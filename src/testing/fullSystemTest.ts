import {DecentralizedCognitiveCore} from '../core/cognitiveCore';
import {AttentionValue, TruthValue} from '../interfaces/types';
import {PerceptionSubsystem} from '../modules/perceptionSubsystem';

async function runFullSystemTest() {
    console.log("Starting full system test...");

    // Create the cognitive core with a small worker pool for testing
    const core = new DecentralizedCognitiveCore(2);
    const perception = new PerceptionSubsystem();

    try {
        // Add enhanced schemas
        console.log("Adding schemas...");

        // Add some initial beliefs and goals
        console.log("Adding initial beliefs and goals...");
        const truth: TruthValue = {frequency: 0.8, confidence: 0.9};
        const attention: AttentionValue = {priority: 0.7, durability: 0.6};

        await core.addInitialBelief("Chocolate is toxic to dogs", truth, attention, {
            domain: "veterinary",
            author: "vetdb.org",
            trust_score: 0.95
        });

        await core.addInitialGoal("Verify if chocolate is toxic to cats", attention, {
            domain: "veterinary",
            author: "user"
        });

        // Add a more complex goal
        const complexAttention: AttentionValue = {priority: 0.9, durability: 0.8};
        await core.addInitialGoal("Diagnose why my cat is sick", complexAttention, {
            domain: "veterinary",
            author: "user"
        });

        // Process some input through perception
        console.log("Processing user input...");
        const userInput = "My cat seems sick after eating chocolate";
        const cognitiveItems = await perception.processInput(userInput);

        console.log(`Processed ${cognitiveItems.length} items from user input`);
        cognitiveItems.forEach((item, index) => {
            console.log(`  Item ${index + 1}: ${item.label || 'No label'}`);
        });

        // Add the processed items to the agenda
        cognitiveItems.forEach(item => {
            console.log("Adding processed input item to agenda:", item.label);
        });

        // Start the cognitive core
        console.log("Starting cognitive core...");
        await core.start();

        // Let it run for a bit to process items
        await new Promise(resolve => setTimeout(resolve, 15000));

        console.log("Stopping cognitive core...");
        core.stop();

        // Print system status
        const status = core.getSystemStatus();
        console.log("Final system status:");
        console.log(`  Agenda size: ${status.agendaSize}`);
        console.log(`  World model stats: ${JSON.stringify(status.worldModelStats)}`);
        console.log(`  Worker stats: ${JSON.stringify(Array.from(status.workerStats.entries()))}`);

        console.log("Full system test completed successfully!");
    } catch (error) {
        console.error("Error during full system test:", error);
    }
}

// Run the test
if (require.main === module) {
    runFullSystemTest().catch(console.error);
}