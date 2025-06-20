"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { 
  Container, Typography, Button, Box, Paper, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, CircularProgress, 
  Card, CardContent, Grid, Chip, Divider,
  AppBar, Toolbar, FormControl, InputLabel, Select, MenuItem,
  LinearProgress, Tooltip
} from '@mui/material';
import { styled } from '@mui/system';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface SummaryRow {
  company: string;
  category: string;
  impressions: number;
  clicks: number;
  ctr?: number; // Click-through rate
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: '#1976d2',
  color: 'white',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: '0.5rem',
}));

export default function SuperDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [groupBy, setGroupBy] = useState<'company' | 'category'>('company');

  useEffect(() => {
    if (session) {
      axios
        .get<SummaryRow[]>('/api/reports/summary')
        .then((res) => {
          // Calculate CTR for each row
          const dataWithCTR = res.data.map(row => ({
            ...row,
            ctr: row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0
          }));
          setData(dataWithCTR);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [session]);
  
  // Prepare data for charts based on groupBy selection
  const prepareChartData = () => {
    if (groupBy === 'company') {
      // Group by company
      const companyMap = new Map();
      data.forEach(row => {
        const existing = companyMap.get(row.company) || { company: row.company, impressions: 0, clicks: 0 };
        existing.impressions += row.impressions;
        existing.clicks += row.clicks;
        companyMap.set(row.company, existing);
      });
      return Array.from(companyMap.values());
    } else {
      // Group by category
      const categoryMap = new Map();
      data.forEach(row => {
        const existing = categoryMap.get(row.category) || { category: row.category, impressions: 0, clicks: 0 };
        existing.impressions += row.impressions;
        existing.clicks += row.clicks;
        categoryMap.set(row.category, existing);
      });
      return Array.from(categoryMap.values());
    }
  };
  
  const chartData = prepareChartData();
  
  // Calculate totals for summary
  const totalImpressions = data.reduce((sum, row) => sum + row.impressions, 0);
  const totalClicks = data.reduce((sum, row) => sum + row.clicks, 0);
  const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0';

  const exportCSV = () => {
    const csv = [
      ['company', 'category', 'impressions', 'clicks'],
      ...data.map((r) => [r.company, r.category, String(r.impressions), String(r.clicks)]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summary.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summary.json';
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
            Super Admin Dashboard
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

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Impressions
              </Typography>
              <Typography variant="h4">{totalImpressions.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Clicks
              </Typography>
              <Typography variant="h4">{totalClicks.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Overall Click-Through Rate
              </Typography>
              <Typography variant="h4">{overallCTR}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="view-mode-label">View Mode</InputLabel>
              <Select
                labelId="view-mode-label"
                value={viewMode}
                label="View Mode"
                onChange={(e) => setViewMode(e.target.value as 'table' | 'chart')}
              >
                <MenuItem value="table">Table View</MenuItem>
                <MenuItem value="chart">Chart View</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {viewMode === 'chart' && (
            <>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="chart-type-label">Chart Type</InputLabel>
                  <Select
                    labelId="chart-type-label"
                    value={chartType}
                    label="Chart Type"
                    onChange={(e) => setChartType(e.target.value as 'bar' | 'pie')}
                  >
                    <MenuItem value="bar">Bar Chart</MenuItem>
                    <MenuItem value="pie">Pie Chart</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="group-by-label">Group By</InputLabel>
                  <Select
                    labelId="group-by-label"
                    value={groupBy}
                    label="Group By"
                    onChange={(e) => setGroupBy(e.target.value as 'company' | 'category')}
                  >
                    <MenuItem value="company">Company</MenuItem>
                    <MenuItem value="category">Category</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      {/* Data Display - Table or Chart */}
      {viewMode === 'table' ? (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Company</StyledTableCell>
                  <StyledTableCell>Category</StyledTableCell>
                  <StyledTableCell align="right">Impressions</StyledTableCell>
                  <StyledTableCell align="right">Clicks</StyledTableCell>
                  <StyledTableCell align="right">CTR</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length > 0 ? (
                  data.map((row, idx) => (
                    <TableRow hover key={idx}>
                      <TableCell>{row.company}</TableCell>
                      <TableCell>
                        <Chip label={row.category} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">{row.impressions}</TableCell>
                      <TableCell align="right">{row.clicks}</TableCell>
                      <TableCell align="right">
                        {row.ctr?.toFixed(2)}%
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(row.ctr || 0, 100)} 
                          sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Paper sx={{ p: 2, height: 500 }}>
          <Typography variant="h6" gutterBottom>
            {chartType === 'bar' ? 'Performance by ' : 'Distribution by '}
            {groupBy === 'company' ? 'Company' : 'Category'}
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            {chartType === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={groupBy} 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="impressions" name="Impressions" fill="#8884d8" />
                <Bar dataKey="clicks" name="Clicks" fill="#82ca9d" />
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="impressions"
                  nameKey={groupBy}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label={({name, percent}: {name: string, percent: number}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
        </Paper>
      )}
    </Container>
  );
}