import React from 'react';
import { Box, Button, Typography } from '@mui/material';

export default function WelcomePage({ onContinue }) {
  return (
    <Box 
      width="100vw" 
      height="100vh" 
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bgcolor="#ffffff"
      gap={2}
    >
      <Typography variant="h4" color="#000000">
        Hi there, welcome to Radley's Choice management app!
      </Typography>
      <Button 
        variant="contained" 
        onClick={onContinue}
        sx={{ backgroundColor: '#000000', color: '#ffffff' }}
      >
        Continue
      </Button>
    </Box>
  );
}
