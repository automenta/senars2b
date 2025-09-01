import { 
  UnifiedBaseComponent, 
  BaseConfig 
} from '@/core/UnifiedBaseComponent';
import { 
  EnhancedConfigurableCRUDManager 
} from '@/core/EnhancedConfigurableCRUDManager';
import { 
  CognitiveItem, 
  AttentionValue 
} from '@/interfaces/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Test utilities for the unified architecture
 */

/**
 * Mock configuration for testing
 */
export interface TestConfig extends BaseConfig {
  testValue?: string;
  testNumber?: number;
  testBoolean?: boolean;
}

/**
 * Mock events for testing
 */
export interface TestEvents {
  testEvent: { data: string; timestamp: number };
  errorEvent: { error: string; context: Record<string, any> };
}

/**
 * Simple test component for testing the base component functionality
 */
export class TestComponent extends UnifiedBaseComponent<TestConfig, TestEvents> {
  constructor(userConfig: Partial<TestConfig> = {}) {
    const defaultConfig: TestConfig = {
      testValue: 'default',
      testNumber: 42,
      testBoolean: true
    };
    super('TestComponent', defaultConfig, userConfig);
  }

  triggerTestEvent(data: string): void {
    this.notifyEvent('testEvent', { data, timestamp: Date.now() }, {
      component: 'TestComponent',
      operation: 'triggerTestEvent'
    });
  }

  triggerErrorEvent(error: string): void {
    this.notifyEvent('errorEvent', { error, context: { test: true } }, {
      component: 'TestComponent',
      operation: 'triggerErrorEvent'
    });
  }

  getTestConfigValue(): string | undefined {
    return this.getConfig().testValue;
  }

  updateTestConfig(updates: Partial<TestConfig>): void {
    this.updateConfig(updates);
  }
}

/**
 * Mock cognitive item for testing
 */
export interface TestCognitiveItem extends CognitiveItem {
  type: 'TEST';
  testData: string;
}

/**
 * Mock manager for testing CRUD functionality
 */
export class TestCRUDManager extends EnhancedConfigurableCRUDManager<TestCognitiveItem, TestConfig> {
  constructor() {
    // Mock dependencies for testing
    const mockWorldModel: any = {
      getAllItems: () => [],
      add_item: () => {},
      update_item: () => {},
      remove_item: () => true
    };
    
    const mockAgenda: any = {
      push: () => {},
      remove: () => true
    };
    
    const defaultConfig: TestConfig = {
      testValue: 'manager-default',
      enableHistoryTracking: true,
      maxHistorySize: 10
    };
    
    super('TestCRUDManager', 'TEST', mockWorldModel, mockAgenda, defaultConfig);
  }

  createTestItem(id?: string, testData: string = 'test'): TestCognitiveItem {
    return {
      id: id || uuidv4(),
      type: 'TEST',
      testData,
      attention: { priority: 0.5, durability: 0.5 },
      stamp: { timestamp: Date.now() }
    };
  }
}

/**
 * Test utilities class
 */
export class TestUtilities {
  /**
   * Create a mock cognitive item for testing
   */
  static createMockCognitiveItem(
    type: CognitiveItem['type'] = 'BELIEF',
    overrides: Partial<CognitiveItem> = {}
  ): CognitiveItem {
    const baseItem: CognitiveItem = {
      id: uuidv4(),
      type,
      attention: { priority: 0.5, durability: 0.5 },
      stamp: { timestamp: Date.now() },
      ...overrides
    };

    // Add type-specific properties
    switch (type) {
      case 'TASK':
        (baseItem as any).task_metadata = {
          status: 'pending',
          priority_level: 'medium'
        };
        break;
      case 'BELIEF':
        (baseItem as any).truth = { frequency: 0.8, confidence: 0.9 };
        break;
      case 'GOAL':
        // GOAL items don't require additional properties
        break;
      case 'QUERY':
        // QUERY items don't require additional properties
        break;
      case 'EVENT':
        (baseItem as any).event_data = { test: true };
        break;
    }

    return baseItem;
  }

  /**
   * Create multiple mock cognitive items
   */
  static createMockCognitiveItems(
    count: number,
    type: CognitiveItem['type'] = 'BELIEF'
  ): CognitiveItem[] {
    return Array.from({ length: count }, () => 
      this.createMockCognitiveItem(type)
    );
  }

  /**
   * Wait for a specific event to be emitted
   */
  static waitForEvent<T>(
    component: UnifiedBaseComponent<any, any>,
    eventName: string,
    timeout: number = 1000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for event ${eventName}`));
      }, timeout);

      component.on(eventName, (data: T) => {
        clearTimeout(timeoutId);
        resolve(data);
      });
    });
  }

  /**
   * Collect events for a specific time period
   */
  static collectEvents<T>(
    component: UnifiedBaseComponent<any, any>,
    eventName: string,
    duration: number = 1000
  ): Promise<T[]> {
    return new Promise((resolve) => {
      const events: T[] = [];
      
      const handler = (data: T) => {
        events.push(data);
      };
      
      component.on(eventName, handler);
      
      setTimeout(() => {
        component.off(eventName, handler);
        resolve(events);
      }, duration);
    });
  }

  /**
   * Create a mock attention value
   */
  static createMockAttentionValue(
    priority: number = 0.5,
    durability: number = 0.5
  ): AttentionValue {
    return { priority, durability };
  }

  /**
   * Create a mock truth value
   */
  static createMockTruthValue(
    frequency: number = 0.8,
    confidence: number = 0.9
  ): { frequency: number; confidence: number } {
    return { frequency, confidence };
  }

  /**
   * Create a mock task metadata
   */
  static createMockTaskMetadata(
    overrides: Partial<any> = {}
  ): any {
    return {
      status: 'pending',
      priority_level: 'medium',
      ...overrides
    };
  }
}