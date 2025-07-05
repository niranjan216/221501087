// src/pages/ShortenerPage.js
import React, { useState } from 'react';
import { TextField, Button, Grid, Typography, Paper } from '@mui/material';
import useLogger from '../middleware/useLogger';
import { v4 as uuidv4 } from 'uuid';
import { urlStore } from '../store/urlStore';

function isValidURL(str) {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}

export default function ShortenerPage() {
  const log = useLogger();
  const [urls, setUrls] = useState([{ id: uuidv4(), longUrl: '', validity: '', shortcode: '' }]);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState({});

  const handleChange = (index, field, value) => {
    const updated = [...urls];
    updated[index][field] = value;
    setUrls(updated);
  };

  const addField = () => {
    if (urls.length < 5) {
      setUrls([...urls, { id: uuidv4(), longUrl: '', validity: '', shortcode: '' }]);
      log('frontend', 'info', 'component', 'Added new URL input field');
    }
  };

  const validateInputs = () => {
    const newErrors = {};
    urls.forEach((item, i) => {
      if (!isValidURL(item.longUrl)) newErrors[i] = 'Invalid URL';
      else if (item.validity && !/^\d+$/.test(item.validity)) newErrors[i] = 'Validity must be an integer';
      else if (item.shortcode && !/^[a-zA-Z0-9]{1,10}$/.test(item.shortcode)) newErrors[i] = 'Shortcode must be alphanumeric and <= 10 chars';
      else if (item.shortcode && urlStore.has(item.shortcode)) newErrors[i] = 'Shortcode already in use';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateShortcode = () => {
    let code;
    do {
      code = Math.random().toString(36).substring(2, 8);
    } while (urlStore.has(code));
    return code;
  };

  const handleSubmit = () => {
    if (!validateInputs()) {
      log('frontend', 'warn', 'component', 'Validation failed on submit');
      return;
    }
    const now = new Date();
    const mapped = urls.map((u) => {
      const code = u.shortcode || generateShortcode();
      const expiry = new Date(now.getTime() + (parseInt(u.validity || '30') * 60000));
      const entry = {
        ...u,
        shortcode: code,
        expiry,
        createdAt: now,
        shortUrl: `http://localhost:3000/${code}`,
        longUrl: u.longUrl,
      };
      urlStore.set(code, entry);
      return entry;
    });
    setResults(mapped);
    log('frontend', 'info', 'component', `Shortened ${mapped.length} URLs`);
  };

  return (
    <Paper elevation={3} sx={{ padding: 4 }}>
      <Typography variant="h5" gutterBottom>URL Shortener</Typography>
      {urls.map((u, index) => (
        <Grid container spacing={2} key={u.id} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Original URL"
              fullWidth
              value={u.longUrl}
              onChange={(e) => handleChange(index, 'longUrl', e.target.value)}
              error={!!errors[index]}
              helperText={errors[index]}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Validity (minutes)"
              fullWidth
              value={u.validity}
              onChange={(e) => handleChange(index, 'validity', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Custom Shortcode"
              fullWidth
              value={u.shortcode}
              onChange={(e) => handleChange(index, 'shortcode', e.target.value)}
            />
          </Grid>
        </Grid>
      ))}
      <Button variant="outlined" onClick={addField} disabled={urls.length >= 5} sx={{ mr: 2 }}>+ Add URL</Button>
      <Button variant="contained" onClick={handleSubmit}>Shorten URLs</Button>

      {results.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <Typography variant="h6">Results</Typography>
          {results.map((res, i) => (
            <Paper key={i} sx={{ p: 2, my: 1 }}>
              <Typography><b>Original:</b> {res.longUrl}</Typography>
              <Typography><b>Short:</b> <a href={res.shortUrl}>{res.shortUrl}</a></Typography>
              <Typography><b>Expires:</b> {res.expiry.toLocaleString()}</Typography>
            </Paper>
          ))}
        </div>
      )}
    </Paper>
  );
}
