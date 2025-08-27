import {AttentionValue, CognitiveItem} from '../interfaces/types';
import {CognitiveItemFactory} from './cognitiveItemFactory';
import {v4 as uuidv4} from 'uuid';
import {ComponentMetrics, SystemComponent} from './selfRepresentationModule';
import {CoverageData, TestResult} from './testAnalysisModule';

export interface EnhancementProposal {
    id: string;
    title: string;
    description: string;
    type: 'bug_fix' | 'performance_improvement' | 'feature_addition' | 'refactoring' | 'test_improvement';
    priority: 'low' | 'medium' | 'high' | 'critical';
    effort: 'small' | 'medium' | 'large';
    impact: 'low' | 'medium' | 'high';
    affectedComponents: string[];
    implementationPlan?: string[];
    validationCriteria?: string[];
    estimatedDuration?: string; // e.g., \"2 days\", \"1 week\"
}

export interface CodeChangeProposal {
    id: string;
    filePath: string;
    changeType: 'add' | 'modify' | 'remove';
    description: string;
    codeSnippet?: string;
    reason: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
}

export class EnhancementProposalModule {
    private proposals: EnhancementProposal[] = [];
    private codeChanges: CodeChangeProposal[] = [];

    // Generate enhancement proposals based on component metrics
    generateFromComponentMetrics(
        component: SystemComponent,
        metrics: ComponentMetrics
    ): EnhancementProposal[] {
        const proposals: EnhancementProposal[] = [];

        // Check for reliability issues
        if (metrics.reliability < 0.7) {
            proposals.push({
                id: `reliability-${component.id}-${uuidv4()}`,
                title: `Improve reliability of ${component.name}`,
                description: `Component ${component.name} has low reliability score (${(metrics.reliability * 100).toFixed(1)}%). Consider adding error handling, improving test coverage, or refactoring problematic areas.`,
                type: 'bug_fix',
                priority: metrics.reliability < 0.5 ? 'critical' : 'high',
                effort: 'medium',
                impact: 'high',
                affectedComponents: [component.id],
                implementationPlan: [
                    'Identify failure points in component',
                    'Add comprehensive error handling',
                    'Implement retry mechanisms where appropriate',
                    'Improve logging for debugging'
                ],
                validationCriteria: [
                    'Reliability score improves to > 0.8',
                    'Error rate decreases by 50%',
                    'Component passes all existing tests'
                ]
            });
        }

        // Check for performance issues
        if (metrics.performance < 0.6) {
            proposals.push({
                id: `performance-${component.id}-${uuidv4()}`,
                title: `Optimize performance of ${component.name}`,
                description: `Component ${component.name} has poor performance score (${(metrics.performance * 100).toFixed(1)}%). Consider algorithm optimization, caching, or parallelization.`,
                type: 'performance_improvement',
                priority: 'high',
                effort: metrics.complexity > 0.7 ? 'large' : 'medium',
                impact: 'high',
                affectedComponents: [component.id],
                implementationPlan: [
                    'Profile component to identify bottlenecks',
                    'Optimize algorithms and data structures',
                    'Implement caching where appropriate',
                    'Consider parallelization opportunities'
                ],
                validationCriteria: [
                    'Performance score improves to > 0.7',
                    'Execution time decreases by 30%',
                    'Resource usage decreases'
                ]
            });
        }

        // Check for complexity issues
        if (metrics.complexity > 0.8) {
            proposals.push({
                id: `complexity-${component.id}-${uuidv4()}`,
                title: `Refactor complex ${component.name}`,
                description: `Component ${component.name} has high complexity score (${(metrics.complexity * 100).toFixed(1)}%). Consider breaking into smaller modules or simplifying logic.`,
                type: 'refactoring',
                priority: 'medium',
                effort: 'large',
                impact: 'medium',
                affectedComponents: [component.id],
                implementationPlan: [
                    'Identify complex functions and modules',
                    'Break large functions into smaller ones',
                    'Extract reusable components',
                    'Simplify conditional logic',
                    'Improve code documentation'
                ],
                validationCriteria: [
                    'Complexity score decreases to < 0.7',
                    'Code maintainability improves',
                    'Test coverage remains the same or improves'
                ]
            });
        }

        // Check for coverage issues
        if (metrics.coverage < 0.7) {
            proposals.push({
                id: `coverage-${component.id}-${uuidv4()}`,
                title: `Improve test coverage for ${component.name}`,
                description: `Component ${component.name} has low test coverage (${(metrics.coverage * 100).toFixed(1)}%). Add unit tests to improve confidence in component reliability.`,
                type: 'test_improvement',
                priority: 'medium',
                effort: 'medium',
                impact: 'high',
                affectedComponents: [component.id],
                implementationPlan: [
                    'Identify untested code paths',
                    'Write unit tests for core functionality',
                    'Add edge case tests',
                    'Implement integration tests where needed'
                ],
                validationCriteria: [
                    'Coverage score improves to > 0.8',
                    'Number of bugs decreases',
                    'Component passes all new tests'
                ]
            });
        }

        this.proposals.push(...proposals);
        return proposals;
    }

    // Generate enhancement proposals based on test failures
    generateFromTestFailures(testFailures: TestResult[]): EnhancementProposal[] {
        const proposals: EnhancementProposal[] = [];
        const failureGroups = new Map<string, TestResult[]>();

        // Group failures by component or error pattern
        for (const failure of testFailures) {
            const component = this.extractComponentFromTest(failure);
            if (!failureGroups.has(component)) {
                failureGroups.set(component, []);
            }
            failureGroups.get(component)?.push(failure);
        }

        // Generate proposals for each group
        for (const [component, failures] of failureGroups.entries()) {
            if (failures.length > 2) { // Only propose fixes for components with multiple failures
                const failureRate = failures.length / failures.length; // This would be more meaningful with total tests
                const priority = failures.length > 5 ? 'critical' : (failures.length > 3 ? 'high' : 'medium');

                proposals.push({
                    id: `test-failures-${component}-${uuidv4()}`,
                    title: `Fix recurring test failures in ${component}`,
                    description: `Component ${component} has ${failures.length} recurring test failures. Investigate root causes and implement fixes.`,
                    type: 'bug_fix',
                    priority,
                    effort: 'medium',
                    impact: 'high',
                    affectedComponents: [component],
                    implementationPlan: [
                        'Analyze failure patterns and error messages',
                        'Identify common root causes',
                        'Implement fixes for each root cause',
                        'Add defensive programming practices',
                        'Improve error handling and logging'
                    ],
                    validationCriteria: [
                        'All identified test failures are resolved',
                        'No new failures are introduced',
                        'Component reliability improves'
                    ]
                });
            }
        }

        this.proposals.push(...proposals);
        return proposals;
    }

    // Generate enhancement proposals based on coverage gaps
    generateFromCoverageGaps(coverageData: Map<string, CoverageData>): EnhancementProposal[] {
        const proposals: EnhancementProposal[] = [];

        for (const [filePath, coverage] of coverageData.entries()) {
            const statementCoverage = coverage.totalStatements > 0 ?
                coverage.statements / coverage.totalStatements : 1;

            if (statementCoverage < 0.7) {
                const component = this.extractComponentFromPath(filePath);

                proposals.push({
                    id: `coverage-gap-${uuidv4()}`,
                    title: `Improve test coverage for ${filePath}`,
                    description: `File ${filePath} has low statement coverage (${(statementCoverage * 100).toFixed(1)}%). Add tests to improve confidence in code quality.`,
                    type: 'test_improvement',
                    priority: statementCoverage < 0.5 ? 'high' : 'medium',
                    effort: 'medium',
                    impact: 'medium',
                    affectedComponents: [component],
                    implementationPlan: [
                        'Identify uncovered code paths',
                        'Write unit tests for uncovered functions',
                        'Add edge case and error condition tests',
                        'Implement integration tests for complex interactions'
                    ],
                    validationCriteria: [
                        'Statement coverage improves to > 0.8',
                        'Branch coverage improves',
                        'No new bugs are introduced'
                    ]
                });
            }
        }

        this.proposals.push(...proposals);
        return proposals;
    }

    // Generate code change proposals based on enhancement suggestions
    generateCodeChanges(proposal: EnhancementProposal): CodeChangeProposal[] {
        const changes: CodeChangeProposal[] = [];

        // This would be a more sophisticated implementation that analyzes the proposal
        // and generates specific code changes. For now, we'll create placeholder changes.

        for (const componentId of proposal.affectedComponents) {
            changes.push({
                id: `code-change-${uuidv4()}`,
                filePath: `src/${componentId}.ts`,
                changeType: 'modify',
                description: `Implement improvements for ${proposal.title}`,
                reason: proposal.description,
                priority: proposal.priority
            });
        }

        this.codeChanges.push(...changes);
        return changes;
    }

    // Prioritize proposals based on impact and effort
    prioritizeProposals(): EnhancementProposal[] {
        return [...this.proposals].sort((a, b) => {
            // Priority ranking: critical > high > medium > low
            const priorityRank = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1};

            // Impact ranking: high > medium > low
            const impactRank = {'high': 3, 'medium': 2, 'low': 1};

            // Effort ranking: small < medium < large
            const effortRank = {'small': 1, 'medium': 2, 'large': 3};

            // Calculate priority score (higher impact, lower effort = higher priority)
            const scoreA = (priorityRank[a.priority] * 10) + (impactRank[a.impact] * 3) - (effortRank[a.effort] * 2);
            const scoreB = (priorityRank[b.priority] * 10) + (impactRank[b.impact] * 3) - (effortRank[b.effort] * 2);

            return scoreB - scoreA; // Sort descending
        });
    }

    // Convert proposals to cognitive items for the agenda
    convertToCognitiveItems(proposals: EnhancementProposal[]): CognitiveItem[] {
        const items: CognitiveItem[] = [];

        for (const proposal of proposals) {
            // Create attention value based on priority
            const attention: AttentionValue = {
                priority: proposal.priority === 'critical' ? 0.9 :
                    proposal.priority === 'high' ? 0.7 :
                        proposal.priority === 'medium' ? 0.5 : 0.3,
                durability: proposal.type === 'bug_fix' ? 0.9 : 0.7
            };

            const item = CognitiveItemFactory.createGoal(
                proposal.id,
                attention
            );

            item.label = proposal.title;

            // Add metadata
            item.meta = { ...item.meta, proposal: proposal };

            items.push(item);
        }

        return items;
    }

    // Get all proposals
    getAllProposals(): EnhancementProposal[] {
        return [...this.proposals];
    }

    // Get proposals by type
    getProposalsByType(type: EnhancementProposal['type']): EnhancementProposal[] {
        return this.proposals.filter(p => p.type === type);
    }

    // Get proposals by priority
    getProposalsByPriority(priority: EnhancementProposal['priority']): EnhancementProposal[] {
        return this.proposals.filter(p => p.priority === priority);
    }

    // Get proposals affecting a specific component
    getProposalsForComponent(componentId: string): EnhancementProposal[] {
        return this.proposals.filter(p => p.affectedComponents.includes(componentId));
    }

    // Add a new proposal
    addProposal(proposal: EnhancementProposal): void {
        this.proposals.push(proposal);
    }

    // Remove a proposal
    removeProposal(proposalId: string): boolean {
        const initialLength = this.proposals.length;
        this.proposals = this.proposals.filter(p => p.id !== proposalId);
        return this.proposals.length < initialLength;
    }

    // Extract component from test failure
    private extractComponentFromTest(test: TestResult): string {
        // Simple extraction - in a real implementation, this would be more sophisticated
        if (test.suiteName) {
            const parts = test.suiteName.split(/[/\\]/);
            return parts[parts.length - 1].split('.')[0];
        }
        return 'unknown';
    }

    // Extract component from file path
    private extractComponentFromPath(filePath: string): string {
        // Extract component name from file path
        const parts = filePath.split(/[/\\]/);
        const fileName = parts[parts.length - 1];
        return fileName.split('.')[0];
    }
}