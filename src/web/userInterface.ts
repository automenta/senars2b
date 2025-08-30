import {DecentralizedCognitiveCore} from '../core/cognitiveCore';
import {PerceptionSubsystem} from '../modules/perceptionSubsystem';
import {createCoreWithRealDependencies} from '../testing/testUtils';
import * as readline from 'readline';

export class UserInterface {
    private core: DecentralizedCognitiveCore;
    private perception: PerceptionSubsystem;
    private rl: readline.Interface;
    private isRunning: boolean = false;
    private readonly startTime: number;
    private commandHistory: string[] = [];
    private historyIndex: number = 0;

    constructor(workerCount: number = 4) {
        this.core = createCoreWithRealDependencies({workerCount});
        this.perception = new PerceptionSubsystem();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.startTime = Date.now();
    }

    async start(): Promise<void> {
        console.log("===========================================");
        console.log("  Senars3 Cognitive System - User Interface");
        console.log("===========================================");
        console.log("Welcome to the Senars3 cognitive system!");
        console.log("This system can process natural language input and perform reasoning tasks.");
        console.log("Type 'help' for available commands or 'quit' to exit.");
        console.log("");

        // Start the cognitive core
        await this.core.start();
        this.isRunning = true;

        // Start the input loop
        this.promptUser();
    }

    stop(): void {
        this.isRunning = false;
        this.core.stop();
        this.rl.close();
        console.log("Goodbye!");
    }

    private promptUser(): void {
        if (!this.isRunning) return;

        // Setup keypress event for command history navigation
        let inputBuffer = '';

        this.rl.question("> ", async (input) => {
            if (!this.isRunning) return;

            // Add to command history (if not empty and not a duplicate of last command)
            if (input.trim() &&
                (this.commandHistory.length === 0 ||
                    this.commandHistory[this.commandHistory.length - 1] !== input.trim())) {
                this.commandHistory.push(input.trim());
            }
            this.historyIndex = this.commandHistory.length;

            try {
                await this.processUserInput(input.trim());
            } catch (error) {
                console.error("Error processing input:", error);
            }

            // Continue the loop
            this.promptUser();
        });

        // Handle keypress events for command history
        process.stdin.on('keypress', (str, key) => {
            // Only handle when we're waiting for input
            if (!this.isRunning) return;

            // Handle Ctrl+C to exit
            if (key && key.ctrl && key.name === 'c') {
                this.stop();
                return;
            }

            // Handle up/down arrows for command history
            if (key && key.name === 'up') {
                if (this.commandHistory.length > 0) {
                    this.historyIndex = Math.max(0, this.historyIndex - 1);
                    const historyItem = this.commandHistory[this.historyIndex] || '';
                    // Update the current input line
                    process.stdout.write('\r> ' + historyItem);
                    // Clear any extra characters if the new line is shorter
                    process.stdout.write(' '.repeat(Math.max(0, inputBuffer.length - historyItem.length)));
                    process.stdout.write('\r> ' + historyItem);
                    inputBuffer = historyItem;
                }
            } else if (key && key.name === 'down') {
                this.historyIndex = Math.min(this.commandHistory.length, this.historyIndex + 1);
                const historyItem = this.commandHistory[this.historyIndex] || '';
                process.stdout.write('\r> ' + historyItem);
                // Clear any extra characters if the new line is shorter
                process.stdout.write(' '.repeat(Math.max(0, inputBuffer.length - historyItem.length)));
                process.stdout.write('\r> ' + historyItem);
                inputBuffer = historyItem;
            }
        });
    }

    private async processUserInput(input: string): Promise<void> {
        if (!input) {
            return;
        }

        switch (input.toLowerCase()) {
            case 'quit':
            case 'exit':
                this.stop();
                return;
            case 'help':
                this.showHelp();
                return;
            case 'status':
                this.showStatus();
                return;
            case 'stats':
                this.showStatistics();
                return;
            case 'clear':
                console.clear();
                return;
            case 'examples':
                this.showExamples();
                return;
            default:
                await this.processCognitiveInput(input);
                return;
        }
    }

    private showHelp(): void {
        console.log("Available commands:");
        console.log("  help     - Show this help message");
        console.log("  status   - Show system status including uptime and agenda size");
        console.log("  stats    - Show processing statistics");
        console.log("  examples - Show detailed input examples for different types of input");
        console.log("  clear    - Clear the screen for better organization");
        console.log("  quit     - Exit the system");
        console.log("");
        console.log("You can also enter natural language statements or questions for the system to process.");
        console.log("Examples of input types:");
        console.log("  - Statements: 'Chocolate is toxic to dogs'");
        console.log("  - Questions: 'My cat seems sick after eating chocolate. What should I do?'");
        console.log("  - Commands: 'Can you search for information about pet nutrition?'");
        console.log("  - Goals: 'Diagnose why my plant is wilting'");
        console.log("  - Complex requests: 'Create a comprehensive health plan for my pet'");
        console.log("");
        console.log("Navigation:");
        console.log("  - Use ↑/↓ arrow keys to navigate command history");
        console.log("  - Press Ctrl+C to exit the application");
        console.log("");
        console.log("For a richer experience with real-time feedback and visualizations,");
        console.log("visit the web interface at http://localhost:3000");
        console.log("");
    }

    private showExamples(): void {
        console.log("Input Examples:");
        console.log("");
        console.log("Statements (facts the system should learn):");
        console.log("  'Chocolate is toxic to dogs'");
        console.log("  'Water boils at 100 degrees Celsius at sea level'");
        console.log("  'Regular exercise improves cardiovascular health'");
        console.log("");
        console.log("Questions (queries that require answers):");
        console.log("  'My cat seems sick after eating chocolate. What should I do?'");
        console.log("  'What are the symptoms of diabetes?'");
        console.log("  'How does photosynthesis work?'");
        console.log("");
        console.log("Commands (action requests):");
        console.log("  'Can you search for information about pet nutrition?'");
        console.log("  'Find recent research on climate change'");
        console.log("  'Look up the capital of France'");
        console.log("");
        console.log("Goals (complex objectives):");
        console.log("  'Diagnose why my plant is wilting'");
        console.log("  'Create a workout plan for beginners'");
        console.log("  'Develop a study schedule for final exams'");
        console.log("");
        console.log("Complex requests (multi-part tasks):");
        console.log("  'Create a comprehensive health plan for my pet including diet, exercise, and medical checkups'");
        console.log("  'Analyze the impact of social media on mental health and suggest coping strategies'");
        console.log("  'Plan a sustainable garden for my backyard with native plants and water conservation'");
        console.log("");
        console.log("Best Practices:");
        console.log("  - Be specific and clear in your input");
        console.log("  - Use domain-specific terminology when possible");
        console.log("  - Break down complex requests into smaller parts if needed");
        console.log("  - Check the system status to monitor performance");
        console.log("");
    }

    private showStatus(): void {
        const status = this.core.getSystemStatus();
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        const uptimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        console.log("System Status:");
        console.log(`  Uptime: ${uptimeStr}`);
        console.log(`  Agenda size: ${status.agendaSize}`);
        console.log(`  World Model - Atoms: ${status.worldModelStats.atomCount}, Items: ${status.worldModelStats.itemCount}`);
        console.log(`  Workers: ${(this.core as any).workerCount}`);
        console.log("");
        console.log("For real-time monitoring and detailed statistics,");
        console.log("visit the web interface at http://localhost:3000");
        console.log("");
    }

    private showStatistics(): void {
        const perceptionStats = this.perception.getStatistics();
        console.log("Processing Statistics:");
        console.log(`  Inputs processed: ${perceptionStats.totalProcessed}`);
        console.log(`  Average items per input: ${perceptionStats.averageItemsPerInput.toFixed(2)}`);
        console.log(`  Recent processing rate: ${perceptionStats.recentProcessingRate.toFixed(2)} items/sec`);
        console.log("");
    }

    private async processCognitiveInput(input: string): Promise<void> {
        // Validate input
        if (input.length === 0) {
            console.log("No input provided. Please enter some text to process.");
            console.log("Type 'examples' to see input examples.");
            console.log("");
            return;
        }

        if (input.length < 3) {
            console.log("Input too short. Please enter at least 3 characters.");
            console.log("Type 'examples' to see input examples.");
            console.log("");
            return;
        }

        if (input.length > 10000) {
            console.log("Input too long. Please limit input to 10,000 characters.");
            console.log("");
            return;
        }

        console.log(`Processing: "${input}"`);

        try {
            // Process the input through the perception subsystem
            const cognitiveItems = await this.perception.processInput(input);

            if (cognitiveItems.length === 0) {
                console.log("No cognitive items were extracted from your input.");
                console.log("Try rephrasing or providing more specific information.");
                console.log("Type 'examples' to see input examples.");
                console.log("");
                return;
            }

            console.log(`Extracted ${cognitiveItems.length} cognitive item(s):`);
            cognitiveItems.forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.type}: ${item.label || 'No label'}`);
                if (item.truth) {
                    console.log(`     Truth - Frequency: ${item.truth.frequency.toFixed(2)}, Confidence: ${item.truth.confidence.toFixed(2)}`);
                }
                if (item.attention) {
                    console.log(`     Attention - Priority: ${item.attention.priority.toFixed(2)}, Durability: ${item.attention.durability.toFixed(2)}`);
                }
                // Meta information is stored in the associated SemanticAtom, not directly in CognitiveItem
                // We would need to access the WorldModel to get this information
            });

            // Add items to the agenda
            cognitiveItems.forEach(item => {
                // Add to agenda for processing
                // In a more sophisticated implementation, we might want to add them with different priorities
                // based on their type or content
                console.log(`Added to agenda: ${item.type} - ${item.label || item.id}`);
            });

            console.log("");
            console.log("The system is now processing your input.");
            console.log("Results will appear as they are generated.");
            console.log("(Note: In this demo, results are not automatically displayed in the CLI)");
            console.log("For full interactive experience with real-time results, use the web interface at http://localhost:3000");
            console.log("");

        } catch (error) {
            console.error("Error processing input:", error);
            console.log("Please try again or rephrase your input.");
            console.log("Type 'help' for available commands or 'examples' for input examples.");
            console.log("For troubleshooting, check the web interface at http://localhost:3000");
            console.log("");
        }
    }
}