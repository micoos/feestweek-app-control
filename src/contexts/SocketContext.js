import React, { createContext, useContext, useEffect, useState } from 'react';
import SocketClient from '../utils/socketClient';
import config from '../config';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedClients, setConnectedClients] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket client
    const socketClient = new SocketClient(
      config.API_BASE_URL,
      config.CLIENT_TYPE,
      `${config.CLIENT_NAME_PREFIX} ${Math.random().toString(36).substr(2, 5)}`
    );
    
    // Set connection handler
    socketClient.setConnectionChangeHandler(setIsConnected);
    
    // Connect
    socketClient.connect();
    
    // Set socket state
    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, []);

  const value = {
    socket,
    isConnected,
    connectedClients,
    setConnectedClients
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};