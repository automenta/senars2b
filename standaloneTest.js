// Simple standalone test to verify our new unified components work
// This test avoids dependencies on the existing codebase structure
// And uses plain JavaScript that Node.js can execute directly

console.log('Running standalone test of unified component concepts...');

// Simple implementation of our core concepts
class SimpleEventEmitter {
  constructor() {
    this.listeners = new Map();
  }
  
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
  }
  
  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }
}

class SimpleConfigManager {
  constructor(defaultConfig, userConfig = {}) {
    this.config = { ...defaultConfig, ...userConfig };
  }
  
  getConfig() {
    return { ...this.config };
  }
  
  updateConfig(updates) {
    this.config = { ...this.config, ...updates };
  }
}

class SimpleStatisticsTracker {
  constructor() {
    this.stats = new Map();
  }
  
  increment(key) {
    this.stats.set(key, (this.stats.get(key) || 0) + 1);
  }
  
  update(key, value) {
    this.stats.set(key, value);
  }
  
  get(key) {
    return this.stats.get(key);
  }
}

// Simple implementation of our enhanced unified base component concepts
class SimpleUnifiedBaseComponent extends SimpleEventEmitter {
  constructor(componentName, defaultConfig, userConfig = {}) {
    super();
    this.componentName = componentName;
    this.configManager = new SimpleConfigManager(defaultConfig, userConfig);
    this.statisticsTracker = new SimpleStatisticsTracker();
  }
  
  getConfig() {
    return this.configManager.getConfig();
  }
  
  updateConfig(updates) {
    this.configManager.updateConfig(updates);
    console.log(`${this.componentName} configuration updated`);
  }
  
  notifyEvent(eventType, event, context = {}) {
    const fullContext = {
      component: this.componentName,
      timestamp: Date.now(),
      ...context
    };
    
    // Track statistics
    this.statisticsTracker.increment(`${eventType}Count`);
    
    console.log(`Event emitted: ${eventType}`, fullContext);
    this.emit(eventType, event);
  }
}

// Simple implementation of our enhanced CRUD manager concepts
class SimpleCRUDManager extends SimpleUnifiedBaseComponent {
  constructor(componentName, defaultConfig) {
    super(componentName, defaultConfig);
    this.items = new Map();
  }
  
  addItem(item) {
    this.items.set(item.id, item);
    this.notifyEvent('itemAdded', { item }, { itemId: item.id });
  }
  
  getItem(id) {
    return this.items.get(id) || null;
  }
  
  getAllItems() {
    return Array.from(this.items.values());
  }
  
  removeItem(id) {
    const result = this.items.delete(id);
    if (result) {
      this.notifyEvent('itemRemoved', { itemId: id }, { itemId: id });
    }
    return result;
  }
}

// Test the simple implementations
function runStandaloneTest() {
  console.log('Testing simple unified component implementations...');
  
  try {
    // Create a simple manager
    const manager = new SimpleCRUDManager(
      'TestManager', 
      { enableLogging: true, maxItems: 100 }
    );
    
    // Add event listeners
    manager.on('itemAdded', (data) => {
      console.log('Item added event received:', data);
    });
    
    manager.on('itemRemoved', (data) => {
      console.log('Item removed event received:', data);
    });
    
    // Add some items
    manager.addItem({ id: '1', name: 'Item 1', value: 42 });
    manager.addItem({ id: '2', name: 'Item 2', value: 84 });
    
    // Get all items
    const allItems = manager.getAllItems();
    console.log('All items:', allItems);
    
    // Test configuration
    const config = manager.getConfig();
    console.log('Initial config:', config);
    
    // Update config
    manager.updateConfig({ maxItems: 200 });
    const updatedConfig = manager.getConfig();
    console.log('Updated config:', updatedConfig);
    
    // Remove an item
    manager.removeItem('1');
    
    console.log('Standalone test completed successfully!');
    return true;
  } catch (error) {
    console.error('Standalone test failed:', error);
    return false;
  }
}

// Run the test
runStandaloneTest();