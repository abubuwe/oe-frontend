"use client";
import React from 'react';
import { 
  Card, CardContent, CardActions, Typography, 
  Button, Chip, Box, Grid, LinearProgress, 
  Tooltip, IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArchiveIcon from '@mui/icons-material/Archive';
import { AdStatus } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';

interface CampaignCardProps {
  ad: {
    id: string;
    headline: string;
    imageUrl: string;
    status: AdStatus;
    budget: number | null;
    spendCap: number | null;
    startDate: string | null;
    endDate: string | null;
    category: {
      name: string;
    };
    metrics?: {
      impressions: number;
      clicks: number;
      spend: number;
    };
  };
  onEdit: (adId: string) => void;
  onStatusChange: (adId: string, status: AdStatus) => void;
  isSuper?: boolean;
  companyName?: string;
}

export default function CampaignCard({ ad, onEdit, onStatusChange, isSuper = false, companyName }: CampaignCardProps) {
  const metrics = ad.metrics || { impressions: 0, clicks: 0, spend: 0 };
  const ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions * 100).toFixed(2) : '0';
  const budgetUsage = ad.budget ? (metrics.spend / ad.budget * 100) : 0;
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };
  
  const getStatusColor = (status: AdStatus) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'archived': return 'error';
      default: return 'default';
    }
  };
  
  const getNextStatus = (currentStatus: AdStatus): AdStatus => {
    switch (currentStatus) {
      case 'active': return 'paused';
      case 'paused': return 'active';
      case 'archived': return 'archived'; // Archived is final state
      default: return 'active';
    }
  };
  
  const getStatusIcon = (status: AdStatus) => {
    switch (status) {
      case 'active': return <PauseIcon />;
      case 'paused': return <PlayArrowIcon />;
      case 'archived': return <ArchiveIcon />;
      default: return <PlayArrowIcon />;
    }
  };
  
  const getStatusTooltip = (status: AdStatus) => {
    switch (status) {
      case 'active': return 'Pause Campaign';
      case 'paused': return 'Activate Campaign';
      case 'archived': return 'Campaign Archived';
      default: return 'Activate Campaign';
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Box sx={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden' }}>
        <img 
          src={ad.imageUrl} 
          alt={ad.headline}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        <Chip 
          label={ad.status}
          color={getStatusColor(ad.status) as any}
          size="small"
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8,
            textTransform: 'capitalize'
          }}
        />
      </Box>
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div" noWrap>
          {ad.headline}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Category: {ad.category.name}
        </Typography>
        
        {isSuper && companyName && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Company: {companyName}
          </Typography>
        )}
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Start Date
            </Typography>
            <Typography variant="body2">
              {formatDate(ad.startDate)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              End Date
            </Typography>
            <Typography variant="body2">
              {formatDate(ad.endDate)}
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Budget Usage
            </Typography>
            <Typography variant="caption">
              {formatCurrency(metrics.spend)} / {ad.budget ? formatCurrency(ad.budget) : 'No limit'}
            </Typography>
          </Box>
          <Tooltip title={`${budgetUsage.toFixed(1)}% of budget used`}>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(budgetUsage, 100)} 
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Tooltip>
        </Box>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary" display="block">
              Impressions
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {metrics.impressions.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary" display="block">
              Clicks
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {metrics.clicks.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary" display="block">
              CTR
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {ctr}%
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
      
      <CardActions>
        <Button 
          size="small" 
          startIcon={<EditIcon />}
          onClick={() => onEdit(ad.id)}
        >
          Edit
        </Button>
        
        {ad.status !== 'archived' && (
          <Tooltip title={getStatusTooltip(ad.status)}>
            <IconButton 
              size="small" 
              onClick={() => onStatusChange(ad.id, getNextStatus(ad.status))}
              color={ad.status === 'active' ? 'warning' : 'success'}
            >
              {getStatusIcon(ad.status)}
            </IconButton>
          </Tooltip>
        )}
        
        {ad.status !== 'archived' && (
          <Tooltip title="Archive Campaign">
            <IconButton 
              size="small" 
              onClick={() => onStatusChange(ad.id, 'archived')}
              color="error"
              sx={{ ml: 'auto' }}
            >
              <ArchiveIcon />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
}
