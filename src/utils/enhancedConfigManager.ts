import { BaseConfig, ConfigManager } from '@/utils/configUtils';
import { Logger } from '@/utils/standardLogger';
import { StatisticsTracker } from '@/utils/StatisticsTracker';

/**
 * Enhanced configuration manager with validation and monitoring
 */
export class EnhancedConfigManager<T extends BaseConfig> extends ConfigManager<T> {
  private validator?: (config: T) => boolean;
  private statisticsTracker: StatisticsTracker;

  constructor(
    defaultConfig: T,
    userConfig: Partial<T> = {},
    validator?: (config: T) => boolean
  ) {
    super(defaultConfig, userConfig);
    this.validator = validator;
    this.statisticsTracker = new StatisticsTracker();
    
    // Validate initial configuration
    this.validateConfig();
  }

  /**
   * Update configuration with validation
   */
  updateConfig(updates: Partial<T>): void {
    const oldConfig = this.getConfig();
    super.updateConfig(updates);
    
    try {
      this.validateConfig();
      Logger.info('Configuration updated successfully', {
        component: 'EnhancedConfigManager',
        operation: 'updateConfig'
      });
      this.statisticsTracker.increment('configUpdates');
    } catch (error) {
      // Rollback to previous configuration
      super.updateConfig(oldConfig);
      Logger.error('Configuration update failed, rolled back', {
        component: 'EnhancedConfigManager',
        operation: 'updateConfig'
      }, error);
      throw error;
    }
  }

  /**
   * Validate current configuration
   */
  private validateConfig(): void {
    if (this.validator) {
      const config = this.getConfig();
      if (!this.validator(config)) {
        throw new Error('Configuration validation failed');
      }
    }
  }

  /**
   * Get configuration statistics
   */
  getStatistics(): Record<string, number> {
    return this.statisticsTracker.getAll();
  }
}

/**
 * Configuration schema definition for type-safe configurations
 */
export interface ConfigSchema<T> {
  validate: (config: T) => boolean;
  defaults: T;
}

/**
 * Factory for creating validated configuration managers
 */
export class ConfigManagerFactory {
  static create<T extends BaseConfig>(
    schema: ConfigSchema<T>,
    userConfig: Partial<T> = {}
  ): EnhancedConfigManager<T> {
    return new EnhancedConfigManager(
      schema.defaults,
      userConfig,
      schema.validate
    );
  }
}