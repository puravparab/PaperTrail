// Get paper details from arxiv api
interface PaperRes {
	id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
	dateAdded: string;
}
const fetchMetadata = async (paperId: string): Promise<PaperRes | null> => {
	const url = `https://export.arxiv.org/api/query?id_list=${paperId}`;
	try {
		const response = await fetch(url);
		const data = await response.text();
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(data, 'text/xml');
		const entry = xmlDoc.querySelector('entry');
		if (entry) {
			const title = entry.querySelector('title')?.textContent || '';
			const authors = Array.from(entry.querySelectorAll('author')).map(
				(author) => author.querySelector('name')?.textContent || ''
			);
			const summary = entry.querySelector('summary')?.textContent || '';
			const published = entry.querySelector('published')?.textContent || '';
			const dateAdded = new Date().toISOString(); // Get the current date and time as an ISO string
			const paperRes: PaperRes = {
				id: paperId,
				title,
				authors,
				summary,
				published,
				dateAdded
			};
			return paperRes;
		}
	} catch (error) { console.error('Error fetching metadata:', error);}
	return null;
};

// Scan current page on arxiv
interface PaperElement {
  id: string;
  titleElement: HTMLElement | null;
}
let papers: PaperElement[] = [];

const scanPage = () => {
  const urlPath = window.location.pathname; // Parse url
  // URL is "arxiv.org/abs/..."
  if (urlPath.startsWith('/abs/')) { 
		const paperId = urlPath.substring(5); // Get the paper Id
    const titleElement = document.querySelector('.title.mathjax');
    if (titleElement) {
      const paperElement: PaperElement = {
        id: paperId,
        titleElement: titleElement as HTMLElement
      };
      papers.push(paperElement);
    }
  } 
	
  // URL is "arxiv.org/search/..."
  else if (urlPath.startsWith('/search/')) {
		const results = document.querySelectorAll('li.arxiv-result');
    results.forEach((result) => {
      const IdElement = result.querySelector('p.list-title.is-inline-block');
      const titleElement = result.querySelector('p.title.is-5.mathjax');
      if (IdElement && titleElement) {
        const a = IdElement.querySelector('a');
        if (a) {
          const paperId = a.href.substring(a.href.lastIndexOf('/') + 1);
          const paperElement: PaperElement = {
            id: paperId,
            titleElement: titleElement as HTMLElement
          };
          papers.push(paperElement);
        }
      }
    });
  }

  // URL is "arxiv.org/list/..."
  else if (urlPath.startsWith('/list/')) {
		const dl = document.querySelectorAll('dl');
		if (dl){
			// the id and class containing paper title are stored sequentially in dt and dd respectively
			dl.forEach((dl) => {
				const dt = dl.querySelectorAll('dt');
				const dd = dl.querySelectorAll('dd');
				if (dt.length === dd.length) {
					for (let i = 0; i < dt.length; i++) {
						const dtElement = dt[i];
						const ddElement = dd[i];
						const a = dtElement.querySelector('a[title="Abstract"]');
						const titleElement = ddElement.querySelector('.list-title.mathjax');
						if (a && titleElement) {
							const anchorElement = a as HTMLAnchorElement;
							const paperId = anchorElement.href.substring(anchorElement.href.lastIndexOf('/') + 1);
							const paperElement: PaperElement = {
								id: paperId,
								titleElement: titleElement as HTMLElement
							};
							papers.push(paperElement);
						}
					}
				}
			});
		}
  }
	
	// Iterate through papers
	papers.forEach((paper) => {
		const titleElement = paper.titleElement;
		if (titleElement) {
			const defaultColor = getComputedStyle(titleElement).color; // Save default color

			// Create a container for the buttons
			const buttonContainer = document.createElement('div');
			buttonContainer.style.display = 'inline-flex';
			buttonContainer.style.alignItems = 'center';
			buttonContainer.style.marginLeft = '10px';

			// Create the save/remove button
			const saveBtn = document.createElement('button');
			saveBtn.textContent = 'Save';
			saveBtn.style.marginRight = '10px';
			saveBtn.style.padding = '4px 10px';
			saveBtn.style.backgroundColor = 'green';
			saveBtn.style.fontSize = '17px';
			saveBtn.style.color = 'white';
			saveBtn.style.border = 'none';
			saveBtn.style.borderRadius = '4px';
			saveBtn.style.cursor = 'pointer';

			let isTitleSaved = false;

			// Send a message to the background script to check if the paper exists in the database
			chrome.runtime.sendMessage({ action: 'checkPaperExists', paperId: paper.id }, (response) => {
				if (response.exists) {
					isTitleSaved = true;
					saveBtn.textContent = 'Remove';
					saveBtn.style.backgroundColor = 'red';
					titleElement.style.color = 'green';
				}
			});

			saveBtn.addEventListener('click', async () => {
				if (isTitleSaved) {
					// Remove from DB
					chrome.runtime.sendMessage({ action: 'removePaper', paperId: paper.id }, (response) => {
						if (response.success) {
							titleElement.style.color = defaultColor;
							saveBtn.textContent = 'Save';
							saveBtn.style.backgroundColor = 'green';
							isTitleSaved = false;
						} else {
							console.error('Error removing paper:', response.error);
						}
					});
				} else {
					const paperId = paper.id;
					const metadata = await fetchMetadata(paperId);
					if (metadata) {
						// Add to DB
						chrome.runtime.sendMessage({ action: 'savePaper', paper: metadata }, (response) => {
							if (response.success) {
								titleElement.style.color = 'green';
								saveBtn.textContent = 'Remove';
								saveBtn.style.backgroundColor = 'red';
								isTitleSaved = true;
							} else {
								console.error('Error saving paper:', response.error);
							}
						});
					}
				}
			});
			buttonContainer.appendChild(saveBtn);

			// Create the "HTML" button
      const viewHtmlBtn = document.createElement('button');
      viewHtmlBtn.textContent = 'HTML';
      viewHtmlBtn.style.marginRight = '10px';
      viewHtmlBtn.style.padding = '4px 10px';
      viewHtmlBtn.style.backgroundColor = '#1976d2';
			viewHtmlBtn.style.fontSize = '17px';
      viewHtmlBtn.style.color = 'white';
      viewHtmlBtn.style.border = 'none';
      viewHtmlBtn.style.borderRadius = '4px';
      viewHtmlBtn.style.cursor = 'pointer';
      viewHtmlBtn.addEventListener('click', () => {
        window.open(`https://ar5iv.labs.arxiv.org/html/${paper.id}`, '_blank');
      });
			buttonContainer.appendChild(viewHtmlBtn);

			// Create the "PDF" button
      const viewPdfBtn = document.createElement('button');
      viewPdfBtn.textContent = 'PDF';
      viewPdfBtn.style.padding = '4px 10px';
      viewPdfBtn.style.backgroundColor = '#1976d2';
			viewPdfBtn.style.fontSize = '17px';
      viewPdfBtn.style.color = 'white';
      viewPdfBtn.style.border = 'none';
      viewPdfBtn.style.borderRadius = '4px';
      viewPdfBtn.style.cursor = 'pointer';
      viewPdfBtn.addEventListener('click', () => {
        window.open(`https://arxiv.org/pdf/${paper.id}.pdf`, '_blank');
      });
      buttonContainer.appendChild(viewPdfBtn);

			titleElement.appendChild(buttonContainer);
		}
	});
};

scanPage();

// Link to List of papers
const paperTrailLink = () => {
  const hoveringDiv = document.createElement('div');
  hoveringDiv.textContent = 'PaperTrail';
  hoveringDiv.style.position = 'fixed';
  hoveringDiv.style.top = '0px';
  hoveringDiv.style.left = '250px';
  hoveringDiv.style.backgroundColor = '#f2f0e8';
  hoveringDiv.style.color = '#b31a1b';
	hoveringDiv.style.fontSize = '20px'; 
	hoveringDiv.style.fontWeight = '600'; 
  hoveringDiv.style.padding = '10px';
  hoveringDiv.style.borderRadius = '1px';
  hoveringDiv.style.zIndex = '9999';
  hoveringDiv.style.cursor = 'pointer';
	
  const listLink = document.createElement('a');
  listLink.href = chrome.runtime.getURL('paperTrail.html');
	listLink.target = '_blank';
  listLink.appendChild(hoveringDiv);

  document.body.appendChild(listLink);
};
paperTrailLink();