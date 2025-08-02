import { useEffect, useCallback } from 'react';
import { useSocket } from '../contexts';
import { EVENTS } from '../constants';

export const useSocketConnection = () => {
  const { socket, isConnected, connectedClients, setConnectedClients } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Setup event handlers
    socket.on(EVENTS.CLIENTS_UPDATE, (event, clients) => {
      console.log('Connected clients update:', clients);
      setConnectedClients(clients);
    });

    return () => {
      socket.off(EVENTS.CLIENTS_UPDATE);
    };
  }, [socket, setConnectedClients]);

  const emit = useCallback((event, data, callback) => {
    if (socket) {
      return socket.emit(event, data, callback);
    }
  }, [socket]);

  const on = useCallback((event, handler) => {
    if (socket) {
      return socket.on(event, handler);
    }
  }, [socket]);

  const off = useCallback((event) => {
    if (socket) {
      return socket.off(event);
    }
  }, [socket]);

  return {
    isConnected,
    connectedClients,
    socketClient: socket,
    emit,
    on,
    off
  };
};