/* eslint-disable react/function-component-definition */
import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SubtitleBuilder from './SubtitleBuilder';
import { GlobalProvider } from './GlobalContext';

// Definiamo la navigazione per il dashboard (una singola pagina per ora)
const NAVIGATION = [
  {
    segment: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
  },
];

function App() {
  // Usa AppProvider per fornire il tema e la navigazione
  return (
    <GlobalProvider>
      <AppProvider navigation={NAVIGATION} branding={{ title: 'Subtitle' }}>
        <DashboardLayout defaultSidebarCollapsed>
          <SubtitleBuilder />
        </DashboardLayout>
      </AppProvider>
    </GlobalProvider>
  );
}

export default App;
