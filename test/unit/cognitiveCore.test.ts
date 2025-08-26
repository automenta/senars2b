import { DecentralizedCognitiveCore } from '../../dist/cognitiveCore';

describe('DecentralizedCognitiveCore', () => {
  let core: DecentralizedCognitiveCore;

  beforeEach(() => {
    core = new DecentralizedCognitiveCore(2); // 2 workers for testing
  });

  describe('constructor', () => {
    it('should create a cognitive core with the specified number of workers', () => {
      // The core should be created successfully
      expect(core).toBeDefined();
    });
  });

  describe('addSchema', () => {
    it('should add a schema to the core', () => {
      const schemaContent = {
        name: "TestSchema",
        pattern: {
          premise: "(?A is related to ?B)",
          conclusion: "(?B is related to ?A)"
        }
      };

      const schemaMeta = {
        type: "CognitiveSchema",
        source: "test",
        timestamp: new Date().toISOString(),
        trust_score: 0.8
      };

      // This should not throw an error
      expect(() => {
        core.addSchema(schemaContent, schemaMeta);
      }).not.toThrow();
    });
  });

  describe('addInitialBelief', () => {
    it('should add an initial belief to the core', () => {
      // This should not throw an error
      expect(() => {
        core.addInitialBelief(
          "Test belief content",
          { frequency: 0.8, confidence: 0.9 },
          { priority: 0.5, durability: 0.7 },
          { domain: "test", source: "test_source" }
        );
      }).not.toThrow();
    });
  });

  describe('addInitialGoal', () => {
    it('should add an initial goal to the core', () => {
      // This should not throw an error
      expect(() => {
        core.addInitialGoal(
          "Test goal content",
          { priority: 0.9, durability: 0.8 },
          { domain: "test", source: "test_source" }
        );
      }).not.toThrow();
    });
  });

  describe('getSystemStatus', () => {
    it('should return the system status', () => {
      const status = core.getSystemStatus();
      
      // Should return an object with expected properties
      expect(status).toHaveProperty('agendaSize');
      expect(status).toHaveProperty('worldModelStats');
      expect(status).toHaveProperty('workerStats');
      expect(typeof status.agendaSize).toBe('number');
    });
  });
});