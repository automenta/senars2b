import {PriorityAgenda} from '../core/agenda';
import {PersistentWorldModel} from '../core/worldModel';
import {SimpleBeliefRevisionEngine} from '../core/beliefRevisionEngine';
import {DynamicAttentionModule} from '../core/attentionModule';
import {EfficientSchemaMatcher} from '../core/schemaMatcher';
import {v4 as uuidv4} from 'uuid';
import {CognitiveItem, SemanticAtom, TruthValue} from '../interfaces/types';

/**
 * Run basic component tests for the cognitive system
 */
async function runBasicComponentTests() {
    console.log("Running basic component tests...");

    try {
        // Test 1: Agenda
        await testAgenda();

        // Test 2: World Model
        await testWorldModel();

        // Test 3: Belief Revision Engine
        await testBeliefRevisionEngine();

        // Test 4: Attention Module
        await testAttentionModule();

        // Test 5: Schema Matcher
        await testSchemaMatcher();

        console.log("\nAll basic component tests completed successfully!");
    } catch (error) {
        console.error("Error during component tests:", error);
        process.exit(1);
    }
}

/**
 * Test the PriorityAgenda component
 */
async function testAgenda(): Promise<void> {
    console.log("\n1. Testing Agenda...");
    const agenda = new PriorityAgenda();

    const item1: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: {frequency: 0.8, confidence: 0.9},
        attention: {priority: 0.9, durability: 0.7},
        stamp: {timestamp: Date.now(), parent_ids: [], schema_id: uuidv4()}
    };

    const item2: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'GOAL',
        attention: {priority: 0.7, durability: 0.8},
        stamp: {timestamp: Date.now(), parent_ids: [], schema_id: uuidv4()},
        goal_status: 'active'
    };

    agenda.push(item1);
    agenda.push(item2);

    console.log(`Agenda size: ${agenda.size()}`);
    console.log(`Peek item priority: ${agenda.peek()?.attention.priority}`);
}

/**
 * Test the PersistentWorldModel component
 */
async function testWorldModel(): Promise<void> {
    console.log("\n2. Testing World Model...");
    const worldModel = new PersistentWorldModel();

    const atom: SemanticAtom = {
        id: uuidv4(),
        content: "Chocolate is toxic to pets",
        embedding: Array(768).fill(0.5),
        meta: {
            type: "Fact",
            source: "veterinary_database",
            timestamp: new Date().toISOString(),
            trust_score: 0.9
        }
    };

    const atomId = worldModel.add_atom(atom);
    console.log(`Added atom with ID: ${atomId}`);

    const retrievedAtom = worldModel.get_atom(atomId);
    console.log(`Retrieved atom content: ${retrievedAtom?.content}`);
}

/**
 * Test the SimpleBeliefRevisionEngine component
 */
async function testBeliefRevisionEngine(): Promise<void> {
    console.log("\n3. Testing Belief Revision Engine...");
    const revisionEngine = new SimpleBeliefRevisionEngine();

    const truth1: TruthValue = {frequency: 0.9, confidence: 0.8};
    const truth2: TruthValue = {frequency: 0.7, confidence: 0.9};

    const mergedTruth = revisionEngine.merge(truth1, truth2);
    console.log(`Merged truth - Frequency: ${mergedTruth.frequency.toFixed(2)}, Confidence: ${mergedTruth.confidence.toFixed(2)}`);

    const hasConflict = revisionEngine.detect_conflict(
        {frequency: 0.9, confidence: 0.8},
        {frequency: 0.2, confidence: 0.85}
    );
    console.log(`Conflict detection result: ${hasConflict}`);
}

/**
 * Test the DynamicAttentionModule component
 */
async function testAttentionModule(): Promise<void> {
    console.log("\n4. Testing Attention Module...");
    const attentionModule = new DynamicAttentionModule();

    const item: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: {frequency: 0.8, confidence: 0.9},
        attention: {priority: 0.9, durability: 0.7},
        stamp: {timestamp: Date.now(), parent_ids: [], schema_id: uuidv4()}
    };

    const initialAttention = attentionModule.calculate_initial(item);
    console.log(`Initial attention - Priority: ${initialAttention.priority.toFixed(2)}, Durability: ${initialAttention.durability.toFixed(2)}`);
}

/**
 * Test the EfficientSchemaMatcher component
 */
async function testSchemaMatcher(): Promise<void> {
    console.log("\n5. Testing Schema Matcher...");
    const schemaMatcher = new EfficientSchemaMatcher();
    const worldModel = new PersistentWorldModel();

    // Create a simple schema atom
    const schemaAtom: SemanticAtom = {
        id: uuidv4(),
        content: {
            name: "TestSchema",
            pattern: {
                premise: "(?A is related to ?B)",
                conclusion: "(?B is related to ?A)"
            }
        },
        embedding: Array(768).fill(0.3),
        meta: {
            type: "CognitiveSchema",
            source: "test",
            timestamp: new Date().toISOString(),
            trust_score: 0.8
        }
    };

    const schema = schemaMatcher.register_schema(schemaAtom, worldModel);
    console.log(`Registered schema with ID: ${schema.atom_id}`);
}

// Run the tests
runBasicComponentTests();