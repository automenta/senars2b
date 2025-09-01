import { EnhancedUnifiedBaseComponent, BaseConfig } from '@/core/EnhancedUnifiedBaseComponent';

interface ReflectionLoopConfig extends BaseConfig {
  cycleInterval?: number;
  enableKpiTracking?: boolean;
  kpiHistorySize?: number;
  schemaUsageTracking?: boolean;
  unusedSchemaThresholdMs?: number;
  memorySizeThreshold?: number;
  agendaSizeThreshold?: number;
}

interface ReflectionLoopEvents {
  cycleStarted: { timestamp: number };
  cycleCompleted: { timestamp: number; duration: number };
  cycleError: { timestamp: number; error: Error };
  kpiUpdated: { kpiName: string; value: number };
  schemaUsageRecorded?: { schemaId: string; timestamp: number };
}

/**
 * Unified reflection loop with enhanced functionality
 */
export class UnifiedReflectionLoop 
  extends EnhancedUnifiedBaseComponent<ReflectionLoopConfig, ReflectionLoopEvents> {
  
  private schemaUsage: Map<string, number> = new Map(); // schema_id -> last_used_timestamp
  private kpiHistory: { timestamp: number; kpi: string; value: number }[] = [];
  private lastRun: number = 0;
  
  protected performanceMetrics: {
    cyclesRun: number;
    errorsEncountered: number;
    lastError: string | null;
    averageCycleTime: number;
  } = {
    cyclesRun: 0,
    errorsEncountered: 0,
    lastError: null,
    averageCycleTime: 0
  };
  
  protected cycleTimes: number[] = [];

  constructor(userConfig: Partial<ReflectionLoopConfig> = {}) {
    const defaultConfig: ReflectionLoopConfig = {
      cycleInterval: 60000, // 1 minute
      enableKpiTracking: true,
      kpiHistorySize: 100,
      schemaUsageTracking: true,
      unusedSchemaThresholdMs: 3600000, // 1 hour
      memorySizeThreshold: 1000000, // 1M items
      agendaSizeThreshold: 10000 // 10K items
    };
    
    super('ReflectionLoop', defaultConfig, userConfig);
  }

  start(): NodeJS.Timeout {
    // Add initial KPIs to track system health
    this.recordKPI('agenda_size', 0);
    this.recordKPI('contradiction_rate', 0);
    this.recordKPI('schema_usage_count', 0);

    const interval = this.getConfig().cycleInterval || 60000;
    return setInterval(() => {
      this.runCycle();
    }, interval);
  }

  runCycle(): void {
    const cycleStart = Date.now();
    this.notifyCycleStarted();
    
    try {
      const now = Date.now();
      this.lastRun = now;

      // Update KPIs
      this.updateKPIs();

      // Trigger schema learning periodically
      this.triggerSchemaLearning();

      // Check KPIs for anomalies
      // Note: In a real implementation, we would have access to the world model and agenda
      // For now, we'll use placeholder logic

      // Check for high contradiction rate
      const contradictionRate = Math.random() * 0.1; // Placeholder
      if (contradictionRate > 0.05) {
        // High contradiction rate - trigger audit
        this.getLogger().info("High contradiction rate detected, triggering audit", {
          operation: 'runCycle'
        });
      }

      // Check for unused schemas
      const unusedSchemas = this.findUnusedSchemas(now);
      if (unusedSchemas.length > 0) {
        this.getLogger().info(`Found ${unusedSchemas.length} unused schemas`, {
          operation: 'runCycle'
        });
      }

      // Check memory size
      const memorySize = this.estimateMemorySize();
      if (memorySize > (this.getConfig().memorySizeThreshold || 1000000)) {
        this.getLogger().info("Memory size threshold exceeded", {
          operation: 'runCycle',
          memorySize
        });
      }

      // Check for performance degradation
      if (this.detectPerformanceDegradation()) {
        this.getLogger().info("Performance degradation detected", {
          operation: 'runCycle'
        });
      }

      // Update performance metrics
      const cycleTime = Date.now() - cycleStart;
      this.notifyCycleCompleted(cycleTime);
    } catch (error) {
      this.notifyCycleError(error as Error);
      throw error;
    }
  }

  recordSchemaUsage(schemaId: string): void {
    // Record that a schema was used
    this.schemaUsage.set(schemaId, Date.now());
    // Call the base class implementation
    super.recordSchemaUsage(schemaId);
  }

  private updateKPIs(): void {
    // Update system KPIs
    this.recordKPI('agenda_size', 0); // Placeholder
    this.recordKPI('schema_usage_count', this.schemaUsage.size);

    // In a real implementation, we would calculate actual contradiction rates
    // For now, we'll use a placeholder
    this.recordKPI('contradiction_rate', Math.random() * 0.1);
  }

  private recordKPI(name: string, value: number): void {
    // Store in history for trend analysis
    this.kpiHistory.push({
      timestamp: Date.now(),
      kpi: name,
      value: value
    });

    // Keep only recent history (last N entries)
    const maxSize = this.getConfig().kpiHistorySize || 100;
    if (this.kpiHistory.length > maxSize) {
      this.kpiHistory = this.kpiHistory.slice(-maxSize);
    }
    
    // Notify listeners
    this.notifyKpiUpdated(name, value);
  }

  private estimateMemorySize(): number {
    // In a real implementation, we would have access to the actual size
    // This is a simplified estimation based on the number of items
    // For now, we'll use a more realistic placeholder
    return this.schemaUsage.size * 1000; // Rough estimate
  }

  private findUnusedSchemas(now: number): string[] {
    // Find schemas that haven't been used in the threshold time
    const threshold = this.getConfig().unusedSchemaThresholdMs || 3600000; // 1 hour default
    const thresholdTime = now - threshold;
    const unused: string[] = [];

    for (const [schemaId, lastUsed] of this.schemaUsage.entries()) {
      if (lastUsed < thresholdTime) {
        unused.push(schemaId);
      }
    }

    return unused;
  }

  private detectPerformanceDegradation(): boolean {
    // Simple performance degradation detection
    // In a real implementation, this would be more sophisticated
    if (this.kpiHistory.length < 10) return false;

    // Check if agenda size is consistently growing
    const recentHistory = this.kpiHistory.slice(-10);
    const agendaSizes = recentHistory
      .filter(entry => entry.kpi === 'agenda_size')
      .map(entry => entry.value);

    if (agendaSizes.length < 5) return false;

    // Calculate trend
    const trend = this.calculateTrend(agendaSizes);
    return trend > 0.1; // Growing trend
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    // Simple linear regression slope
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  /**
   * Trigger schema learning process
   * This method would be called by the cognitive core to enable schema learning
   */
  private triggerSchemaLearning(): void {
    // In a full implementation, this would call the schema learning module
    // For now, we'll just log that schema learning was triggered
    this.getLogger().info("Schema learning cycle triggered", {
      operation: 'triggerSchemaLearning'
    });
  }

  /**
   * Notify listeners that a cycle has started
   */
  private notifyCycleStarted(): void {
    const timestamp = Date.now();
    this.notifyEvent('cycleStarted', { timestamp }, {
      operation: 'runCycle',
      timestamp
    });
  }

  /**
   * Notify listeners that a cycle has completed
   */
  private notifyCycleCompleted(duration: number): void {
    const timestamp = Date.now();
    this.notifyEvent('cycleCompleted', { timestamp, duration }, {
      operation: 'runCycle',
      timestamp,
      duration
    });
    
    // Update performance metrics
    this.cycleTimes.push(duration);
    // Keep only the last N cycle times (configurable)
    const maxSize = this.getConfig().kpiHistorySize || 100;
    if (this.cycleTimes.length > maxSize) {
      this.cycleTimes = this.cycleTimes.slice(-maxSize);
    }
    
    this.performanceMetrics.cyclesRun++;
    this.performanceMetrics.averageCycleTime = this.cycleTimes.reduce((a, b) => a + b, 0) / this.cycleTimes.length;
  }

  /**
   * Notify listeners that a cycle encountered an error
   */
  private notifyCycleError(error: Error): void {
    const timestamp = Date.now();
    this.notifyEvent('cycleError', { timestamp, error }, {
      operation: 'runCycle',
      timestamp
    });
    
    this.performanceMetrics.errorsEncountered++;
    this.performanceMetrics.lastError = error.message;
  }

  /**
   * Notify listeners that a KPI was updated
   */
  private notifyKpiUpdated(kpiName: string, value: number): void {
    if (this.getConfig().enableKpiTracking) {
      this.notifyEvent('kpiUpdated', { kpiName, value }, {
        operation: 'updateKPIs',
        kpiName,
        value
      });
    }
  }

  /**
   * Get performance metrics for the reflection loop
   */
  getPerformanceMetrics(): any {
    return { ...this.performanceMetrics };
  }
}