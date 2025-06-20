"use client";
import { useEffect } from 'react';
import axios from 'axios';
import { Paper, Typography, Button, Box } from '@mui/material';
import Image from 'next/image';

export interface AdProps {
  id: string;
  imageUrl: string;
  headline: string;
  ctaText: string;
  ctaUrl: string;
  category?: string;
  company?: string;
  impressionId: string;
}

interface BannerProps {
  ad: AdProps;
  impressionId: string;
}

export default function AdBanner({ ad, impressionId }: BannerProps) {
  useEffect(() => {
    // Record the view impression when the component mounts
    axios
      .post('/api/report', { 
        type: 'view', 
        impressionId
      })
      .then((res) => {
        console.log('View impression recorded:', res.data);
      })
      .catch((error) => console.error('Error recording view impression:', error));
  }, [impressionId]);

  const handleClick = () => {
    // Record the click impression
    axios
      .post('/api/report', { 
        type: 'click', 
        impressionId
      })
      .catch((error) => console.error('Error recording click:', error));

    // Open the target URL in a new tab
    window.open(ad.ctaUrl, '_blank');
  };

  return (
    <Paper 
      elevation={3} 
      sx={{
        padding: '1rem',
        margin: '1rem 0',
        textAlign: 'center',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#f9f9f9'
      }}
    >
      <Box sx={{ position: 'relative' }}>
        {/* Sponsored label */}
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            padding: '2px 8px',
            fontSize: '0.75rem',
            borderBottomLeftRadius: '4px'
          }}
        >
          Sponsored
        </Box>
        
        {/* Ad image */}
        <Box sx={{ position: 'relative', width: '100%', height: '200px', marginBottom: '0.5rem' }}>
          <Image 
            src={ad.imageUrl} 
            alt={ad.headline}
            fill
            style={{ 
              objectFit: 'contain',
              borderRadius: '4px'
            }} 
          />
        </Box>
      </Box>
      
      {/* Ad headline */}
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 600, 
          marginY: '0.75rem',
          color: '#333'
        }}
      >
        {ad.headline}
      </Typography>
      
      {/* Company and category info if available */}
      {(ad.company || ad.category) && (
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            marginBottom: '0.75rem',
            color: '#666'
          }}
        >
          {ad.company && `By ${ad.company}`}
          {ad.company && ad.category && ' • '}
          {ad.category && `${ad.category}`}
        </Typography>
      )}
      
      {/* Call to action button */}
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleClick}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '20px',
          padding: '6px 20px',
          marginTop: '0.5rem'
        }}
      >
        {ad.ctaText}
      </Button>
    </Paper>
  );
}
