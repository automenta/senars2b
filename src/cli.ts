#!/usr/bin/env node

import { UserInterface } from './userInterface';
import { DecentralizedCognitiveCore } from './cognitiveCore';
import { PerceptionSubsystem } from './perceptionSubsystem';

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // Start interactive mode
        const ui = new UserInterface(4);
        await ui.start();
        return;
    }
    
    // Process command-line input
    const input = args.join(' ');
    
    // Create a simplified version for one-off processing
    const core = new DecentralizedCognitiveCore(2);
    const perception = new PerceptionSubsystem();
    
    console.log(`Processing: "${input}"`);
    
    try {
        // Process the input
        const cognitiveItems = await perception.processInput(input);
        
        if (cognitiveItems.length === 0) {
            console.log("No cognitive items were extracted from your input.");
            return;
        }
        
        console.log(`Extracted ${cognitiveItems.length} cognitive item(s):`);
        cognitiveItems.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.type}: ${item.label || 'No label'}`);
        });
        
        console.log("");
        console.log("In interactive mode, these items would be added to the agenda for processing.");
        console.log("Start the system with 'npm start' for full cognitive processing.");
        
    } catch (error) {
        console.error("Error processing input:", error);
    }
}

main().catch(console.error);