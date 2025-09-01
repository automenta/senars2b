#!/usr/bin/env node

/**
 * Simple test to verify core components can be imported and instantiated
 */

import { TaskFactory } from '../modules/taskFactory';
import { TaskValidator } from '../utils/taskValidator';
import { AttentionValue } from '../interfaces/types';

async function runSimpleTest() {
    console.log("===============================================");
    console.log("  Senars3 Simple Component Test");
    console.log("===============================================");
    console.log("");

    try {
        // Test TaskFactory
        console.log("--- Testing TaskFactory ---");
        const attention: AttentionValue = { priority: 0.8, durability: 0.6 };
        const task = TaskFactory.createTask("Test task", attention, 'high');
        console.log("✓ TaskFactory.createTask works");
        console.log(`  Created task with ID: ${task.id}`);

        // Test TaskValidator
        console.log("\n--- Testing TaskValidator ---");
        const isValid = TaskValidator.validateTask(task);
        console.log("✓ TaskValidator.validateTask works");
        console.log(`  Task validation result: ${isValid}`);

        // Test normalization
        const normalizedTask = TaskValidator.normalizeTask(task);
        console.log("✓ TaskValidator.normalizeTask works");
        console.log(`  Normalized task status: ${normalizedTask.task_metadata?.status}`);

        console.log("\n🎉 All core component tests passed!");
        return 0;
    } catch (error) {
        console.error("❌ Test failed with error:", error);
        return 1;
    }
}

runSimpleTest().then(exitCode => {
    process.exit(exitCode);
}).catch(error => {
    console.error("Test execution failed:", error);
    process.exit(1);
});