import React from 'react';
import { Select, MenuItem, FormControl } from '@mui/material';

const LanguageSelector = ({ value, onChange }) => {
  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{ 
          bgcolor: 'white',
          '& .MuiSelect-select': { py: 1 }
        }}
      >
        <MenuItem value="en">English</MenuItem>
        <MenuItem value="hi">हिंदी</MenuItem>
      </Select>
    </FormControl>
  );
};

export default LanguageSelector; 