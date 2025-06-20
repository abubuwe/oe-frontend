"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import {
  Box, Typography, Button, Grid, CircularProgress,
  Paper, Tabs, Tab, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { AdStatus } from '@prisma/client';
import CampaignCard from './campaign-card';
import CampaignEditDialog from './campaign-edit-dialog';

interface Ad {
  id: string;
  headline: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl: string;
  status: AdStatus;
  budget: number | null;
  spendCap: number | null;
  startDate: string | null;
  endDate: string | null;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  metrics?: {
    impressions: number;
    clicks: number;
    spend: number;
  };
}

interface Category {
  id: string;
  name: string;
}

export default function AdvertiserCampaigns() {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<Ad[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);

  // Fetch campaigns and categories
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user.companyId) return;

      try {
        setLoading(true);
        
        // Fetch campaigns
        const campaignsResponse = await axios.get<Ad[]>(`/api/campaigns?companyId=${session.user.companyId}`);
        setCampaigns(campaignsResponse.data);
        
        // Fetch categories
        const categoriesResponse = await axios.get<Category[]>(`/api/categories?companyId=${session.user.companyId}`);
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error('Error fetching campaign data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter campaigns based on search, status, and category
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.headline.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || campaign.categoryId === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get campaigns for current tab
  const getTabCampaigns = () => {
    switch (tabValue) {
      case 0: // All
        return filteredCampaigns;
      case 1: // Active
        return filteredCampaigns.filter(c => c.status === 'active');
      case 2: // Paused
        return filteredCampaigns.filter(c => c.status === 'paused');
      case 3: // Archived
        return filteredCampaigns.filter(c => c.status === 'archived');
      default:
        return filteredCampaigns;
    }
  };

  // Handle campaign edit
  const handleEditCampaign = (adId: string) => {
    const ad = campaigns.find(c => c.id === adId) || null;
    setCurrentAd(ad);
    setEditDialogOpen(true);
  };

  // Handle campaign status change
  const handleStatusChange = async (adId: string, newStatus: AdStatus) => {
    try {
      await axios.patch(`/api/campaigns/${adId}/status`, { status: newStatus });
      
      // Update local state
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === adId ? { ...campaign, status: newStatus } : campaign
      ));
    } catch (error) {
      console.error('Error updating campaign status:', error);
    }
  };

  // Handle campaign save
  const handleSaveCampaign = async (adData: any) => {
    try {
      if (currentAd) {
        // Update existing campaign
        const response = await axios.put(`/api/campaigns/${currentAd.id}`, adData);
        
        // Update local state
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === currentAd.id ? { ...campaign, ...response.data } : campaign
        ));
      } else {
        // Create new campaign
        const response = await axios.post('/api/campaigns', {
          ...adData,
          companyId: session?.user.companyId
        });
        
        // Add to local state
        setCampaigns(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      throw error;
    }
  };

  // Create new campaign
  const handleCreateCampaign = () => {
    setCurrentAd(null);
    setEditDialogOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Campaign Management
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateCampaign}
        >
          Create Campaign
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Campaigns" />
          <Tab label="Active" />
          <Tab label="Paused" />
          <Tab label="Archived" />
        </Tabs>

        <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            placeholder="Search campaigns..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="paused">Paused</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map(category => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {getTabCampaigns().length > 0 ? (
        <Grid container spacing={3}>
          {getTabCampaigns().map(campaign => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={campaign.id}>
              <CampaignCard 
                ad={campaign}
                onEdit={handleEditCampaign}
                onStatusChange={handleStatusChange}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary">
            No campaigns found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {campaigns.length > 0 
              ? 'Try adjusting your filters or search term'
              : 'Create your first campaign to get started'}
          </Typography>
          {campaigns.length === 0 && (
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={handleCreateCampaign}
              sx={{ mt: 2 }}
            >
              Create Campaign
            </Button>
          )}
        </Box>
      )}

      <CampaignEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSaveCampaign}
        ad={currentAd}
        categories={categories}
        isLoading={loading}
      />
    </Box>
  );
}
