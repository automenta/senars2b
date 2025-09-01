import { UnifiedBaseComponent, BaseConfig } from '@/core/UnifiedBaseComponent';
import { Logger } from '@/utils/standardLogger';

/**
 * Configuration for the performance monitor
 */
interface PerformanceMonitorConfig extends BaseConfig {
  enableMemoryMonitoring?: boolean;
  enableCpuMonitoring?: boolean;
  enableEventLoopMonitoring?: boolean;
  monitoringInterval?: number;
  memoryThreshold?: number;
  cpuThreshold?: number;
}

/**
 * Events emitted by the performance monitor
 */
interface PerformanceMonitorEvents {
  memoryUsageHigh: { usedMemory: number; threshold: number; timestamp: number };
  cpuUsageHigh: { cpuUsage: number; threshold: number; timestamp: number };
  eventLoopDelayHigh: { delay: number; threshold: number; timestamp: number };
  performanceReport: { report: PerformanceReport; timestamp: number };
}

/**
 * Performance report structure
 */
interface PerformanceReport {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu?: {
    usage: number;
  };
  eventLoop?: {
    delay: number;
  };
  timestamp: number;
}

/**
 * Utility class for monitoring system performance
 */
export class PerformanceMonitor extends UnifiedBaseComponent<PerformanceMonitorConfig, PerformanceMonitorEvents> {
  private monitoringIntervalId: NodeJS.Timeout | null = null;
  private eventLoopStartedAt: number = 0;

  constructor(userConfig: Partial<PerformanceMonitorConfig> = {}) {
    const defaultConfig: PerformanceMonitorConfig = {
      enableMemoryMonitoring: true,
      enableCpuMonitoring: false, // Requires additional dependencies
      enableEventLoopMonitoring: true,
      monitoringInterval: 5000, // 5 seconds
      memoryThreshold: 80, // 80% memory usage
      cpuThreshold: 80 // 80% CPU usage
    };
    
    super('PerformanceMonitor', defaultConfig, userConfig);
    
    // Set up event loop monitoring
    if (this.getConfig().enableEventLoopMonitoring) {
      this.setupEventLoopMonitoring();
    }
  }

  /**
   * Start monitoring performance
   */
  start(): void {
    if (this.monitoringIntervalId) {
      this.getLogger().warn('Performance monitoring is already started', {
        component: 'PerformanceMonitor',
        operation: 'start'
      });
      return;
    }

    const interval = this.getConfig().monitoringInterval || 5000;
    this.monitoringIntervalId = setInterval(() => {
      this.collectPerformanceData();
    }, interval);

    this.getLogger().info('Performance monitoring started', {
      component: 'PerformanceMonitor',
      operation: 'start',
      interval
    });
  }

  /**
   * Stop monitoring performance
   */
  stop(): void {
    if (this.monitoringIntervalId) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
      this.getLogger().info('Performance monitoring stopped', {
        component: 'PerformanceMonitor',
        operation: 'stop'
      });
    }
  }

  /**
   * Collect performance data
   */
  private collectPerformanceData(): void {
    const report: PerformanceReport = {
      memory: this.getMemoryUsage(),
      timestamp: Date.now()
    };

    // CPU monitoring (simplified)
    if (this.getConfig().enableCpuMonitoring) {
      report.cpu = this.getCpuUsage();
    }

    // Event loop monitoring
    if (this.getConfig().enableEventLoopMonitoring) {
      report.eventLoop = this.getEventLoopDelay();
    }

    // Emit performance report
    this.notifyEvent('performanceReport', { report, timestamp: report.timestamp }, {
      component: 'PerformanceMonitor',
      operation: 'collectPerformanceData'
    });

    // Check for thresholds
    this.checkThresholds(report);
  }

  /**
   * Get memory usage information
   */
  private getMemoryUsage(): PerformanceReport['memory'] {
    const used = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    const total = process.memoryUsage().heapTotal / 1024 / 1024; // MB
    const percentage = (used / total) * 100;

    return { used, total, percentage };
  }

  /**
   * Get CPU usage information (simplified)
   */
  private getCpuUsage(): PerformanceReport['cpu'] {
    // In a real implementation, we would use a library like 'os-utils' or 'pidusage'
    // For now, we'll return a placeholder
    return { usage: 0 };
  }

  /**
   * Get event loop delay
   */
  private getEventLoopDelay(): PerformanceReport['eventLoop'] {
    const delay = Date.now() - this.eventLoopStartedAt;
    return { delay };
  }

  /**
   * Set up event loop monitoring
   */
  private setupEventLoopMonitoring(): void {
    const measure = () => {
      this.eventLoopStartedAt = Date.now();
      setImmediate(measure);
    };
    measure();
  }

  /**
   * Check if any performance thresholds have been exceeded
   */
  private checkThresholds(report: PerformanceReport): void {
    // Check memory threshold
    if (this.getConfig().enableMemoryMonitoring && 
        report.memory.percentage > (this.getConfig().memoryThreshold || 80)) {
      this.notifyEvent('memoryUsageHigh', { 
        usedMemory: report.memory.percentage, 
        threshold: this.getConfig().memoryThreshold || 80, 
        timestamp: report.timestamp 
      }, {
        component: 'PerformanceMonitor',
        operation: 'checkThresholds'
      });
      
      this.getLogger().warn(`High memory usage detected: ${report.memory.percentage.toFixed(2)}%`, {
        component: 'PerformanceMonitor',
        operation: 'checkThresholds',
        usedMemory: report.memory.percentage,
        threshold: this.getConfig().memoryThreshold
      });
    }

    // Check CPU threshold
    if (this.getConfig().enableCpuMonitoring && 
        report.cpu && 
        report.cpu.usage > (this.getConfig().cpuThreshold || 80)) {
      this.notifyEvent('cpuUsageHigh', { 
        cpuUsage: report.cpu.usage, 
        threshold: this.getConfig().cpuThreshold || 80, 
        timestamp: report.timestamp 
      }, {
        component: 'PerformanceMonitor',
        operation: 'checkThresholds'
      });
      
      this.getLogger().warn(`High CPU usage detected: ${report.cpu.usage.toFixed(2)}%`, {
        component: 'PerformanceMonitor',
        operation: 'checkThresholds',
        cpuUsage: report.cpu.usage,
        threshold: this.getConfig().cpuThreshold
      });
    }

    // Check event loop delay threshold
    if (this.getConfig().enableEventLoopMonitoring && 
        report.eventLoop && 
        report.eventLoop.delay > 100) { // 100ms threshold
      this.notifyEvent('eventLoopDelayHigh', { 
        delay: report.eventLoop.delay, 
        threshold: 100, 
        timestamp: report.timestamp 
      }, {
        component: 'PerformanceMonitor',
        operation: 'checkThresholds'
      });
      
      this.getLogger().warn(`High event loop delay detected: ${report.eventLoop.delay}ms`, {
        component: 'PerformanceMonitor',
        operation: 'checkThresholds',
        delay: report.eventLoop.delay,
        threshold: 100
      });
    }
  }

  /**
   * Get a performance report on demand
   */
  getPerformanceReport(): PerformanceReport {
    return {
      memory: this.getMemoryUsage(),
      cpu: this.getConfig().enableCpuMonitoring ? this.getCpuUsage() : undefined,
      eventLoop: this.getConfig().enableEventLoopMonitoring ? this.getEventLoopDelay() : undefined,
      timestamp: Date.now()
    };
  }
}