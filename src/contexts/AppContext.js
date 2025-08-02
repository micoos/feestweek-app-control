import React, { createContext, useContext, useState, useCallback } from 'react';
import { MODES } from '../constants';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentMode, setCurrentMode] = useState(MODES.GALLERY);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Add notification
  const addNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, duration);
    
    return id;
  }, []);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Show success notification
  const showSuccess = useCallback((message) => {
    addNotification(message, 'success');
  }, [addNotification]);

  // Show error notification
  const showError = useCallback((message) => {
    addNotification(message, 'error', 5000);
  }, [addNotification]);

  // Show info notification
  const showInfo = useCallback((message) => {
    addNotification(message, 'info');
  }, [addNotification]);

  const value = {
    // State
    currentMode,
    setCurrentMode,
    response,
    setResponse,
    loading,
    setLoading,
    notifications,
    
    // Actions
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showInfo
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};