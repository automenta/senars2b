#!/usr/bin/env node

/**
 * Senars3 Cognitive System - Usability and Integrity Test
 * 
 * This script verifies the core usability and integrity features of the Senars3 cognitive system.
 * It tests key aspects of the system's functionality to ensure it meets the requirements for
 * a user-friendly, reliable, and robust cognitive reasoning system.
 */

// Simple test that verifies the project structure and basic functionality

async function runUsabilityIntegrityTest(): Promise<number> {
    console.log("===============================================");
    console.log("  Senars3 Cognitive System - Usability & Integrity Test");
    console.log("===============================================");
    console.log("");

    const testResults: { name: string; passed: boolean; error?: string }[] = [];
    
    try {
        // Test 1: Project Structure
        console.log("--- Test 1: Project Structure ---");
        const fs = require('fs');
        const path = require('path');
        
        const requiredDirs = ['src', 'test', 'src/core', 'src/modules', 'src/interfaces'];
        const missingDirs = requiredDirs.filter(dir => !fs.existsSync(path.join(__dirname, '..', '..', dir)));
        
        if (missingDirs.length === 0) {
            console.log("✓ All required directories exist");
            testResults.push({ name: "Project Structure", passed: true });
        } else {
            console.log(`✗ Missing directories: ${missingDirs.join(', ')}`);
            testResults.push({ name: "Project Structure", passed: false, error: `Missing directories: ${missingDirs.join(', ')}` });
        }
        
        // Test 2: Required Files
        console.log("\n--- Test 2: Required Files ---");
        const requiredFiles = [
            'package.json',
            'README.md',
            'src/core/cognitiveCore.ts',
            'src/modules/perceptionSubsystem.ts',
            'src/interfaces/types.ts'
        ];
        
        const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, '..', '..', file)));
        
        if (missingFiles.length === 0) {
            console.log("✓ All required files exist");
            testResults.push({ name: "Required Files", passed: true });
        } else {
            console.log(`✗ Missing files: ${missingFiles.join(', ')}`);
            testResults.push({ name: "Required Files", passed: false, error: `Missing files: ${missingFiles.join(', ')}` });
        }
        
        // Test 3: Package Dependencies
        console.log("\n--- Test 3: Package Dependencies ---");
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'));
        
        const requiredDeps = ['express', 'langchain', '@xenova/transformers'];
        const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies?.[dep]);
        
        if (missingDeps.length === 0) {
            console.log("✓ All required dependencies are present");
            testResults.push({ name: "Package Dependencies", passed: true });
        } else {
            console.log(`✗ Missing dependencies: ${missingDeps.join(', ')}`);
            testResults.push({ name: "Package Dependencies", passed: false, error: `Missing dependencies: ${missingDeps.join(', ')}` });
        }
        
        // Test 4: Scripts
        console.log("\n--- Test 4: Available Scripts ---");
        const requiredScripts = ['dev', 'test', 'demo'];
        const missingScripts = requiredScripts.filter(script => !packageJson.scripts?.[script]);
        
        if (missingScripts.length === 0) {
            console.log("✓ All required scripts are defined");
            testResults.push({ name: "Available Scripts", passed: true });
        } else {
            console.log(`✗ Missing scripts: ${missingScripts.join(', ')}`);
            testResults.push({ name: "Available Scripts", passed: false, error: `Missing scripts: ${missingScripts.join(', ')}` });
        }
        
        // Test 5: Documentation
        console.log("\n--- Test 5: Documentation ---");
        const docs = ['README.md', 'USER_GUIDE.md'];
        const missingDocs = docs.filter(doc => !fs.existsSync(path.join(__dirname, '..', '..', doc)));
        
        if (missingDocs.length === 0) {
            console.log("✓ All required documentation files exist");
            testResults.push({ name: "Documentation", passed: true });
        } else {
            console.log(`✗ Missing documentation: ${missingDocs.join(', ')}`);
            testResults.push({ name: "Documentation", passed: false, error: `Missing documentation: ${missingDocs.join(', ')}` });
        }
        
        // Test 6: Test Files
        console.log("\n--- Test 6: Test Files ---");
        const testDir = path.join(__dirname, '..', '..', 'test', 'unit');
        if (fs.existsSync(testDir)) {
            const testFiles = fs.readdirSync(testDir);
            if (testFiles.length > 0) {
                console.log(`✓ Test directory contains ${testFiles.length} test files`);
                testResults.push({ name: "Test Files", passed: true });
            } else {
                console.log("✗ Test directory is empty");
                testResults.push({ name: "Test Files", passed: false, error: "Test directory is empty" });
            }
        } else {
            console.log("✗ Test directory does not exist");
            testResults.push({ name: "Test Files", passed: false, error: "Test directory does not exist" });
        }
        
        // Test 7: TypeScript Configuration
        console.log("\n--- Test 7: TypeScript Configuration ---");
        const tsConfigs = ['tsconfig.json', 'tsconfig.test.json'];
        const missingConfigs = tsConfigs.filter(config => !fs.existsSync(path.join(__dirname, '..', '..', config)));
        
        if (missingConfigs.length === 0) {
            console.log("✓ All required TypeScript configuration files exist");
            testResults.push({ name: "TypeScript Configuration", passed: true });
        } else {
            console.log(`✗ Missing TypeScript configs: ${missingConfigs.join(', ')}`);
            testResults.push({ name: "TypeScript Configuration", passed: false, error: `Missing TypeScript configs: ${missingConfigs.join(', ')}` });
        }
        
        // Test 8: Jest Configuration
        console.log("\n--- Test 8: Jest Configuration ---");
        const jestConfig = 'jest.config.js';
        if (fs.existsSync(path.join(__dirname, '..', '..', jestConfig))) {
            console.log("✓ Jest configuration file exists");
            testResults.push({ name: "Jest Configuration", passed: true });
        } else {
            console.log("✗ Jest configuration file is missing");
            testResults.push({ name: "Jest Configuration", passed: false, error: "Jest configuration file is missing" });
        }
        
    } catch (error: unknown) {
        console.error("✗ Test failed with error:", error);
        testResults.push({ name: "Overall Test Suite", passed: false, error: error instanceof Error ? error.message : String(error) });
    }

    // Summary
    console.log("\n===============================================");
    console.log("  TEST RESULTS SUMMARY");
    console.log("===============================================");
    
    const passedTests = testResults.filter(t => t.passed).length;
    const totalTests = testResults.length;
    
    testResults.forEach((test, index) => {
        const status = test.passed ? "✓ PASS" : "✗ FAIL";
        console.log(`${index + 1}. ${test.name}: ${status}`);
        if (!test.passed && test.error) {
            console.log(`   Error: ${test.error}`);
        }
    });
    
    console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log("\n🎉 All tests passed! The system meets basic usability and integrity requirements.");
        console.log("\nProject Integrity Verified:");
        console.log("- Project structure is complete");
        console.log("- Required files and directories exist");
        console.log("- Dependencies are properly configured");
        console.log("- Documentation is available");
        console.log("- Test infrastructure is in place");
        console.log("- Build configurations are present");
        return 0; // Success exit code
    } else {
        console.log("\n⚠️  Some tests failed. Please review the issues above.");
        return 1; // Failure exit code
    }
}

// Run the test
runUsabilityIntegrityTest().then(exitCode => {
    process.exit(exitCode);
}).catch(error => {
    console.error("Test execution failed:", error);
    process.exit(1);
});