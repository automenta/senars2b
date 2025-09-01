import { BaseComponent } from './BaseComponent';
import { ConfigManager, BaseConfig } from '@/utils/configUtils';

/**
 * Abstract base class for configurable components
 * Provides common functionality for configuration management
 */
export abstract class BaseConfigurableComponent<
  T extends BaseConfig, 
  EventMap extends Record<string, any>
> extends BaseComponent<EventMap> {
  protected configManager: ConfigManager<T>;

  constructor(componentName: string, defaultConfig: T, userConfig: Partial<T> = {}) {
    super(componentName);
    this.configManager = new ConfigManager(defaultConfig, userConfig);
  }

  /**
   * Get the current configuration
   */
  getConfig(): T {
    return this.configManager.getConfig();
  }

  /**
   * Update the configuration with partial updates
   */
  updateConfig(updates: Partial<T>): void {
    this.configManager.updateConfig(updates);
    this.logger.info('Configuration updated', { 
      component: this.constructor.name, 
      operation: 'updateConfig' 
    });
  }

  /**
   * Get a specific configuration value
   */
  protected getConfigValue<K extends keyof T>(key: K): T[K] {
    return this.configManager.get(key);
  }

  /**
   * Set a specific configuration value
   */
  protected setConfigValue<K extends keyof T>(key: K, value: T[K]): void {
    this.configManager.set(key, value);
    this.logger.info('Configuration value updated', { 
      component: this.constructor.name, 
      operation: 'setConfigValue',
      key: key as string
    });
  }
}