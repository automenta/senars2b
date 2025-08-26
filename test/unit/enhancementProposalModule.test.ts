import { EnhancementProposalModule } from '../../src/modules/enhancementProposalModule';
import { SystemComponent, ComponentMetrics } from '../../src/modules/selfRepresentationModule';
import { TestResult, CoverageData } from '../../src/modules/testAnalysisModule';

describe('EnhancementProposalModule', () => {
  let enhancementProposalModule: EnhancementProposalModule;

  beforeEach(() => {
    enhancementProposalModule = new EnhancementProposalModule();
  });

  describe('generateFromComponentMetrics', () => {
    it('should generate enhancement proposals based on component metrics', () => {
      const component: SystemComponent = {
        id: 'test-component',
        name: 'Test Component',
        description: 'A test component',
        responsibilities: ['testing'],
        dependencies: [],
        capabilities: ['testing'],
        metrics: {
          reliability: 0.9,
          performance: 0.8,
          complexity: 0.5,
          coverage: 0.9
        }
      };

      const metrics: ComponentMetrics = {
        reliability: 0.4, // Low reliability
        performance: 0.5, // Poor performance
        complexity: 0.9,  // High complexity
        coverage: 0.6     // Low coverage
      };

      const proposals = enhancementProposalModule.generateFromComponentMetrics(component, metrics);

      // Should generate multiple proposals for the different issues
      expect(proposals.length).toBe(4);
      
      // Check that we have proposals for each issue type
      const reliabilityProposals = proposals.filter(p => p.title.includes('Improve reliability'));
      const performanceProposals = proposals.filter(p => p.title.includes('Optimize performance'));
      const complexityProposals = proposals.filter(p => p.title.includes('Refactor'));
      const coverageProposals = proposals.filter(p => p.title.includes('Improve test coverage'));
      
      expect(reliabilityProposals.length).toBe(1);
      expect(performanceProposals.length).toBe(1);
      expect(complexityProposals.length).toBe(1);
      expect(coverageProposals.length).toBe(1);
    });

    it('should generate appropriate priority levels', () => {
      const component: SystemComponent = {
        id: 'test-component',
        name: 'Test Component',
        description: 'A test component',
        responsibilities: ['testing'],
        dependencies: [],
        capabilities: ['testing']
      };

      // Test critical reliability issue
      const criticalMetrics: ComponentMetrics = {
        reliability: 0.3, // Very low reliability
        performance: 0.8,
        complexity: 0.5,
        coverage: 0.9
      };

      const proposals = enhancementProposalModule.generateFromComponentMetrics(component, criticalMetrics);
      
      const reliabilityProposal = proposals.find(p => p.title.includes('Improve reliability'));
      expect(reliabilityProposal).toBeDefined();
      expect(reliabilityProposal?.priority).toBe('critical');
    });
  });

  describe('generateFromTestFailures', () => {
    it('should generate enhancement proposals based on test failures', () => {
      const testFailures: TestResult[] = [
        {
          testName: 'Test 1',
          suiteName: 'ComponentA Tests',
          status: 'failed',
          duration: 10,
          errorMessage: 'Error occurred',
          failureLocation: 'test1.ts:10'
        },
        {
          testName: 'Test 2',
          suiteName: 'ComponentA Tests',
          status: 'failed',
          duration: 15,
          errorMessage: 'Error occurred',
          failureLocation: 'test2.ts:20'
        },
        {
          testName: 'Test 3',
          suiteName: 'ComponentA Tests',
          status: 'failed',
          duration: 12,
          errorMessage: 'Error occurred',
          failureLocation: 'test3.ts:15'
        }
      ];

      const proposals = enhancementProposalModule.generateFromTestFailures(testFailures);

      // Should generate a proposal for the recurring failures
      expect(proposals.length).toBe(1);
      expect(proposals[0].title).toContain('Fix recurring test failures');
      expect(proposals[0].priority).toBe('medium'); // 3 failures is medium priority
    });

    it('should not generate proposals for isolated failures', () => {
      const testFailures: TestResult[] = [
        {
          testName: 'Test 1',
          suiteName: 'ComponentA Tests',
          status: 'failed',
          duration: 10,
          errorMessage: 'Error occurred',
          failureLocation: 'test1.ts:10'
        }
      ];

      const proposals = enhancementProposalModule.generateFromTestFailures(testFailures);

      // Should not generate a proposal for a single failure
      expect(proposals.length).toBe(0);
    });
  });

  describe('generateFromCoverageGaps', () => {
    it('should generate enhancement proposals based on coverage gaps', () => {
      const coverageData = new Map<string, CoverageData>();
      coverageData.set('src/poorlyCovered.ts', {
        statements: 10,
        branches: 0,
        functions: 2,
        lines: 10,
        totalStatements: 100,
        totalBranches: 0,
        totalFunctions: 20,
        totalLines: 100
      }); // 10% coverage - very low

      const proposals = enhancementProposalModule.generateFromCoverageGaps(coverageData);

      // Should generate a proposal for the low coverage
      expect(proposals.length).toBe(1);
      expect(proposals[0].title).toContain('Improve test coverage');
      expect(proposals[0].priority).toBe('high'); // Very low coverage is high priority
    });

    it('should not generate proposals for adequate coverage', () => {
      const coverageData = new Map<string, CoverageData>();
      coverageData.set('src/wellCovered.ts', {
        statements: 90,
        branches: 0,
        functions: 18,
        lines: 90,
        totalStatements: 100,
        totalBranches: 0,
        totalFunctions: 20,
        totalLines: 100
      }); // 90% coverage - adequate

      const proposals = enhancementProposalModule.generateFromCoverageGaps(coverageData);

      // Should not generate a proposal for adequate coverage
      expect(proposals.length).toBe(0);
    });
  });

  describe('prioritizeProposals', () => {
    it('should prioritize proposals based on impact and effort', () => {
      // Add some proposals with different priorities
      enhancementProposalModule.addProposal({
        id: 'proposal-1',
        title: 'Critical proposal',
        description: 'A critical issue',
        type: 'bug_fix',
        priority: 'critical',
        effort: 'small',
        impact: 'high',
        affectedComponents: ['component-a']
      });

      enhancementProposalModule.addProposal({
        id: 'proposal-2',
        title: 'Medium proposal',
        description: 'A medium issue',
        type: 'feature_addition',
        priority: 'medium',
        effort: 'medium',
        impact: 'medium',
        affectedComponents: ['component-b']
      });

      enhancementProposalModule.addProposal({
        id: 'proposal-3',
        title: 'High proposal',
        description: 'A high issue',
        type: 'performance_improvement',
        priority: 'high',
        effort: 'large',
        impact: 'high',
        affectedComponents: ['component-c']
      });

      const prioritizedProposals = enhancementProposalModule.prioritizeProposals();

      // Should prioritize critical proposals first
      expect(prioritizedProposals[0].priority).toBe('critical');
      expect(prioritizedProposals[1].priority).toBe('high');
      expect(prioritizedProposals[2].priority).toBe('medium');
    });
  });

  describe('convertToCognitiveItems', () => {
    it('should convert proposals to cognitive items', () => {
      const proposals = [
        {
          id: 'proposal-1',
          title: 'Test proposal',
          description: 'A test proposal',
          type: 'bug_fix' as const,
          priority: 'high' as const,
          effort: 'medium' as const,
          impact: 'high' as const,
          affectedComponents: ['component-a']
        }
      ];

      const items = enhancementProposalModule.convertToCognitiveItems(proposals);

      // Should convert to cognitive items
      expect(items.length).toBe(1);
      expect(items[0].type).toBe('GOAL');
      expect(items[0].label).toBe('Test proposal');
      expect(items[0].attention?.priority).toBe(0.7); // High priority
    });
  });
});