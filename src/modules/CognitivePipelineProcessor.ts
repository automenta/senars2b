import { UnifiedBaseComponent, BaseConfig } from '@/core/UnifiedBaseComponent';
import { CognitiveItem } from '@/interfaces/types';
import { Logger } from '@/utils/standardLogger';

/**
 * Configuration for the cognitive pipeline processor
 */
interface CognitivePipelineConfig extends BaseConfig {
  maxConcurrentPipelines?: number;
  enablePipelineTracing?: boolean;
  pipelineTimeoutMs?: number;
  enableResultCaching?: boolean;
  cacheTTL?: number;
}

/**
 * Events emitted by the cognitive pipeline processor
 */
interface CognitivePipelineEvents {
  pipelineStarted: { pipelineId: string; input: CognitiveItem; timestamp: number };
  pipelineStepCompleted: { pipelineId: string; step: string; result: any; timestamp: number };
  pipelineCompleted: { pipelineId: string; result: CognitiveItem; duration: number; timestamp: number };
  pipelineFailed: { pipelineId: string; error: Error; step: string; timestamp: number };
  pipelineCancelled: { pipelineId: string; reason: string; timestamp: number };
}

/**
 * Pipeline step definition
 */
interface PipelineStep {
  name: string;
  processor: (input: CognitiveItem) => Promise<CognitiveItem>;
  condition?: (input: CognitiveItem) => boolean;
}

/**
 * Pipeline execution context
 */
interface PipelineContext {
  id: string;
  input: CognitiveItem;
  steps: PipelineStep[];
  currentStepIndex: number;
  results: Map<string, any>;
  startTime: number;
  cancelled: boolean;
  cancelReason?: string;
}

/**
 * Advanced cognitive pipeline processor
 */
export class CognitivePipelineProcessor extends UnifiedBaseComponent<CognitivePipelineConfig, CognitivePipelineEvents> {
  private pipelines: Map<string, PipelineContext> = new Map();
  private pipelineCache: Map<string, { result: CognitiveItem; timestamp: number }> = new Map();
  private activePipelineCount: number = 0;

  constructor(userConfig: Partial<CognitivePipelineConfig> = {}) {
    const defaultConfig: CognitivePipelineConfig = {
      maxConcurrentPipelines: 10,
      enablePipelineTracing: false,
      pipelineTimeoutMs: 30000, // 30 seconds
      enableResultCaching: true,
      cacheTTL: 300000 // 5 minutes
    };
    
    super('CognitivePipelineProcessor', defaultConfig, userConfig);
  }

  /**
   * Create a new pipeline
   */
  createPipeline(input: CognitiveItem, steps: PipelineStep[]): string {
    // Check concurrent pipeline limit
    if (this.activePipelineCount >= (this.getConfig().maxConcurrentPipelines || 10)) {
      throw this.createOperationError(
        'createPipeline',
        'Maximum concurrent pipelines reached'
      );
    }

    const pipelineId = `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const context: PipelineContext = {
      id: pipelineId,
      input,
      steps,
      currentStepIndex: 0,
      results: new Map(),
      startTime: Date.now(),
      cancelled: false
    };

    this.pipelines.set(pipelineId, context);
    this.activePipelineCount++;

    // Check cache if enabled
    if (this.getConfig().enableResultCaching) {
      const cachedResult = this.getCachedResult(input);
      if (cachedResult) {
        this.getLogger().info('Pipeline result found in cache', {
          component: 'CognitivePipelineProcessor',
          operation: 'createPipeline',
          pipelineId
        });
        
        // Emit completion event
        this.notifyEvent('pipelineCompleted', {
          pipelineId,
          result: cachedResult,
          duration: 0,
          timestamp: Date.now()
        }, {
          component: 'CognitivePipelineProcessor',
          operation: 'createPipeline',
          pipelineId
        });
        
        // Clean up
        this.pipelines.delete(pipelineId);
        this.activePipelineCount--;
        
        return pipelineId;
      }
    }

    // Emit start event
    this.notifyEvent('pipelineStarted', {
      pipelineId,
      input,
      timestamp: context.startTime
    }, {
      component: 'CognitivePipelineProcessor',
      operation: 'createPipeline',
      pipelineId
    });

    // Start processing
    this.processNextStep(context);

    return pipelineId;
  }

  /**
   * Cancel a pipeline
   */
  cancelPipeline(pipelineId: string, reason: string = 'Cancelled by user'): boolean {
    const context = this.pipelines.get(pipelineId);
    if (!context) {
      return false;
    }

    context.cancelled = true;
    context.cancelReason = reason;

    this.notifyEvent('pipelineCancelled', {
      pipelineId,
      reason,
      timestamp: Date.now()
    }, {
      component: 'CognitivePipelineProcessor',
      operation: 'cancelPipeline',
      pipelineId
    });

    // Clean up
    this.pipelines.delete(pipelineId);
    this.activePipelineCount--;

    return true;
  }

  /**
   * Get pipeline status
   */
  getPipelineStatus(pipelineId: string): {
    exists: boolean;
    active: boolean;
    currentStep?: string;
    progress?: number;
    duration?: number;
  } {
    const context = this.pipelines.get(pipelineId);
    if (!context) {
      return { exists: false, active: false };
    }

    return {
      exists: true,
      active: !context.cancelled,
      currentStep: context.steps[context.currentStepIndex]?.name,
      progress: context.steps.length > 0 ? context.currentStepIndex / context.steps.length : 0,
      duration: Date.now() - context.startTime
    };
  }

  /**
   * Get active pipeline count
   */
  getActivePipelineCount(): number {
    return this.activePipelineCount;
  }

  /**
   * Process the next step in a pipeline
   */
  private async processNextStep(context: PipelineContext): Promise<void> {
    // Check if pipeline was cancelled
    if (context.cancelled) {
      return;
    }

    // Check for timeout
    const elapsed = Date.now() - context.startTime;
    if (elapsed > (this.getConfig().pipelineTimeoutMs || 30000)) {
      this.handlePipelineError(context, new Error('Pipeline timeout exceeded'), 'timeout');
      return;
    }

    // Check if we've completed all steps
    if (context.currentStepIndex >= context.steps.length) {
      this.completePipeline(context);
      return;
    }

    const step = context.steps[context.currentStepIndex];

    // Check step condition if present
    if (step.condition && !step.condition(context.input)) {
      this.getLogger().debug('Skipping pipeline step due to condition', {
        component: 'CognitivePipelineProcessor',
        operation: 'processNextStep',
        pipelineId: context.id,
        step: step.name
      });
      
      // Move to next step
      context.currentStepIndex++;
      setImmediate(() => this.processNextStep(context));
      return;
    }

    try {
      if (this.getConfig().enablePipelineTracing) {
        this.getLogger().debug('Starting pipeline step', {
          component: 'CognitivePipelineProcessor',
          operation: 'processNextStep',
          pipelineId: context.id,
          step: step.name
        });
      }

      const stepStartTime = Date.now();
      const result = await step.processor(context.input);
      const stepDuration = Date.now() - stepStartTime;

      // Store result
      context.results.set(step.name, result);

      // Emit step completion event
      this.notifyEvent('pipelineStepCompleted', {
        pipelineId: context.id,
        step: step.name,
        result,
        timestamp: Date.now()
      }, {
        component: 'CognitivePipelineProcessor',
        operation: 'processNextStep',
        pipelineId: context.id,
        step: step.name,
        duration: stepDuration
      });

      if (this.getConfig().enablePipelineTracing) {
        this.getLogger().debug('Pipeline step completed', {
          component: 'CognitivePipelineProcessor',
          operation: 'processNextStep',
          pipelineId: context.id,
          step: step.name,
          duration: stepDuration
        });
      }

      // Update input for next step
      context.input = result;

      // Move to next step
      context.currentStepIndex++;
      setImmediate(() => this.processNextStep(context));
    } catch (error) {
      this.handlePipelineError(context, error as Error, step.name);
    }
  }

  /**
   * Complete a pipeline successfully
   */
  private completePipeline(context: PipelineContext): void {
    const duration = Date.now() - context.startTime;
    
    this.getLogger().info('Pipeline completed successfully', {
      component: 'CognitivePipelineProcessor',
      operation: 'completePipeline',
      pipelineId: context.id,
      duration
    });

    // Emit completion event
    this.notifyEvent('pipelineCompleted', {
      pipelineId: context.id,
      result: context.input,
      duration,
      timestamp: Date.now()
    }, {
      component: 'CognitivePipelineProcessor',
      operation: 'completePipeline',
      pipelineId: context.id,
      duration
    });

    // Cache result if enabled
    if (this.getConfig().enableResultCaching) {
      this.cacheResult(context.input);
    }

    // Clean up
    this.pipelines.delete(context.id);
    this.activePipelineCount--;
  }

  /**
   * Handle pipeline error
   */
  private handlePipelineError(context: PipelineContext, error: Error, step: string): void {
    this.getLogger().error('Pipeline failed', {
      component: 'CognitivePipelineProcessor',
      operation: 'handlePipelineError',
      pipelineId: context.id,
      step,
      error: error.message
    });

    // Emit failure event
    this.notifyEvent('pipelineFailed', {
      pipelineId: context.id,
      error,
      step,
      timestamp: Date.now()
    }, {
      component: 'CognitivePipelineProcessor',
      operation: 'handlePipelineError',
      pipelineId: context.id,
      step
    });

    // Clean up
    this.pipelines.delete(context.id);
    this.activePipelineCount--;
  }

  /**
   * Get cached result for an input
   */
  private getCachedResult(input: CognitiveItem): CognitiveItem | null {
    if (!this.getConfig().enableResultCaching) {
      return null;
    }

    // Create a cache key from the input (simplified)
    const cacheKey = this.createCacheKey(input);
    const cached = this.pipelineCache.get(cacheKey);
    
    if (cached) {
      const now = Date.now();
      const ttl = this.getConfig().cacheTTL || 300000; // 5 minutes default
      
      if (now - cached.timestamp < ttl) {
        return cached.result;
      } else {
        // Expired, remove from cache
        this.pipelineCache.delete(cacheKey);
      }
    }
    
    return null;
  }

  /**
   * Cache a result
   */
  private cacheResult(result: CognitiveItem): void {
    if (!this.getConfig().enableResultCaching) {
      return;
    }

    // Create a cache key (simplified)
    const cacheKey = this.createCacheKey(result);
    this.pipelineCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (this.pipelineCache.size > 1000) {
      this.cleanupCache();
    }
  }

  /**
   * Create a cache key from a cognitive item
   */
  private createCacheKey(item: CognitiveItem): string {
    // Simplified cache key creation
    // In a real implementation, you might want to use a more sophisticated approach
    return `${item.type}-${item.id}-${JSON.stringify(item.stamp)}`;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const ttl = this.getConfig().cacheTTL || 300000; // 5 minutes default
    
    for (const [key, entry] of this.pipelineCache.entries()) {
      if (now - entry.timestamp >= ttl) {
        this.pipelineCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): { size: number; hitRate: number; missRate: number } {
    // In a real implementation, you would track hits and misses
    return {
      size: this.pipelineCache.size,
      hitRate: 0,
      missRate: 0
    };
  }
}