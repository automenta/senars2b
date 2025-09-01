/**
 * Common configuration utilities and interfaces
 */

export interface ConfigurableComponent<T> {
  getConfig(): T;
  updateConfig(updates: Partial<T>): void;
}

export interface BaseConfig {
  workerCount?: number;
  decayCycleInterval?: number;
  [key: string]: any;
}

export class ConfigManager<T extends BaseConfig> {
  private config: T;

  constructor(defaultConfig: T, userConfig: Partial<T> = {}) {
    this.config = { ...defaultConfig, ...userConfig } as T;
  }

  getConfig(): T {
    return { ...this.config };
  }

  updateConfig(updates: Partial<T>): void {
    this.config = { ...this.config, ...updates };
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.config[key];
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.config[key] = value;
  }
}

/**
 * Utility function to merge configurations with defaults
 */
export function mergeConfigWithDefaults<T extends Record<string, any>>(
  defaults: T,
  config: Partial<T> = {}
): T {
  return { ...defaults, ...config } as T;
}