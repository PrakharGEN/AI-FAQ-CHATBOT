import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Snackbar,
  Alert
} from '@mui/material';

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const handleLogin = () => {
    // Simple password check - in a real app, this should be more secure
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      setNotification({
        open: true,
        message: 'Invalid password',
        severity: 'error'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:8000/admin/add-faq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, answer }),
      });

      if (response.ok) {
        setNotification({
          open: true,
          message: 'FAQ added successfully!',
          severity: 'success'
        });
        setQuestion('');
        setAnswer('');
      } else {
        throw new Error('Failed to add FAQ');
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error adding FAQ',
        severity: 'error'
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Admin Login
            </Typography>
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleLogin}
              sx={{ mt: 2 }}
            >
              Login
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Add New FAQ
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              margin="normal"
              required
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              margin="normal"
              required
              multiline
              rows={4}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 2 }}
              fullWidth
            >
              Add FAQ
            </Button>
          </form>
        </Paper>
      </Box>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminPage; 