interface Paper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
}

const paperTrailContainer = document.getElementById('paper-trail-container');

// Retrieve saved papers from the background script
const getSavedPapersFromBackground = (): Promise<Paper[]> => {
  return new Promise<Paper[]>((resolve, reject) => {
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

// Render the papers in a table structure
const renderPapers = (papers: Paper[]) => {
  if (paperTrailContainer) {
    paperTrailContainer.innerHTML = ''; // Clear previous content

    const table = document.createElement('table');
    table.classList.add('paper-table');

    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
      <th>ID</th>
      <th>Title</th>
      <th>Authors</th>
      <th>Summary</th>
      <th>Published</th>
    `;
    table.appendChild(headerRow);

    papers.forEach((paper) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${paper.id}</td>
        <td><a href="https://arxiv.org/abs/${paper.id}" target="_blank" rel="noopener noreferrer">${paper.title}</a></td>
        <td>${paper.authors.join(', ')}</td>
        <td>${paper.summary}</td>
        <td>${paper.published}</td>
      `;
      table.appendChild(row);
    });

    paperTrailContainer.appendChild(table);
  }
};

// Fetch saved papers and render them
getSavedPapersFromBackground()
  .then((savedPapers) => {
    renderPapers(savedPapers);
  })
  .catch((error) => {
    console.error('Error retrieving saved papers:', error);
  });