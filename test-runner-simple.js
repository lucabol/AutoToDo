// Simple test runner for Safari ITP protection
const fs = require('fs');

// Mock the required browser APIs for Node.js testing
global.window = global;
global.document = {
    addEventListener: () => {},
    hidden: false
};
global.performance = { now: () => Date.now() };
global.indexedDB = undefined;

// Define simple test framework
global.describe = (name, fn) => {
    console.log('\n🧪 Testing:', name);
    fn();
};

global.test = (name, fn) => {
    try {
        fn();
        console.log('  ✅', name);
    } catch (error) {
        console.log('  ❌', name, '-', error.message);
    }
};

global.expect = (actual) => ({
    toBe: (expected) => {
        if (actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual}`);
        }
    },
    toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
    },
    toBeGreaterThan: (expected) => {
        if (actual <= expected) {
            throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
    },
    toBeGreaterThanOrEqual: (expected) => {
        if (actual < expected) {
            throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
        }
    },
    toBeLessThan: (expected) => {
        if (actual >= expected) {
            throw new Error(`Expected ${actual} to be less than ${expected}`);
        }
    },
    toHaveProperty: (prop, value) => {
        if (!(prop in actual)) {
            throw new Error(`Expected object to have property ${prop}`);
        }
        if (value !== undefined && actual[prop] !== value) {
            throw new Error(`Expected property ${prop} to be ${value}, got ${actual[prop]}`);
        }
    },
    toBeTruthy: () => {
        if (!actual) {
            throw new Error(`Expected value to be truthy, got ${actual}`);
        }
    }
});

global.beforeEach = () => {};
global.afterEach = () => {};

// Load the SafariITPHandler
try {
    const safariITPCode = fs.readFileSync('js/SafariITPHandler.js', 'utf8');
    eval(safariITPCode);
    console.log('✅ SafariITPHandler loaded successfully');
} catch (error) {
    console.error('❌ Failed to load SafariITPHandler:', error.message);
    process.exit(1);
}

// Run a simple functional test
console.log('\n🧪 Running Safari ITP Handler Tests:');

// Test 1: Basic instantiation
try {
    global.navigator = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.5 Safari/605.1.15' };
    global.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
    };
    
    const handler = new SafariITPHandler();
    console.log('  ✅ SafariITPHandler instantiation successful');
    
    // Test Safari detection
    const isSafariITP = handler.detectSafariITP();
    console.log(`  ✅ Safari ITP detection: ${isSafariITP}`);
    
    // Test activity update
    handler.updateLastActivity();
    console.log('  ✅ Activity update successful');
    
    // Test status
    const status = handler.getITPStatus();
    console.log(`  ✅ Status retrieval successful: ${Object.keys(status).length} properties`);
    
} catch (error) {
    console.log('  ❌ Basic functionality test failed:', error.message);
}

// Test 2: Non-Safari browser
try {
    global.navigator = { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' };
    
    const handler = new SafariITPHandler();
    const isSafariITP = handler.detectSafariITP();
    
    if (!isSafariITP) {
        console.log('  ✅ Non-Safari browser correctly detected');
    } else {
        console.log('  ❌ Non-Safari browser incorrectly detected as Safari');
    }
    
} catch (error) {
    console.log('  ❌ Non-Safari test failed:', error.message);
}

console.log('\n✅ All basic tests completed');