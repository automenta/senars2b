// Simple test to verify our new unified components work independently
import { EnhancedUnifiedBaseComponent } from '@/core/EnhancedUnifiedBaseComponent';
import { EnhancedCRUDManager } from '@/core/EnhancedCRUDManager';

// Define a simple test item type
interface TestItem {
  id: string;
  name: string;
  value: number;
}

// Define a simple config
interface TestConfig {
  enableLogging?: boolean;
  maxItems?: number;
}

// Define events
interface TestEvents {
  itemAdded: { item: TestItem };
  itemRemoved: { itemId: string };
}

// Create a simple test manager
class TestManager extends EnhancedCRUDManager<TestItem, TestConfig> {
  constructor() {
    super('TestManager', 'TASK', { enableLogging: true, maxItems: 100 });
  }

  // Test method to add an item
  addTestItem(name: string, value: number): TestItem {
    const item: TestItem = {
      id: `item-${Date.now()}`,
      name,
      value
    };
    
    this.addItem(item);
    return item;
  }
  
  // Test method to get all items
  getAllTestItems(): TestItem[] {
    return this.getAllItems();
  }
}

// Test the components
export function runSimpleTest() {
  console.log('Running simple test of unified components...');
  
  try {
    // Create a test manager
    const manager = new TestManager();
    
    // Add some items
    const item1 = manager.addTestItem('Test Item 1', 42);
    const item2 = manager.addTestItem('Test Item 2', 84);
    
    console.log('Added items:', item1.id, item2.id);
    
    // Get all items
    const allItems = manager.getAllTestItems();
    console.log('All items count:', allItems.length);
    
    // Test configuration
    const config = manager.getConfig();
    console.log('Config:', config);
    
    // Update config
    manager.updateConfig({ maxItems: 200 });
    const updatedConfig = manager.getConfig();
    console.log('Updated config:', updatedConfig);
    
    console.log('Simple test completed successfully!');
    return true;
  } catch (error) {
    console.error('Simple test failed:', error);
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runSimpleTest();
}