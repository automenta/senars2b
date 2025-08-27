import {AttentionValue, CognitiveItem, SemanticAtom, TruthValue} from '@/interfaces/types';
import {CognitiveSchema, WorldModel} from '@/core/worldModel';
import {DecentralizedCognitiveCore} from '@/core/cognitiveCore';
import {createCognitiveItem, createSemanticAtom, createTruthValue, createAttentionValue, createMockSchema, createCognitiveMetadata} from './testUtils';

describe('Engineering Design Domain Tests', () => {
    let core: DecentralizedCognitiveCore;

    beforeEach(() => {
        core = new DecentralizedCognitiveCore(2);
    });

    it('should handle system design trade-offs and optimization', () => {
        // Add engineering knowledge
        const truth = createTruthValue({frequency: 0.9, confidence: 0.95});
        const attention = createAttentionValue({priority: 0.9, durability: 0.8});

        core.addInitialBelief("Material A has tensile strength of 500 MPa but costs $10/kg", truth, attention,
            createCognitiveMetadata({
                domain: "materials_engineering",
                source: "material_database",
                trust_score: 0.95
            })
        );

        core.addInitialBelief("Material B has tensile strength of 400 MPa but costs $5/kg", truth, attention,
            createCognitiveMetadata({
                domain: "materials_engineering",
                source: "material_database",
                trust_score: 0.95
            })
        );

        core.addInitialGoal("Select optimal material for structural component", attention,
            createCognitiveMetadata({
                domain: "mechanical_engineering",
                source: "design_team"
            })
        );

        const status = core.getSystemStatus();
        expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
    });

    it('should handle failure analysis and reliability engineering', () => {
        const truth = createTruthValue({frequency: 0.8, confidence: 0.9});
        const attention = createAttentionValue({priority: 0.85, durability: 0.75});

        core.addInitialBelief("Component X has mean time between failures of 10,000 hours", truth, attention,
            createCognitiveMetadata({
                domain: "reliability_engineering",
                source: "testing_lab",
                trust_score: 0.9
            })
        );

        core.addInitialBelief("Operating temperature above 80°C reduces component life by 30%", truth, attention,
            createCognitiveMetadata({
                domain: "thermal_engineering",
                source: "empirical_study",
                trust_score: 0.85
            })
        );

        core.addInitialGoal("Design thermal management system for Component X", attention,
            createCognitiveMetadata({
                domain: "thermal_engineering",
                source: "engineering_team"
            })
        );

        const status = core.getSystemStatus();
        expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
    });
});