import {useCallback, useEffect, useState} from 'react';

const WS_URL = `ws://${window.location.host.replace(':3000', ':8080')}/ws`;

type MessageListener = (message: any) => void;

class WebSocketManager {
    public isConnected = false;
    private ws: WebSocket | null = null;
    private listeners: Set<MessageListener> = new Set();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

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
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not connected. Message not sent:', message);
        }
    }

    public disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
        }
    }

    private connect() {
        try {
            this.ws = new WebSocket(WS_URL);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.listeners.forEach(listener => listener({type: 'CONNECTION_STATUS', payload: {isConnected: true}}));
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.listeners.forEach(listener => listener(message));
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.listeners.forEach(listener => listener({
                    type: 'CONNECTION_STATUS',
                    payload: {isConnected: false, error: 'Connection error'}
                }));
            };

            this.ws.onclose = (event) => {
                console.log('WebSocket disconnected', event.reason);
                this.isConnected = false;
                this.listeners.forEach(listener => listener({
                    type: 'CONNECTION_STATUS',
                    payload: {isConnected: false}
                }));

                // Attempt to reconnect if not explicitly closed
                if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                    setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
                }
            };
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.listeners.forEach(listener => listener({
                type: 'CONNECTION_STATUS',
                payload: {isConnected: false, error: 'Connection failed'}
            }));
        }
    }
}

const webSocketManager = new WebSocketManager();

export const useWebSocket = (messageHandler: (message: any) => void) => {
    const [isConnected, setIsConnected] = useState(webSocketManager.isConnected);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    const handleMessage = useCallback((message: any) => {
        if (message.type === 'CONNECTION_STATUS') {
            setIsConnected(message.payload.isConnected);
            setConnectionError(message.payload.error || null);
        } else {
            messageHandler(message);
        }
    }, [messageHandler]);

    useEffect(() => {
        webSocketManager.addListener(handleMessage);
        return () => {
            webSocketManager.removeListener(handleMessage);
        };
    }, [handleMessage]);

    const sendMessage = useCallback((message: any) => {
        webSocketManager.sendMessage(message);
    }, []);

    return {isConnected, connectionError, sendMessage};
};
