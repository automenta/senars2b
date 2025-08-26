import { SelfDevelopmentManager } from '../../src/modules/selfDevelopmentManager';
import { DecentralizedCognitiveCore } from '../../src/core/cognitiveCore';
import { PerceptionSubsystem } from '../../src/modules/perceptionSubsystem';
import { WebSocketInterface } from '../../src/web/webSocketInterface';

// Mock the WebSocketInterface to avoid actually starting a server
jest.mock('../../src/web/webSocketInterface');

describe('SelfDevelopmentManager', () => {
  let selfDevelopmentManager: SelfDevelopmentManager;
  let core: DecentralizedCognitiveCore;
  let perception: PerceptionSubsystem;

  beforeEach(() => {
    // Create minimal instances for testing
    core = new DecentralizedCognitiveCore(1);
    perception = new PerceptionSubsystem();
    
    // Create the self-development manager
    selfDevelopmentManager = new SelfDevelopmentManager(core, perception);
  });

  afterEach(() => {
    // Stop the self-development manager if it's running
    (selfDevelopmentManager as any).stop();
  });

  describe('constructor', () => {
    it('should create a self-development manager', () => {
      expect(selfDevelopmentManager).toBeDefined();
    });
  });

  describe('start and stop', () => {
    it('should start and stop the self-development process', () => {
      // Spy on console.log to verify messages
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      selfDevelopmentManager.start();
      expect(consoleSpy).toHaveBeenCalledWith('Starting self-development manager');
      expect(consoleSpy).toHaveBeenCalledWith('Initializing self-development goals');

      selfDevelopmentManager.stop();
      expect(consoleSpy).toHaveBeenCalledWith('Self-development manager stopped');

      consoleSpy.mockRestore();
    });

    it('should not start if already running', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      selfDevelopmentManager.start();
      selfDevelopmentManager.start(); // Try to start again

      // Count how many times the start message was logged
      const startMessages = (consoleSpy.mock.calls as any[]).filter(
        call => call[0] === 'Starting self-development manager'
      );
      
      expect(startMessages.length).toBe(1); // Should only be called once

      consoleSpy.mockRestore();
    });
  });

  describe('processTestResultsFile', () => {
    it('should process a valid test results file', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const testResults = JSON.stringify([
        {
          testName: 'should handle medical diagnosis scenarios',
          suiteName: 'Medical Domain Tests',
          status: 'passed',
          duration: 44
        },
        {
          testName: 'should handle legal reasoning scenarios',
          suiteName: 'Legal Domain Tests',
          status: 'failed',
          duration: 15,
          errorMessage: 'Expected result did not match actual result',
          failureLocation: 'legalDomain.test.ts:45'
        }
      ]);

      selfDevelopmentManager.processTestResultsFile(testResults);

      // Verify that the method processes the results
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Processed test result item')
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid test results file gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      selfDevelopmentManager.processTestResultsFile('invalid json');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error processing test results file:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('processCoverageReportFile', () => {
    it('should process a valid coverage report file', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const coverageData = JSON.stringify([
        ['src/agenda.ts', {
          statements: 10,
          branches: 0,
          functions: 5,
          lines: 11,
          totalStatements: 97,
          totalBranches: 0,
          totalFunctions: 95,
          totalLines: 94
        }]
      ]);

      selfDevelopmentManager.processCoverageReportFile(coverageData);

      // Verify that the method processes the coverage data
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Processed coverage item')
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid coverage report file gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      selfDevelopmentManager.processCoverageReportFile('invalid json');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error processing coverage report file:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getStatus', () => {
    it('should return the current status', () => {
      const status = selfDevelopmentManager.getStatus();

      expect(status).toEqual({
        isRunning: false,
        proposalCount: 0,
        codeChangeCount: 0,
        testChangeCount: 0
      });
    });
  });
});