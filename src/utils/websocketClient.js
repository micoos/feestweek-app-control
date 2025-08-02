class WebSocketClient {
  constructor(url, clientType, clientName) {
    this.url = url;
    this.clientType = clientType; // 'controller' or 'display'
    this.clientName = clientName;
    this.ws = null;
    this.clientId = null;
    this.pendingRequests = new Map();
    this.eventHandlers = new Map();
    this.reconnectInterval = 1000;
    this.maxReconnectInterval = 30000;
    this.reconnectTimer = null;
    this.isConnected = false;
    this.shouldReconnect = true;
    this.connectionChangeHandler = null;
  }

  connect() {
    console.log(`[WS] Connecting to ${this.url}...`);
    
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('[WS] Connection error:', error);
      this.scheduleReconnect();
    }
  }

  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log('[WS] Connected successfully');
      this.isConnected = true;
      this.reconnectInterval = 1000; // Reset reconnect interval
      
      // Register with server
      this.send({
        type: 'register',
        clientType: this.clientType,
        clientName: this.clientName
      });
      
      if (this.connectionChangeHandler) {
        this.connectionChangeHandler(true);
      }
    };
    
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('[WS] Error parsing message:', error);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('[WS] WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('[WS] Connection closed');
      this.isConnected = false;
      this.clientId = null;
      
      if (this.connectionChangeHandler) {
        this.connectionChangeHandler(false);
      }
      
      // Clear pending requests
      this.pendingRequests.forEach((pending) => {
        pending.reject(new Error('Connection lost'));
      });
      this.pendingRequests.clear();
      
      // Attempt reconnection
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };
  }

  handleMessage(message) {
    const { type, action, payload, id } = message;
    
    switch (type) {
      case 'event':
        if (action === 'registered') {
          this.clientId = payload.clientId;
          console.log(`[WS] Registered with ID: ${this.clientId}`);
          this.handleEvent('registered', payload);
        } else {
          this.handleEvent(action, payload);
        }
        break;
        
      case 'response':
      case 'error':
        const pending = this.pendingRequests.get(id);
        if (pending) {
          if (type === 'error') {
            pending.reject(new Error(payload.error || 'Request failed'));
          } else {
            pending.resolve(payload);
          }
          this.pendingRequests.delete(id);
        }
        break;
        
      case 'request':
        // For display clients - handle incoming requests
        if (this.clientType === 'display') {
          this.handleEvent('request', message);
        }
        break;
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    console.log(`[WS] Scheduling reconnect in ${this.reconnectInterval}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      console.log('[WS] Attempting reconnection...');
      this.connect();
      
      // Exponential backoff
      this.reconnectInterval = Math.min(
        this.reconnectInterval * 2,
        this.maxReconnectInterval
      );
    }, this.reconnectInterval);
  }

  async request(action, payload = {}, timeout = 5000) {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected');
    }
    
    const id = this.generateId();
    const message = {
      id,
      type: 'request',
      action,
      payload,
      timestamp: Date.now(),
      sender: this.clientId
    };
    
    return new Promise((resolve, reject) => {
      // Set timeout
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout for action: ${action}`));
      }, timeout);
      
      // Store pending request
      this.pendingRequests.set(id, {
        resolve: (data) => {
          clearTimeout(timeoutId);
          resolve(data);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
      
      // Send request
      this.send(message);
    });
  }

  respond(requestId, success, payload = {}) {
    if (!this.isConnected) {
      console.warn('[WS] Cannot respond - not connected');
      return;
    }
    
    this.send({
      id: requestId,
      type: 'response',
      action: 'response',
      payload: { success, ...payload },
      timestamp: Date.now(),
      sender: this.clientId
    });
  }

  emit(action, payload = {}) {
    if (!this.isConnected) {
      console.warn('[WS] Cannot emit event - not connected');
      return;
    }
    
    this.send({
      type: 'event',
      action,
      payload,
      timestamp: Date.now(),
      sender: this.clientId
    });
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('[WS] Cannot send - WebSocket not open');
    }
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  handleEvent(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[WS] Error in event handler for ${event}:`, error);
      }
    });
  }

  setConnectionChangeHandler(handler) {
    this.connectionChangeHandler = handler;
  }

  disconnect() {
    console.log('[WS] Disconnecting...');
    this.shouldReconnect = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.clientId = null;
  }

  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  getClientId() {
    return this.clientId;
  }
}

export default WebSocketClient;