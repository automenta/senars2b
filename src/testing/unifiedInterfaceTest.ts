import UnifiedInterface from '../web/unifiedInterface';

async function runUnifiedTest() {
  console.log('=== Senars3 Cognitive System Unified Interface Test ===\n');
  
  // Create unified interface
  const unifiedInterface = new UnifiedInterface(8080, 3000, 2);
  
  // Start the interface
  unifiedInterface.start();
  
  // Wait a moment for the servers to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Test 1: Get system status
    console.log('1. Testing system status...\n');
    const status = unifiedInterface.getSystemStatus();
    console.log('System Status:', JSON.stringify(status, null, 2));
    
    // Test 2: Get server statistics
    console.log('\n2. Testing server statistics...\n');
    const stats = unifiedInterface.getServerStats();
    console.log('Server Statistics:', JSON.stringify(stats, null, 2));
    
    // Test 3: Add a belief
    console.log('\n3. Testing belief addition...\n');
    unifiedInterface.addBelief(
      'Chocolate is toxic to cats',
      { frequency: 0.9, confidence: 0.95 },
      { priority: 0.8, durability: 0.7 }
    );
    console.log('Belief added successfully');
    
    // Test 4: Add a goal
    console.log('\n4. Testing goal addition...\n');
    unifiedInterface.addGoal(
      'Verify if chocolate is toxic to cats',
      { priority: 0.9, durability: 0.8 }
    );
    console.log('Goal added successfully');
    
    // Test 5: Process input
    console.log('\n5. Testing input processing...\n');
    const result = await unifiedInterface.processInput(
      'My cat seems sick after eating chocolate. What should I do?'
    );
    console.log('Processed Input:', JSON.stringify(result, null, 2));
    
    // Test 6: Process another input
    console.log('\n6. Testing another input processing...\n');
    const result2 = await unifiedInterface.processInput(
      'How can I keep my cat safe from household hazards?'
    );
    console.log('Processed Input:', JSON.stringify(result2, null, 2));
    
    // Final status
    console.log('\n7. Final system status...\n');
    const finalStatus = unifiedInterface.getSystemStatus();
    console.log('Final System Status:', JSON.stringify(finalStatus, null, 2));
    
    console.log('\n=== Unified Interface Test Complete ===');
  } catch (error) {
    console.error('Error during unified test:', error);
  } finally {
    // Stop the interface
    unifiedInterface.stop();
  }
}

// Run the test
runUnifiedTest().catch(console.error);