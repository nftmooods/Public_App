import React from 'react';
import { AppProvider } from './contexts/AppContext';
import { MainApp } from './components/MainApp';

function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;