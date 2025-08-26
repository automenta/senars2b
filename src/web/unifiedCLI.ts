#!/usr/bin/env node

import * as readline from 'readline';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';

class WebSocketCLI {
    private ws: WebSocket | null = null;
    private rl: readline.Interface;
    private isConnected: boolean = false;
    private pendingRequests: Map<string, { resolve: Function, reject: Function }> = new Map();
    private commandHistory: string[] = [];
    private historyIndex: number = 0;

    constructor(private host: string = 'localhost', private port: number = 8080) {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const wsUrl = `ws://${this.host}:${this.port}`;
            console.log(`Connecting to Senars3 Cognitive System at ${wsUrl}...`);
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.on('open', () => {
                this.isConnected = true;
                console.log('✅ Connected to Senars3 Cognitive System');
                console.log('Initializing system...');
                this.sendRequest('core', 'start', {})
                    .then(() => {
                        console.log('System initialized successfully!');
                        console.log('Type "help" for available commands or "quit" to exit.');
                        resolve();
                    })
                    .catch(reject);
            });
            
            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });
            
            this.ws.on('close', () => {
                this.isConnected = false;
                console.log('\n❌ Disconnected from Senars3 Cognitive System');
                process.exit(0);
            });
            
            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            });
        });
    }

    private handleMessage(message: any): void {
        switch (message.type) {
            case 'response':
                this.handleResponse(message);
                break;
            case 'event':
                this.handleEvent(message);
                break;
            case 'error':
                this.handleError(message);
                break;
            case 'welcome':
                console.log('Welcome to Senars3 Cognitive System');
                console.log(`Version: ${message.payload.version}`);
                console.log(`Uptime: ${message.payload.uptime}`);
                break;
        }
    }

    private handleResponse(message: any): void {
        const pending = this.pendingRequests.get(message.id);
        if (pending) {
            pending.resolve(message.payload);
            this.pendingRequests.delete(message.id);
        } else {
            // Display unsolicited responses
            console.log('\n--- System Response ---');
            console.log(JSON.stringify(message.payload, null, 2));
            this.showPrompt();
        }
    }

    private handleEvent(message: any): void {
        switch (message.method) {
            case 'inputProcessed':
                this.displayResults(message.payload.input, message.payload.cognitiveItems);
                break;
            case 'inputProcessingError':
                console.error('❌ Error processing input:', message.payload.error);
                this.showPrompt();
                break;
            case 'systemError':
                console.error('❌ System error:', message.payload.error);
                this.showPrompt();
                break;
            default:
                console.log('\n--- System Event ---');
                console.log(`${message.method}:`, JSON.stringify(message.payload, null, 2));
                this.showPrompt();
        }
    }

    private handleError(message: any): void {
        const pending = this.pendingRequests.get(message.id);
        if (pending) {
            pending.reject(new Error(`${message.error.code}: ${message.error.message}`));
            this.pendingRequests.delete(message.id);
        } else {
            console.error('❌ Error:', message.error.message);
            this.showPrompt();
        }
    }

    private sendRequest(target: string, method: string, payload: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.isConnected || !this.ws) {
                reject(new Error('Not connected to server'));
                return;
            }
            
            const id = uuidv4();
            const message = {
                id,
                type: 'request',
                target,
                method,
                payload
            };
            
            this.pendingRequests.set(id, { resolve, reject });
            this.ws.send(JSON.stringify(message));
        });
    }

    private displayResults(input: string, results: any[]): void {
        console.log('\n--- Cognitive Processing Results ---');
        console.log(`Input: "${input}"`);
        console.log(`Extracted ${results.length} cognitive item(s):`);
        
        if (results.length === 0) {
            console.log('No cognitive items were extracted from your input.');
            console.log('Try rephrasing or providing more specific information.');
        } else {
            results.forEach((item, index) => {
                console.log(`\n${index + 1}. ${item.type}: ${item.label || 'No label'}`);
                if (item.truth) {
                    console.log(`   Truth - Frequency: ${item.truth.frequency.toFixed(2)}, Confidence: ${item.truth.confidence.toFixed(2)}`);
                }
                if (item.attention) {
                    console.log(`   Attention - Priority: ${item.attention.priority.toFixed(2)}, Durability: ${item.attention.durability.toFixed(2)}`);
                }
                if (item.meta) {
                    const metaStr = Object.entries(item.meta)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ');
                    if (metaStr) {
                        console.log(`   Meta: ${metaStr}`);
                    }
                }
            });
        }
        
        this.showPrompt();
    }

    private showPrompt(): void {
        this.rl.prompt();
    }

    private showHelp(): void {
        console.log('\n--- Senars3 CLI Help ---');
        console.log('Available commands:');
        console.log('  help              - Show this help message');
        console.log('  status            - Show system status');
        console.log('  stats             - Show processing statistics');
        console.log('  process <input>   - Process natural language input');
        console.log('  clear             - Clear the screen');
        console.log('  quit / exit       - Exit the system');
        console.log('\nDirect component access:');
        console.log('  core.<method> <json>     - Call core methods');
        console.log('  perception.<method> <json> - Call perception methods');
        console.log('  agenda.<method> <json>   - Call agenda methods');
        console.log('  worldModel.<method> <json> - Call world model methods');
        console.log('\nExamples:');
        console.log('  process My cat seems sick after eating chocolate. What should I do?');
        console.log('  core.getSystemStatus {}');
        console.log('  perception.processInput {"input": "Example input"}');
        console.log('\nNavigation:');
        console.log('  Use ↑/↓ arrow keys to navigate command history');
        console.log('  Press Ctrl+C to exit');
        console.log('');
    }

    private async processCommand(input: string): Promise<void> {
        const trimmed = input.trim();
        if (!trimmed) {
            this.showPrompt();
            return;
        }

        // Add to command history
        if (this.commandHistory.length === 0 || 
            this.commandHistory[this.commandHistory.length - 1] !== trimmed) {
            this.commandHistory.push(trimmed);
        }
        this.historyIndex = this.commandHistory.length;

        const parts = trimmed.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        try {
            switch (command) {
                case 'quit':
                case 'exit':
                    console.log('Goodbye!');
                    process.exit(0);
                    break;
                case 'help':
                    this.showHelp();
                    this.showPrompt();
                    break;
                case 'clear':
                    console.clear();
                    this.showPrompt();
                    break;
                case 'status':
                    const status = await this.sendRequest('core', 'getSystemStatus', {});
                    console.log('\n--- System Status ---');
                    console.log(JSON.stringify(status, null, 2));
                    this.showPrompt();
                    break;
                case 'stats':
                    const stats = await this.sendRequest('worldModel', 'getStatistics', {});
                    console.log('\n--- Processing Statistics ---');
                    console.log(JSON.stringify(stats, null, 2));
                    this.showPrompt();
                    break;
                case 'process':
                    if (args) {
                        console.log(`Processing: "${args}"`);
                        await this.sendRequest('perception', 'processInput', { input: args });
                    } else {
                        console.log('Please provide input to process. Usage: process <text>');
                        this.showPrompt();
                    }
                    break;
                default:
                    // Handle direct component access
                    if (command.includes('.')) {
                        const [target, method] = command.split('.');
                        let payload = {};
                        if (args) {
                            try {
                                payload = JSON.parse(args);
                            } catch (e) {
                                console.error('Invalid JSON payload:', e);
                                this.showPrompt();
                                return;
                            }
                        }
                        const result = await this.sendRequest(target, method, payload);
                        console.log('\n--- Result ---');
                        console.log(JSON.stringify(result, null, 2));
                        this.showPrompt();
                    } else {
                        // Process as natural language input
                        console.log(`Processing: "${trimmed}"`);
                        await this.sendRequest('perception', 'processInput', { input: trimmed });
                    }
                    break;
            }
        } catch (error) {
            console.error('Error processing command:', error);
            this.showPrompt();
        }
    }

    private setupInputHandling(): void {
        this.rl.on('line', (input) => {
            this.processCommand(input);
        });

        this.rl.on('close', () => {
            console.log('\nGoodbye!');
            process.exit(0);
        });

        // Setup history navigation
        process.stdin.on('keypress', (str, key) => {
            if (key && key.ctrl && key.name === 'c') {
                console.log('\nGoodbye!');
                process.exit(0);
            }
            
            if (key && key.name === 'up') {
                if (this.commandHistory.length > 0) {
                    this.historyIndex = Math.max(0, this.historyIndex - 1);
                    const historyItem = this.commandHistory[this.historyIndex] || '';
                    // Clear current line and show history item
                    process.stdout.write('\r\x1b[K> ' + historyItem);
                }
            } else if (key && key.name === 'down') {
                this.historyIndex = Math.min(this.commandHistory.length, this.historyIndex + 1);
                const historyItem = this.commandHistory[this.historyIndex] || '';
                // Clear current line and show history item or empty
                process.stdout.write('\r\x1b[K> ' + historyItem);
            }
        });
    }

    async start(): Promise<void> {
        try {
            await this.connect();
            this.setupInputHandling();
            console.log('\n--- Senars3 Cognitive System CLI ---');
            console.log('Unified interface connecting to WebSocket backend');
            console.log('Type "help" for available commands or "quit" to exit.');
            this.rl.setPrompt('> ');
            this.showPrompt();
        } catch (error) {
            console.error('Failed to connect to Senars3 Cognitive System:', error);
            process.exit(1);
        }
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    let host = 'localhost';
    let port = 8080;
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--host' && i + 1 < args.length) {
            host = args[i + 1];
            i++;
        } else if (args[i] === '--port' && i + 1 < args.length) {
            port = parseInt(args[i + 1], 10);
            i++;
        }
    }
    
    const cli = new WebSocketCLI(host, port);
    await cli.start();
}

main().catch(console.error);