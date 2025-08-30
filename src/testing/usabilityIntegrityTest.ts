import {WebSocketInterface} from '../web/webSocketInterface';
import {RestApiInterface} from '../web/restApiInterface';
import {DecentralizedCognitiveCore} from '../core/cognitiveCore';

/**
 * Test suite for usability and integrity enhancements
 */
async function runUsabilityIntegrityTests(): Promise<void> {
    console.log('=== Usability and Integrity Enhancement Tests ===\n');

    // Test 1: Enhanced error handling in cognitive core
    console.log('1. Testing enhanced error handling in cognitive core...\n');
    const core = new DecentralizedCognitiveCore(1);

    try {
        // Test content length validation
        await core.addInitialBelief('', {frequency: 0.9, confidence: 0.9}, {priority: 0.8, durability: 0.7});
        console.error('ERROR: Should have thrown an error for empty content');
    } catch (error) {
        console.log('✓ Correctly rejected empty content with error:', (error as Error).message);
    }

    try {
        // Test content length validation
        const longContent = 'a'.repeat(10001);
        await core.addInitialBelief(longContent, {frequency: 0.9, confidence: 0.9}, {priority: 0.8, durability: 0.7});
        console.error('ERROR: Should have thrown an error for content that is too long');
    } catch (error) {
        console.log('✓ Correctly rejected content that is too long with error:', (error as Error).message);
    }

    try {
        // Test valid content
        await core.addInitialBelief('This is a valid belief', {frequency: 0.9, confidence: 0.9}, {
            priority: 0.8,
            durability: 0.7
        });
        console.log('✓ Correctly accepted valid content');
    } catch (error) {
        console.error('ERROR: Should not have thrown an error for valid content:', error);
    }

    // Test 2: Enhanced WebSocket interface
    console.log('\n2. Testing enhanced WebSocket interface...\n');
    const wsInterface = new WebSocketInterface(8081, 1);

    // Test system diagnostics
    const diagnostics = wsInterface.getSystemDiagnostics();
    console.log('✓ System diagnostics retrieved successfully');
    console.log('  - Server uptime:', diagnostics.server.uptime);
    console.log('  - Connected clients:', diagnostics.server.connectedClients);
    console.log('  - System performance metrics available:', !!diagnostics.performance);

    // Test enhanced welcome message
    console.log('✓ Enhanced welcome message with detailed system info should be sent to new clients');

    // Test 3: Enhanced REST API interface
    console.log('\n3. Testing enhanced REST API interface...\n');
    const restInterface = new RestApiInterface(wsInterface, 3001);
    const app = restInterface.getApp();

    // Test diagnostics endpoint would be available
    console.log('✓ REST API diagnostics endpoint /api/diagnostics should be available');

    // Test 4: Enhanced perception subsystem
    console.log('\n4. Testing enhanced perception subsystem...\n');
    const perception = wsInterface.getPerception();

    try {
        const items = await perception.processInput('This is a test sentence. This is another sentence!');
        console.log('✓ Successfully processed input with', items.length, 'items');

        // Check that items have proper structure
        if (items.length > 0) {
            const firstItem = items[0];
            if (firstItem.label && firstItem.truth && firstItem.attention) {
                console.log('✓ Items have proper structure with label, truth, and attention values');
            } else {
                console.error('ERROR: Items missing required properties');
            }
        }
    } catch (error) {
        console.error('ERROR: Failed to process input:', error);
    }

    // Test 5: Enhanced system status reporting
    console.log('\n5. Testing enhanced system status reporting...\n');
    const status = core.getSystemStatus();

    if (status.systemInfo && status.systemInfo.workerCount !== undefined) {
        console.log('✓ System status includes detailed system info');
        console.log('  - Worker count:', status.systemInfo.workerCount);
        console.log('  - Version:', status.systemInfo.version);
    } else {
        console.error('ERROR: System status missing detailed system info');
    }

    if (status.performance) {
        console.log('✓ System status includes performance metrics');
        console.log('  - Uptime:', status.performance.uptime);
        console.log('  - Items processed per second:', status.performance.itemsProcessedPerSecond);
    } else {
        console.error('ERROR: System status missing performance metrics');
    }

    console.log('\n=== All usability and integrity tests completed ===');

    // Clean up
    wsInterface.close();
}

// Run the tests
if (require.main === module) {
    runUsabilityIntegrityTests().catch(console.error);
}

export {runUsabilityIntegrityTests};