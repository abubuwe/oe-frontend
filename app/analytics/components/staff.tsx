"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { 
  Container, Typography, Button, Box, Paper, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, CircularProgress, 
  Card, CardContent, Grid, Chip, Divider,
  AppBar, Toolbar, TextField, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { styled } from '@mui/system';

interface ReportRow {
  impressionId: string;
  adId: string;
  company: string;
  category: string;
  question: string;
  timestamp: string;
  views: number;
  clicks: number;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: '#1976d2',
  color: 'white',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: '0.5rem',
}));

export default function StaffDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [categoryFilter, setcategoryFilter] = useState<string>('all');
  
  // Extract unique companies and categories for filters
  const companies = ['all', ...Array.from(new Set(data.map(item => item.company)))];
  const categories = ['all', ...Array.from(new Set(data.map(item => item.category)))];

  useEffect(() => {
    if (session) {
      axios
        .get<ReportRow[]>('/api/reports')
        .then((res) => setData(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [session]);
  
  // Filter data based on selected filters
  const filteredData = data.filter(row => {
    const matchesCompany = companyFilter === 'all' || row.company === companyFilter;
    const matchesCategory = categoryFilter === 'all' || row.category === categoryFilter;
    return matchesCompany && matchesCategory;
  });
  
  // Calculate summary statistics
  const totalImpressions = filteredData.length;
  const totalViews = filteredData.reduce((sum, row) => sum + row.views, 0);
  const totalClicks = filteredData.reduce((sum, row) => sum + row.clicks, 0);
  const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews * 100).toFixed(2) : '0';

  const exportCSV = () => {
    const csv = [
      ['impressionId', 'adId', 'company', 'category', 'question', 'timestamp', 'views', 'clicks'],
      ...data.map((r) => [
        r.impressionId,
        r.adId,
        r.company,
        r.category,
        JSON.stringify(r.question),
        r.timestamp,
        String(r.views),
        String(r.clicks),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reports-staff.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reports-staff.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: '1px solid #ddd', mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" color="inherit" sx={{ flexGrow: 1 }}>
            Staff Dashboard
          </Typography>
          <Box>
            <StyledButton 
              variant="outlined" 
              color="primary" 
              onClick={exportCSV} 
              disabled={!data.length}
            >
              Export CSV
            </StyledButton>
            <StyledButton 
              variant="outlined" 
              color="primary" 
              onClick={exportJSON} 
              disabled={!data.length}
            >
              Export JSON
            </StyledButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="company-filter-label">Filter by Company</InputLabel>
              <Select
                labelId="company-filter-label"
                value={companyFilter}
                label="Filter by Company"
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                {companies.map((company) => (
                  <MenuItem key={company} value={company}>
                    {company === 'all' ? 'All Companies' : company}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="category-filter-label">Filter by Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={categoryFilter}
                label="Filter by Category"
                onChange={(e) => setcategoryFilter(e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Impressions
              </Typography>
              <Typography variant="h4">{totalImpressions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Views
              </Typography>
              <Typography variant="h4">{totalViews}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Clicks
              </Typography>
              <Typography variant="h4">{totalClicks}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Click-Through Rate
              </Typography>
              <Typography variant="h4">{clickThroughRate}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Data Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Impression ID</StyledTableCell>
                <StyledTableCell>Ad ID</StyledTableCell>
                <StyledTableCell>Company</StyledTableCell>
                <StyledTableCell>Category</StyledTableCell>
                <StyledTableCell>Question</StyledTableCell>
                <StyledTableCell>Timestamp</StyledTableCell>
                <StyledTableCell align="right">Views</StyledTableCell>
                <StyledTableCell align="right">Clicks</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <TableRow hover key={row.impressionId}>
                    <TableCell>{row.impressionId.substring(0, 8)}...</TableCell>
                    <TableCell>{row.adId.substring(0, 8)}...</TableCell>
                    <TableCell>{row.company}</TableCell>
                    <TableCell>
                      <Chip label={row.category} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {row.question.length > 50 
                        ? `${row.question.substring(0, 50)}...` 
                        : row.question}
                    </TableCell>
                    <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
                    <TableCell align="right">{row.views}</TableCell>
                    <TableCell align="right">{row.clicks}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}