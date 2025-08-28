// Simple test to verify the new unified interface
console.log('Testing new unified interface...');

// Check if required elements exist
const requiredElements = [
    'notification-container',
    'connection-status',
    'system-status',
    'agenda-count',
    'atom-count',
    'item-count',
    'processed-count',
    'worker-count',
    'uptime',
    'system-load',
    'heap-used',
    'heap-total'
];

let allElementsFound = true;
for (const elementId of requiredElements) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with ID '${elementId}' not found`);
        allElementsFound = false;
    }
}

if (allElementsFound) {
    console.log('All required elements found. Interface test passed.');
} else {
    console.error('Interface test failed. Some elements are missing.');
}

// Test navigation
const navItems = document.querySelectorAll('.nav-item');
console.log(`Found ${navItems.length} navigation items`);

// Test demo cards
const demoCards = document.querySelectorAll('.demo-card');
console.log(`Found ${demoCards.length} demo cards`);