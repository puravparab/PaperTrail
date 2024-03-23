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

      let isTitleSaved = false; // TODO: compare with db

      option.addEventListener('click', () => {
        if (isTitleSaved) {
					titleElement.style.color = defaultColor; // Restore default color
					option.textContent = '[save]';
					option.style.color = 'green';
					isTitleSaved = false;
        } else {
					titleElement.style.color = 'green';
					option.textContent = '[remove]';
					option.style.color = 'red';
					isTitleSaved = true;
        }
      });
      titleElement.appendChild(option);
    }
  });
};

//paperTrailLink();
scanPage();

const paperTrailLink = () => {
  const hoveringDiv = document.createElement('div');
  hoveringDiv.textContent = 'PaperTrail';
  hoveringDiv.style.position = 'fixed';
  hoveringDiv.style.top = '0px';
  hoveringDiv.style.right = '60px';
  hoveringDiv.style.backgroundColor = '#f2f0e8';
  hoveringDiv.style.color = '#b31a1b';
	hoveringDiv.style.fontSize = '16px'; 
	hoveringDiv.style.fontWeight = '700'; 
  hoveringDiv.style.padding = '10px';
  hoveringDiv.style.borderRadius = '1px';
  hoveringDiv.style.zIndex = '9999';
  hoveringDiv.style.cursor = 'pointer';

  const listLink = document.createElement('a');
  listLink.href = '/'; // Adjust the URL to match the list page URL
  listLink.appendChild(hoveringDiv);

  document.body.appendChild(listLink);
};

paperTrailLink();