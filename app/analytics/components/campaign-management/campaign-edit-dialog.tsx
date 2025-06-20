"use client";
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel,
  Select, MenuItem, Grid, Typography, Box,
  InputAdornment, FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AdStatus } from '@prisma/client';

interface Category {
  id: string;
  name: string;
}

interface CampaignEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (adData: any) => Promise<void>;
  ad: {
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
  } | null;
  categories: Category[];
  isLoading: boolean;
}

export default function CampaignEditDialog({
  open,
  onClose,
  onSave,
  ad,
  categories,
  isLoading
}: CampaignEditDialogProps) {
  const [formData, setFormData] = useState({
    headline: '',
    ctaText: '',
    ctaUrl: '',
    imageUrl: '',
    status: 'active' as AdStatus,
    budget: '',
    spendCap: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    categoryId: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (ad) {
      setFormData({
        headline: ad.headline || '',
        ctaText: ad.ctaText || '',
        ctaUrl: ad.ctaUrl || '',
        imageUrl: ad.imageUrl || '',
        status: ad.status || 'active',
        budget: ad.budget ? String(ad.budget) : '',
        spendCap: ad.spendCap ? String(ad.spendCap) : '',
        startDate: ad.startDate ? new Date(ad.startDate) : null,
        endDate: ad.endDate ? new Date(ad.endDate) : null,
        categoryId: ad.categoryId || ''
      });
      setErrors({});
    }
  }, [ad]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDateChange = (date: Date | null, fieldName: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: date
    }));
    
    // Clear error when field is edited
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.headline.trim()) {
      newErrors.headline = 'Headline is required';
    }
    
    if (!formData.ctaText.trim()) {
      newErrors.ctaText = 'CTA text is required';
    }
    
    if (!formData.ctaUrl.trim()) {
      newErrors.ctaUrl = 'CTA URL is required';
    } else if (!formData.ctaUrl.startsWith('http')) {
      newErrors.ctaUrl = 'URL must start with http:// or https://';
    }
    
    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = 'Image URL is required';
    } else if (!formData.imageUrl.startsWith('http')) {
      newErrors.imageUrl = 'URL must start with http:// or https://';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    if (formData.budget && isNaN(Number(formData.budget))) {
      newErrors.budget = 'Budget must be a number';
    }
    
    if (formData.spendCap && isNaN(Number(formData.spendCap))) {
      newErrors.spendCap = 'Spend cap must be a number';
    }
    
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      const dataToSubmit = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        spendCap: formData.spendCap ? parseFloat(formData.spendCap) : null,
      };
      
      await onSave(dataToSubmit);
      onClose();
    } catch (error) {
      console.error('Error saving campaign:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {ad ? 'Edit Campaign' : 'Create New Campaign'}
      </DialogTitle>
      
      <DialogContent dividers>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Campaign Details
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="headline"
                label="Headline"
                value={formData.headline}
                onChange={handleChange}
                fullWidth
                error={!!errors.headline}
                helperText={errors.headline}
                disabled={isLoading || isSaving}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.categoryId}>
                <InputLabel>Category</InputLabel>
                <Select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  label="Category"
                  disabled={isLoading || isSaving}
                >
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="ctaText"
                label="CTA Text"
                value={formData.ctaText}
                onChange={handleChange}
                fullWidth
                error={!!errors.ctaText}
                helperText={errors.ctaText}
                disabled={isLoading || isSaving}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="ctaUrl"
                label="CTA URL"
                value={formData.ctaUrl}
                onChange={handleChange}
                fullWidth
                error={!!errors.ctaUrl}
                helperText={errors.ctaUrl}
                disabled={isLoading || isSaving}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="imageUrl"
                label="Image URL"
                value={formData.imageUrl}
                onChange={handleChange}
                fullWidth
                error={!!errors.imageUrl}
                helperText={errors.imageUrl}
                disabled={isLoading || isSaving}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Campaign Budget
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="budget"
                label="Total Budget"
                value={formData.budget}
                onChange={handleChange}
                fullWidth
                error={!!errors.budget}
                helperText={errors.budget || 'Leave empty for no budget limit'}
                disabled={isLoading || isSaving}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="spendCap"
                label="Daily Spend Cap"
                value={formData.spendCap}
                onChange={handleChange}
                fullWidth
                error={!!errors.spendCap}
                helperText={errors.spendCap || 'Leave empty for no daily cap'}
                disabled={isLoading || isSaving}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Campaign Schedule
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(date) => handleDateChange(date, 'startDate')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.startDate,
                    helperText: errors.startDate,
                    disabled: isLoading || isSaving
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DatePicker
                label="End Date"
                value={formData.endDate}
                onChange={(date) => handleDateChange(date, 'endDate')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.endDate,
                    helperText: errors.endDate,
                    disabled: isLoading || isSaving
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Campaign Status
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                  disabled={isLoading || isSaving}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="paused">Paused</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={isLoading || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
