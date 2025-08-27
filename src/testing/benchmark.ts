import { DecentralizedCognitiveCore } from '../core/cognitiveCore';
import { TruthValue, AttentionValue } from '../interfaces/types';

async function runBenchmark() {
    console.log("Starting benchmark test...");
    
    // Create the cognitive core with a small worker pool for testing
    const core = new DecentralizedCognitiveCore(4);
    
    // Add enhanced schemas
    console.log("Adding schemas...");
    
    // Add a large number of initial beliefs and goals for benchmarking
    console.log("Adding initial beliefs and goals...");
    const startTime = Date.now();
    
    const truth: TruthValue = { frequency: 0.8, confidence: 0.9 };
    const attention: AttentionValue = { priority: 0.7, durability: 0.6 };
    
    // Add 100 beliefs
    for (let i = 0; i < 100; i++) {
        core.addInitialBelief(`Test belief ${i}`, truth, attention, {
            domain: "test",
            author: "benchmark",
            trust_score: 0.8
        });
    }
    
    // Add 50 goals
    for (let i = 0; i < 50; i++) {
        core.addInitialGoal(`Test goal ${i}`, attention, {
            domain: "test",
            author: "benchmark"
        });
    }
    
    const setupTime = Date.now() - startTime;
    console.log(`Setup completed in ${setupTime}ms`);
    
    // Start the cognitive core
    console.log("Starting cognitive core...");
    await core.start();
    
    // Let it run for a bit to process items
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log("Stopping cognitive core...");
    core.stop();
    
    // Print system status
    const status = core.getSystemStatus();
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log("Benchmark results:");
    console.log(`  Total time: ${totalTime}ms`);
    console.log(`  Setup time: ${setupTime}ms`);
    console.log(`  Processing time: ${totalTime - setupTime}ms`);
    console.log(`  Agenda size: ${status.agendaSize}`);
    console.log(`  World model stats: ${JSON.stringify(status.worldModelStats)}`);
    
    // Calculate throughput
    const totalItems = status.worldModelStats.itemCount;
    const throughput = totalItems / ((totalTime - setupTime) / 1000);
    console.log(`  Throughput: ${throughput.toFixed(2)} items/second`);
    
    // Worker statistics
    console.log("  Worker statistics:");
    for (const [workerId, stats] of status.workerStats.entries()) {
        console.log(`    Worker ${workerId}: ${stats.itemsProcessed} items processed, ${stats.errors} errors`);
    }
    
    console.log("Benchmark test completed!");
}

// Run the benchmark
if (require.main === module) {
    runBenchmark().catch(console.error);
}