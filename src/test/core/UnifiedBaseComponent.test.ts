import { TestComponent, TestUtilities } from './TestUtilities';

describe('UnifiedBaseComponent', () => {
  let component: TestComponent;

  beforeEach(() => {
    component = new TestComponent();
  });

  afterEach(() => {
    component = null!;
  });

  describe('Configuration Management', () => {
    it('should initialize with default configuration', () => {
      expect(component.getConfig().testValue).toBe('default');
      expect(component.getConfig().testNumber).toBe(42);
      expect(component.getConfig().testBoolean).toBe(true);
    });

    it('should accept user configuration overrides', () => {
      const customComponent = new TestComponent({
        testValue: 'custom',
        testNumber: 100
      });

      expect(customComponent.getConfig().testValue).toBe('custom');
      expect(customComponent.getConfig().testNumber).toBe(100);
      expect(customComponent.getConfig().testBoolean).toBe(true); // Default value
    });

    it('should allow configuration updates', () => {
      component.updateConfig({ testValue: 'updated' });
      expect(component.getConfig().testValue).toBe('updated');
    });

    it('should allow getting specific configuration values', () => {
      expect(component.getTestConfigValue()).toBe('default');
    });
  });

  describe('Event Handling', () => {
    it('should emit events with correct data', (done) => {
      component.on('testEvent', (event) => {
        expect(event.data).toBe('test-data');
        expect(event.timestamp).toBeDefined();
        done();
      });

      component.triggerTestEvent('test-data');
    });

    it('should handle multiple event listeners', () => {
      let callCount = 0;
      
      const handler1 = () => callCount++;
      const handler2 = () => callCount++;
      
      component.on('testEvent', handler1);
      component.on('testEvent', handler2);
      
      component.triggerTestEvent('test');
      
      expect(callCount).toBe(2);
    });

    it('should allow removing event listeners', () => {
      let callCount = 0;
      const handler = () => callCount++;
      
      component.on('testEvent', handler);
      component.triggerTestEvent('test');
      expect(callCount).toBe(1);
      
      component.off('testEvent', handler);
      component.triggerTestEvent('test');
      expect(callCount).toBe(1); // Should not increment
    });
  });

  describe('Statistics Tracking', () => {
    it('should track statistics correctly', () => {
      const tracker = component.getStatisticsTracker();
      
      tracker.increment('testCounter');
      expect(tracker.get('testCounter')).toBe(1);
      
      tracker.increment('testCounter', 2);
      expect(tracker.get('testCounter')).toBe(3);
      
      tracker.update('testValue', 42);
      expect(tracker.get('testValue')).toBe(42);
    });

    it('should calculate averages correctly', () => {
      const tracker = component.getStatisticsTracker();
      
      tracker.update('testMetric', 10);
      tracker.update('testMetric', 20);
      tracker.update('testMetric', 30);
      
      const average = tracker.getAverage('testMetric');
      expect(average).toBe(20);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors with context', () => {
      const error = new Error('Test error');
      const context = {
        component: 'TestComponent',
        operation: 'testOperation'
      };
      
      expect(() => {
        component.handleError(error, context);
      }).toThrow('Test error');
    });

    it('should create validation errors', () => {
      const error = component.createValidationError('Test validation error');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Test validation error');
    });

    it('should create not found errors', () => {
      const error = component.createNotFoundError('TestResource', '123');
      expect(error.code).toBe('NOT_FOUND_ERROR');
      expect(error.message).toBe('TestResource with ID 123 not found');
    });
  });

  describe('Event Utilities', () => {
    it('should wait for events with timeout', async () => {
      // Test the waitForEvent utility
      const promise = TestUtilities.waitForEvent(component, 'testEvent', 100);
      
      setTimeout(() => {
        component.triggerTestEvent('delayed-event');
      }, 50);
      
      const event = await promise;
      expect(event.data).toBe('delayed-event');
    });

    it('should reject when waiting for events times out', async () => {
      const promise = TestUtilities.waitForEvent(component, 'testEvent', 50);
      
      await expect(promise).rejects.toThrow('Timeout waiting for event testEvent');
    });

    it('should collect events over time', async () => {
      // Test the collectEvents utility
      const promise = TestUtilities.collectEvents(component, 'testEvent', 100);
      
      component.triggerTestEvent('event-1');
      setTimeout(() => component.triggerTestEvent('event-2'), 30);
      setTimeout(() => component.triggerTestEvent('event-3'), 60);
      
      const events = await promise;
      expect(events).toHaveLength(3);
      expect(events[0].data).toBe('event-1');
      expect(events[1].data).toBe('event-2');
      expect(events[2].data).toBe('event-3');
    });
  });
});