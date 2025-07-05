// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from '@mui/material';
import ShortenerPage from './pages/ShortenerPage';
import RedirectPage from './pages/RedirectPage';
import { LoggerProvider } from './middleware/LoggerContext';
import useLogger from './middleware/useLogger';

export default function App() {
  const log = useLogger();

  React.useEffect(() => {
    log('frontend', 'info', 'page', 'App mounted and routing initialized');
  }, []);

  return (
    <LoggerProvider>
      <Router>
        <Container maxWidth="md" sx={{ mt: 5 }}>
          <Routes>
            <Route path="/" element={<ShortenerPage />} />
            <Route path="/:shortcode" element={<RedirectPage />} />
          </Routes>
        </Container>
      </Router>
    </LoggerProvider>
  );
}
