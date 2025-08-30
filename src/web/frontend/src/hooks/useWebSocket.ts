import {useCallback, useEffect, useState} from 'react';

const WS_URL = `ws://${window.location.host.replace(':3000', ':8080')}/ws`;

type MessageListener = (message: any) => void;

class WebSocketManager {
    public isConnected = false;
    private ws: WebSocket | null = null;
    private listeners: Set<MessageListener> = new Set();

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
            console.error('WebSocket is not connected.');
        }
    }

    private connect() {
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.isConnected = true;
            this.listeners.forEach(listener => listener({type: 'CONNECTION_STATUS', payload: {isConnected: true}}));
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.listeners.forEach(listener => listener(message));
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.isConnected = false;
            this.listeners.forEach(listener => listener({type: 'CONNECTION_STATUS', payload: {isConnected: false}}));
            // Optional: implement reconnection logic here
        };
    }
}

const webSocketManager = new WebSocketManager();

export const useWebSocket = (messageHandler: (message: any) => void) => {
    const [isConnected, setIsConnected] = useState(webSocketManager.isConnected);

    const handleMessage = useCallback((message: any) => {
        if (message.type === 'CONNECTION_STATUS') {
            setIsConnected(message.payload.isConnected);
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

    return {isConnected, sendMessage: webSocketManager.sendMessage.bind(webSocketManager)};
};
