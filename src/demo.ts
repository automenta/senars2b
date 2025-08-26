#!/usr/bin/env node

/**
 * Senars3 Cognitive System Demo
 * 
 * This script demonstrates the key capabilities of the Senars3 cognitive system
 * through a series of example interactions.
 */

import { UserInterface } from './userInterface';
import { DecentralizedCognitiveCore } from './cognitiveCore';
import { PerceptionSubsystem } from './perceptionSubsystem';

async function runDemo() {
    console.log("===========================================");
    console.log("  Senars3 Cognitive System - Demo");
    console.log("===========================================");
    console.log("");
    
    // Create a simplified version for demonstration
    const core = new DecentralizedCognitiveCore(2);
    const perception = new PerceptionSubsystem();
    
    console.log("Starting cognitive core...");
    await core.start();
    
    // Example 1: Process a simple statement
    console.log("\n--- Example 1: Processing a Statement ---");
    const statement = "Chocolate is toxic to dogs";
    console.log(`Input: "${statement}"`);
    
    try {
        const cognitiveItems = await perception.processInput(statement);
        console.log(`Extracted ${cognitiveItems.length} cognitive item(s):`);
        cognitiveItems.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.type}: ${item.label || 'No label'}`);
        });
    } catch (error) {
        console.error("Error processing input:", error);
    }
    
    // Example 2: Process a question
    console.log("\n--- Example 2: Processing a Question ---");
    const question = "My cat seems sick after eating chocolate. What should I do?";
    console.log(`Input: "${question}"`);
    
    try {
        const cognitiveItems = await perception.processInput(question);
        console.log(`Extracted ${cognitiveItems.length} cognitive item(s):`);
        cognitiveItems.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.type}: ${item.label || 'No label'}`);
        });
    } catch (error) {
        console.error("Error processing input:", error);
    }
    
    // Example 3: Process a goal/command
    console.log("\n--- Example 3: Processing a Goal ---");
    const goal = "Diagnose why my plant is wilting";
    console.log(`Input: "${goal}"`);
    
    try {
        const cognitiveItems = await perception.processInput(goal);
        console.log(`Extracted ${cognitiveItems.length} cognitive item(s):`);
        cognitiveItems.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.type}: ${item.label || 'No label'}`);
        });
    } catch (error) {
        console.error("Error processing input:", error);
    }
    
    // Show system status
    console.log("\n--- System Status ---");
    const status = core.getSystemStatus();
    console.log(`Agenda size: ${status.agendaSize}`);
    console.log(`World Model - Atoms: ${status.worldModelStats.atomCount}, Items: ${status.worldModelStats.itemCount}`);
    
    // Stop the core
    console.log("\nStopping cognitive core...");
    core.stop();
    
    console.log("\nDemo completed successfully!");
    console.log("\nTo interact with the full system, run:");
    console.log("  npm start        # For CLI interface");
    console.log("  npm run start:web # For web interface");
}

// Run the demo
runDemo().catch(console.error);