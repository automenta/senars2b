import {ImplementationModule} from '@/modules/implementationModule';
import {CodeChangeProposal} from '@/modules/enhancementProposalModule';

describe('ImplementationModule', () => {
    let implementationModule: ImplementationModule;

    beforeEach(() => {
        implementationModule = new ImplementationModule();
    });

    describe('generateCodeChange', () => {
        it('should generate a code change based on a proposal', () => {
            const proposal: CodeChangeProposal = {
                id: 'proposal-1',
                filePath: 'src/testComponent.ts',
                changeType: 'modify',
                description: 'Fix a bug in testComponent',
                reason: 'Component is not handling edge cases properly',
                priority: 'high'
            };

            const change = implementationModule.generateCodeChange(proposal);

            // Should generate a code change
            expect(change).toBeDefined();
            expect(change.id).toContain('code-change');
            expect(change.filePath).toBe('src/testComponent.ts');
            expect(change.changeType).toBe('modify');
            expect(change.description).toBe('Fix a bug in testComponent');
            expect(change.newContent).toContain('* TODO: Implement');
        });
    });

    describe('generateTestChange', () => {
        it('should generate a test change for a code change', () => {
            const codeChange = {
                id: 'code-change-1',
                filePath: 'src/testComponent.ts',
                changeType: 'modify' as const,
                newContent: '// New content',
                description: 'Fix a bug in testComponent'
            };

            const testChange = implementationModule.generateTestChange('testComponent', codeChange);

            // Should generate a test change
            expect(testChange).toBeDefined();
            expect(testChange.id).toContain('test-change');
            expect(testChange.filePath).toBe('src/testComponent.test.ts');
            expect(testChange.testType).toBe('unit');
            expect(testChange.description).toBe('Test for Fix a bug in testComponent');
            expect(testChange.relatedComponent).toBe('testComponent');
        });
    });

    describe('applyCodeChange', () => {
        it('should apply a code change', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const change = {
                id: 'code-change-1',
                filePath: 'src/testComponent.ts',
                changeType: 'modify' as const,
                newContent: '// New content',
                description: 'Fix a bug in testComponent'
            };

            const result = implementationModule.applyCodeChange(change);

            // Should apply the change successfully
            expect(result).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Applying code change to src/testComponent.ts')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('applyTestChange', () => {
        it('should apply a test change', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const testChange = {
                id: 'test-change-1',
                filePath: 'src/testComponent.test.ts',
                testType: 'unit' as const,
                content: '// Test content',
                description: 'Test for a feature',
                relatedComponent: 'testComponent'
            };

            const result = implementationModule.applyTestChange(testChange);

            // Should apply the test change successfully
            expect(result).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Applying test change to src/testComponent.test.ts')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('validateChange', () => {
        it('should validate a code change', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const change = {
                id: 'code-change-1',
                filePath: 'src/testComponent.ts',
                changeType: 'modify' as const,
                newContent: '// New content',
                description: 'Fix a bug in testComponent',
                validationTests: [
                    'Should fix the bug without introducing regressions',
                    'Should handle edge cases appropriately'
                ]
            };

            const result = implementationModule.validateChange(change);

            // Should validate the change successfully
            expect(result).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Validating change: Fix a bug in testComponent')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Running validation tests')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('getAllCodeChanges and getAllTestChanges', () => {
        it('should return all code changes and test changes', () => {
            // Generate some changes
            const proposal: CodeChangeProposal = {
                id: 'proposal-1',
                filePath: 'src/testComponent.ts',
                changeType: 'modify' as const,
                description: 'Fix a bug in testComponent',
                reason: 'Component is not handling edge cases properly',
                priority: 'high' as const
            };

            implementationModule.generateCodeChange(proposal);
            const codeChange = implementationModule.getAllCodeChanges()[0];
            implementationModule.generateTestChange('testComponent', codeChange);

            // Should return all changes
            const codeChanges = implementationModule.getAllCodeChanges();
            const testChanges = implementationModule.getAllTestChanges();

            expect(codeChanges.length).toBe(1);
            expect(testChanges.length).toBe(1);
        });
    });
});