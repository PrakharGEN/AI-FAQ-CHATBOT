import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Button,
  Menu,
  MenuItem
} from '@mui/material';
import ChatBotPage from './pages/ChatBotPage';
import AdminPage from './components/AdminPage';
import LanguageSelector from './components/LanguageSelector';
import ChatIcon from '@mui/icons-material/Chat';
import PhoneIcon from '@mui/icons-material/Phone';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// Philips brand colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#0072DA', // Philips blue
      contrastText: '#fff',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Arial", "Helvetica", sans-serif',
  },
});

// Separate header component to use navigation
const Header = ({ language, setLanguage, currentMode, setCurrentMode }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleModeSelect = (mode) => {
    setCurrentMode(mode);
    handleMenuClose();
    navigate('/'); // Always navigate to home when changing modes
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const handleChatClick = () => {
    setCurrentMode('chat');
    navigate('/');
  };

  return (
    <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            cursor: 'pointer' 
          }}
          onClick={handleChatClick}
        >
          Philips FAQ Bot
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <LanguageSelector value={language} onChange={setLanguage} />
          
          {/* Mode Selection */}
          <Button
            onClick={handleMenuClick}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'white',
                opacity: 0.9
              },
              textTransform: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            {currentMode === 'chat' ? <ChatIcon /> : <PhoneIcon />}
            {currentMode === 'chat' ? 'Chat' : 'Call'}
            <KeyboardArrowDownIcon />
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleModeSelect('chat')}>
              <ChatIcon sx={{ mr: 1 }} /> Chat Support
            </MenuItem>
            <MenuItem onClick={() => handleModeSelect('call')}>
              <PhoneIcon sx={{ mr: 1 }} /> Call Support
            </MenuItem>
          </Menu>

          <Button 
            onClick={handleAdminClick}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'white',
                opacity: 0.9
              }
            }}
          >
            ADMIN
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

const App = () => {
  const [language, setLanguage] = useState('en');
  const [currentMode, setCurrentMode] = useState('chat');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <Header 
            language={language}
            setLanguage={setLanguage}
            currentMode={currentMode}
            setCurrentMode={setCurrentMode}
          />
          <Container sx={{ mt: 4 }}>
            <Routes>
              <Route 
                path="/" 
                element={
                  <ChatBotPage 
                    language={language} 
                    currentMode={currentMode}
                  />
                } 
              />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App; 