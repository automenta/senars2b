import { DecentralizedCognitiveCore } from './cognitiveCore';
import { TruthValue, AttentionValue } from './types';
import { EnhancedAnalogyHypothesisSchema, EnhancedCausalInferenceSchema, GoalDecompositionSchema } from './advancedSchemas';
import { PerceptionSubsystem } from './perceptionSubsystem';
import { CognitiveItemFactory } from './cognitiveItemFactory';

async function main() {
    console.log("Starting cognitive system...");
    const core = new DecentralizedCognitiveCore(2); // Reduced worker count for testing
    const perception = new PerceptionSubsystem();
    
    // Add enhanced schemas
    console.log("Adding schemas...");
    core.addSchema(EnhancedAnalogyHypothesisSchema.content, EnhancedAnalogyHypothesisSchema.meta);
    core.addSchema(EnhancedCausalInferenceSchema.content, EnhancedCausalInferenceSchema.meta);
    core.addSchema(GoalDecompositionSchema.content, GoalDecompositionSchema.meta);
    
    // Add some initial beliefs and goals
    console.log("Adding initial beliefs and goals...");
    const truth: TruthValue = { frequency: 0.8, confidence: 0.9 };
    const attention: AttentionValue = { priority: 0.7, durability: 0.6 };
    
    core.addInitialBelief("Chocolate is toxic to dogs", truth, attention, {
        domain: "veterinary",
        author: "vetdb.org"
    });
    
    core.addInitialGoal("Verify if chocolate is toxic to cats", attention, {
        domain: "veterinary",
        author: "user"
    });
    
    // Add a more complex goal
    const complexAttention: AttentionValue = { priority: 0.9, durability: 0.8 };
    core.addInitialGoal("Diagnose why my cat is sick", complexAttention, {
        domain: "veterinary",
        author: "user"
    });
    
    // Process some input through perception
    console.log("Processing user input...");
    const userInput = "My cat seems sick after eating chocolate";
    const cognitiveItems = await perception.processInput(userInput);
    
    // Add the processed items to the agenda
    cognitiveItems.forEach(item => {
        console.log("Processed input item:", item.label);
    });
    
    // Start the cognitive core
    console.log("Starting cognitive core...");
    await core.start();
    
    // Run for a short time then stop
    setTimeout(() => {
        console.log("Stopping cognitive core...");
        core.stop();
        console.log("System stopped.");
    }, 10000); // Stop after 10 seconds for testing
}

main().catch(console.error);