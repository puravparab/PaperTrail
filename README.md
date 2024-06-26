# PaperTrail
A browser extension that lets you easily save and manage research papers from [arXiv](https://arxiv.org/). With PaperTrail, you can quickly bookmark papers, view their metadata, and keep track of your reading list.

![PaperTrail](assets/PaperTrail.png)

## Features
- Bookmark and search through arxiv papers

- Quick links to pdf and html versions

- Download data to a json or csv file

## Setup
There are two ways to set up PaperTrail:\
(Use option 2 if you want to contribute)

### Option 1: Using the Release
1. Go to the [PaperTrail](https://github.com/puravparab/PaperTrail/releases) releases page on GitHub.
2. Download the latest release of the extension.
3. Extract the downloaded ZIP file to a directory of your choice.
4. Open Google Chrome and navigate to `chrome://extensions`.
5. Enable "Developer mode" using the toggle switch in the top right corner.
6. Click on "Load unpacked" and select the extracted directory.
7. PaperTrail should now be installed and visible in your Chrome extensions list.

### Option 2: Manual Setup
1. Clone the PaperTrail repository:
```
git clone https://github.com/puravparab/PaperTrail.git
```
2. Navigate to the project directory:
```
cd PaperTrail
```
3. Install the dependencies and build the extension:\
The built extension will be available in the `dist` directory.
```
npm install
npm run build
```
4. Open Google Chrome and navigate to `chrome://extensions`.\
Enable "Developer mode" using the toggle switch in the top right corner.\
Click on "Load unpacked" and select the `dist` directory.
5. PaperTrail should now be installed and visible in your Chrome extensions list.

## Updating to a newer release?
Download and extract the dist.zip file in the same location as the older version. This is done so that you don't lose your saved papers. 

## Save your papers locally
Go to the PaperTrail Dashboard and get your saved paper data as a .csv or .json file.

## Common Issues
1. You will need npm to build this extension
2. If you have saved papers and get a "No saved papers found", try reloading the page. 

## Issues
If you encounter any issues or have suggestions for improvements, please [open an issue](https://github.com/puravparab/PaperTrail/issues) on the GitHub repository. I appreciate your feedback and will do my best to address any problems or feature requests.

## Contributing
If you'd like to contribute, please follow these steps:

1. Fork the repository on GitHub.
2. Create a new branch for your feature or bug fix.
3. Make your modifications and ensure that the extension builds successfully.
4. Commit your changes and push them to your forked repository.
5. Submit a pull request to the main repository.