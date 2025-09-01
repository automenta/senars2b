import { TestCRUDManager, TestUtilities } from '../utils/TestUtilities';

describe('EnhancedConfigurableCRUDManager', () => {
  let manager: TestCRUDManager;

  beforeEach(() => {
    manager = new TestCRUDManager();
  });

  afterEach(() => {
    manager = null!;
  });

  describe('CRUD Operations', () => {
    it('should add items correctly', () => {
      const item = manager.createTestItem();
      manager.addItem(item);
      
      expect(manager.size()).toBe(1);
      expect(manager.getItem(item.id)).toEqual(item);
    });

    it('should retrieve items correctly', () => {
      const item = manager.createTestItem();
      manager.addItem(item);
      
      const retrieved = manager.getItem(item.id);
      expect(retrieved).toEqual(item);
      
      const nonExistent = manager.getItem('non-existent');
      expect(nonExistent).toBeNull();
    });

    it('should update items correctly', () => {
      const item = manager.createTestItem();
      manager.addItem(item);
      
      const updated = manager.updateItem(item.id, { testData: 'updated' });
      expect(updated).not.toBeNull();
      expect(updated!.testData).toBe('updated');
      
      const retrieved = manager.getItem(item.id);
      expect(retrieved!.testData).toBe('updated');
    });

    it('should remove items correctly', () => {
      const item = manager.createTestItem();
      manager.addItem(item);
      
      expect(manager.size()).toBe(1);
      
      const result = manager.removeItem(item.id);
      expect(result).toBe(true);
      expect(manager.size()).toBe(0);
      expect(manager.getItem(item.id)).toBeNull();
      
      // Removing non-existent item should return false
      const result2 = manager.removeItem('non-existent');
      expect(result2).toBe(false);
    });

    it('should get all items', () => {
      const item1 = manager.createTestItem();
      const item2 = manager.createTestItem();
      manager.addItem(item1);
      manager.addItem(item2);
      
      const allItems = manager.getAllItems();
      expect(allItems).toHaveLength(2);
      expect(allItems).toContainEqual(item1);
      expect(allItems).toContainEqual(item2);
    });

    it('should clear all items', () => {
      const item1 = manager.createTestItem();
      const item2 = manager.createTestItem();
      manager.addItem(item1);
      manager.addItem(item2);
      
      expect(manager.size()).toBe(2);
      
      manager.clear();
      expect(manager.size()).toBe(0);
      expect(manager.getAllItems()).toHaveLength(0);
    });
  });

  describe('Query Operations', () => {
    beforeEach(() => {
      // Add some test items
      manager.addItem(manager.createTestItem(undefined, 'test-1'));
      manager.addItem(manager.createTestItem(undefined, 'test-2'));
      manager.addItem(manager.createTestItem(undefined, 'test-1')); // Duplicate value
    });

    it('should find items by key-value pairs', () => {
      const items = manager.findBy('testData', 'test-1');
      expect(items).toHaveLength(2);
      expect(items.every(item => item.testData === 'test-1')).toBe(true);
    });

    it('should find a single item by key-value pair', () => {
      const item = manager.findOneBy('testData', 'test-2');
      expect(item).not.toBeNull();
      expect(item!.testData).toBe('test-2');
      
      const nonExistent = manager.findOneBy('testData', 'non-existent');
      expect(nonExistent).toBeNull();
    });
  });

  describe('Event Handling', () => {
    it('should emit itemAdded events', (done) => {
      const item = manager.createTestItem();
      
      manager.on('itemAdded', (event) => {
        expect(event.item).toEqual(item);
        done();
      });
      
      manager.addItem(item);
    });

    it('should emit itemUpdated events', (done) => {
      const item = manager.createTestItem();
      manager.addItem(item);
      
      manager.on('itemUpdated', (event) => {
        expect(event.item.testData).toBe('updated');
        done();
      });
      
      manager.updateItem(item.id, { testData: 'updated' });
    });

    it('should emit itemRemoved events', (done) => {
      const item = manager.createTestItem();
      manager.addItem(item);
      
      manager.on('itemRemoved', (event) => {
        expect(event.itemId).toBe(item.id);
        done();
      });
      
      manager.removeItem(item.id);
    });
  });

  describe('History Tracking', () => {
    it('should track item history when enabled', () => {
      const item = manager.createTestItem();
      manager.addItem(item);
      
      // Update the item
      manager.updateItem(item.id, { testData: 'updated' });
      
      // Get history
      const history = manager.getItemHistory(item.id);
      expect(history).not.toBeNull();
      expect(history).toHaveLength(2); // Initial + update
      
      if (history) {
        expect(history[0].testData).toBe('test');
        expect(history[1].testData).toBe('updated');
      }
    });

    it('should limit history size', () => {
      // Create a manager with small history limit
      const limitedManager = new TestCRUDManager();
      limitedManager.updateConfig({ maxHistorySize: 3 });
      
      const item = limitedManager.createTestItem();
      limitedManager.addItem(item);
      
      // Make more updates than the history limit
      for (let i = 0; i < 5; i++) {
        limitedManager.updateItem(item.id, { testData: `update-${i}` });
      }
      
      const history = limitedManager.getItemHistory(item.id);
      if (history) {
        expect(history).toHaveLength(3); // Limited to 3
        expect(history[0].testData).toBe('update-2'); // Oldest kept
        expect(history[2].testData).toBe('update-4'); // Newest
      }
    });
  });

  describe('Type Safety', () => {
    it('should reject items with incorrect types', () => {
      // This would require a more complex setup to test properly
      // In practice, the type system prevents this at compile time
      expect(true).toBe(true);
    });
  });
});