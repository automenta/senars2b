import { CognitiveItem, TruthValue, AttentionValue } from '../interfaces/types';
import { CognitiveItemFactory } from './cognitiveItemFactory';
import { v4 as uuidv4 } from 'uuid';

export interface TestResult {
  testName: string;
  suiteName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
  failureLocation?: string;
}

export interface CoverageData {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  totalStatements: number;
  totalBranches: number;
  totalFunctions: number;
  totalLines: number;
}

export class TestAnalysisModule {
  private testResults: TestResult[] = [];
  private coverageData: Map<string, CoverageData> = new Map();
  private failurePatterns: Map<string, number> = new Map();
  private componentFailures: Map<string, number> = new Map();

  // Process test results and generate cognitive items
  processTestResults(results: TestResult[]): CognitiveItem[] {
    this.testResults = results;
    const items: CognitiveItem[] = [];
    
    // Analyze overall test health
    const healthItem = this.analyzeTestHealth();
    if (healthItem) items.push(healthItem);
    
    // Identify failure patterns
    const patternItems = this.identifyFailurePatterns();
    items.push(...patternItems);
    
    // Analyze component failures
    const componentItems = this.analyzeComponentFailures();
    items.push(...componentItems);
    
    return items;
  }
  
  // Process coverage data and generate cognitive items
  processCoverageData(coverage: Map<string, CoverageData>): CognitiveItem[] {
    this.coverageData = coverage;
    const items: CognitiveItem[] = [];
    
    // Analyze overall coverage
    const coverageItem = this.analyzeCoverageHealth();
    if (coverageItem) items.push(coverageItem);
    
    // Identify low coverage areas
    const lowCoverageItems = this.identifyLowCoverageAreas();
    items.push(...lowCoverageItems);
    
    return items;
  }
  
  // Analyze overall test health
  private analyzeTestHealth(): CognitiveItem | null {
    if (this.testResults.length === 0) return null;
    
    const totalTests = this.testResults.length;
    const failedTests = this.testResults.filter(t => t.status === 'failed').length;
    const passedTests = this.testResults.filter(t => t.status === 'passed').length;
    const skippedTests = this.testResults.filter(t => t.status === 'skipped').length;
    
    const failureRate = failedTests / totalTests;
    
    // Create a belief about test health
    const truth: TruthValue = {
      frequency: 1.0,
      confidence: 0.9
    };
    
    const attention: AttentionValue = {
      priority: failureRate > 0.1 ? 0.9 : (failureRate > 0.05 ? 0.7 : 0.5),
      durability: 0.8
    };
    
    const item = CognitiveItemFactory.createBelief(
      `test-health-${uuidv4()}`,
      truth,
      attention
    );
    
    item.label = `Test suite health: ${passedTests}/${totalTests} passed (${(failureRate * 100).toFixed(1)}% failure rate)`;
    
    return item;
  }
  
  // Identify failure patterns
  private identifyFailurePatterns(): CognitiveItem[] {
    const items: CognitiveItem[] = [];
    this.failurePatterns.clear();
    
    // Group failures by error message patterns
    const failedTests = this.testResults.filter(t => t.status === 'failed');
    
    for (const test of failedTests) {
      if (test.errorMessage) {
        // Simple pattern extraction - in a real implementation, this would be more sophisticated
        const pattern = this.extractErrorPattern(test.errorMessage);
        const count = this.failurePatterns.get(pattern) || 0;
        this.failurePatterns.set(pattern, count + 1);
      }
    }
    
    // Create beliefs for common failure patterns
    for (const [pattern, count] of this.failurePatterns.entries()) {
      if (count > 1) { // Only report patterns that occur more than once
        const truth: TruthValue = {
          frequency: count / failedTests.length,
          confidence: 0.8
        };
        
        const attention: AttentionValue = {
          priority: Math.min(0.9, count / 5), // Cap priority at 0.9
          durability: 0.7
        };
        
        const item = CognitiveItemFactory.createBelief(
          `failure-pattern-${uuidv4()}`,
          truth,
          attention
        );
        
        item.label = `Common failure pattern: "${pattern}" occurred ${count} times`;
        
        items.push(item);
      }
    }
    
    return items;
  }
  
  // Analyze component failures
  private analyzeComponentFailures(): CognitiveItem[] {
    const items: CognitiveItem[] = [];
    this.componentFailures.clear();
    
    // Group failures by component (based on suite name or file path)
    const failedTests = this.testResults.filter(t => t.status === 'failed');
    
    for (const test of failedTests) {
      const component = this.extractComponent(test.suiteName || test.testName);
      const count = this.componentFailures.get(component) || 0;
      this.componentFailures.set(component, count + 1);
    }
    
    // Create beliefs for components with high failure rates
    for (const [component, count] of this.componentFailures.entries()) {
      const componentTests = this.testResults.filter(t => 
        (t.suiteName || t.testName).includes(component));
      const totalComponentTests = componentTests.length;
      
      if (totalComponentTests > 0) {
        const failureRate = count / totalComponentTests;
        
        // Only report components with significant failure rates
        if (failureRate > 0.2 || count > 3) {
          const truth: TruthValue = {
            frequency: failureRate,
            confidence: 0.85
          };
          
          const attention: AttentionValue = {
            priority: Math.min(0.9, failureRate * 2), // Amplify priority
            durability: 0.75
          };
          
          const item = CognitiveItemFactory.createBelief(
            `component-failure-${uuidv4()}`,
            truth,
            attention
          );
          
          item.label = `Component "${component}" has high failure rate: ${count}/${totalComponentTests} tests failed (${(failureRate * 100).toFixed(1)}%)`;
          
          items.push(item);
        }
      }
    }
    
    return items;
  }
  
  // Analyze coverage health
  private analyzeCoverageHealth(): CognitiveItem | null {
    if (this.coverageData.size === 0) return null;
    
    // Calculate overall coverage metrics
    let totalStatements = 0;
    let coveredStatements = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    
    for (const coverage of this.coverageData.values()) {
      totalStatements += coverage.totalStatements;
      coveredStatements += coverage.statements;
      totalBranches += coverage.totalBranches;
      coveredBranches += coverage.branches;
    }
    
    const statementCoverage = totalStatements > 0 ? coveredStatements / totalStatements : 1;
    const branchCoverage = totalBranches > 0 ? coveredBranches / totalBranches : 1;
    
    // Create a belief about coverage health
    const truth: TruthValue = {
      frequency: 1.0,
      confidence: 0.9
    };
    
    const attention: AttentionValue = {
      priority: statementCoverage < 0.8 ? 0.8 : (statementCoverage < 0.9 ? 0.6 : 0.4),
      durability: 0.7
    };
    
    const item = CognitiveItemFactory.createBelief(
      `coverage-health-${uuidv4()}`,
      truth,
      attention
    );
    
    item.label = `Overall coverage: ${(statementCoverage * 100).toFixed(1)}% statements, ${(branchCoverage * 100).toFixed(1)}% branches`;
    
    return item;
  }
  
  // Identify low coverage areas
  private identifyLowCoverageAreas(): CognitiveItem[] {
    const items: CognitiveItem[] = [];
    
    // Find files/modules with low coverage
    for (const [filePath, coverage] of this.coverageData.entries()) {
      const statementCoverage = coverage.totalStatements > 0 ? 
        coverage.statements / coverage.totalStatements : 1;
      
      // Flag components with coverage below 70%
      if (statementCoverage < 0.7) {
        const truth: TruthValue = {
          frequency: 1.0,
          confidence: 0.9
        };
        
        const attention: AttentionValue = {
          priority: 0.8,
          durability: 0.7
        };
        
        const item = CognitiveItemFactory.createBelief(
          `low-coverage-${uuidv4()}`,
          truth,
          attention
        );
        
        item.label = `Low coverage in ${filePath}: ${(statementCoverage * 100).toFixed(1)}% statements covered`;
        
        items.push(item);
      }
    }
    
    return items;
  }
  
  // Simple error pattern extraction
  private extractErrorPattern(errorMessage: string): string {
    // In a real implementation, this would use more sophisticated NLP techniques
    // For now, we'll extract the first part of the error message
    const lines = errorMessage.split('\n');
    return lines[0].substring(0, 50) + (lines[0].length > 50 ? '...' : '');
  }
  
  // Extract component name from suite/test name
  private extractComponent(name: string): string {
    // Simple component extraction - in a real implementation, this would be more sophisticated
    // Look for common patterns like file paths or component names
    const parts = name.split(/[/\\]/);
    return parts[parts.length - 1].split('.')[0]; // Get last part and remove extension
  }
  
  // Generate enhancement proposals based on analysis
  generateEnhancementProposals(): CognitiveItem[] {
    const items: CognitiveItem[] = [];
    
    // Propose fixes for common failure patterns
    for (const [pattern, count] of this.failurePatterns.entries()) {
      if (count > 2) { // Only propose fixes for patterns that occur frequently
        const attention: AttentionValue = {
          priority: Math.min(0.9, count / 5),
          durability: 0.8
        };
        
        const item = CognitiveItemFactory.createGoal(
          `fix-pattern-${uuidv4()}`,
          attention
        );
        
        item.label = `Investigate and fix common failure pattern: "${pattern}"`;
        
        items.push(item);
      }
    }
    
    // Propose improvements for components with high failure rates
    for (const [component, count] of this.componentFailures.entries()) {
      if (count > 3) {
        const attention: AttentionValue = {
          priority: 0.8,
          durability: 0.7
        };
        
        const item = CognitiveItemFactory.createGoal(
          `improve-component-${uuidv4()}`,
          attention
        );
        
        item.label = `Improve reliability of component "${component}"`;
        
        items.push(item);
      }
    }
    
    // Propose coverage improvements
    for (const [filePath, coverage] of this.coverageData.entries()) {
      const statementCoverage = coverage.totalStatements > 0 ? 
        coverage.statements / coverage.totalStatements : 1;
      
      if (statementCoverage < 0.7) {
        const attention: AttentionValue = {
          priority: 0.7,
          durability: 0.6
        };
        
        const item = CognitiveItemFactory.createGoal(
          `improve-coverage-${uuidv4()}`,
          attention
        );
        
        item.label = `Improve test coverage for ${filePath}`;
        
        items.push(item);
      }
    }
    
    return items;
  }
}