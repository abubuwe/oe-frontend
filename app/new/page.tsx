'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, TextField, Button, Typography, Paper, List, CircularProgress, Box } from '@mui/material';
import { styled } from '@mui/system';
import AdBanner, { AdProps } from '@/components/ad-banner';

interface HistoryItem {
  role: string;
  content: string;
}

const StyledPaper = styled(Paper)({
  padding: '1rem',
  marginTop: '1rem',
  marginBottom: '1rem',
  fontFamily: 'Open Sans, sans-serif',
});

const StyledButton = styled(Button)({
  height: '56px',
});

export default function NewConversationPage() {
  const [question, setQuestion] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [answer, setAnswer] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [ad, setAd] = useState<AdProps | null>(null);
  const [adLoading, setAdLoading] = useState<boolean>(false);

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  const getSessionId = (): string => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('ad_session_id');
      if (!storedId) {
        const newId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('ad_session_id', newId);
        return newId;
      }
      return storedId;
    }
    return '';
  };

  const fetchAd = async (questionText: string) => {
    setAdLoading(true);
    try {
      const sessionId = getSessionId();
      const adRes = await axios.post('/api/ads', {
        question: questionText,
        sessionId
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (adRes.data && adRes.data.id) {
        setAd(adRes.data);
      } else {
        setAd(null);
      }
    } catch (error) {
      console.error('Error fetching ad:', error);
      setAd(null);
    } finally {
      setAdLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAd(null);
    setLoading(true);
    setAdLoading(true);
    scrollToBottom();

    fetchAd(question);

    try {
      const response = await axios.post('/api/ask', { question, history });
      setHistory([...history, { role: 'user', content: question }, { role: 'assistant', content: response.data.answer }]);
      setAnswer(response.data.answer);
      setQuestion('');
    } catch (error) {
      console.error('Error fetching the answer:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [loading, history]);

  return (
    <>
      <Container maxWidth="md" style={{ marginTop: '120px', fontFamily: 'Roboto, sans-serif', marginBottom: '250px' }}>
        {history.length > 0 && (
          <List>
            {history.map((item, index) => (
              <StyledPaper elevation={3} key={index}>
                <Typography variant="body1" component="div">
                  <strong>{item.role.charAt(0).toUpperCase() + item.role.slice(1)}:</strong>
                </Typography>
                <Box component="div" dangerouslySetInnerHTML={{ __html: item.content.replace(/\n/g, '<br />') }} />
              </StyledPaper>
            ))}
          </List>
        )}
        <StyledPaper elevation={3}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <TextField
              label="Ask a question"
              variant="outlined"
              fullWidth
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
            />
            <StyledButton type="submit" variant="contained" color="primary" disabled={loading}>
              Ask
            </StyledButton>
          </form>
        </StyledPaper>

        {/* Ad Loading Indicator or Ad Banner */}
        {adLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Finding relevant ad...
            </Typography>
            <CircularProgress size={24} />
          </Box>
        ) : (
          ad && loading && (
            <Box mt={2}>
              <AdBanner ad={ad} impressionId={ad.impressionId} />
            </Box>
          )
        )}

        {/* Main Answer Loading Indicator */}
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
            <CircularProgress />
          </Box>
        )}
      </Container>
    </>
  );
}
