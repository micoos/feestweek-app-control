import { io } from 'socket.io-client';

class SocketClient {
  constructor(url, clientType, clientName) {
    this.url = url;
    this.clientType = clientType;
    this.clientName = clientName;
    this.socket = null;
    this.eventHandlers = new Map();
    this.isConnected = false;
    this.onConnectionChange = null;
  }

  connect() {
    console.log(`[Socket.IO] Connecting to ${this.url} as ${this.clientType}`);
    
    this.socket = io(this.url, {
      query: {
        type: this.clientType,
        name: this.clientName
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    if (!this.socket) {
      console.error('[Socket.IO] Socket not initialized');
      return;
    }

    // Connection events
    this.socket.on('connect', () => {
      console.log(`[Socket.IO] Connected with ID: ${this.socket.id}`);
      this.isConnected = true;
      
      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Disconnected: ${reason}`);
      this.isConnected = false;
      
      if (this.onConnectionChange) {
        this.onConnectionChange(false);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error.message);
    });

    // Handle all registered events
    this.socket.onAny((event, ...args) => {
      const handler = this.eventHandlers.get(event);
      if (handler) {
        try {
          handler(event, ...args);
        } catch (error) {
          console.error(`[Socket.IO] Error handling event ${event}:`, error);
        }
      }
    });
  }

  on(event, handler) {
    console.log(`[Socket.IO] Registering handler for event: ${event}`);
    this.eventHandlers.set(event, handler);
    
    // Don't register directly on socket - onAny will handle it
  }

  off(event) {
    console.log(`[Socket.IO] Removing handler for event: ${event}`);
    this.eventHandlers.delete(event);
    
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit(event, data, callback) {
    if (this.socket && this.isConnected) {
      console.log(`[Socket.IO] Emitting ${event}:`, data);
      
      if (callback) {
        this.socket.emit(event, data, callback);
      } else {
        this.socket.emit(event, data);
      }
    } else {
      console.warn(`[Socket.IO] Cannot emit ${event} - not connected`);
    }
  }

  setConnectionChangeHandler(handler) {
    this.onConnectionChange = handler;
  }

  disconnect() {
    if (this.socket) {
      console.log('[Socket.IO] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  getId() {
    return this.socket ? this.socket.id : null;
  }
}

export default SocketClient;