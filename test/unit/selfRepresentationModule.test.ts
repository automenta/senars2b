import {ComponentMetrics, SelfRepresentationModule, SystemComponent} from '@/modules/selfRepresentationModule';

describe('SelfRepresentationModule', () => {
    let selfRepresentationModule: SelfRepresentationModule;

    beforeEach(() => {
        selfRepresentationModule = new SelfRepresentationModule();
    });

    describe('addComponent', () => {
        it('should add a component to the system model', () => {
            const component: SystemComponent = {
                id: 'test-component',
                name: 'Test Component',
                description: 'A test component',
                responsibilities: ['testing'],
                dependencies: [],
                capabilities: ['testing-capability']
            };

            selfRepresentationModule.addComponent(component);

            // Should add the component
            const components = selfRepresentationModule.getAllComponents();
            expect(components.length).toBe(12); // 11 existing + 1 new
            expect(components).toContainEqual(component);
        });
    });

    describe('addRelationship', () => {
        it('should add a relationship between components', () => {
            const relationship = {
                source: 'component-a',
                target: 'component-b',
                type: 'dependency' as const,
                description: 'Component A depends on Component B'
            };

            selfRepresentationModule.addRelationship(relationship);

            // Should add the relationship
            const architecture = selfRepresentationModule.getArchitecture();
            expect(architecture.relationships).toContainEqual(relationship);
        });
    });

    describe('addConstraint', () => {
        it('should add a system constraint', () => {
            const constraint = {
                id: 'test-constraint',
                description: 'Test constraint',
                componentsAffected: ['component-a'],
                priority: 0.8
            };

            selfRepresentationModule.addConstraint(constraint);

            // Should add the constraint
            const architecture = selfRepresentationModule.getArchitecture();
            expect(architecture.constraints).toContainEqual(constraint);
        });
    });

    describe('updateComponentMetrics', () => {
        it('should update component metrics', () => {
            const metrics: ComponentMetrics = {
                reliability: 0.9,
                performance: 0.8,
                complexity: 0.5,
                coverage: 0.9
            };

            // Update metrics for an existing component
            selfRepresentationModule.updateComponentMetrics('agenda', metrics);

            // Should update the component metrics
            const component = selfRepresentationModule.getComponent('agenda');
            expect(component?.metrics).toEqual(metrics);
        });
    });

    describe('getComponent', () => {
        it('should get a component by ID', () => {
            const component = selfRepresentationModule.getComponent('agenda');

            // Should return the agenda component
            expect(component).toBeDefined();
            expect(component?.id).toBe('agenda');
            expect(component?.name).toBe('Priority Agenda');
        });

        it('should return undefined for non-existent component', () => {
            const component = selfRepresentationModule.getComponent('non-existent');

            // Should return undefined
            expect(component).toBeUndefined();
        });
    });

    describe('getDependencies and getDependents', () => {
        it('should get dependencies and dependents of a component', () => {
            const dependencies = selfRepresentationModule.getDependencies('cognitiveCore');
            const dependents = selfRepresentationModule.getDependents('agenda');

            // Should return the correct dependencies and dependents
            expect(dependencies.length).toBe(2); // agenda and worldModel
            expect(dependencies[0].id).toBe('agenda');
            expect(dependencies[1].id).toBe('worldModel');

            expect(dependents.length).toBe(2); // cognitiveCore and reflection depend on agenda
            // Order might vary, so we check if both are present
            const dependentIds = dependents.map(d => d.id);
            expect(dependentIds).toContain('cognitiveCore');
            expect(dependentIds).toContain('reflection');
        });
    });

    describe('getRelatedComponents', () => {
        it('should get related components (dependencies and dependents)', () => {
            const related = selfRepresentationModule.getRelatedComponents('agenda');

            // Should return both dependencies and dependents
            expect(related.length).toBe(2); // cognitiveCore and reflection depend on agenda
            // Order might vary, so we check if both are present
            const relatedIds = related.map(r => r.id);
            expect(relatedIds).toContain('cognitiveCore');
            expect(relatedIds).toContain('reflection');
        });
    });

    describe('getCapabilities and findComponentsWithCapability', () => {
        it('should get capabilities and find components with specific capabilities', () => {
            const capabilities = selfRepresentationModule.getCapabilities('agenda');
            const components = selfRepresentationModule.findComponentsWithCapability('priority_management');

            // Should return the correct capabilities and components
            expect(capabilities).toContain('priority_management');
            expect(components.length).toBeGreaterThan(0);
            expect(components[0].id).toBe('agenda');
        });
    });

    describe('generateSystemOverview', () => {
        it('should generate a system overview as cognitive items', () => {
            const items = selfRepresentationModule.generateSystemOverview();

            // Should generate items for the system overview
            expect(items.length).toBeGreaterThan(0);
            expect(items[0].type).toBe('BELIEF');
            expect(items[0].label).toContain('System architecture');
        });
    });

    describe('generateCapabilityAnalysis', () => {
        it('should generate capability analysis as cognitive items', () => {
            const items = selfRepresentationModule.generateCapabilityAnalysis();

            // Should generate items for capability analysis
            expect(items.length).toBeGreaterThan(0);
            expect(items[0].type).toBe('BELIEF');
            expect(items[0].label).toContain('Capability');
        });
    });

    describe('identifyCapabilityGaps', () => {
        it('should identify capability gaps', () => {
            const items = selfRepresentationModule.identifyCapabilityGaps();

            // Should generate items for capability gaps (as goals)
            expect(items.length).toBeGreaterThan(0);
            expect(items[0].type).toBe('GOAL');
            expect(items[0].label).toContain('Implement capability');
        });
    });
});