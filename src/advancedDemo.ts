#!/usr/bin/env node

/**
 * Senars3 Cognitive System - Advanced Demo
 * 
 * This script demonstrates the advanced capabilities of the Senars3 cognitive system
 * with a complex, multi-domain scenario.
 */

import { UserInterface } from './userInterface';
import { DecentralizedCognitiveCore } from './cognitiveCore';
import { PerceptionSubsystem } from './perceptionSubsystem';

async function runAdvancedDemo() {
    console.log("===========================================");
    console.log("  Senars3 Cognitive System - Advanced Demo");
    console.log("===========================================");
    console.log("");
    
    // Create a simplified version for demonstration
    const core = new DecentralizedCognitiveCore(2);
    const perception = new PerceptionSubsystem();
    
    console.log("Initializing cognitive core...");
    await core.start();
    
    // Complex scenario: Environmental impact assessment for a new industrial project
    console.log("\n--- Complex Environmental Scenario ---");
    const complexScenario = `
    A manufacturing company plans to build a new chemical plant near a river ecosystem. 
    The plant will produce fertilizers and discharge waste water into the river. 
    Local communities depend on the river for fishing and agriculture. 
    There have been recent reports of declining fish populations and water quality issues upstream. 
    Analyze the potential environmental, economic, and social impacts of this project. 
    Consider regulatory compliance, sustainable alternatives, and stakeholder concerns. 
    Provide recommendations for a balanced approach that addresses all these factors.
    `;
    
    console.log(`Processing complex scenario:\n${complexScenario}`);
    
    try {
        const cognitiveItems = await perception.processInput(complexScenario);
        console.log(`\nExtracted ${cognitiveItems.length} cognitive item(s):`);
        
        // Group items by type for better presentation
        const beliefs = cognitiveItems.filter(item => item.type === 'BELIEF');
        const goals = cognitiveItems.filter(item => item.type === 'GOAL');
        const queries = cognitiveItems.filter(item => item.type === 'QUERY');
        
        if (beliefs.length > 0) {
            console.log("\nBeliefs identified:");
            beliefs.forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.label || 'No label'}`);
                if (item.truth) {
                    console.log(`     Truth: Frequency=${item.truth.frequency.toFixed(2)}, Confidence=${item.truth.confidence.toFixed(2)}`);
                }
            });
        }
        
        if (goals.length > 0) {
            console.log("\nGoals identified:");
            goals.forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.label || 'No label'}`);
            });
        }
        
        if (queries.length > 0) {
            console.log("\nQueries identified:");
            queries.forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.label || 'No label'}`);
            });
        }
        
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
    
    console.log("\nAdvanced demo completed!");
    console.log("\nThis demonstrates the system's ability to process complex, multi-domain scenarios");
    console.log("and extract multiple types of cognitive items from natural language input.");
}