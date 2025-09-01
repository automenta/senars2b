import { TaskStatus } from '../interfaces/sharedTypes';

/**
 * Status management utilities for consistent status handling across components
 */

export interface StatusDefinition<T> {
  initial: T;
  terminal: T[];
  transitions: {
    from: T;
    to: T[];
  }[];
}

export class StatusManager<T> {
  private statusDefinition: StatusDefinition<T>;
  private currentStatus: T;

  constructor(statusDefinition: StatusDefinition<T>, initialStatus?: T) {
    this.statusDefinition = statusDefinition;
    this.currentStatus = initialStatus || statusDefinition.initial;
  }

  /**
   * Get the current status
   */
  getStatus(): T {
    return this.currentStatus;
  }

  /**
   * Check if the current status is terminal
   */
  isTerminal(): boolean {
    return this.statusDefinition.terminal.includes(this.currentStatus);
  }

  /**
   * Check if a transition to a new status is valid
   */
  canTransitionTo(newStatus: T): boolean {
    // If we're already in a terminal state, no transitions are allowed
    if (this.isTerminal()) {
      return false;
    }

    // Check if the transition is explicitly allowed
    const validTransitions = this.statusDefinition.transitions
      .filter(transition => transition.from === this.currentStatus)
      .flatMap(transition => transition.to);

    return validTransitions.includes(newStatus);
  }

  /**
   * Transition to a new status if valid
   */
  transitionTo(newStatus: T): boolean {
    if (this.canTransitionTo(newStatus)) {
      this.currentStatus = newStatus;
      return true;
    }
    return false;
  }

  /**
   * Get all possible next statuses from the current status
   */
  getNextPossibleStatuses(): T[] {
    if (this.isTerminal()) {
      return [];
    }

    const transitions = this.statusDefinition.transitions
      .filter(transition => transition.from === this.currentStatus)
      .flatMap(transition => transition.to);

    return transitions;
  }

  /**
   * Reset to initial status
   */
  reset(): void {
    this.currentStatus = this.statusDefinition.initial;
  }
}

// Common status definitions
export const TASK_STATUS_DEFINITION: StatusDefinition<TaskStatus> = {
  initial: 'pending',
  terminal: ['completed', 'failed', 'deferred'],
  transitions: [
    { from: 'pending', to: ['awaiting_dependencies', 'decomposing'] },
    { from: 'awaiting_dependencies', to: ['ready_for_execution', 'failed'] },
    { from: 'decomposing', to: ['awaiting_subtasks'] },
    { from: 'awaiting_subtasks', to: ['ready_for_execution', 'failed'] },
    { from: 'ready_for_execution', to: ['completed', 'failed'] }
  ]
};