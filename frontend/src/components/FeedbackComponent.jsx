import React, { useState } from 'react';
import { Box, IconButton, Snackbar } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

const FeedbackComponent = ({ messageId }) => {
  const [feedback, setFeedback] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleFeedback = async (isPositive) => {
    if (feedback !== null) return; // Prevent multiple feedback submissions

    try {
      const response = await fetch('http://localhost:8000/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          isPositive,
        }),
      });

      if (response.ok) {
        setFeedback(isPositive);
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
      <IconButton
        size="small"
        onClick={() => handleFeedback(true)}
        color={feedback === true ? 'primary' : 'default'}
        disabled={feedback !== null}
      >
        <ThumbUpIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => handleFeedback(false)}
        color={feedback === false ? 'error' : 'default'}
        disabled={feedback !== null}
      >
        <ThumbDownIcon fontSize="small" />
      </IconButton>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Thank you for your feedback!"
      />
    </Box>
  );
};

export default FeedbackComponent; 