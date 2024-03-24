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

// PaperTrail Database
let db: IDBDatabase;
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request: IDBOpenDBRequest = indexedDB.open('PaperTrailDB', 1);
    request.onerror = () => {
      console.error('Error opening database:', request.error);
      reject(request.error);
    };
    request.onsuccess = () => {
      db = request.result;
      console.log('Database opened successfully');
      resolve(db);
    };
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      db = (event.target as IDBOpenDBRequest).result;
      const objectStore: IDBObjectStore = db.createObjectStore('papers', { keyPath: 'id' });
      objectStore.createIndex('title', 'title', { unique: false });
      objectStore.createIndex('authors', 'authors', { unique: false, multiEntry: true });
      objectStore.createIndex('summary', 'summary', { unique: false });
      objectStore.createIndex('published', 'published', { unique: false });
      console.log('Database upgraded');
    };
  });
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

			// Check if the paper exists in the database
			const transaction: IDBTransaction = db.transaction(['papers'], 'readonly');
			const objectStore: IDBObjectStore = transaction.objectStore('papers');
			const request: IDBRequest = objectStore.get(paper.id);
			request.onerror = () => {console.error('Error checking paper existence:', request.error);};
			request.onsuccess = () => {
				if (request.result) {
					// Paper exists in the database
					isTitleSaved = true;
					option.textContent = '[remove]';
					option.style.color = 'red';
				}
			};

      option.addEventListener('click', async () => {
        if (isTitleSaved) { // remove from DB
					const transaction: IDBTransaction = db.transaction(['papers'], 'readwrite');
					const objectStore: IDBObjectStore = transaction.objectStore('papers');
					const request: IDBRequest = objectStore.delete(paper.id);
					request.onerror = () => {console.error('Error removing paper:', request.error);};
					request.onsuccess = () => {
						titleElement.style.color = defaultColor; // Restore default color
						option.textContent = '[save]';
						option.style.color = 'green';
						isTitleSaved = false;
					}
        } 
				else {
					const paperId = paper.id;
					const metadata = await fetchMetadata(paperId);
					if (metadata){ // Add to DB
						const transaction: IDBTransaction = db.transaction(['papers'], 'readwrite');
						const objectStore: IDBObjectStore = transaction.objectStore('papers');
						const request: IDBRequest = objectStore.put(metadata);
						request.onsuccess = () => {
							titleElement.style.color = 'green';
							option.textContent = '[remove]';
							option.style.color = 'red';
							isTitleSaved = true;
						}
						request.onerror = () => {console.error('Error saving paper:', request.error);};
					}
        }
      });
      titleElement.appendChild(option);
    }
  });
};


// Open database and start page scan
openDatabase()
	.then((database: IDBDatabase) => {
		db = database;
		return scanPage();
	})
	.then(() => {
		console.log('Page scan completed');
	})
	.catch((error: Error) => {
		console.error('Error initializing database or scanning page:', error);
	});


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
  listLink.href = '/'; // Adjust the URL to match the list page URL
  listLink.appendChild(hoveringDiv);
  document.body.appendChild(listLink);
};
paperTrailLink();