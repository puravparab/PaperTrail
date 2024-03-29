document.addEventListener('DOMContentLoaded', () => {
  const openButton = document.getElementById('openPaperTrail') as HTMLButtonElement;
  openButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'papertrail.html' });
  });
});