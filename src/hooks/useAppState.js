import { useEffect, useCallback } from 'react';
import { useApp } from '../contexts';
import { EVENTS, MODES } from '../constants';

export const useAppState = (socketClient) => {
  const { 
    currentMode, 
    setCurrentMode, 
    response, 
    setResponse, 
    loading, 
    setLoading,
    showSuccess,
    showError,
    showInfo
  } = useApp();

  useEffect(() => {
    if (!socketClient) return;

    // Handle state updates
    const handleStateUpdate = (event, state) => {
      console.log('Received state update:', state);
      if (state && state.mode) {
        setCurrentMode(state.mode);
      }
    };

    socketClient.on(EVENTS.STATE_UPDATE, handleStateUpdate);

    return () => {
      socketClient.off(EVENTS.STATE_UPDATE);
    };
  }, [socketClient, setCurrentMode]);

  const sendControlAction = useCallback((mode) => {
    if (!socketClient) {
      showError('Not connected to server');
      return;
    }
    
    setLoading(true);
    socketClient.emit(EVENTS.CONTROL_ACTION, { action: mode }, (response) => {
      setLoading(false);
      if (response && response.success) {
        showSuccess(`Display changed to ${mode}`);
        setCurrentMode(mode);
      } else {
        showError('Error changing display mode');
      }
    });
  }, [socketClient, setLoading, showSuccess, showError, setCurrentMode]);

  const sendMessage = useCallback((message) => {
    if (!message.trim()) {
      showInfo('Please enter a message');
      return;
    }
    
    if (!socketClient) {
      showError('Not connected to server');
      return;
    }
    
    setLoading(true);
    socketClient.emit(EVENTS.CONTROL_MESSAGE, { message }, (response) => {
      setLoading(false);
      if (response && response.success) {
        showSuccess(`Message sent successfully`);
        setCurrentMode(MODES.MESSAGE);
      } else {
        showError('Error sending message');
      }
    });
  }, [socketClient, setLoading, showSuccess, showError, showInfo, setCurrentMode]);

  const handleMediaControl = useCallback((type, data) => {
    if (!socketClient) {
      showError('Not connected to server');
      return;
    }
    
    setLoading(true);
    socketClient.emit(EVENTS.CONTROL_MEDIA, { type, data }, (response) => {
      setLoading(false);
      if (response && response.success) {
        showSuccess(`${type} displayed successfully`);
        setCurrentMode(type);
      } else {
        showError(`Error displaying ${type}`);
      }
    });
  }, [socketClient, setLoading, showSuccess, showError, setCurrentMode]);

  const clearResponse = useCallback(() => {
    setResponse('');
  }, [setResponse]);

  return {
    response,
    loading,
    currentMode,
    setResponse,
    setCurrentMode,
    sendControlAction,
    sendMessage,
    handleMediaControl,
    clearResponse
  };
};