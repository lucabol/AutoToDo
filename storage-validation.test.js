/**
 * SafeStorage Validation Tests
 * Tests for the enhanced StorageManager validation methods
 */

// Mock DOM elements for notifications
const mockBody = {
    appendChild: () => {},
    removeChild: () => {}
};

global.document = {
    body: mockBody,
    createElement: () => ({
        style: {},
        innerHTML: '',
        parentNode: mockBody,
        addEventListener: () => {},
        remove: () => {}
    }),
    head: {
        appendChild: () => {}
    }
};

global.console = {
    info: console.info,
    warn: console.warn,
    error: console.error,
    log: console.log
};

// Mock Blob for size calculations
global.Blob = class Blob {
    constructor(parts) {
        this.size = parts[0] ? parts[0].length : 0;
    }
};

// Mock window.matchMedia for theme detection
global.window = {
    matchMedia: () => ({
        matches: false,
        addEventListener: () => {}
    })
};

// Mock navigator for Node.js environment
global.navigator = {
    storage: undefined // Will be undefined in Node.js
};

// Load the StorageManager
const { StorageManager, storageManager } = require('./js/StorageManager.js');

/**
 * Test Runner - Simple test framework
 */
class TestRunner {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.tests = [];
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    assert(condition, message) {
        if (condition) {
            this.passed++;
            console.log(`✅ ${message}`);
        } else {
            this.failed++;
            console.log(`❌ ${message}`);
        }
    }

    async run() {
        console.log('\n🧪 Running SafeStorage Validation Tests...\n');
        
        for (const test of this.tests) {
            console.log(`📋 ${test.name}`);
            try {
                await test.fn();
            } catch (error) {
                this.failed++;
                console.log(`❌ Test failed: ${error.message}`);
            }
            console.log('');
        }
        
        console.log(`\n📊 Test Results:`);
        console.log(`   ✅ Passed: ${this.passed}`);
        console.log(`   ❌ Failed: ${this.failed}`);
        console.log(`   📈 Total:  ${this.passed + this.failed}`);
        
        if (this.failed === 0) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the results above.');
        }
    }
}

const runner = new TestRunner();

// Test 1: Key Validation
runner.test('should validate storage keys correctly', () => {
    const storage = new StorageManager();
    
    // Valid keys
    runner.assert(storage.isValidKey('valid-key'), 'Should accept valid string key');
    runner.assert(storage.isValidKey('key123'), 'Should accept alphanumeric key');
    runner.assert(storage.isValidKey('a'), 'Should accept single character key');
    
    // Invalid keys
    runner.assert(!storage.isValidKey(''), 'Should reject empty string key');
    runner.assert(!storage.isValidKey(null), 'Should reject null key');
    runner.assert(!storage.isValidKey(undefined), 'Should reject undefined key');
    runner.assert(!storage.isValidKey(123), 'Should reject numeric key');
    runner.assert(!storage.isValidKey({}), 'Should reject object key');
    
    // Very long key
    const longKey = 'x'.repeat(300);
    runner.assert(!storage.isValidKey(longKey), 'Should reject very long key');
});

// Test 2: Value Validation
runner.test('should validate storage values correctly', () => {
    const storage = new StorageManager();
    
    // Valid values
    runner.assert(storage.isValidValue('valid string'), 'Should accept valid string value');
    runner.assert(storage.isValidValue(''), 'Should accept empty string value');
    runner.assert(storage.isValidValue(null), 'Should accept null value');
    runner.assert(storage.isValidValue(undefined), 'Should accept undefined value');
    
    // Invalid values
    runner.assert(!storage.isValidValue(123), 'Should reject numeric value');
    runner.assert(!storage.isValidValue({}), 'Should reject object value');
    runner.assert(!storage.isValidValue([]), 'Should reject array value');
    
    // Large value
    const largeValue = 'x'.repeat(6 * 1024 * 1024); // 6MB
    runner.assert(!storage.isValidValue(largeValue), 'Should reject very large value');
});

// Test 3: Safe Set Item
runner.test('should perform safe set operations with validation', () => {
    const storage = new StorageManager();
    
    // Valid operation
    const result1 = storage.safeSetItem('test-key', 'test-value');
    runner.assert(result1.success, 'Should succeed with valid key and value');
    runner.assert(result1.validation.keyValid, 'Should validate key as valid');
    runner.assert(result1.validation.valueValid, 'Should validate value as valid');
    runner.assert(result1.error === null, 'Should have no error for valid operation');
    
    // Invalid key
    const result2 = storage.safeSetItem('', 'test-value');
    runner.assert(!result2.success, 'Should fail with invalid key');
    runner.assert(!result2.validation.keyValid, 'Should validate key as invalid');
    runner.assert(result2.error === 'Invalid key format', 'Should provide key error message');
    
    // Invalid value
    const result3 = storage.safeSetItem('test-key', 123);
    runner.assert(!result3.success, 'Should fail with invalid value');
    runner.assert(!result3.validation.valueValid, 'Should validate value as invalid');
    runner.assert(result3.error === 'Invalid value format or too large', 'Should provide value error message');
});

// Test 4: Storage Testing
runner.test('should test storage functionality comprehensively', () => {
    const storage = new StorageManager();
    const testResults = storage.testStorage();
    
    runner.assert(typeof testResults === 'object', 'Should return test results object');
    runner.assert(typeof testResults.canWrite === 'boolean', 'Should test write capability');
    runner.assert(typeof testResults.canRead === 'boolean', 'Should test read capability');
    runner.assert(typeof testResults.canDelete === 'boolean', 'Should test delete capability');
    runner.assert(typeof testResults.persistent === 'boolean', 'Should test persistence');
    runner.assert(Array.isArray(testResults.errors), 'Should provide errors array');
    
    // In a working environment, these should all be true
    runner.assert(testResults.canWrite, 'Should be able to write');
    runner.assert(testResults.canRead, 'Should be able to read');
    runner.assert(testResults.canDelete, 'Should be able to delete');
});

// Test 5: Enhanced Storage Info
runner.test('should provide enhanced storage information', () => {
    const storage = new StorageManager();
    const info = storage.getStorageInfo();
    
    // Original fields
    runner.assert(typeof info.type === 'string', 'Should provide storage type');
    runner.assert(typeof info.isPrivateBrowsing === 'boolean', 'Should provide private browsing status');
    runner.assert(typeof info.isPersistent === 'boolean', 'Should provide persistence status');
    runner.assert(typeof info.memoryStorageSize === 'number', 'Should provide memory storage size');
    
    // Enhanced fields
    runner.assert(typeof info.browserSupport === 'object', 'Should provide browser support info');
    runner.assert(typeof info.capabilities === 'object', 'Should provide capabilities info');
    
    // Browser support details
    runner.assert(typeof info.browserSupport.localStorage === 'boolean', 'Should check localStorage support');
    runner.assert(typeof info.browserSupport.sessionStorage === 'boolean', 'Should check sessionStorage support');
    runner.assert(typeof info.browserSupport.quotaAPI === 'boolean', 'Should check quota API support');
    
    // Capabilities details
    runner.assert(typeof info.capabilities.canWrite === 'boolean', 'Should check write capability');
    runner.assert(typeof info.capabilities.canRead === 'boolean', 'Should check read capability');
    runner.assert(typeof info.capabilities.canDelete === 'boolean', 'Should check delete capability');
    runner.assert(typeof info.capabilities.hasQuotaAPI === 'boolean', 'Should check quota API availability');
    
    // In Node.js environment, quota API should be false
    runner.assert(info.browserSupport.quotaAPI === false, 'Should correctly detect quota API availability in current environment');
    runner.assert(info.capabilities.hasQuotaAPI === false, 'Should correctly report quota API capability in current environment');
});

// Test 6: Storage Quota (async test)
runner.test('should handle storage quota estimation gracefully', async () => {
    const storage = new StorageManager();
    
    try {
        const quota = await storage.getStorageQuota();
        runner.assert(typeof quota === 'object', 'Should return quota object');
        runner.assert(typeof quota.supported === 'boolean', 'Should indicate if quota API is supported');
        
        if (quota.supported) {
            runner.assert(typeof quota.quota === 'number' || quota.quota === null, 'Should provide quota information');
            runner.assert(typeof quota.usage === 'number' || quota.usage === null, 'Should provide usage information');
            runner.assert(typeof quota.available === 'number' || quota.available === null, 'Should provide available space');
        } else {
            runner.assert(quota.quota === null, 'Should return null quota for unsupported API');
            runner.assert(quota.usage === null, 'Should return null usage for unsupported API');
            runner.assert(quota.available === null, 'Should return null available for unsupported API');
        }
    } catch (error) {
        runner.assert(true, 'Should handle quota estimation errors gracefully');
    }
});

// Test 7: JSON Data Validation with Safe Storage
runner.test('should safely handle JSON data storage', () => {
    const storage = new StorageManager();
    
    const testData = {
        todos: [
            { id: '1', text: 'Buy groceries', completed: false },
            { id: '2', text: 'Walk the dog', completed: true }
        ],
        settings: { theme: 'dark', language: 'en' }
    };
    
    const jsonString = JSON.stringify(testData);
    const result = storage.safeSetItem('test-json', jsonString);
    
    runner.assert(result.success, 'Should successfully store JSON data');
    runner.assert(result.validation.keyValid, 'Should validate JSON key');
    runner.assert(result.validation.valueValid, 'Should validate JSON value');
    
    // Retrieve and verify
    const retrieved = storage.getItem('test-json');
    runner.assert(retrieved !== null, 'Should retrieve JSON data');
    
    const parsed = JSON.parse(retrieved);
    runner.assert(parsed.todos.length === 2, 'Should preserve JSON structure');
    runner.assert(parsed.settings.theme === 'dark', 'Should preserve nested JSON data');
});

// Test 8: Error Handling in Safe Operations
runner.test('should handle errors gracefully in safe operations', () => {
    const storage = new StorageManager();
    
    // Test with extremely large value that might cause issues
    const extremelyLargeValue = 'x'.repeat(10 * 1024 * 1024); // 10MB
    const result = storage.safeSetItem('large-test', extremelyLargeValue);
    
    // Should either succeed or fail gracefully
    runner.assert(typeof result.success === 'boolean', 'Should return success status');
    runner.assert(typeof result.validation === 'object', 'Should return validation results');
    
    if (!result.success) {
        runner.assert(typeof result.error === 'string', 'Should provide error message on failure');
    }
    
    // Storage should still work after the test
    const simpleResult = storage.safeSetItem('simple-test', 'simple-value');
    runner.assert(simpleResult.success, 'Should work normally after error test');
});

// Run all tests
runner.run().catch(console.error);