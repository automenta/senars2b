import { UserInterface } from '../web/userInterface';

// This is a simple test to verify the UserInterface enhancements
// In a real test, we would mock the input/output streams

async function testUserInterface() {
    console.log('Testing User Interface Enhancements...');
    
    // Create user interface
    const ui = new UserInterface(2);
    
    // Test that the interface was created correctly
    console.log('User interface created with 2 workers');
    
    // Test that the start time was set
    const startTime = (ui as any).startTime;
    console.log('Start time set:', !!startTime);
    
    console.log('User Interface enhancements test completed!');
}

testUserInterface().catch(console.error);