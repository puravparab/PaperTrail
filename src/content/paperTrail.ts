interface Paper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
}

const paperList = document.getElementById('paperList');

// Retrieve saved papers from the background script
const getSavedPapersFromBackground = (): Promise<Paper[]> => {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage({ action: 'getSavedPapers' }, (response) => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			} else if (response.error) {
				reject(new Error(response.error));
			} else {
				resolve(response.papers);
			}
		});
	});
};

// Display the saved papers on the homepage
const displaySavedPapers = (savedPapers: Paper[]) => {
	if (paperList) {
		savedPapers.forEach((paper) => {
			const listItem = document.createElement('li');
			const link = document.createElement('a');
			link.href = `https://arxiv.org/abs/${paper.id}`;
			link.target = '_blank';
			link.textContent = paper.title;
			listItem.appendChild(link);
			paperList.appendChild(listItem);
		});
	}
};

// Retrieve saved papers and display them on the homepage
getSavedPapersFromBackground()
	.then((savedPapers) => displaySavedPapers(savedPapers))
	.catch((error) => {
		console.error('Error retrieving saved papers:', error);
	});