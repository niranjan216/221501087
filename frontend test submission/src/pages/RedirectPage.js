// src/pages/RedirectPage.js
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useLogger from '../middleware/useLogger';
import { urlStore } from '../store/urlStore';
import { Typography, CircularProgress, Box } from '@mui/material';

export default function RedirectPage() {
  const { shortcode } = useParams();
  const navigate = useNavigate();
  const log = useLogger();

  useEffect(() => {
    console.log("Shortcode param:", shortcode);
    
    log('frontend', 'info', 'page', `Attempting redirection for shortcode: ${shortcode}`);

    const data = urlStore.get(shortcode);
    console.log("Mapped data:", data);

    if (!data) {
      log('frontend', 'error', 'utils', `No mapping found for shortcode: ${shortcode}`);
      return;
    }

    const now = new Date();
    const expiry = new Date(data.expiry);

    if (now > expiry) {
      log('frontend', 'warn', 'utils', `Shortcode expired: ${shortcode}`);
    } else {
      log('frontend', 'info', 'utils', `Redirecting to: ${data.longUrl}`);
      window.location.href = data.longUrl;
    }
  }, [shortcode]);

  return (
    <Box textAlign="center" mt={10}>
      <CircularProgress />
      <Typography mt={2}>Redirecting...</Typography>
    </Box>
  );
}
