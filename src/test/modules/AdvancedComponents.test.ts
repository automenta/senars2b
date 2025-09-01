import { CognitivePipelineProcessor } from '@/modules/CognitivePipelineProcessor';
import { DistributedCognitiveNode } from '@/modules/DistributedCognitiveNode';
import { CognitiveLearningEngine } from '@/modules/CognitiveLearningEngine';
import { TestUtilities } from '../test/utils/TestUtilities';

describe('Advanced Components', () => {
  describe('CognitivePipelineProcessor', () => {
    let pipelineProcessor: CognitivePipelineProcessor;

    beforeEach(() => {
      pipelineProcessor = new CognitivePipelineProcessor({
        maxConcurrentPipelines: 5,
        enablePipelineTracing: true
      });
    });

    afterEach(() => {
      pipelineProcessor = null!;
    });

    it('should create and execute pipelines', (done) => {
      const input = TestUtilities.createMockCognitiveItem('BELIEF');
      
      const steps = [
        {
          name: 'step1',
          processor: async (item: any) => {
            return { ...item, processedBy: 'step1' };
          }
        },
        {
          name: 'step2',
          processor: async (item: any) => {
            return { ...item, processedBy: 'step2' };
          }
        }
      ];

      pipelineProcessor.on('pipelineCompleted', (event) => {
        expect(event.result.processedBy).toBe('step2');
        expect(event.duration).toBeGreaterThan(0);
        done();
      });

      const pipelineId = pipelineProcessor.createPipeline(input, steps);
      expect(pipelineId).toMatch(/^pipeline-/);
    });

    it('should handle pipeline cancellation', () => {
      const input = TestUtilities.createMockCognitiveItem('BELIEF');
      
      const steps = [
        {
          name: 'slowStep',
          processor: async (item: any) => {
            // Simulate slow processing
            await new Promise(resolve => setTimeout(resolve, 100));
            return { ...item, processedBy: 'slowStep' };
          }
        }
      ];

      const pipelineId = pipelineProcessor.createPipeline(input, steps);
      
      // Cancel the pipeline
      const result = pipelineProcessor.cancelPipeline(pipelineId, 'Test cancellation');
      expect(result).toBe(true);
      
      // Check status
      const status = pipelineProcessor.getPipelineStatus(pipelineId);
      expect(status.exists).toBe(false);
    });

    it('should track pipeline status', () => {
      const input = TestUtilities.createMockCognitiveItem('BELIEF');
      
      const steps = [
        {
          name: 'step1',
          processor: async (item: any) => {
            return { ...item, processedBy: 'step1' };
          }
        }
      ];

      const pipelineId = pipelineProcessor.createPipeline(input, steps);
      
      // Check status
      const status = pipelineProcessor.getPipelineStatus(pipelineId);
      expect(status.exists).toBe(true);
      expect(status.active).toBe(true);
      expect(status.currentStep).toBe('step1');
    });

    it('should limit concurrent pipelines', () => {
      const input = TestUtilities.createMockCognitiveItem('BELIEF');
      
      const steps = [
        {
          name: 'step1',
          processor: async (item: any) => {
            return { ...item, processedBy: 'step1' };
          }
        }
      ];

      // Create maximum allowed pipelines
      const maxPipelines = 5;
      const pipelineIds: string[] = [];
      
      for (let i = 0; i < maxPipelines; i++) {
        const id = pipelineProcessor.createPipeline(input, steps);
        pipelineIds.push(id);
      }
      
      // Try to create one more - should throw an error
      expect(() => {
        pipelineProcessor.createPipeline(input, steps);
      }).toThrow('Maximum concurrent pipelines reached');
      
      // Check active count
      expect(pipelineProcessor.getActivePipelineCount()).toBe(maxPipelines);
    });
  });

  describe('DistributedCognitiveNode', () => {
    let node: DistributedCognitiveNode;

    beforeEach(() => {
      node = new DistributedCognitiveNode({
        nodeId: 'test-node-1',
        clusterId: 'test-cluster',
        enableClustering: true
      });
    });

    afterEach(() => {
      node.shutdown();
      node = null!;
    });

    it('should connect to cluster', () => {
      node.connectToCluster('test-cluster', ['node-2', 'node-3']);
      
      const clusterInfo = node.getClusterInfo();
      expect(clusterInfo.clusterId).toBe('test-cluster');
      expect(clusterInfo.nodeCount).toBe(2); // Excluding self
    });

    it('should handle node heartbeats', () => {
      node.connectToCluster('test-cluster', ['node-2']);
      
      // Simulate receiving heartbeat
      node.receiveHeartbeat('node-2', 'test-cluster');
      
      const nodeInfo = node.getNodeInfo();
      expect(nodeInfo.nodeId).toBe('test-node-1');
      expect(nodeInfo.clusterId).toBe('test-cluster');
    });

    it('should manage items', () => {
      const item = TestUtilities.createMockCognitiveItem('BELIEF');
      
      // Add item
      node.addItem(item);
      
      // Retrieve item
      const retrieved = node.getItem(item.id);
      expect(retrieved).toEqual(item);
      
      // Get all items
      const allItems = node.getAllItems();
      expect(allItems).toHaveLength(1);
      expect(allItems[0]).toEqual(item);
      
      // Remove item
      const removed = node.removeItem(item.id);
      expect(removed).toBe(true);
      
      const afterRemoval = node.getItem(item.id);
      expect(afterRemoval).toBeNull();
    });

    it('should disconnect from cluster', (done) => {
      node.on('nodeDisconnected', (event) => {
        expect(event.nodeId).toBe('test-node-1');
        expect(event.clusterId).toBe('test-cluster');
        expect(event.reason).toBe('Test disconnect');
        done();
      });
      
      node.disconnectFromCluster('Test disconnect');
    });
  });

  describe('CognitiveLearningEngine', () => {
    let learningEngine: CognitiveLearningEngine;

    beforeEach(() => {
      learningEngine = new CognitiveLearningEngine({
        enableLearning: true,
        learningRate: 0.01,
        maxTrainingIterations: 100
      });
    });

    afterEach(() => {
      learningEngine = null!;
    });

    it('should create and train models', async () => {
      const modelId = learningEngine.createModel('test-model', [5, 10, 1]);
      
      const modelInfo = learningEngine.getModelInfo(modelId);
      expect(modelInfo.exists).toBe(true);
      expect(modelInfo.layers).toEqual([5, 10, 1]);
      
      // Create simple training data
      const trainingData = [
        {
          input: TestUtilities.createMockCognitiveItem('BELIEF'),
          output: 0.8
        },
        {
          input: TestUtilities.createMockCognitiveItem('TASK'),
          output: 0.6
        }
      ];
      
      // Training should complete without error
      await expect(learningEngine.trainModel(modelId, trainingData)).resolves.not.toThrow();
    });

    it('should make predictions', () => {
      const modelId = learningEngine.createModel('test-model', [5, 10, 1]);
      
      const input = TestUtilities.createMockCognitiveItem('BELIEF');
      const prediction = learningEngine.predict(modelId, input);
      
      expect(prediction.prediction).toBeDefined();
      expect(typeof prediction.confidence).toBe('number');
      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle feedback', () => {
      const feedback = {
        inputId: 'test-input-1',
        expectedOutput: 0.9,
        actualOutput: 0.7,
        reward: 0.2,
        timestamp: Date.now()
      };
      
      // Should not throw an error
      expect(() => {
        learningEngine.receiveFeedback(feedback);
      }).not.toThrow();
    });

    it('should manage models', () => {
      const modelId = learningEngine.createModel('test-model', [5, 10, 1]);
      
      // Get all models
      const models = learningEngine.getAllModels();
      expect(models).toContain(modelId);
      
      // Remove model
      const removed = learningEngine.removeModel(modelId);
      expect(removed).toBe(true);
      
      // Check that model is gone
      const afterRemoval = learningEngine.getModelInfo(modelId);
      expect(afterRemoval.exists).toBe(false);
    });

    it('should provide learning statistics', () => {
      const stats = learningEngine.getLearningStatistics();
      
      expect(stats).toHaveProperty('modelCount');
      expect(stats).toHaveProperty('feedbackCount');
      expect(stats).toHaveProperty('activeTrainingSessions');
      expect(stats).toHaveProperty('cacheSize');
      
      expect(typeof stats.modelCount).toBe('number');
      expect(typeof stats.feedbackCount).toBe('number');
      expect(typeof stats.activeTrainingSessions).toBe('number');
      expect(typeof stats.cacheSize).toBe('number');
    });
  });
});