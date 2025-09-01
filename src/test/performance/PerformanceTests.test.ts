import { TestComponent, TestCRUDManager, TestUtilities } from '../test/utils/TestUtilities';
import { PerformanceMonitor } from '@/utils/PerformanceMonitor';

describe('Performance Tests', () => {
  describe('UnifiedBaseComponent Performance', () => {
    let component: TestComponent;

    beforeEach(() => {
      component = new TestComponent();
    });

    afterEach(() => {
      component = null!;
    });

    it('should handle high-frequency event emission efficiently', () => {
      const eventCount = 10000;
      let receivedCount = 0;

      component.on('testEvent', () => {
        receivedCount++;
      });

      const startTime = performance.now();

      for (let i = 0; i < eventCount; i++) {
        component.triggerTestEvent(`event-${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(receivedCount).toBe(eventCount);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle configuration updates efficiently', () => {
      const updateCount = 10000;
      const startTime = performance.now();

      for (let i = 0; i < updateCount; i++) {
        component.updateConfig({ testNumber: i });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(component.getConfig().testNumber).toBe(updateCount - 1);
      expect(duration).toBeLessThan(500); // Should complete in under 500ms
    });
  });

  describe('CRUD Manager Performance', () => {
    let manager: TestCRUDManager;

    beforeEach(() => {
      manager = new TestCRUDManager();
    });

    afterEach(() => {
      manager = null!;
    });

    it('should handle large numbers of items efficiently', () => {
      const itemCount = 10000;
      const items: any[] = [];

      // Add items
      const addStartTime = performance.now();
      for (let i = 0; i < itemCount; i++) {
        const item = manager.createTestItem(`item-${i}`, `data-${i}`);
        manager.addItem(item);
        items.push(item);
      }
      const addEndTime = performance.now();
      const addDuration = addEndTime - addStartTime;

      expect(manager.size()).toBe(itemCount);
      expect(addDuration).toBeLessThan(1000); // Should complete in under 1 second

      // Retrieve items
      const getStartTime = performance.now();
      for (let i = 0; i < 1000; i++) { // Test a sample of items
        const item = manager.getItem(items[i].id);
        expect(item).toEqual(items[i]);
      }
      const getEndTime = performance.now();
      const getDuration = getEndTime - getStartTime;

      expect(getDuration).toBeLessThan(100); // Should complete in under 100ms

      // Update items
      const updateStartTime = performance.now();
      for (let i = 0; i < 1000; i++) { // Test a sample of items
        const updated = manager.updateItem(items[i].id, { testData: `updated-${i}` });
        expect(updated).not.toBeNull();
        expect(updated!.testData).toBe(`updated-${i}`);
      }
      const updateEndTime = performance.now();
      const updateDuration = updateEndTime - updateStartTime;

      expect(updateDuration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle queries efficiently', () => {
      // Add items with different values
      for (let i = 0; i < 1000; i++) {
        const value = i % 10; // 10 different values
        const item = manager.createTestItem(`item-${i}`, `value-${value}`);
        manager.addItem(item);
      }

      const queryStartTime = performance.now();
      const results = manager.findBy('testData', 'value-5');
      const queryEndTime = performance.now();
      const queryDuration = queryEndTime - queryStartTime;

      // Should find approximately 100 items (1000 items / 10 values)
      expect(results.length).toBeGreaterThan(90);
      expect(results.length).toBeLessThan(110);
      expect(queryDuration).toBeLessThan(50); // Should complete in under 50ms
    });
  });

  describe('Performance Monitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor({
        enableMemoryMonitoring: true,
        enableEventLoopMonitoring: true,
        monitoringInterval: 100 // Fast interval for testing
      });
    });

    afterEach(() => {
      monitor.stop();
      monitor = null!;
    });

    it('should collect performance data efficiently', (done) => {
      monitor.on('performanceReport', (event) => {
        expect(event.report).toBeDefined();
        expect(event.report.memory).toBeDefined();
        expect(event.report.timestamp).toBeDefined();
        done();
      });

      monitor.start();
    });

    it('should detect high memory usage', (done) => {
      // Configure monitor with a very low threshold for testing
      const lowThresholdMonitor = new PerformanceMonitor({
        enableMemoryMonitoring: true,
        memoryThreshold: 0.000001, // Extremely low threshold
        monitoringInterval: 50
      });

      lowThresholdMonitor.on('memoryUsageHigh', (event) => {
        expect(event.usedMemory).toBeDefined();
        expect(event.threshold).toBe(0.000001);
        lowThresholdMonitor.stop();
        done();
      });

      lowThresholdMonitor.start();
    });
  });
});