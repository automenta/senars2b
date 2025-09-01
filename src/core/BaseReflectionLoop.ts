import { Agenda } from './agenda';
import { BaseWorldModel } from './BaseWorldModel';
import { EventEmitter } from '@/utils/EventEmitter';
import { StatisticsTracker } from '@/utils/StatisticsTracker';
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
export abstract class BaseReflectionLoop extends EventEmitter<ReflectionLoopEvents> {
  protected agenda: Agenda;
  protected worldModel: BaseWorldModel;
  protected readonly interval: number;
  protected lastRun: number = 0;
  protected statisticsTracker: StatisticsTracker = new StatisticsTracker();
  
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
    super();
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
    this.emit('cycleStarted', { timestamp });
    Logger.info('Reflection cycle started', {
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
    this.emit('cycleCompleted', { timestamp, duration });
    Logger.info('Reflection cycle completed', {
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
    this.emit('cycleError', { timestamp, error });
    Logger.error('Reflection loop error', {
      component: 'ReflectionLoop',
      operation: 'runCycle',
      timestamp
    }, error);
    
    this.performanceMetrics.errorsEncountered++;
    this.performanceMetrics.lastError = error.message;
  }

  /**
   * Notify listeners that a KPI was updated
   */
  protected notifyKpiUpdated(kpiName: string, value: number): void {
    this.emit('kpiUpdated', { kpiName, value });
    Logger.debug('KPI updated', {
      component: 'ReflectionLoop',
      operation: 'updateKPIs',
      kpiName,
      value
    });
  }

  /**
   * Get statistics tracker
   */
  getStatisticsTracker(): StatisticsTracker {
    return this.statisticsTracker;
  }
}