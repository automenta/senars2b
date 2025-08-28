import { AttentionValue, CognitiveItem, TaskMetadata } from '../interfaces/types';

/**
 * @interface Agenda
 * @description Defines the core interface for an agenda system, which manages and prioritizes cognitive items.
 */
export interface Agenda {
    /**
     * Adds or updates a cognitive item in the agenda.
     * @param item The cognitive item to add.
     */
    push(item: CognitiveItem): void;

    /**
     * Removes and returns the highest priority unblocked item from the agenda.
     * @returns A promise that resolves to the highest priority item.
     */
    pop(): Promise<CognitiveItem>;

    /**
     * Returns the highest priority unblocked item without removing it.
     * @returns The highest priority item or null if the agenda is empty.
     */
    peek(): CognitiveItem | null;

    /**
     * Returns the number of items in the agenda.
     * @returns The size of the agenda.
     */
    size(): number;

    /**
     * Updates the attention value of a specific item.
     * @param id The ID of the item to update.
     * @param newVal The new attention value.
     */
    updateAttention(id: string, newVal: AttentionValue): void;

    /**
     * Removes an item from the agenda by its ID.
     * @param id The ID of the item to remove.
     * @returns True if the item was removed, false otherwise.
     */
    remove(id: string): boolean;

    /**
     * Retrieves an item by its ID without removing it.
     * @param id The ID of the item to retrieve.
     * @returns The cognitive item or null if not found.
     */
    get(id: string): CognitiveItem | null;

    /**
     * Updates the status of a specific task within the agenda.
     * @param taskId The ID of the task to update.
     * @param status The new status for the task.
     * @returns `true` if the task was found and updated, `false` otherwise.
     */
    updateTaskStatus(taskId: string, status: TaskMetadata['status']): boolean;

    /**
     * Retrieves tasks from the agenda based on a set of filter criteria.
     * @param filter The filter criteria, which can include tag, category, or status.
     * @returns An array of cognitive items that match the filter criteria.
     */
    getTasksBy(filter: { tag?: string; category?: string; status?: TaskMetadata['status'] }): CognitiveItem[];
}

/**
 * @class PriorityAgenda
 * @implements {Agenda}
 * @description A sophisticated, priority-based agenda for managing cognitive items.
 * It sorts items based on a weighted priority score, handles task dependencies,
 * and provides detailed statistics for monitoring system performance.
 */
export class PriorityAgenda implements Agenda {
    // Constants for priority calculation
    private static readonly TASK_PRIORITY_WEIGHT = 0.4;
    private static readonly DEADLINE_FACTOR_WEIGHT = 0.5;
    private static readonly ATTENTION_PRIORITY_WEIGHT = 0.1;
    private static readonly DEADLINE_WINDOW_MS = 24 * 60 * 60 * 1000; // 1 day

    private items: CognitiveItem[] = [];
    private itemMap: Map<string, CognitiveItem> = new Map(); // For O(1) lookups
    private waitingQueue: (() => void)[] = [];

    // --- Statistics Tracking ---
    private popCount: number = 0;
    private totalWaitTime: number = 0;
    private maxWaitTime: number = 0;
    private lastPopTime: number = 0;
    private lastStatsCheckTime: number = Date.now();
    private lastPopCount: number = 0;
    // --- End Statistics Tracking ---

    private getTaskStatus: (taskId: string) => TaskMetadata['status'] | null;

    /**
     * Creates an instance of PriorityAgenda.
     * @param {function(string): TaskMetadata['status'] | null} [getTaskStatus]
     * A function to resolve the status of a task by its ID. This is crucial for robust
     * dependency checking. If not provided, it defaults to checking only within the agenda's
     * current items, which may not be sufficient for complex, persistent task chains.
     */
    constructor(getTaskStatus?: (taskId: string) => TaskMetadata['status'] | null) {
        this.getTaskStatus = getTaskStatus || ((taskId: string) => {
            const task = this.itemMap.get(taskId);
            return task?.task_metadata?.status || null;
        });
    }

    /**
     * Updates the status of a specific task within the agenda.
     * If the task's new status is 'completed', this may unblock dependent tasks.
     * @param {string} taskId The ID of the task to update.
     * @param {TaskMetadata['status']} status The new status for the task.
     * @returns {boolean} True if the task was found and updated, false otherwise.
     */
    updateTaskStatus(taskId: string, status: TaskMetadata['status']): boolean {
        const item = this.itemMap.get(taskId);

        if (item && item.type === 'TASK' && item.task_metadata) {
            item.task_metadata.status = status;
            item.updated_at = Date.now();

            // If a task is completed, it might unblock other tasks that depend on it.
            if (status === 'completed') {
                this.resolveWaitingPop();
            }

            return true;
        }

        return false;
    }

    /**
     * Adds or updates a cognitive item in the agenda. If an item with the same ID
     * already exists, it will be updated. The agenda is re-sorted after the operation.
     * @param {CognitiveItem} item The cognitive item to add or update.
     * @throws {Error} If the item is null, undefined, or lacks required properties (id, attention).
     */
    push(item: CognitiveItem): void {
        if (!item || !item.id || !item.attention) {
            throw new Error('Item must be a valid CognitiveItem with an id and attention value.');
        }
        if (typeof item.attention.priority !== 'number' || item.attention.priority < 0 || item.attention.priority > 1) {
            throw new Error('Item attention priority must be a number between 0 and 1.');
        }

        const isNewItem = !this.itemMap.has(item.id);

        if (!isNewItem) {
            const index = this.items.findIndex(i => i.id === item.id);
            if (index !== -1) {
                this.items[index] = item;
            }
        } else {
            this.items.push(item);
        }
        this.itemMap.set(item.id, item);
        this.sortItemsByPriority();

        // An added or updated item might unblock a waiting pop() call.
        this.resolveWaitingPop();
    }

    /**
     * Asynchronously removes and returns the highest priority item that is not blocked by dependencies.
     * If no unblocked items are available, it waits until an item becomes available or a timeout occurs.
     * @returns {Promise<CognitiveItem>} A promise that resolves to the highest priority unblocked item.
     * @throws {Error} If the wait times out (default: 30 seconds).
     */
    async pop(): Promise<CognitiveItem> {
        const unblockedItemIndex = this.items.findIndex(item => !this.isBlocked(item));

        if (unblockedItemIndex !== -1) {
            const item = this.items.splice(unblockedItemIndex, 1)[0];
            this.itemMap.delete(item.id);

            // If the popped item is a task, update its status and timestamp.
            if (item.type === 'TASK' && item.task_metadata) {
                item.task_metadata.status = 'in_progress';
                item.updated_at = Date.now();
            }

            this.trackPopStatistics();
            return item;
        }

        // Wait for an item to become available.
        return new Promise<CognitiveItem>((resolve, reject) => {
            const timeout = setTimeout(() => {
                const index = this.waitingQueue.indexOf(resolver);
                if (index !== -1) {
                    this.waitingQueue.splice(index, 1);
                }
                reject(new Error('Timeout waiting for an unblocked item to become available'));
            }, 30000); // 30-second timeout

            const resolver = () => {
                clearTimeout(timeout);
                this.pop().then(resolve).catch(reject);
            };

            this.waitingQueue.push(resolver);
        });
    }

    /**
     * Returns the highest priority unblocked item without removing it from the agenda.
     * @returns {CognitiveItem | null} The highest priority unblocked item, or null if none exists.
     */
    peek(): CognitiveItem | null {
        const unblockedItemIndex = this.items.findIndex(item => !this.isBlocked(item));
        return unblockedItemIndex !== -1 ? this.items[unblockedItemIndex] : null;
    }

    /**
     * Gets the total number of items currently in the agenda.
     * @returns {number} The number of items.
     */
    size(): number {
        return this.items.length;
    }

    /**
     * Updates the attention value of an item and re-sorts the agenda.
     * @param {string} id The ID of the item to update.
     * @param {AttentionValue} newVal The new attention value for the item.
     */
    updateAttention(id: string, newVal: AttentionValue): void {
        const item = this.itemMap.get(id);
        if (item) {
            item.attention = newVal;
            this.sortItemsByPriority();
            this.resolveWaitingPop();
        }
    }

    /**
     * Removes an item from the agenda by its ID.
     * @param {string} id The ID of the item to remove.
     * @returns {boolean} True if the item was found and removed, false otherwise.
     */
    remove(id: string): boolean {
        if (!this.itemMap.has(id)) {
            return false;
        }
        this.items = this.items.filter(item => item.id !== id);
        this.itemMap.delete(id);
        // Removing an item could unblock a dependency.
        this.resolveWaitingPop();
        return true;
    }

    /**
     * Retrieves an item from the agenda by its ID without removing it.
     * @param {string} id The ID of the item to retrieve.
     * @returns {CognitiveItem | null} The found item, or null if it does not exist.
     */
    get(id: string): CognitiveItem | null {
        return this.itemMap.get(id) || null;
    }

    /**
     * Provides detailed statistics about the agenda's performance.
     * @returns {{size: number, popRate: number, averageWaitTime: number, maxWaitTime: number, totalPops: number}}
     * An object containing performance metrics.
     */
    getStatistics(): {
        size: number;
        popRate: number; // pops per second
        averageWaitTime: number; // in milliseconds
        maxWaitTime: number; // in milliseconds
        totalPops: number;
    } {
        const now = Date.now();
        const timeElapsedSeconds = (now - this.lastStatsCheckTime) / 1000;
        const popsSinceLastCheck = this.popCount - this.lastPopCount;

        const popRate = timeElapsedSeconds > 0 ? popsSinceLastCheck / timeElapsedSeconds : 0;

        // Update for the next calculation period.
        this.lastStatsCheckTime = now;
        this.lastPopCount = this.popCount;

        const averageWaitTime = this.popCount > 0 ? this.totalWaitTime / this.popCount : 0;

        return {
            size: this.items.length,
            popRate,
            averageWaitTime,
            maxWaitTime: this.maxWaitTime,
            totalPops: this.popCount,
        };
    }

    /**
     * Retrieves tasks from the agenda based on a set of filter criteria.
     * @param {object} filter The filter criteria.
     * @param {string} [filter.tag] A tag to filter tasks by.
     * @param {string} [filter.category] A category to filter tasks by.
     * @param {TaskMetadata['status']} [filter.status] A status to filter tasks by.
     * @returns {CognitiveItem[]} An array of tasks that match the filter criteria.
     */
    getTasksBy(filter: { tag?: string; category?: string; status?: TaskMetadata['status'] }): CognitiveItem[] {
        return this.items.filter(item => {
            if (item.type !== 'TASK' || !item.task_metadata) {
                return false;
            }

            if (filter.status && item.task_metadata.status !== filter.status) {
                return false;
            }

            if (filter.tag && (!item.task_metadata.tags || !item.task_metadata.tags.includes(filter.tag))) {
                return false;
            }

            if (filter.category && (!item.task_metadata.categories || !item.task_metadata.categories.includes(filter.category))) {
                return false;
            }

            return true;
        });
    }

    /**
     * Calculates the combined priority score for a cognitive item.
     * This score is a weighted average of the item's intrinsic attention,
     * its task priority level, and its deadline proximity.
     * @private
     * @param {CognitiveItem} item The item to score.
     * @returns {number} The calculated priority score.
     */
    private getCombinedPriority(item: CognitiveItem): number {
        const attentionPriority = item.attention.priority;

        if (item.type === 'TASK' && item.task_metadata) {
            const priorityMap = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 };
            const taskPriority = priorityMap[item.task_metadata.priority_level] || 0.5;

            let deadlineFactor = 0;
            if (item.task_metadata.deadline) {
                const now = Date.now();
                const timeLeft = item.task_metadata.deadline - now;
                if (timeLeft < 0) {
                    deadlineFactor = 1.0; // Overdue tasks get max factor.
                } else if (timeLeft < PriorityAgenda.DEADLINE_WINDOW_MS) {
                    deadlineFactor = 1.0 - (timeLeft / PriorityAgenda.DEADLINE_WINDOW_MS);
                }
            }

            return (
                taskPriority * PriorityAgenda.TASK_PRIORITY_WEIGHT +
                deadlineFactor * PriorityAgenda.DEADLINE_FACTOR_WEIGHT +
                attentionPriority * PriorityAgenda.ATTENTION_PRIORITY_WEIGHT
            );
        }

        return attentionPriority;
    }

    /**
     * Sorts the internal items array by priority in descending order.
     * @private
     */
    private sortItemsByPriority(): void {
        this.items.sort((a, b) => this.getCombinedPriority(b) - this.getCombinedPriority(a));
    }

    /**
     * Checks if a task is blocked by any of its dependencies.
     * A task is blocked if any of its dependencies do not have the 'completed' status.
     * @private
     * @param {CognitiveItem} item The task to check.
     * @returns {boolean} True if the task is blocked, false otherwise.
     */
    private isBlocked(item: CognitiveItem): boolean {
        if (item.type !== 'TASK' || !item.task_metadata?.dependencies?.length) {
            return false;
        }

        for (const depId of item.task_metadata.dependencies) {
            const dependencyStatus = this.getTaskStatus(depId);
            if (dependencyStatus !== 'completed') {
                return true; // Blocked if dependency is not completed or status is unknown.
            }
        }

        return false;
    }

    /**
     * Updates statistics related to pop operations.
     * @private
     */
    private trackPopStatistics(): void {
        const now = Date.now();
        this.popCount++;

        if (this.lastPopTime > 0) {
            const waitTime = now - this.lastPopTime;
            this.totalWaitTime += waitTime;
            if (waitTime > this.maxWaitTime) {
                this.maxWaitTime = waitTime;
            }
        }

        this.lastPopTime = now;
    }

    /**
     * If there are any pending `pop` promises, this method resolves the oldest one.
     * This should be called whenever an action occurs that might unblock a task,
     * such as adding/removing an item or updating a task's status.
     * @private
     */
    private resolveWaitingPop(): void {
        if (this.waitingQueue.length > 0) {
            const resolver = this.waitingQueue.shift();
            if (resolver) {
                resolver();
            }
        }
    }
}