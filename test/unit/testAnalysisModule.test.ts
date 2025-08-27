import {CoverageData, TestAnalysisModule, TestResult} from '@/modules/testAnalysisModule';

describe('TestAnalysisModule', () => {
    let testAnalysisModule: TestAnalysisModule;

    beforeEach(() => {
        testAnalysisModule = new TestAnalysisModule();
    });

    describe('processTestResults', () => {
        it('should process test results and generate cognitive items', () => {
            const testResults: TestResult[] = [
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
                },
                {
                    testName: 'should process text input correctly',
                    suiteName: 'Perception Subsystem Tests',
                    status: 'passed',
                    duration: 4
                }
            ];

            const items = testAnalysisModule.processTestResults(testResults);

            // Should generate items for test health, failure patterns, and component failures
            expect(items.length).toBeGreaterThan(0);

            // Check that we have a test health item
            const healthItem = items.find(item => item.label?.includes('Test suite health'));
            expect(healthItem).toBeDefined();

            // Check that we have items for failure patterns
            const patternItems = items.filter(item => item.label?.includes('Common failure pattern'));
            // In this case, we only have one failure, so no pattern should be identified
            expect(patternItems.length).toBe(0);
        });

        it('should identify common failure patterns', () => {
            const testResults: TestResult[] = [
                {
                    testName: 'Test 1',
                    suiteName: 'Suite A',
                    status: 'failed',
                    duration: 10,
                    errorMessage: 'Connection timeout error occurred',
                    failureLocation: 'test1.ts:10'
                },
                {
                    testName: 'Test 2',
                    suiteName: 'Suite B',
                    status: 'failed',
                    duration: 15,
                    errorMessage: 'Connection timeout error occurred',
                    failureLocation: 'test2.ts:20'
                }
            ];

            const items = testAnalysisModule.processTestResults(testResults);

            // Should identify the common failure pattern
            const patternItems = items.filter(item => item.label?.includes('Common failure pattern'));
            expect(patternItems.length).toBeGreaterThan(0);
            expect(patternItems[0].label).toContain('Connection timeout error occurred');
        });
    });

    describe('processCoverageData', () => {
        it('should process coverage data and generate cognitive items', () => {
            const coverageData = new Map<string, CoverageData>();
            coverageData.set('src/agenda.ts', {
                statements: 10,
                branches: 0,
                functions: 5,
                lines: 11,
                totalStatements: 97,
                totalBranches: 0,
                totalFunctions: 95,
                totalLines: 94
            });
            coverageData.set('src/worldModel.ts', {
                statements: 7,
                branches: 0,
                functions: 2,
                lines: 8,
                totalStatements: 355,
                totalBranches: 0,
                totalFunctions: 84,
                totalLines: 371
            });

            const items = testAnalysisModule.processCoverageData(coverageData);

            // Should generate items for coverage health and low coverage areas
            expect(items.length).toBeGreaterThan(0);

            // Check that we have a coverage health item
            const healthItem = items.find(item => item.label?.includes('Overall coverage'));
            expect(healthItem).toBeDefined();
        });

        it('should identify low coverage areas', () => {
            const coverageData = new Map<string, CoverageData>();
            // Add a file with very low coverage
            coverageData.set('src/poorlyCovered.ts', {
                statements: 5,
                branches: 0,
                functions: 1,
                lines: 5,
                totalStatements: 100,
                totalBranches: 0,
                totalFunctions: 20,
                totalLines: 100
            });

            const items = testAnalysisModule.processCoverageData(coverageData);

            // Should identify the low coverage area
            const lowCoverageItems = items.filter(item => item.label?.includes('Low coverage'));
            expect(lowCoverageItems.length).toBeGreaterThan(0);
            expect(lowCoverageItems[0].label).toContain('poorlyCovered.ts');
        });
    });

    describe('generateEnhancementProposals', () => {
        it('should generate enhancement proposals based on analysis', () => {
            // First process some test results to populate the internal state
            const testResults: TestResult[] = [
                {
                    testName: 'Test 1',
                    suiteName: 'Suite A',
                    status: 'failed',
                    duration: 10,
                    errorMessage: 'Connection timeout error occurred',
                    failureLocation: 'test1.ts:10'
                },
                {
                    testName: 'Test 2',
                    suiteName: 'Suite A',
                    status: 'failed',
                    duration: 15,
                    errorMessage: 'Connection timeout error occurred',
                    failureLocation: 'test2.ts:20'
                }
            ];

            testAnalysisModule.processTestResults(testResults);

            // Add some coverage data
            const coverageData = new Map<string, CoverageData>();
            coverageData.set('src/poorlyCovered.ts', {
                statements: 5,
                branches: 0,
                functions: 1,
                lines: 5,
                totalStatements: 100,
                totalBranches: 0,
                totalFunctions: 20,
                totalLines: 100
            });

            testAnalysisModule.processCoverageData(coverageData);

            // Generate enhancement proposals
            const proposals = (testAnalysisModule as any).generateEnhancementProposals();

            // Should generate proposals for failure patterns and low coverage
            expect(proposals.length).toBeGreaterThan(0);
        });
    });
});