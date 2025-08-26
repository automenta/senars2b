import { DecentralizedCognitiveCore } from '../core/cognitiveCore';
import { PerceptionSubsystem } from '../modules/perceptionSubsystem';
import { TruthValue, AttentionValue } from '../interfaces/types';
import { EnhancedAnalogyHypothesisSchema, EnhancedCausalInferenceSchema, GoalDecompositionSchema } from '../modules/advancedSchemas';

async function runInteractiveDemo() {
    console.log("===========================================");
    console.log("  Senars3 Cognitive System - Interactive Demo");
    console.log("===========================================");
    console.log("This demo will walk you through a scenario where a pet owner is concerned about their cat's health.");
    console.log("");

    // Create cognitive core with enhanced components
    const core = new DecentralizedCognitiveCore(4, true); // Using enhanced components
    const perception = new PerceptionSubsystem();

    // Add schemas
    console.log("Adding cognitive schemas...");
    core.addSchema(EnhancedAnalogyHypothesisSchema.content, EnhancedAnalogyHypothesisSchema.meta);
    core.addSchema(EnhancedCausalInferenceSchema.content, EnhancedCausalInferenceSchema.meta);
    core.addSchema(GoalDecompositionSchema.content, GoalDecompositionSchema.meta);

    // Add initial knowledge base
    console.log("Populating knowledge base...");
    const highTruth: TruthValue = { frequency: 0.9, confidence: 0.95 };
    const mediumTruth: TruthValue = { frequency: 0.7, confidence: 0.8 };
    const highAttention: AttentionValue = { priority: 0.9, durability: 0.8 };
    const mediumAttention: AttentionValue = { priority: 0.7, durability: 0.6 };

    // Veterinary facts
    core.addInitialBelief("Chocolate is toxic to dogs", highTruth, highAttention, {
        domain: "veterinary",
        source: "vetdb.org",
        trust_score: 0.95,
        author: "Veterinary Database"
    });

    core.addInitialBelief("Theobromine is found in chocolate", highTruth, highAttention, {
        domain: "chemistry",
        source: "chemistry_db",
        trust_score: 0.9,
        author: "Chemical Composition Database"
    });

    core.addInitialBelief("Theobromine poisoning causes vomiting and diarrhea in pets", highTruth, highAttention, {
        domain: "veterinary",
        source: "vetdb.org",
        trust_score: 0.95,
        author: "Veterinary Database"
    });

    core.addInitialBelief("Cats are more sensitive to theobromine than dogs", mediumTruth, mediumAttention, {
        domain: "veterinary",
        source: "feline_health_study",
        trust_score: 0.8,
        author: "Feline Health Research Group"
    });

    console.log("Knowledge base populated with 4 facts.");
    console.log("");

    // Simulate user interaction
    console.log("User input: \"My cat seems sick after eating chocolate. What should I do?\"");
    
    // Process user input
    const userInput = "My cat seems sick after eating chocolate. What should I do?";
    const cognitiveItems = await perception.processInput(userInput);
    
    console.log(`Processed into ${cognitiveItems.length} cognitive items:`);
    cognitiveItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.type}: ${item.label}`);
    });
    
    console.log("");
    console.log("Adding items to agenda for processing...");
    
    // Add items to agenda
    cognitiveItems.forEach(item => {
        // In a real implementation, we would add these to the agenda
        console.log(`Added to agenda: ${item.type} - ${item.label}`);
    });
    
    console.log("");
    console.log("The system would now process these items through its cognitive cycle:");
    console.log("1. Contextualize: Find relevant facts in the knowledge base");
    console.log("2. Reason: Apply schemas to generate hypotheses");
    console.log("3. Act: Execute goals like searching for information or diagnosing");
    console.log("4. Learn: Update beliefs based on new information");
    console.log("");
    
    console.log("Expected processing results:");
    console.log("- The system would recognize that chocolate is toxic to pets");
    console.log("- It would hypothesize that the cat's illness is due to chocolate poisoning");
    console.log("- It would generate a goal to provide care advice");
    console.log("- It might execute a search for veterinary recommendations");
    console.log("");
    
    console.log("System status:");
    const status = core.getSystemStatus();
    console.log(`- Agenda size: ${status.agendaSize}`);
    console.log(`- World Model contains: ${status.worldModelStats.atomCount} atoms`);
    console.log("");
    
    console.log("Demo completed. In a full implementation, the system would continue processing");
    console.log("and eventually provide a response like:");
    console.log("");
    console.log("\"Based on the symptoms and known facts, your cat is likely suffering from");
    console.log("chocolate poisoning. Theobromine in chocolate is toxic to cats. Please contact");
    console.log("your veterinarian immediately for treatment recommendations.\"");
    console.log("");
}

runInteractiveDemo().catch(console.error);