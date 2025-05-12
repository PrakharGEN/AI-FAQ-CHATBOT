import { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, IconButton, Paper } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PhoneIcon from '@mui/icons-material/Phone';

const PHILIPS_BLUE = '#0961E0';
const PHILIPS_GREEN = '#4CAF50';

const ChatBotPage = ({ language, currentMode }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [showCallFrame, setShowCallFrame] = useState(false);

  // Reset showCallFrame when mode changes
  useEffect(() => {
    setShowCallFrame(false);
  }, [currentMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setMessages([...messages, { text: question, sender: 'user' }]);
    
    try {
      const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          question,
          language 
        }),
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { text: data.answer, sender: 'bot' }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        text: 'Sorry, I encountered an error. Please try again.', 
        sender: 'bot' 
      }]);
    }
    
    setQuestion('');
  };

  return (
    <Box sx={{ 
      flexGrow: 1, 
      p: 3, 
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '800px',
      mx: 'auto',
      width: '100%',
      position: 'relative'
    }}>
      {currentMode === 'chat' ? (
        <>
          {/* Messages Area */}
          <Box sx={{ 
            flexGrow: 1, 
            mb: 2, 
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            bgcolor: 'white',
            p: 2,
            borderRadius: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            minHeight: 'calc(100vh - 250px)'
          }}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {message.sender === 'bot' && (
                  <Box
                    sx={{
                      bgcolor: PHILIPS_BLUE,
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.875rem',
                      alignSelf: 'flex-start',
                      mb: 1
                    }}
                  >
                    philips
                  </Box>
                )}
                <Paper
                  sx={{
                    p: 2,
                    ml: message.sender === 'bot' ? 1 : 0,
                    mr: message.sender === 'user' ? 1 : 0,
                    backgroundColor: message.sender === 'user' ? '#e3f2fd' : 'white',
                    maxWidth: '70%',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderRadius: 2
                  }}
                >
                  <Typography>{message.text}</Typography>
                </Paper>
              </Box>
            ))}
          </Box>

          {/* Input Area */}
          <Box component="form" onSubmit={handleSubmit} sx={{ 
            display: 'flex', 
            gap: 1,
            position: 'relative',
          }}>
            <TextField
              fullWidth
              placeholder="Type your question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  '&.Mui-focused fieldset': {
                    borderColor: PHILIPS_BLUE,
                  },
                },
              }}
            />
            <IconButton 
              type="submit"
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                color: PHILIPS_BLUE
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </>
      ) : (
        // Call Support Interface
        <Container sx={{ 
          minHeight: 'calc(100vh - 250px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'white',
          borderRadius: 2,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center',
          p: 4
        }}>
          <img 
            src="/philips.jpg" 
            alt="Philips Logo" 
            style={{
              display: 'block',
              margin: '0 auto 20px',
              width: '120px'
            }}
          />
          <Typography variant="h4" sx={{ mb: 4 }}>
            Customer Support
          </Typography>

          {showCallFrame ? (
            <Box
              component="iframe"
              src="put your vapi key here"
              sx={{
                width: '200px',
                height: '200px',
                border: 'none',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 10px rgba(0,0,0,0.2)'
              }}
              allow="camera; microphone"
            />
          ) : (
            <Box
              onClick={() => setShowCallFrame(true)}
              sx={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                bgcolor: PHILIPS_GREEN,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 6px 10px rgba(0,0,0,0.2)',
                transition: 'all 0.3s',
                '&:hover': {
                  bgcolor: '#45a049',
                  transform: 'scale(1.05)'
                },
                '&:active': {
                  bgcolor: '#3e8e41',
                  transform: 'scale(0.95)'
                }
              }}
            >
              <PhoneIcon sx={{ fontSize: 60, mb: 1 }} />
              <Typography>
                Call Support
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 4, p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
            <Typography variant="h6">Philips ChatBot</Typography>
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              AI VOICE AGENT
            </Typography>
          </Box>
        </Container>
      )}
    </Box>
  );
};

export default ChatBotPage; 