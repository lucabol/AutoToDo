/**
 * StorageManager Tests
 * Tests for robust storage handling including private browsing scenarios
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
        parentNode: mockBody
    })
};

global.console = {
    info: console.info,
    warn: console.warn,
    error: console.error,
    log: console.log
};

// Mock window.matchMedia for theme detection
global.window = {
    matchMedia: () => ({
        matches: false,
        addEventListener: () => {}
    })
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
            console.log(`✅ PASS: ${message}`);
            this.passed++;
        } else {
            console.log(`❌ FAIL: ${message}`);
            this.failed++;
        }
    }

    async run() {
        console.log('🧪 Running StorageManager Tests...\n');
        console.log('============================================================');

        for (const test of this.tests) {
            try {
                await test.fn();
            } catch (error) {
                console.log(`❌ FAIL: ${test.name} - ${error.message}`);
                this.failed++;
            }
        }

        console.log('============================================================');
        console.log(`📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
        
        if (this.failed === 0) {
            console.log('🎉 All StorageManager tests passed!');
        } else {
            console.log(`⚠️  ${this.failed} test(s) failed.`);
        }

        return this.failed === 0;
    }
}

const runner = new TestRunner();

// Test 1: StorageManager Creation
runner.test('should create StorageManager instance', () => {
    const storage = new StorageManager();
    runner.assert(storage instanceof StorageManager, 'StorageManager instance created');
    runner.assert(typeof storage.getItem === 'function', 'Has getItem method');
    runner.assert(typeof storage.setItem === 'function', 'Has setItem method');
    runner.assert(typeof storage.removeItem === 'function', 'Has removeItem method');
    runner.assert(typeof storage.clear === 'function', 'Has clear method');
});

// Test 2: Storage Detection with Working localStorage
runner.test('should detect localStorage when available', () => {
    // Mock working localStorage
    global.localStorage = {
        setItem: () => {},
        getItem: () => null,
        removeItem: () => {}
    };

    const storage = new StorageManager();
    const info = storage.getStorageInfo();
    
    runner.assert(info.type === 'localStorage', 'Detected localStorage as primary storage');
});

// Test 3: Fallback to sessionStorage
runner.test('should fallback to sessionStorage when localStorage fails', () => {
    // Mock failing localStorage
    global.localStorage = {
        setItem: () => { throw new Error('localStorage disabled'); },
        getItem: () => { throw new Error('localStorage disabled'); },
        removeItem: () => { throw new Error('localStorage disabled'); }
    };

    // Mock working sessionStorage
    global.sessionStorage = {
        setItem: () => {},
        getItem: () => null,
        removeItem: () => {}
    };

    const storage = new StorageManager();
    const info = storage.getStorageInfo();
    
    runner.assert(info.type === 'sessionStorage', 'Fell back to sessionStorage');
});

// Test 4: Fallback to Memory Storage
runner.test('should fallback to memory storage when both localStorage and sessionStorage fail', () => {
    // Mock failing localStorage and sessionStorage
    global.localStorage = {
        setItem: () => { throw new Error('localStorage disabled'); },
        getItem: () => { throw new Error('localStorage disabled'); },
        removeItem: () => { throw new Error('localStorage disabled'); }
    };

    global.sessionStorage = {
        setItem: () => { throw new Error('sessionStorage disabled'); },
        getItem: () => { throw new Error('sessionStorage disabled'); },
        removeItem: () => { throw new Error('sessionStorage disabled'); }
    };

    const storage = new StorageManager();
    const info = storage.getStorageInfo();
    
    runner.assert(info.type === 'memory', 'Fell back to memory storage');
    runner.assert(!info.isPersistent, 'Memory storage is not persistent');
});

// Test 5: Basic Storage Operations
runner.test('should handle basic storage operations', () => {
    const storage = new StorageManager();
    
    // Test setItem and getItem
    const success = storage.setItem('test-key', 'test-value');
    runner.assert(success, 'setItem should return true on success');
    
    const value = storage.getItem('test-key');
    runner.assert(value === 'test-value', 'getItem should return stored value');
    
    // Test removeItem
    const removed = storage.removeItem('test-key');
    runner.assert(removed, 'removeItem should return true on success');
    
    const removedValue = storage.getItem('test-key');
    runner.assert(removedValue === null, 'getItem should return null after removal');
});

// Test 6: JSON Data Storage (like TodoModel uses)
runner.test('should handle JSON data storage correctly', () => {
    const storage = new StorageManager();
    
    const testData = [
        { id: '1', text: 'Buy groceries', completed: false },
        { id: '2', text: 'Walk the dog', completed: true }
    ];
    
    const jsonData = JSON.stringify(testData);
    storage.setItem('todos', jsonData);
    
    const retrieved = storage.getItem('todos');
    runner.assert(retrieved === jsonData, 'JSON data stored and retrieved correctly');
    
    const parsed = JSON.parse(retrieved);
    runner.assert(Array.isArray(parsed), 'Retrieved data can be parsed as JSON');
    runner.assert(parsed.length === 2, 'Parsed data has correct length');
    runner.assert(parsed[0].text === 'Buy groceries', 'Parsed data has correct content');
});

// Test 7: Private Browsing Detection
runner.test('should detect private browsing mode', () => {
    // Mock quota exceeded error (simulates Safari private browsing)
    global.localStorage = {
        setItem: (key, value) => {
            if (value.length > 1000) {
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                throw error;
            }
        },
        getItem: () => null,
        removeItem: () => {}
    };

    const storage = new StorageManager();
    const info = storage.getStorageInfo();
    
    runner.assert(info.isPrivateBrowsing, 'Should detect private browsing mode');
});

// Test 8: Quota Exceeded Handling
runner.test('should handle quota exceeded gracefully', () => {
    const storage = new StorageManager();
    
    // Mock quota exceeded error
    const originalSetItem = storage.storage ? storage.storage.setItem : null;
    
    // Force quota exceeded scenario
    global.localStorage = {
        setItem: () => {
            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            throw error;
        },
        getItem: () => null,
        removeItem: () => {}
    };

    // This should trigger the quota exceeded handler
    const success = storage.setItem('large-data', 'x'.repeat(10000));
    
    // Should still work via memory storage fallback
    runner.assert(storage.getItem('large-data') !== null, 'Data should be available via memory fallback');
});

// Test 9: Storage Info Method
runner.test('should provide accurate storage information', () => {
    const storage = new StorageManager();
    const info = storage.getStorageInfo();
    
    runner.assert(typeof info === 'object', 'getStorageInfo returns object');
    runner.assert(typeof info.type === 'string', 'Has storage type');
    runner.assert(typeof info.isPrivateBrowsing === 'boolean', 'Has private browsing flag');
    runner.assert(typeof info.isPersistent === 'boolean', 'Has persistence flag');
    runner.assert(typeof info.memoryStorageSize === 'number', 'Has memory storage size');
});

// Test 10: Clear Storage
runner.test('should clear all storage correctly', () => {
    const storage = new StorageManager();
    
    // Add some test data
    storage.setItem('key1', 'value1');
    storage.setItem('key2', 'value2');
    
    runner.assert(storage.getItem('key1') === 'value1', 'Data stored correctly');
    
    // Clear storage
    const cleared = storage.clear();
    runner.assert(cleared, 'clear() should return true');
    
    // Verify data is gone
    runner.assert(storage.getItem('key1') === null, 'Data cleared correctly');
    runner.assert(storage.getItem('key2') === null, 'All data cleared');
});

// Run all tests
runner.run().then(success => {
    process.exit(success ? 0 : 1);
});