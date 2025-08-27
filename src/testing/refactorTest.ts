import {DecentralizedCognitiveCore} from '../core/cognitiveCore';
import {PriorityAgenda} from '../core/agenda';
import {PersistentWorldModel} from '../core/worldModel';
import {SimpleBeliefRevisionEngine} from '../core/beliefRevisionEngine';
import {DynamicAttentionModule} from '../core/attentionModule';
import {HybridResonanceModule} from '../core/resonanceModule';
import {EfficientSchemaMatcher} from '../core/schemaMatcher';
import {HierarchicalGoalTreeManager} from '../core/goalTreeManager';
import {SchemaLearningModule} from '../modules/schemaLearningModule';
import {v4 as uuidv4} from 'uuid';
import {CognitiveItem, SemanticAtom} from '../interfaces/types';

/**
 * Test that refactored components still work correctly
 */
async function runRefactorTests() {
    console.log("Running refactor verification tests...");

    try {
        // Test 1: Core system initialization
        await testCoreInitialization();

        // Test 2: Component integration
        await testComponentIntegration();

        // Test 3: Schema learning module
        await testSchemaLearningModule();

        console.log("\nAll refactor verification tests completed successfully!");
    } catch (error) {
        console.error("Error during refactor tests:", error);
        process.exit(1);
    }
}

/**
 * Test that the core system initializes correctly
 */
async function testCoreInitialization(): Promise<void> {
    console.log("\n1. Testing Core System Initialization...");

    // Test standard initialization
    const core = new DecentralizedCognitiveCore(2);
    console.log("Standard core initialized successfully");

    // Test enhanced initialization (now the same as standard)
    const enhancedCore = new DecentralizedCognitiveCore(2);
    console.log("Enhanced core initialized successfully");
}

/**
 * Test that components integrate correctly
 */
async function testComponentIntegration(): Promise<void> {
    console.log("\n2. Testing Component Integration...");

    // Create components
    const agenda = new PriorityAgenda();
    const worldModel = new PersistentWorldModel();
    const revisionEngine = new SimpleBeliefRevisionEngine();
    const attentionModule = new DynamicAttentionModule();
    const resonanceModule = new HybridResonanceModule();
    const schemaMatcher = new EfficientSchemaMatcher();
    const goalTreeManager = new HierarchicalGoalTreeManager();
    const schemaLearningModule = new SchemaLearningModule(worldModel);

    // Test agenda operations
    const item: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: {frequency: 0.8, confidence: 0.9},
        attention: {priority: 0.9, durability: 0.7},
        stamp: {timestamp: Date.now(), parent_ids: [], schema_id: uuidv4()}
    };

    agenda.push(item);
    console.log(`Agenda size after push: ${agenda.size()}`);

    // Test world model operations
    const atom: SemanticAtom = {
        id: uuidv4(),
        content: "Test atom for integration",
        embedding: Array(768).fill(0.5),
        meta: {
            type: "Fact",
            source: "integration_test",
            timestamp: new Date().toISOString(),
            trust_score: 0.9
        }
    };

    const atomId = worldModel.add_atom(atom);
    console.log(`Added atom with ID: ${atomId}`);

    // Test attention module
    const attention = attentionModule.calculate_initial(item);
    console.log(`Calculated attention - Priority: ${attention.priority.toFixed(2)}, Durability: ${attention.durability.toFixed(2)}`);

    console.log("Component integration test completed successfully");
}

/**
 * Test the schema learning module
 */
async function testSchemaLearningModule(): Promise<void> {
    console.log("\n3. Testing Schema Learning Module...");

    const worldModel = new PersistentWorldModel();
    const schemaLearningModule = new SchemaLearningModule(worldModel);

    // Create test items
    const item1: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: {frequency: 0.8, confidence: 0.9},
        attention: {priority: 0.9, durability: 0.7},
        stamp: {timestamp: Date.now(), parent_ids: [], schema_id: uuidv4()},
        label: "Medical diagnosis related to cardiac issues"
    };

    const item2: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: {frequency: 0.7, confidence: 0.8},
        attention: {priority: 0.8, durability: 0.6},
        stamp: {timestamp: Date.now(), parent_ids: [], schema_id: uuidv4()},
        label: "Patient symptoms include chest pain"
    };

    // Record schema usage
    schemaLearningModule.recordSchemaUsage("test-schema-1", true, [item1, item2]);
    schemaLearningModule.recordSchemaUsage("test-schema-1", true, [item1, item2]);
    schemaLearningModule.recordSchemaUsage("test-schema-1", true, [item1, item2]);
    schemaLearningModule.recordSchemaUsage("test-schema-1", false, [item1, item2]);
    schemaLearningModule.recordSchemaUsage("test-schema-1", true, [item1, item2]);

    // Try to learn new schemas
    const newSchemas = schemaLearningModule.learnNewSchemas();
    console.log(`Learned ${newSchemas.length} new schemas`);

    // Get statistics
    const stats = schemaLearningModule.getStatistics();
    console.log(`Schema learning statistics:`, stats);

    console.log("Schema learning module test completed successfully");
}

// Run the tests
runRefactorTests();