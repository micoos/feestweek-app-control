import React from 'react';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import Notifications from './components/Notifications';
import { AppProvider, SocketProvider } from './contexts';

function AppWrapper() {
  return (
    <ErrorBoundary>
      <SocketProvider>
        <AppProvider>
          <App />
          <Notifications />
        </AppProvider>
      </SocketProvider>
    </ErrorBoundary>
  );
}

export default AppWrapper;