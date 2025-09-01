import { CognitiveItemValidator } from '@/utils/CognitiveItemValidator';
import { TestUtilities } from '../test/utils/TestUtilities';
import { ConfigurationManager } from '@/utils/ConfigurationManager';

describe('Utility Components', () => {
  describe('CognitiveItemValidator', () => {
    let validator: CognitiveItemValidator;

    beforeEach(() => {
      validator = new CognitiveItemValidator({
        enableStrictValidation: true
      });
    });

    afterEach(() => {
      validator = null!;
    });

    it('should validate valid cognitive items', () => {
      const validItem = TestUtilities.createMockCognitiveItem('BELIEF');
      const result = validator.validate(validItem);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid cognitive items', () => {
      const invalidItem: any = {
        id: 'test-item',
        // Missing type and other required fields
      };
      
      const result = validator.validate(invalidItem);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate item types correctly', () => {
      // Test valid BELIEF item
      const beliefItem = TestUtilities.createMockCognitiveItem('BELIEF');
      const beliefResult = validator.validate(beliefItem);
      expect(beliefResult.isValid).toBe(true);
      
      // Test valid TASK item
      const taskItem = TestUtilities.createMockCognitiveItem('TASK');
      const taskResult = validator.validate(taskItem);
      expect(taskResult.isValid).toBe(true);
    });

    it('should validate truth values for beliefs', () => {
      // Test belief with invalid frequency
      const invalidBelief: any = TestUtilities.createMockCognitiveItem('BELIEF');
      invalidBelief.truth.frequency = 1.5; // Invalid - should be 0-1
      
      const result = validator.validate(invalidBelief);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('frequency'))).toBe(true);
    });

    it('should validate attention values', () => {
      // Test item with invalid attention values
      const invalidItem: any = TestUtilities.createMockCognitiveItem('BELIEF');
      invalidItem.attention.priority = 1.5; // Invalid - should be 0-1
      
      const result = validator.validate(invalidItem);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('priority'))).toBe(true);
    });

    it('should validate batch items', () => {
      const validItem = TestUtilities.createMockCognitiveItem('BELIEF');
      const invalidItem: any = { id: 'invalid' }; // Missing required fields
      
      const result = validator.validateBatch([validItem, invalidItem]);
      
      expect(result.validItems).toHaveLength(1);
      expect(result.invalidItems).toHaveLength(1);
      expect(result.validItems[0]).toEqual(validItem);
      expect(result.invalidItems[0].item).toEqual(invalidItem);
    });
  });

  describe('ConfigurationManager', () => {
    let configManager: ConfigurationManager;

    beforeEach(() => {
      configManager = new ConfigurationManager({
        system: {
          name: 'Test System',
          version: '1.0.0'
        },
        features: {
          enabled: true,
          limit: 100
        }
      });
    });

    afterEach(() => {
      configManager = null!;
    });

    it('should initialize with default configuration', () => {
      expect(configManager.get('system.name')).toBe('Test System');
      expect(configManager.get('system.version')).toBe('1.0.0');
      expect(configManager.get('features.enabled')).toBe(true);
      expect(configManager.get('features.limit')).toBe(100);
    });

    it('should get nested configuration values', () => {
      const systemName = configManager.get('system.name');
      const featureLimit = configManager.get('features.limit');
      
      expect(systemName).toBe('Test System');
      expect(featureLimit).toBe(100);
    });

    it('should handle default values for missing configuration', () => {
      const defaultValue = configManager.get('non.existent.path', 'default');
      expect(defaultValue).toBe('default');
    });

    it('should update configuration values', () => {
      configManager.set('system.name', 'Updated System');
      configManager.set('features.limit', 200);
      
      expect(configManager.get('system.name')).toBe('Updated System');
      expect(configManager.get('features.limit')).toBe(200);
    });

    it('should emit config update events', (done) => {
      configManager.on('configUpdated', (event) => {
        expect(event.changedKeys).toContain('system.name');
        done();
      });
      
      configManager.set('system.name', 'Event Test System');
    });

    it('should reset to default configuration', () => {
      // Change some values
      configManager.set('system.name', 'Modified System');
      configManager.set('features.limit', 500);
      
      expect(configManager.get('system.name')).toBe('Modified System');
      expect(configManager.get('features.limit')).toBe(500);
      
      // Reset to defaults
      configManager.resetToDefault();
      
      expect(configManager.get('system.name')).toBe('Test System');
      expect(configManager.get('features.limit')).toBe(100);
    });

    it('should merge configuration objects correctly', () => {
      // Load additional configuration
      const additionalConfig = {
        features: {
          limit: 300, // Override existing value
          newFeature: true // Add new value
        },
        database: {
          host: 'localhost',
          port: 5432
        }
      };
      
      configManager.loadConfig(additionalConfig, 'test');
      
      // Check that existing values are preserved
      expect(configManager.get('system.name')).toBe('Test System');
      expect(configManager.get('features.enabled')).toBe(true);
      
      // Check that values are overridden
      expect(configManager.get('features.limit')).toBe(300);
      
      // Check that new values are added
      expect(configManager.get('features.newFeature')).toBe(true);
      expect(configManager.get('database.host')).toBe('localhost');
      expect(configManager.get('database.port')).toBe(5432);
    });
  });
});