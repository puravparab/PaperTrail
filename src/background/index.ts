console.log('Background script loaded');

interface Paper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  dateAdded: string;
}

let db: IDBDatabase;
// Open the IndexedDB database
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
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
			if (!db.objectStoreNames.contains('papers')) {
				const objectStore: IDBObjectStore = db.createObjectStore('papers', { keyPath: 'id' });
				objectStore.createIndex('title', 'title', { unique: false });
				objectStore.createIndex('authors', 'authors', { unique: false, multiEntry: true });
				objectStore.createIndex('summary', 'summary', { unique: false });
				objectStore.createIndex('published', 'published', { unique: false });
        objectStore.createIndex('dateAdded', 'dateAdded', { unique: false });
			}
			console.log('Database upgraded');
		};
  });
};

// Retrieve all saved papers from the database
const getSavedPapers = (): Promise<Paper[]> => {
  return new Promise((resolve, reject) => {
    const transaction: IDBTransaction = db.transaction(['papers'], 'readonly');
    const objectStore: IDBObjectStore = transaction.objectStore('papers');
    const request: IDBRequest = objectStore.getAll();
    request.onerror = () => {
      console.error('Error retrieving saved papers:', request.error);
      reject(request.error);
    };
    request.onsuccess = () => {
      const savedPapers: Paper[] = request.result;
			console.log(`${request.result.length} papers returned.`);
      resolve(savedPapers);
    };
  });
};

// Save paper to DB
const savePaper = (paper: Paper): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction: IDBTransaction = db.transaction(['papers'], 'readwrite');
    const objectStore: IDBObjectStore = transaction.objectStore('papers');
    const request: IDBRequest = objectStore.put(paper);
    request.onerror = () => {
      console.error('Error saving paper:', request.error);
      reject(request.error);
    };
    request.onsuccess = () => {
			console.log(`Paper #${paper.id} - ${paper.title} added.`);
      resolve();
    };
  });
};

// Remove a paper from the database
const removePaper = (paperId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction: IDBTransaction = db.transaction(['papers'], 'readwrite');
    const objectStore: IDBObjectStore = transaction.objectStore('papers');
    const request: IDBRequest = objectStore.delete(paperId);
    request.onerror = () => {
      console.error('Error removing paper:', request.error);
      reject(request.error);
    };
    request.onsuccess = () => {
			console.log(`Paper #${paperId} removed.`);
      resolve();
    };
  });
};

// Check if a paper exists in the database
const checkPaperExists = (paperId: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const transaction: IDBTransaction = db.transaction(['papers'], 'readonly');
    const objectStore: IDBObjectStore = transaction.objectStore('papers');
    const request: IDBRequest = objectStore.get(paperId);
    request.onerror = () => {
      console.error('Error checking paper existence:', request.error);
      reject(request.error);
    };
    request.onsuccess = () => {
      const exists = request.result !== undefined;
      resolve(exists);
    };
  });
};


// Listens to requests from the content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	// Get all saved papers
  if (request.action === 'getSavedPapers') {
    getSavedPapers()
      .then((savedPapers) => {
        sendResponse({ papers: savedPapers });
      })
      .catch((error) => {
        console.error('Error retrieving saved papers:', error);
        sendResponse({ error: error.message });
      });
    return true; // Required to use sendResponse asynchronously
  }
	// Save a paper
	else if (request.action === 'savePaper') {
    savePaper(request.paper)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required to use sendResponse asynchronously
  } 
	// Remove a paper
	else if (request.action === 'removePaper') {
    removePaper(request.paperId)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required to use sendResponse asynchronously
  }
	// Check if a paper exists
	else if (request.action === 'checkPaperExists') {
    checkPaperExists(request.paperId)
      .then((exists) => {
        sendResponse({ exists });
      })
      .catch((error) => {
        console.error('Error checking paper existence:', error);
        sendResponse({ exists: false });
      });
    return true; // Required to use sendResponse asynchronously
  }
});

// Open the database when the background script starts
openDatabase()
  .then(() => {
    console.log('Background script initialized');
  })
  .catch((error) => {
    console.error('Error initializing background script:', error);
  });