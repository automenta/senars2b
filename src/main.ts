import { UserInterface } from './userInterface';

async function main() {
    const ui = new UserInterface(4); // 4 worker threads
    await ui.start();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM. Shutting down gracefully...');
    process.exit(0);
});

main().catch(console.error);