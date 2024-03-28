// Get paper details from arxiv api
interface PaperRes {
	id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
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
			const paperRes: PaperRes = {
				id: paperId,
				title,
				authors,
				summary,
				published,
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
			const option = document.createElement('span');
			option.textContent = '[save]';
			option.style.color = 'green';
			option.style.cursor = 'pointer';
			option.style.marginLeft = '5px';

			let isTitleSaved = false;

			// Send a message to the background script to check if the paper exists in the database
			chrome.runtime.sendMessage({ action: 'checkPaperExists', paperId: paper.id }, (response) => {
				if (response.exists) {
					isTitleSaved = true;
					option.textContent = '[remove]';
					titleElement.style.color = 'green';
					option.style.color = 'red';
				}
			});

			option.addEventListener('click', async () => {
				if (isTitleSaved) {
					// Remove from DB
					chrome.runtime.sendMessage({ action: 'removePaper', paperId: paper.id }, (response) => {
						if (response.success) {
							titleElement.style.color = defaultColor;
							option.textContent = '[save]';
							option.style.color = 'green';
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
								option.textContent = '[remove]';
								option.style.color = 'red';
								isTitleSaved = true;
							} else {
								console.error('Error saving paper:', response.error);
							}
						});
					}
				}
			});
			titleElement.appendChild(option);
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
  hoveringDiv.style.right = '320px';
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