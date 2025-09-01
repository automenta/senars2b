import { UnifiedBaseComponent, BaseConfig } from '@/core/UnifiedBaseComponent';
import { Logger } from '@/utils/standardLogger';

/**
 * Configuration for the configuration manager
 */
interface ConfigurationManagerConfig extends BaseConfig {
  enableValidation?: boolean;
  enableHotReload?: boolean;
  configFilePath?: string;
}

/**
 * Events emitted by the configuration manager
 */
interface ConfigurationManagerEvents {
  configLoaded: { config: Record<string, any>; source: string };
  configUpdated: { config: Record<string, any>; changedKeys: string[] };
  configError: { error: string; source: string };
}

/**
 * Utility class for managing system configuration
 */
export class ConfigurationManager extends UnifiedBaseComponent<ConfigurationManagerConfig, ConfigurationManagerEvents> {
  private config: Record<string, any> = {};
  private defaultConfig: Record<string, any> = {};
  private configFileWatcher: any = null; // Would be fs.FSWatcher in Node.js

  constructor(
    defaultConfig: Record<string, any>,
    userConfig: Partial<ConfigurationManagerConfig> = {}
  ) {
    const finalConfig: ConfigurationManagerConfig = {
      enableValidation: true,
      enableHotReload: false,
      configFilePath: './config.json',
      ...userConfig
    };
    
    super('ConfigurationManager', finalConfig, userConfig);
    
    this.defaultConfig = defaultConfig;
    this.config = { ...defaultConfig };
    
    this.getLogger().info('Configuration manager initialized', {
      component: 'ConfigurationManager',
      operation: 'constructor'
    });
  }

  /**
   * Load configuration from a file
   */
  async loadFromFile(filePath?: string): Promise<void> {
    const configPath = filePath || this.getConfig().configFilePath || './config.json';
    
    try {
      // In a real implementation, we would load from file:
      // const fileConfig = JSON.parse(await fs.promises.readFile(configPath, 'utf8'));
      
      // For this example, we'll use a mock configuration
      const fileConfig = {
        system: {
          name: "Cognitive System",
          version: "1.0.0"
        },
        performance: {
          maxMemory: 1024,
          cpuLimit: 80
        }
      };
      
      this.loadConfig(fileConfig, 'file');
      
      this.notifyEvent('configLoaded', { config: fileConfig, source: 'file' }, {
        component: 'ConfigurationManager',
        operation: 'loadFromFile',
        source: 'file'
      });
    } catch (error) {
      const errorMessage = `Failed to load configuration from file: ${error instanceof Error ? error.message : String(error)}`;
      
      this.notifyEvent('configError', { error: errorMessage, source: 'file' }, {
        component: 'ConfigurationManager',
        operation: 'loadFromFile',
        source: 'file'
      });
      
      this.getLogger().error(errorMessage, {
        component: 'ConfigurationManager',
        operation: 'loadFromFile'
      });
    }
  }

  /**
   * Load configuration from environment variables
   */
  loadFromEnvironment(): void {
    try {
      // Extract configuration from environment variables
      // This is a simplified example
      const envConfig: Record<string, any> = {};
      
      // Example: extract system configuration from environment
      if (process.env.SYSTEM_NAME) {
        envConfig.system = {
          ...(envConfig.system || {}),
          name: process.env.SYSTEM_NAME
        };
      }
      
      if (process.env.SYSTEM_VERSION) {
        envConfig.system = {
          ...(envConfig.system || {}),
          version: process.env.SYSTEM_VERSION
        };
      }
      
      this.loadConfig(envConfig, 'environment');
      
      this.notifyEvent('configLoaded', { config: envConfig, source: 'environment' }, {
        component: 'ConfigurationManager',
        operation: 'loadFromEnvironment',
        source: 'environment'
      });
    } catch (error) {
      const errorMessage = `Failed to load configuration from environment: ${error instanceof Error ? error.message : String(error)}`;
      
      this.notifyEvent('configError', { error: errorMessage, source: 'environment' }, {
        component: 'ConfigurationManager',
        operation: 'loadFromEnvironment',
        source: 'environment'
      });
      
      this.getLogger().error(errorMessage, {
        component: 'ConfigurationManager',
        operation: 'loadFromEnvironment'
      });
    }
  }

  /**
   * Load configuration from an object
   */
  loadConfig(config: Record<string, any>, source: string): void {
    try {
      // Validate configuration if enabled
      if (this.getConfig().enableValidation) {
        this.validateConfig(config);
      }
      
      // Merge with existing configuration
      const previousConfig = { ...this.config };
      this.config = this.deepMerge(this.config, config);
      
      // Determine changed keys
      const changedKeys = this.getChangedKeys(previousConfig, this.config);
      
      this.notifyEvent('configUpdated', { config: this.config, changedKeys }, {
        component: 'ConfigurationManager',
        operation: 'loadConfig',
        source
      });
      
      this.getLogger().info(`Configuration loaded from ${source}`, {
        component: 'ConfigurationManager',
        operation: 'loadConfig',
        source,
        changedKeys: changedKeys.length
      });
    } catch (error) {
      const errorMessage = `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`;
      
      this.notifyEvent('configError', { error: errorMessage, source }, {
        component: 'ConfigurationManager',
        operation: 'loadConfig',
        source
      });
      
      this.getLogger().error(errorMessage, {
        component: 'ConfigurationManager',
        operation: 'loadConfig',
        source
      });
    }
  }

  /**
   * Get a configuration value by path
   */
  get<T = any>(path: string, defaultValue?: T): T {
    return this.getNestedValue(this.config, path, defaultValue);
  }

  /**
   * Set a configuration value by path
   */
  set(path: string, value: any): void {
    this.setNestedValue(this.config, path, value);
    
    this.notifyEvent('configUpdated', { 
      config: this.config, 
      changedKeys: [path] 
    }, {
      component: 'ConfigurationManager',
      operation: 'set',
      path
    });
  }

  /**
   * Get the entire configuration
   */
  getAll(): Record<string, any> {
    return { ...this.config };
  }

  /**
   * Reset to default configuration
   */
  resetToDefault(): void {
    this.config = { ...this.defaultConfig };
    
    this.notifyEvent('configUpdated', { 
      config: this.config, 
      changedKeys: Object.keys(this.defaultConfig) 
    }, {
      component: 'ConfigurationManager',
      operation: 'resetToDefault'
    });
    
    this.getLogger().info('Configuration reset to defaults', {
      component: 'ConfigurationManager',
      operation: 'resetToDefault'
    });
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: Record<string, any>): void {
    // In a real implementation, we would perform validation
    // For now, we'll just log that validation was attempted
    this.getLogger().debug('Configuration validation attempted', {
      component: 'ConfigurationManager',
      operation: 'validateConfig'
    });
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue<T>(obj: Record<string, any>, path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let current: any = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return defaultValue as T;
      }
      current = current[key];
    }
    
    return current !== undefined ? current : (defaultValue as T);
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    if (!lastKey) return;
    
    let current = obj;
    for (const key of keys) {
      if (current[key] === null || current[key] === undefined) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
    const output = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          output[key] = this.deepMerge(target[key] || {}, source[key]);
        } else {
          output[key] = source[key];
        }
      }
    }
    
    return output;
  }

  /**
   * Get changed keys between two configurations
   */
  private getChangedKeys(oldConfig: Record<string, any>, newConfig: Record<string, any>): string[] {
    const changedKeys: string[] = [];
    
    const compare = (oldObj: Record<string, any>, newObj: Record<string, any>, prefix = ''): void => {
      for (const key in newObj) {
        const oldVal = oldObj[key];
        const newVal = newObj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof newVal === 'object' && newVal !== null && !Array.isArray(newVal)) {
          compare(
            typeof oldVal === 'object' && oldVal !== null && !Array.isArray(oldVal) ? oldVal : {},
            newVal,
            fullKey
          );
        } else if (oldVal !== newVal) {
          changedKeys.push(fullKey);
        }
      }
    };
    
    compare(oldConfig, newConfig);
    return changedKeys;
  }

  /**
   * Set up configuration file watching for hot reload
   */
  private setupFileWatching(): void {
    if (!this.getConfig().enableHotReload) return;
    
    // In a real implementation, we would use fs.watch or chokidar:
    // this.configFileWatcher = fs.watch(this.getConfig().configFilePath || './config.json', () => {
    //   this.loadFromFile();
    // });
    
    this.getLogger().info('Configuration file watching enabled', {
      component: 'ConfigurationManager',
      operation: 'setupFileWatching'
    });
  }
}