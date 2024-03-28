'use client';

import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Link, Tooltip } from '@mui/material';

interface PaperData {
  id: string;
  title: string;
  authors: string[]; 
  summary: string;
  published: string;
	dateAdded: string;
}

const PaperDashboard: React.FC = () => {
  const [papers, setPapers] = useState<PaperData[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof PaperData | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
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

    // Fetch saved papers and update the state
    getSavedPapersFromBackground()
      .then((savedPapers) => {
        setPapers(savedPapers);
      })
      .catch((error) => {
        console.error('Error retrieving saved papers:', error);
      });
  }, []);

  const handleSort = (column: keyof PaperData) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedPapers = sortColumn
    ? [...papers].sort((a, b) => {
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
    : papers;

  return (
    <Container maxWidth="md">
      <Box mt={4}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#b31a1b' }}>
          PaperTrail
        </Typography>
        {papers.length === 0 ? (
          <Typography>No saved papers found.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell onClick={() => handleSort('title')} sx={{ cursor: 'pointer'}}>
                    Title
                  </TableCell>
                  <TableCell onClick={() => handleSort('authors')} sx={{ cursor: 'pointer'}}>
                    Authors
                  </TableCell>
                  <TableCell onClick={() => handleSort('summary')} sx={{ cursor: 'pointer'}}>
                    Summary
                  </TableCell>
                  <TableCell onClick={() => handleSort('published')} sx={{ cursor: 'pointer'}}>
                    Published
                  </TableCell>
									<TableCell onClick={() => handleSort('dateAdded')} sx={{ cursor: 'pointer'}}>
                    Date Added
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedPapers.map((paper) => (
                  <TableRow
                    key={paper.id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        cursor: 'pointer',
                      },
                    }}
                  >
                    <TableCell>
                      <Link href={`https://arxiv.org/abs/${paper.id}`} target="_blank" rel="noopener noreferrer">
                        <Tooltip title={paper.title} placement="top-start">
                          <span>{paper.title.length > 50 ? `${paper.title.slice(0, 50)}...` : paper.title}</span>
                        </Tooltip>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={paper.authors.join(', ')} placement="top-start">
                        <span>{paper.authors.join(', ').length > 50 ? `${paper.authors.join(', ').slice(0, 50)}...` : paper.authors.join(', ')}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={paper.summary} placement="top-start">
                        <span>{paper.summary.length > 100 ? `${paper.summary.slice(0, 100)}...` : paper.summary}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{paper.published}</TableCell>
										<TableCell>{paper.dateAdded}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
};

export default PaperDashboard;