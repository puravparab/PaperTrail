import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, TableContainer, Paper, 
  Table, TableHead, TableRow, TableCell, TableBody, 
  Link, Tooltip, Grid, Divider, Button, TextField
} from '@mui/material';
import { format } from 'date-fns';

interface PaperData {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  dateAdded: string;
}

const PaperDashboard: React.FC = () => {
  // List of retrieved papers
  const [papers, setPapers] = useState<PaperData[]>([]);

	// Dashboard sorting
  const [sortColumn, setSortColumn] = useState<keyof PaperData | null>('dateAdded');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

	// Paper display
	const [currPaperDisplayed, setCurrPaperDisplayed] = useState<PaperData | null>(null);
	const [isAuthorListExpanded, setIsAuthorListExpanded] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  useEffect(() => {
    // Fetch saved papers and update the state
    getSavedPapersFromBackground()
      .then((savedPapers) => {
        setPapers(savedPapers);
        if (savedPapers.length !== 0) {
          setCurrPaperDisplayed(savedPapers[0]);
        }
      })
      .catch((error) => {
        console.error('Error retrieving saved papers:', error);
      });
  }, []);

  // Retrieve saved papers from the background script
  const getSavedPapersFromBackground = () => {
    return new Promise<PaperData[]>((resolve, reject) => {
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

  // Download paper to csv file
  const handleDownloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 'arxiv_id,title,authors,date_published,date_added\n' + papers.map(paper => 
      `${paper.id},${paper.title},${paper.authors.join(';')},${paper.published},${paper.dateAdded}`
    ).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'PaperTrail_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download paper to json
  const handleDownloadJSON = () => {
    const jsonContent = JSON.stringify(papers, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PaperTrail_data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

	// Format datetime when displaying dashboard
  const formatDateTime = (dateTimeString: string) => {
    const dateTime = new Date(dateTimeString);
    // return format(dateTime, 'MMMM d, yyyy - h:mm a');
    return format(dateTime, 'MMMM d, yyyy');
  };

	// Display a paper when row is clicked
  const paperDisplay = (paper: PaperData) => {
    setCurrPaperDisplayed(paper);
		setIsAuthorListExpanded(false);
  };

  // Column sort function
  const handleSort = (column: keyof PaperData) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Filters papers based on searchQuery
  const filteredPapers = papers.filter((paper) =>
    paper.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.authors.some((author) => author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sorting logic for the dashboard
  const sortedPapers = sortColumn
    ? [...filteredPapers].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        if (aValue === null) return sortDirection === 'asc' ? 1 : -1;
        if (bValue === null) return sortDirection === 'asc' ? -1 : 1;

        if (sortColumn === 'dateAdded') {
          const aDate = new Date(aValue as string);
          const bDate = new Date(bValue as string);
          return sortDirection === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
        } else {
          if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        }
        return 0;
      })
    : filteredPapers;

  return (
    <Container maxWidth="xl">
      <Box mt={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" flexDirection="column" alignItems="flex-start">
            <Link
              href="https://github.com/puravparab/PaperTrail"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textDecoration: 'none' }}
            >
              <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#b31a1b', fontWeight: 'bold' }}>
                PaperTrail
              </Typography>
            </Link>
            <Typography variant="subtitle1" gutterBottom>
              {filteredPapers.length} papers added.
            </Typography>
          </Box>

          {/* Data download links */}
          {papers.length === 0 
            ? (<></>)
            : (<>
                {/* Search bar */}
                <Box display="flex" justifyContent="center" mt={2}>
                  <TextField
                    placeholder=""
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    sx={{ width: '400px' }}
                    label="Search papers..."
                  />
                </Box>
                <Box>
                  <Button variant="outlined" color="primary" onClick={handleDownloadCSV} sx={{ marginRight: '10px' }}>
                    CSV
                  </Button>
                  <Button variant="outlined" color="primary" onClick={handleDownloadJSON}>
                    JSON
                  </Button>
                </Box>
              </>)
          }
        </Box>

				{/* Dashboard */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            {filteredPapers.length === 0 
            ? (<Typography>No saved papers found. (Don't see your saved papers? Try reloading this page.)</Typography>)
            : (
              <TableContainer component={Paper}>
                <Table size="small">
									{/* Header */}
                  <TableHead>
                    <TableRow>
                      <TableCell onClick={() => handleSort('id')} sx={{ cursor: 'pointer' }}>
                        ID
                      </TableCell>
                      <TableCell onClick={() => handleSort('title')} sx={{ cursor: 'pointer' }}>
                        Title
                      </TableCell>
                      <TableCell onClick={() => handleSort('authors')} sx={{ cursor: 'pointer' }}>
                        Authors
                      </TableCell>
                      <TableCell onClick={() => handleSort('summary')} sx={{ cursor: 'pointer' }}>
                        Abstract
                      </TableCell>
                      <TableCell onClick={() => handleSort('published')} sx={{ cursor: 'pointer' }}>
                        Published
                      </TableCell>
                      <TableCell onClick={() => handleSort('dateAdded')} sx={{ cursor: 'pointer' }}>
                        Date Added
                      </TableCell>
                    </TableRow>
                  </TableHead>

									{/* Data */}
                  <TableBody>
                    {sortedPapers.map((paper) => (
                      <TableRow
                        key={paper.id}
                        onClick={() => paperDisplay(paper)}
                        hover
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            cursor: 'pointer',
                          },
                        }}
                      >
                        {/* Paper ID */}
                        <TableCell><span>{paper.id}</span></TableCell>
                        {/* Paper Title */}
                        <TableCell>
                          <Link href={`https://arxiv.org/abs/${paper.id}`} target="_blank" rel="noopener noreferrer">
                            <Tooltip title={paper.title} placement="top-start">
                              <span>{paper.title.length > 50 ? `${paper.title.slice(0, 50)}...` : paper.title}</span>
                            </Tooltip>
                          </Link>
                        </TableCell>
												{/* Authors */}
                        <TableCell>
                          <Tooltip title={paper.authors.join(', ')} placement="top-start">
                            <span>{paper.authors.join(', ').length > 50 ? `${paper.authors.join(', ').slice(0, 50)}...` : paper.authors.join(', ')}</span>
                          </Tooltip>
                        </TableCell>
												{/* Summary */}
                        <TableCell>
                          <Tooltip title={paper.summary} placement="top-start">
                            <span>{paper.summary.length > 100 ? `${paper.summary.slice(0, 100)}...` : paper.summary}</span>
                          </Tooltip>
                        </TableCell>
												{/* Date paper was published */}
                        <TableCell>{formatDateTime(paper.published)}</TableCell>
												{/* Date paper was added */}
                        <TableCell>{formatDateTime(paper.dateAdded)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Grid>
          
          {/* Paper Display */}
          <Grid item xs={12} md={5}>
						{currPaperDisplayed && (
							<Box sx={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
								{/* Title */}
                <Typography variant="h5" gutterBottom>
                  <Link
                    href={`https://arxiv.org/abs/${currPaperDisplayed.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: '#b31a1b', fontWeight: 'bold', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {currPaperDisplayed.title}
                  </Link>
                </Typography>

								<Divider sx={{ marginBottom: '10px' }} />

                {/* HTML, PDF Buttons */}
                <Box display="flex" alignItems="center" marginBottom="10px">
                  <Link
                    href={`https://ar5iv.labs.arxiv.org/html/${currPaperDisplayed.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      textDecoration: 'none',
                      marginRight: '10px',
                      '& button': {
                        padding: '5px 10px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#1976d2',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'background-color 0.3s',
                        '&:hover': {
                          backgroundColor: '#1565c0',
                        },
                      },
                    }}
                  >
                    <button>View HTML</button>
                  </Link>
                  <Link
                    href={`https://arxiv.org/pdf/${currPaperDisplayed.id}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      textDecoration: 'none',
                      marginRight: '10px',
                      '& button': {
                        padding: '5px 10px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#1976d2',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'background-color 0.3s',
                        '&:hover': {
                          backgroundColor: '#1565c0',
                        },
                      },
                    }}
                  >
                    <button>View PDF</button>
                  </Link>
                  <Link
                    href={`https://arxiv.org/src/${currPaperDisplayed.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      textDecoration: 'none',
                      '& button': {
                        padding: '5px 10px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#1976d2',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'background-color 0.3s',
                        '&:hover': {
                          backgroundColor: '#1565c0',
                        },
                      },
                    }}
                  >
                    <button>LaTeX source</button>
                  </Link>
                </Box>

								{/* Authors */}
								<Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
									Authors:
								</Typography>
								<Typography variant="body1" gutterBottom>
									{isAuthorListExpanded
										? currPaperDisplayed.authors.join(', ')
										: currPaperDisplayed.authors.length > 20
										? `${currPaperDisplayed.authors.slice(0, 20).join(', ')}...`
										: currPaperDisplayed.authors.join(', ')}
								</Typography>
								{currPaperDisplayed.authors.length > 20 && (
									<button
										onClick={() => setIsAuthorListExpanded(!isAuthorListExpanded)}
										style={{ marginLeft: '5px', border: 'none', color: '#1976d2', background: 'none', cursor: 'pointer' }}
									>
										{isAuthorListExpanded ? 'collapse' : 'show more'}
									</button>
								)}

								{/* Date Published */}
								<Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
									Published:
								</Typography>
								<Typography variant="body1" gutterBottom>
									{formatDateTime(currPaperDisplayed.published)}
								</Typography>
								
								{/* Summary */}
								<Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
									Abstract:
								</Typography>
								<Typography variant="body1" gutterBottom>
									{currPaperDisplayed.summary}
								</Typography>
								
							</Box>
						)}
          </Grid>
        </Grid>
      </Box>

      {/* Issues Link */}
      <Box mt={4} display="flex" justifyContent="center">
        <Link href="https://github.com/puravparab/PaperTrail/issues" target="_blank" rel="noopener noreferrer">
          <Typography variant="body2" color="textSecondary">
            Report an issue or suggest an improvement on GitHub
          </Typography>
        </Link>
      </Box>
    </Container>
  );
};

export default PaperDashboard;