declare module 'y-websocket/bin/utils' {
    import {WebSocket} from 'ws';
    import {IncomingMessage} from 'http';

    export function setupWSConnection(
        conn: WebSocket,
        req: IncomingMessage,
        options?: {
            gc?: boolean;
            awareness?: any;
            pingTimeout?: number;
            pongTimeout?: number;
            timeout?: number;
        }
    ): void;
}