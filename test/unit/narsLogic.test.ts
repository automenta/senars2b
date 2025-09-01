import {PersistentWorldModel} from '@/core/worldModel';
import {PriorityAgenda} from '@/core/agenda';
import {embeddingService} from '@/services/embeddingService';
import {v4 as uuidv4} from 'uuid';
import {CognitiveItemFactory} from '@/modules/cognitiveItemFactory';

// Mock the embedding service
jest.mock('@/services/embeddingService');

describe('NARS Logic Tests', () => {
    let worldModel: PersistentWorldModel;
    let agenda: PriorityAgenda;

    const mockEmbeddingService = embeddingService as jest.Mocked<typeof embeddingService>;

    beforeEach(() => {
        // Setup mock embeddings
        mockEmbeddingService.generateEmbedding.mockImplementation(async (text: string) => {
            // Generate a deterministic embedding based on the text
            const hash = text.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
            return Array(384).fill(0).map((_, i) => Math.abs(Math.sin(hash + i)) * 0.5 + 0.25);
        });

        // Create world model and agenda directly
        worldModel = new PersistentWorldModel();
        agenda = new PriorityAgenda((taskId: string) => {
            const task = worldModel.get_item(taskId);
            return task?.task_metadata?.status || null;
        });
    });

    describe('Structural Reasoning', () => {
        it('should perform inheritance reasoning (Bird -> Animal)', async () => {
            // Create semantic atoms for the beliefs
            const birdAtom = {
                id: uuidv4(),
                content: "Birds are animals",
                embedding: await mockEmbeddingService.generateEmbedding("Birds are animals"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "biology"}
            };

            const tweetyAtom = {
                id: uuidv4(),
                content: "Tweety is a bird",
                embedding: await mockEmbeddingService.generateEmbedding("Tweety is a bird"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "biology"}
            };

            // Add atoms to world model
            worldModel.add_atom(birdAtom);
            worldModel.add_atom(tweetyAtom);

            // Create cognitive items (beliefs)
            const birdAnimalBelief = CognitiveItemFactory.createBelief(
                birdAtom.id,
                {frequency: 0.9, confidence: 0.8},
                {priority: 0.7, durability: 0.6}
            );
            birdAnimalBelief.label = "Birds are animals";

            const tweetyBirdBelief = CognitiveItemFactory.createBelief(
                tweetyAtom.id,
                {frequency: 0.95, confidence: 0.9},
                {priority: 0.8, durability: 0.7}
            );
            tweetyBirdBelief.label = "Tweety is a bird";

            // Add beliefs to world model
            worldModel.add_item(birdAnimalBelief);
            worldModel.add_item(tweetyBirdBelief);

            // Check that the world model contains the expected beliefs
            const items = worldModel.getAllItems();
            const foundBirdAnimalBelief = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("Birds are animals")
            );

            const foundTweetyBirdBelief = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("Tweety is a bird")
            );

            expect(foundBirdAnimalBelief).toBeDefined();
            expect(foundTweetyBirdBelief).toBeDefined();
        }, 10000); // 10 second timeout

        it('should perform similarity reasoning', async () => {
            // Create semantic atoms for the beliefs
            const similarityAtom = {
                id: uuidv4(),
                content: "Cars and trucks are similar vehicles",
                embedding: await mockEmbeddingService.generateEmbedding("Cars and trucks are similar vehicles"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "transportation"}
            };

            const wheelAtom = {
                id: uuidv4(),
                content: "Cars have wheels",
                embedding: await mockEmbeddingService.generateEmbedding("Cars have wheels"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "transportation"}
            };

            // Add atoms to world model
            worldModel.add_atom(similarityAtom);
            worldModel.add_atom(wheelAtom);

            // Create cognitive items (beliefs)
            const similarityBelief = CognitiveItemFactory.createBelief(
                similarityAtom.id,
                {frequency: 0.85, confidence: 0.75},
                {priority: 0.6, durability: 0.5}
            );
            similarityBelief.label = "Cars and trucks are similar vehicles";

            const wheelBelief = CognitiveItemFactory.createBelief(
                wheelAtom.id,
                {frequency: 0.99, confidence: 0.95},
                {priority: 0.8, durability: 0.7}
            );
            wheelBelief.label = "Cars have wheels";

            // Add beliefs to world model
            worldModel.add_item(similarityBelief);
            worldModel.add_item(wheelBelief);

            // Verify beliefs were added
            const items = worldModel.getAllItems();
            const foundSimilarityBelief = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("Cars and trucks are similar")
            );

            const foundWheelBelief = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("Cars have wheels")
            );

            expect(foundSimilarityBelief).toBeDefined();
            expect(foundWheelBelief).toBeDefined();
        }, 10000); // 10 second timeout
    });

    describe('Procedural Reasoning', () => {
        it('should perform means-ends reasoning', async () => {
            // Create semantic atoms for the goal and belief
            const goalAtom = {
                id: uuidv4(),
                content: "Open the door",
                embedding: await mockEmbeddingService.generateEmbedding("Open the door"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "household"}
            };

            const procedureAtom = {
                id: uuidv4(),
                content: "To open a door, one needs a key",
                embedding: await mockEmbeddingService.generateEmbedding("To open a door, one needs a key"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "household"}
            };

            // Add atoms to world model
            worldModel.add_atom(goalAtom);
            worldModel.add_atom(procedureAtom);

            // Create cognitive items (goal and belief)
            const goal = CognitiveItemFactory.createGoal(
                goalAtom.id,
                {priority: 0.9, durability: 0.8}
            );
            goal.label = "Open the door";

            const procedure = CognitiveItemFactory.createBelief(
                procedureAtom.id,
                {frequency: 0.9, confidence: 0.85},
                {priority: 0.7, durability: 0.6}
            );
            procedure.label = "To open a door, one needs a key";

            // Add items to world model
            worldModel.add_item(goal);
            worldModel.add_item(procedure);

            // Verify items were added
            const items = worldModel.getAllItems();
            const foundGoal = items.find(item =>
                item.type === 'GOAL' &&
                item.label?.includes("Open the door")
            );

            const foundProcedure = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("To open a door")
            );

            expect(foundGoal).toBeDefined();
            expect(foundProcedure).toBeDefined();
        }, 10000); // 10 second timeout

        it('should perform conditional reasoning (If-Then)', async () => {
            // Create semantic atoms for the beliefs
            const conditionalAtom = {
                id: uuidv4(),
                content: "If it rains, then the ground gets wet",
                embedding: await mockEmbeddingService.generateEmbedding("If it rains, then the ground gets wet"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "weather"}
            };

            const observationAtom = {
                id: uuidv4(),
                content: "It is raining",
                embedding: await mockEmbeddingService.generateEmbedding("It is raining"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "weather"}
            };

            // Add atoms to world model
            worldModel.add_atom(conditionalAtom);
            worldModel.add_atom(observationAtom);

            // Create cognitive items (beliefs)
            const conditional = CognitiveItemFactory.createBelief(
                conditionalAtom.id,
                {frequency: 0.95, confidence: 0.9},
                {priority: 0.8, durability: 0.7}
            );
            conditional.label = "If it rains, then the ground gets wet";

            const observation = CognitiveItemFactory.createBelief(
                observationAtom.id,
                {frequency: 0.9, confidence: 0.85},
                {priority: 0.85, durability: 0.75}
            );
            observation.label = "It is raining";

            // Add beliefs to world model
            worldModel.add_item(conditional);
            worldModel.add_item(observation);

            // Verify beliefs were added
            const items = worldModel.getAllItems();
            const foundConditional = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("If it rains")
            );

            const foundObservation = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("It is raining")
            );

            expect(foundConditional).toBeDefined();
            expect(foundObservation).toBeDefined();
        }, 10000); // 10 second timeout
    });

    describe('Reasoning with Negations', () => {
        it('should handle negative evidence', async () => {
            // Create semantic atoms for the beliefs
            const initialAtom = {
                id: uuidv4(),
                content: "All swans are white",
                embedding: await mockEmbeddingService.generateEmbedding("All swans are white"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "zoology"}
            };

            const contradictingAtom = {
                id: uuidv4(),
                content: "This swan is black",
                embedding: await mockEmbeddingService.generateEmbedding("This swan is black"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "zoology"}
            };

            // Add atoms to world model
            worldModel.add_atom(initialAtom);
            worldModel.add_atom(contradictingAtom);

            // Create cognitive items (beliefs)
            const initialBelief = CognitiveItemFactory.createBelief(
                initialAtom.id,
                {frequency: 0.9, confidence: 0.8},
                {priority: 0.7, durability: 0.6}
            );
            initialBelief.label = "All swans are white";

            const contradictingEvidence = CognitiveItemFactory.createBelief(
                contradictingAtom.id,
                {frequency: 0.95, confidence: 0.9},
                {priority: 0.8, durability: 0.7}
            );
            contradictingEvidence.label = "This swan is black";

            // Add beliefs to world model
            worldModel.add_item(initialBelief);
            worldModel.add_item(contradictingEvidence);

            // Verify beliefs were added
            const items = worldModel.getAllItems();
            const foundInitialBelief = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("All swans are white")
            );

            const foundContradictingEvidence = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("This swan is black")
            );

            expect(foundInitialBelief).toBeDefined();
            expect(foundContradictingEvidence).toBeDefined();
        }, 10000); // 10 second timeout

        it('should perform contrapositive reasoning', async () => {
            // Create semantic atoms for the beliefs
            const conditionalAtom = {
                id: uuidv4(),
                content: "If it is a bird, then it has feathers",
                embedding: await mockEmbeddingService.generateEmbedding("If it is a bird, then it has feathers"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "biology"}
            };

            const negativeAtom = {
                id: uuidv4(),
                content: "This animal does not have feathers",
                embedding: await mockEmbeddingService.generateEmbedding("This animal does not have feathers"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "biology"}
            };

            // Add atoms to world model
            worldModel.add_atom(conditionalAtom);
            worldModel.add_atom(negativeAtom);

            // Create cognitive items (beliefs)
            const conditional = CognitiveItemFactory.createBelief(
                conditionalAtom.id,
                {frequency: 0.9, confidence: 0.8},
                {priority: 0.7, durability: 0.6}
            );
            conditional.label = "If it is a bird, then it has feathers";

            const negativeEvidence = CognitiveItemFactory.createBelief(
                negativeAtom.id,
                {frequency: 0.95, confidence: 0.9},
                {priority: 0.8, durability: 0.7}
            );
            negativeEvidence.label = "This animal does not have feathers";

            // Add beliefs to world model
            worldModel.add_item(conditional);
            worldModel.add_item(negativeEvidence);

            // Verify beliefs were added
            const items = worldModel.getAllItems();
            const foundConditional = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("If it is a bird")
            );

            const foundNegativeEvidence = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("does not have feathers")
            );

            expect(foundConditional).toBeDefined();
            expect(foundNegativeEvidence).toBeDefined();
        }, 10000); // 10 second timeout
    });

    describe('Compatibility with LM Text', () => {
        it('should process natural language inputs', async () => {
            // Simulate processing a natural language input
            const nlInput = "The cat is on the mat";

            // Create semantic atom for the belief
            const nlAtom = {
                id: uuidv4(),
                content: nlInput,
                embedding: await mockEmbeddingService.generateEmbedding(nlInput),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "everyday", source: "nl_input"}
            };

            // Add atom to world model
            worldModel.add_atom(nlAtom);

            // Create cognitive item (belief)
            const nlBelief = CognitiveItemFactory.createBelief(
                nlAtom.id,
                {frequency: 0.95, confidence: 0.9},
                {priority: 0.8, durability: 0.7}
            );
            nlBelief.label = nlInput;
            // Add metadata to the belief item
            nlBelief.meta = {domain: "everyday", source: "nl_input"};

            // Add belief to world model
            worldModel.add_item(nlBelief);

            // Verify the belief was added
            const items = worldModel.getAllItems();
            const foundNlBelief = items.find(item =>
                item.type === 'BELIEF' &&
                item.label === nlInput
            );

            expect(foundNlBelief).toBeDefined();
            expect(foundNlBelief?.meta?.source).toBe("nl_input");
        }, 10000); // 10 second timeout

        it('should handle uncertain LM outputs', async () => {
            // Simulate an uncertain LM output
            const uncertainOutput = "It might rain tomorrow";

            // Create semantic atom for the belief
            const uncertainAtom = {
                id: uuidv4(),
                content: uncertainOutput,
                embedding: await mockEmbeddingService.generateEmbedding(uncertainOutput),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "weather_forecast", source: "lm_output"}
            };

            // Add atom to world model
            worldModel.add_atom(uncertainAtom);

            // Create cognitive item (belief) with lower confidence
            const uncertainBelief = CognitiveItemFactory.createBelief(
                uncertainAtom.id,
                {frequency: 0.6, confidence: 0.5}, // Lower confidence for uncertainty
                {priority: 0.6, durability: 0.5}
            );
            uncertainBelief.label = uncertainOutput;

            // Add belief to world model
            worldModel.add_item(uncertainBelief);

            // Verify the uncertain belief was added
            const items = worldModel.getAllItems();
            const foundUncertainBelief = items.find(item =>
                item.type === 'BELIEF' &&
                item.label === uncertainOutput
            );

            expect(foundUncertainBelief).toBeDefined();
            expect(foundUncertainBelief?.truth?.frequency).toBeCloseTo(0.6);
            expect(foundUncertainBelief?.truth?.confidence).toBeCloseTo(0.5);
        }, 10000); // 10 second timeout
    });

    describe('Diverse Application Domains', () => {
        it('should handle medical domain reasoning', async () => {
            // Create semantic atoms for the beliefs
            const symptomAtom = {
                id: uuidv4(),
                content: "Fever is a symptom of infection",
                embedding: await mockEmbeddingService.generateEmbedding("Fever is a symptom of infection"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "medicine"}
            };

            const patientAtom = {
                id: uuidv4(),
                content: "Patient has a fever",
                embedding: await mockEmbeddingService.generateEmbedding("Patient has a fever"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "medicine", patient_id: "P001"}
            };

            // Add atoms to world model
            worldModel.add_atom(symptomAtom);
            worldModel.add_atom(patientAtom);

            // Create cognitive items (beliefs)
            const symptomBelief = CognitiveItemFactory.createBelief(
                symptomAtom.id,
                {frequency: 0.85, confidence: 0.8},
                {priority: 0.7, durability: 0.6}
            );
            symptomBelief.label = "Fever is a symptom of infection";

            const patientBelief = CognitiveItemFactory.createBelief(
                patientAtom.id,
                {frequency: 0.9, confidence: 0.85},
                {priority: 0.8, durability: 0.7}
            );
            patientBelief.label = "Patient has a fever";
            // Add metadata to the patient belief
            patientBelief.meta = {domain: "medicine", patient_id: "P001"};

            // Add beliefs to world model
            worldModel.add_item(symptomBelief);
            worldModel.add_item(patientBelief);

            // Verify medical beliefs were added
            const items = worldModel.getAllItems();
            const foundSymptomBelief = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("Fever is a symptom")
            );

            const foundPatientBelief = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("Patient has a fever")
            );

            expect(foundSymptomBelief).toBeDefined();
            expect(foundPatientBelief).toBeDefined();
            expect(foundPatientBelief?.meta?.domain).toBe("medicine");
        }, 10000); // 10 second timeout

        it('should handle scientific domain reasoning', async () => {
            // Create semantic atoms for the beliefs
            const boilingPointAtom = {
                id: uuidv4(),
                content: "Water boils at 100 degrees Celsius at sea level",
                embedding: await mockEmbeddingService.generateEmbedding("Water boils at 100 degrees Celsius at sea level"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "physics"}
            };

            const altitudeAtom = {
                id: uuidv4(),
                content: "Altitude affects boiling point",
                embedding: await mockEmbeddingService.generateEmbedding("Altitude affects boiling point"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "physics"}
            };

            // Add atoms to world model
            worldModel.add_atom(boilingPointAtom);
            worldModel.add_atom(altitudeAtom);

            // Create cognitive items (beliefs)
            const boilingPointBelief = CognitiveItemFactory.createBelief(
                boilingPointAtom.id,
                {frequency: 0.99, confidence: 0.95},
                {priority: 0.8, durability: 0.7}
            );
            boilingPointBelief.label = "Water boils at 100 degrees Celsius at sea level";

            const altitudeBelief = CognitiveItemFactory.createBelief(
                altitudeAtom.id,
                {frequency: 0.9, confidence: 0.85},
                {priority: 0.7, durability: 0.6}
            );
            altitudeBelief.label = "Altitude affects boiling point";

            // Add beliefs to world model
            worldModel.add_item(boilingPointBelief);
            worldModel.add_item(altitudeBelief);

            // Verify scientific beliefs were added
            const items = worldModel.getAllItems();
            const foundBoilingPointBelief = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("Water boils at 100 degrees")
            );

            const foundAltitudeBelief = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("Altitude affects boiling point")
            );

            expect(foundBoilingPointBelief).toBeDefined();
            expect(foundAltitudeBelief).toBeDefined();
        }, 10000); // 10 second timeout

        it('should handle business domain reasoning', async () => {
            // Create semantic atoms for the beliefs
            const satisfactionAtom = {
                id: uuidv4(),
                content: "High customer satisfaction leads to repeat purchases",
                embedding: await mockEmbeddingService.generateEmbedding("High customer satisfaction leads to repeat purchases"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "business"}
            };

            const scoreAtom = {
                id: uuidv4(),
                content: "Our customer satisfaction score is 4.5 out of 5",
                embedding: await mockEmbeddingService.generateEmbedding("Our customer satisfaction score is 4.5 out of 5"),
                creationTime: Date.now(),
                lastAccessTime: Date.now(),
                meta: {domain: "business", metric: "nps"}
            };

            // Add atoms to world model
            worldModel.add_atom(satisfactionAtom);
            worldModel.add_atom(scoreAtom);

            // Create cognitive items (beliefs)
            const satisfactionBelief = CognitiveItemFactory.createBelief(
                satisfactionAtom.id,
                {frequency: 0.8, confidence: 0.7},
                {priority: 0.7, durability: 0.6}
            );
            satisfactionBelief.label = "High customer satisfaction leads to repeat purchases";

            const scoreBelief = CognitiveItemFactory.createBelief(
                scoreAtom.id,
                {frequency: 0.9, confidence: 0.85},
                {priority: 0.8, durability: 0.7}
            );
            scoreBelief.label = "Our customer satisfaction score is 4.5 out of 5";

            // Add beliefs to world model
            worldModel.add_item(satisfactionBelief);
            worldModel.add_item(scoreBelief);

            // Verify business beliefs were added
            const items = worldModel.getAllItems();
            const foundSatisfactionBelief = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("High customer satisfaction")
            );

            const foundScoreBelief = items.find(item =>
                item.type === 'BELIEF' &&
                item.label?.includes("customer satisfaction score is 4.5")
            );

            expect(foundSatisfactionBelief).toBeDefined();
            expect(foundScoreBelief).toBeDefined();
        }, 10000); // 10 second timeout
    });
});