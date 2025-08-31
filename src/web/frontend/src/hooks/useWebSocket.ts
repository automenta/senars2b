import { useCallback, useEffect, useRef, useState } from 'react';

const WS_URL = `ws://${window.location.host.replace(':3000', ':8080')}/ws`;

type MessageListener = (message: any) => void;

class WebSocketManager {
  public isConnected = false;
  private ws: WebSocket | null = null;
  private listeners: Set<MessageListener> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isIntentionallyClosed = false;

  constructor() {
    this.connect();
  }

  public addListener(listener: MessageListener) {
    this.listeners.add(listener);
  }

  public removeListener(listener: MessageListener) {
    this.listeners.delete(listener);
  }

  public sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  public disconnect() {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
    }
  }

  private connect() {
    try {
      // Clear previous connection if exists
      if (this.ws) {
        this.ws.close();
      }

      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.listeners.forEach((listener) =>
          listener({
            type: 'CONNECTION_STATUS',
            payload: { isConnected: true },
          })
        );
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.listeners.forEach((listener) => listener(message));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.listeners.forEach((listener) =>
            listener({
              type: 'ERROR',
              payload: { message: 'Failed to parse server message' },
            })
          );
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.listeners.forEach((listener) =>
          listener({
            type: 'CONNECTION_STATUS',
            payload: { isConnected: false, error: 'Connection error' },
          })
        );
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.reason);
        const wasConnected = this.isConnected;
        this.isConnected = false;
        this.listeners.forEach((listener) =>
          listener({
            type: 'CONNECTION_STATUS',
            payload: { isConnected: false },
          })
        );

        // Attempt to reconnect if not explicitly closed and was previously connected
        if (
          !this.isIntentionallyClosed &&
          wasConnected &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.reconnectAttempts++;
          console.log(
            `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
          );
          setTimeout(
            () => this.connect(),
            this.reconnectDelay * this.reconnectAttempts
          );
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.listeners.forEach((listener) =>
        listener({
          type: 'CONNECTION_STATUS',
          payload: { isConnected: false, error: 'Connection failed' },
        })
      );
    }
  }
}

const webSocketManager = new WebSocketManager();

export const useWebSocket = (messageHandler: (message: any) => void) => {
  const [isConnected, setIsConnected] = useState(webSocketManager.isConnected);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const messageHandlerRef = useRef(messageHandler);

  // Keep ref updated to the latest handler
  useEffect(() => {
    messageHandlerRef.current = messageHandler;
  }, [messageHandler]);

  const handleMessage = useCallback((message: any) => {
    if (message.type === 'CONNECTION_STATUS') {
      setIsConnected(message.payload.isConnected);
      setConnectionError(message.payload.error || null);
    } else {
      try {
        messageHandlerRef.current(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    }
  }, []);

  useEffect(() => {
    webSocketManager.addListener(handleMessage);
    return () => {
      webSocketManager.removeListener(handleMessage);
    };
  }, [handleMessage]);

  const sendMessage = useCallback((message: any) => {
    try {
      webSocketManager.sendMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      webSocketManager.disconnect();
    };
  }, []);

  return { isConnected, connectionError, sendMessage };
};
