import { Agenda } from './agenda';
import { BaseWorldModel } from './BaseWorldModel';
import { BaseComponent } from './BaseComponent';
import { Logger } from '@/utils/standardLogger';

/**
 * Events emitted by the reflection loop
 */
interface ReflectionLoopEvents {
  cycleStarted: { timestamp: number };
  cycleCompleted: { timestamp: number; duration: number };
  cycleError: { timestamp: number; error: Error };
  kpiUpdated: { kpiName: string; value: number };
}

/**
 * Abstract base class for reflection loop implementations
 * Provides common functionality for monitoring and optimizing cognitive processes
 */
export abstract class BaseReflectionLoop extends BaseComponent<ReflectionLoopEvents> {
  protected agenda: Agenda;
  protected worldModel: BaseWorldModel;
  protected readonly interval: number;
  protected lastRun: number = 0;
  
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

  constructor(worldModel: BaseWorldModel, agenda: Agenda, interval: number = 60000) {
    super('ReflectionLoop');
    this.worldModel = worldModel;
    this.agenda = agenda;
    this.interval = interval;
  }

  /**
   * Start the reflection loop
   */
  abstract start(): NodeJS.Timeout;

  /**
   * Run a single reflection cycle
   */
  abstract runCycle(): void;

  /**
   * Record schema usage for monitoring
   */
  recordSchemaUsage(schemaId: string): void {
    this.statisticsTracker.update(`schema_usage_${schemaId}`, Date.now());
    Logger.debug('Schema usage recorded', {
      component: 'ReflectionLoop',
      operation: 'recordSchemaUsage',
      schemaId
    });
  }

  /**
   * Get performance metrics for the reflection loop
   */
  getPerformanceMetrics(): any {
    return { ...this.performanceMetrics };
  }

  /**
   * Notify listeners that a cycle has started
   */
  protected notifyCycleStarted(): void {
    const timestamp = Date.now();
    this.notifyEvent('cycleStarted', { timestamp }, {
      component: 'ReflectionLoop',
      operation: 'runCycle',
      timestamp
    });
  }

  /**
   * Notify listeners that a cycle has completed
   */
  protected notifyCycleCompleted(duration: number): void {
    const timestamp = Date.now();
    this.notifyEvent('cycleCompleted', { timestamp, duration }, {
      component: 'ReflectionLoop',
      operation: 'runCycle',
      timestamp,
      duration
    });
    
    // Update performance metrics
    this.cycleTimes.push(duration);
    // Keep only the last 100 cycle times
    if (this.cycleTimes.length > 100) {
      this.cycleTimes = this.cycleTimes.slice(-100);
    }
    
    this.performanceMetrics.cyclesRun++;
    this.performanceMetrics.averageCycleTime = this.cycleTimes.reduce((a, b) => a + b, 0) / this.cycleTimes.length;
  }

  /**
   * Notify listeners that a cycle encountered an error
   */
  protected notifyCycleError(error: Error): void {
    const timestamp = Date.now();
    this.notifyEvent('cycleError', { timestamp, error }, {
      component: 'ReflectionLoop',
      operation: 'runCycle',
      timestamp
    });
    
    this.performanceMetrics.errorsEncountered++;
    this.performanceMetrics.lastError = error.message;
  }

  /**
   * Notify listeners that a KPI was updated
   */
  protected notifyKpiUpdated(kpiName: string, value: number): void {
    this.notifyEvent('kpiUpdated', { kpiName, value }, {
      component: 'ReflectionLoop',
      operation: 'updateKPIs',
      kpiName,
      value
    });
  }
}