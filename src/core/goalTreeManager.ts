import {AttentionValue, CognitiveItem, GoalTreeManager, UUID} from '../interfaces/types';
import {CognitiveItemFactory} from '../modules/cognitiveItemFactory';

export class HierarchicalGoalTreeManager implements GoalTreeManager {
    private goalHierarchy: Map<UUID, UUID[]> = new Map(); // goal_id -> [child_ids]
    private goalParents: Map<UUID, UUID> = new Map(); // child_id -> parent_id
    private goals: Map<UUID, CognitiveItem> = new Map();
    private goalDependencies: Map<UUID, UUID[]> = new Map(); // goal_id -> [dependency_ids]

    decompose(goal: CognitiveItem): CognitiveItem[] {
        // Decompose a goal into subgoals based on content analysis
        const subgoals: CognitiveItem[] = [];

        // Analyze goal content to determine appropriate decomposition
        const content = goal.label || (goal.atom_id as string);
        const subgoalCount = this.determineSubgoalCount(content);

        for (let i = 0; i < subgoalCount; i++) {
            const subgoalAttention: AttentionValue = {
                priority: goal.attention.priority * (0.8 + Math.random() * 0.2),
                durability: goal.attention.durability * (0.8 + Math.random() * 0.2)
            };

            const subgoal = CognitiveItemFactory.createGoal(
                `subgoal-${goal.id}-${i}`,
                subgoalAttention,
                goal.id
            );

            // Create meaningful subgoal labels based on content
            subgoal.label = this.generateSubgoalLabel(content, i, subgoalCount);
            subgoal.goal_parent_id = goal.id;

            subgoals.push(subgoal);

            // Update hierarchy
            this.addGoalToHierarchy(goal.id, subgoal.id);
            this.goals.set(subgoal.id, subgoal);
        }

        return subgoals;
    }

    mark_achieved(goal_id: UUID): void {
        // Mark a goal as achieved
        const goal = this.goals.get(goal_id);
        if (goal) {
            goal.goal_status = "achieved";
            this.goals.set(goal_id, goal);

            // Check if parent goal can be marked achieved
            this.checkParentAchievement(goal_id);

            // Update dependent goals
            this.updateDependentGoals(goal_id, "achieved");
        }
    }

    mark_failed(goal_id: UUID): void {
        // Mark a goal as failed
        const goal = this.goals.get(goal_id);
        if (goal) {
            goal.goal_status = "failed";
            this.goals.set(goal_id, goal);

            // Propagate failure to parent
            const parentId = this.goalParents.get(goal_id);
            if (parentId) {
                this.mark_failed(parentId);
            }

            // Update dependent goals
            this.updateDependentGoals(goal_id, "failed");
        }
    }

    get_ancestors(goal_id: UUID): UUID[] {
        // Return the ancestors of a goal
        const ancestors: UUID[] = [];
        let currentId = this.goalParents.get(goal_id);

        // Limit traversal to prevent infinite loops
        let depth = 0;
        const maxDepth = 20;

        while (currentId && depth < maxDepth) {
            ancestors.push(currentId);
            currentId = this.goalParents.get(currentId);
            depth++;
        }

        return ancestors;
    }

    // Add dependency relationship between goals
    addDependency(goalId: UUID, dependencyId: UUID): void {
        if (!this.goalDependencies.has(goalId)) {
            this.goalDependencies.set(goalId, []);
        }

        const dependencies = this.goalDependencies.get(goalId)!;
        if (!dependencies.includes(dependencyId)) {
            dependencies.push(dependencyId);
        }
    }

    // Get dependencies for a goal
    getDependencies(goalId: UUID): UUID[] {
        return this.goalDependencies.get(goalId) || [];
    }

    // Register a goal with the manager
    registerGoal(goal: CognitiveItem): void {
        this.goals.set(goal.id, goal);
    }

    // Get goal by ID
    getGoal(goalId: UUID): CognitiveItem | null {
        return this.goals.get(goalId) || null;
    }

    private addGoalToHierarchy(parentId: UUID, childId: UUID): void {
        // Add a child goal to a parent in the hierarchy
        if (!this.goalHierarchy.has(parentId)) {
            this.goalHierarchy.set(parentId, []);
        }

        const children = this.goalHierarchy.get(parentId)!;
        if (!children.includes(childId)) {
            children.push(childId);
        }

        this.goalParents.set(childId, parentId);
    }

    private checkParentAchievement(childId: UUID): void {
        // Check if all subgoals of a parent are achieved
        const parentId = this.goalParents.get(childId);
        if (!parentId) return;

        const siblings = this.goalHierarchy.get(parentId);
        if (!siblings) return;

        // Check if all siblings are achieved or failed
        const allComplete = siblings.every(siblingId => {
            const sibling = this.goals.get(siblingId);
            return sibling && (sibling.goal_status === "achieved" || sibling.goal_status === "failed");
        });

        // If all siblings are complete, check if parent can be achieved
        if (allComplete) {
            const parent = this.goals.get(parentId);
            if (parent) {
                // Check if all siblings are achieved (not just complete)
                const allAchieved = siblings.every(siblingId => {
                    const sibling = this.goals.get(siblingId);
                    return sibling && sibling.goal_status === "achieved";
                });

                allAchieved ? this.mark_achieved(parentId) : this.handleFailedParent(siblings, parentId);
            }
        }
    }

    private handleFailedParent(siblings: UUID[], parentId: UUID): void {
        // If any sibling failed, mark parent as failed
        const anyFailed = siblings.some(siblingId => {
            const sibling = this.goals.get(siblingId);
            return sibling && sibling.goal_status === "failed";
        });

        if (anyFailed) {
            this.mark_failed(parentId);
        }
    }

    private updateDependentGoals(goalId: UUID, status: "achieved" | "failed"): void {
        // Update goals that depend on this goal
        // In a real implementation, we would have a reverse dependency map
        // For now, we'll iterate through all dependencies
        for (const [dependentId, dependencies] of this.goalDependencies.entries()) {
            if (dependencies.includes(goalId)) {
                const dependent = this.goals.get(dependentId);
                if (dependent) {
                    // If a dependency failed, the dependent goal fails
                    if (status === "failed") {
                        this.mark_failed(dependentId);
                    }
                    // If a dependency is achieved, check if all dependencies are achieved
                    else if (status === "achieved") {
                        const allDependenciesAchieved = dependencies.every(depId => {
                            const dep = this.goals.get(depId);
                            return dep && dep.goal_status === "achieved";
                        });

                        if (allDependenciesAchieved) {
                            // All dependencies achieved, but this doesn't automatically achieve the goal
                            // The goal still needs to be processed by the cognitive core
                        }
                    }
                }
            }
        }
    }

    private determineSubgoalCount(content: string): number {
        // Determine how many subgoals to create based on content complexity
        const wordCount = content.split(/\s+/).length;

        return wordCount < 5 ? 1 :
            wordCount < 15 ? 2 :
                wordCount < 30 ? 3 : 4; // Maximum of 4 subgoals
    }

    private generateSubgoalLabel(parentContent: string, index: number, total: number): string {
        // Generate meaningful subgoal labels
        const actionKeywords = [
            "identify", "analyze", "research", "verify", "confirm",
            "gather", "collect", "examine", "investigate", "review"
        ];

        const focusKeywords = [
            "information", "details", "evidence", "data", "facts",
            "aspects", "components", "elements", "factors", "considerations"
        ];

        // Simple heuristic to create meaningful subgoal labels
        if (parentContent.toLowerCase().includes("diagnose")) {
            const diagnosisSteps = [
                "Gather symptomatic information",
                "Review medical history",
                "Analyze potential causes",
                "Formulate treatment plan"
            ];
            return diagnosisSteps[index] || `Diagnosis step ${index + 1}`;
        }

        if (parentContent.toLowerCase().includes("search") || parentContent.toLowerCase().includes("find")) {
            const searchSteps = [
                "Define search criteria",
                "Identify reliable sources",
                "Extract relevant information",
                "Verify findings"
            ];
            return searchSteps[index] || `Search step ${index + 1}`;
        }

        // Default subgoal labels
        const action = actionKeywords[index % actionKeywords.length];
        const focus = focusKeywords[Math.floor(index / actionKeywords.length) % focusKeywords.length];

        return `${action.charAt(0).toUpperCase() + action.slice(1)} ${focus}`;
    }
}