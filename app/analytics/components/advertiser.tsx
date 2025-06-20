"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { 
  Container, Typography, Button, Box, Paper, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, CircularProgress, 
  Card, CardContent, Grid, Chip, Divider,
  AppBar, Toolbar, Checkbox
} from '@mui/material';
import { styled } from '@mui/system';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

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

export default function AdvertiserDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<ReportRow[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string, impressions: number, clicks: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartLoading, setChartLoading] = useState<boolean>(true);

  useEffect(() => {
    if (session?.user.companyId) {
      // Fetch impression data
      axios
        .get<ReportRow[]>(`/api/reports?companyId=${session.user.companyId}`)
        .then((res) => setData(res.data))
        .catch((error: any) => {
          console.error('Error fetching advertiser reports:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            endpoint: '/api/reports',
            companyId: session.user.companyId
          });
        })
        .finally(() => setLoading(false));
      
      // Fetch daily metrics for the chart
      axios
        .get(`/api/reports/daily?companyId=${session.user.companyId}`)
        .then((res) => setDailyData(res.data))
        .catch((error: any) => {
          console.error('Error fetching daily metrics:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            endpoint: '/api/reports/daily',
            companyId: session.user.companyId
          });
        })
        .finally(() => setChartLoading(false));
    }
  }, [session]);

  // Calculate summary statistics
  const totalImpressions = data.length;
  const totalViews = data.reduce((sum, row) => sum + row.views, 0);
  const totalClicks = data.reduce((sum, row) => sum + row.clicks, 0);
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
    a.download = 'reports.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reports.json';
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
            Advertiser Dashboard
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
      
      {/* Daily Metrics Chart */}
      <Paper sx={{ width: '100%', p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Daily Impressions and Clicks
        </Typography>
        {chartLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="300px">
            <CircularProgress />
          </Box>
        ) : dailyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={dailyData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value, name) => [value, name === 'impressions' ? 'Impressions' : 'Clicks']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="impressions" 
                stroke="#8884d8" 
                name="Impressions"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="clicks" 
                stroke="#82ca9d" 
                name="Clicks"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height="300px">
            <Typography>No daily data available</Typography>
          </Box>
        )}
      </Paper>

      {/* Data Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Category</StyledTableCell>
                <StyledTableCell>Question</StyledTableCell>
                <StyledTableCell>Timestamp</StyledTableCell>
                <StyledTableCell align="center">Clicked</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length > 0 ? (
                data.map((row) => (
                  <TableRow hover key={row.impressionId}>
                    <TableCell>
                      <Chip label={row.category} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {row.question.length > 50 
                        ? `${row.question.substring(0, 50)}...` 
                        : row.question}
                    </TableCell>
                    <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
                    <TableCell align="center">
                      <Checkbox 
                        checked={row.clicks > 0}
                        disabled={true}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
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