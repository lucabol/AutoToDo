/**
 * StorageManager Tests
 * Tests for the storage manager that handles Safari private browsing fallbacks
 */

// Import the StorageManager module
const { StorageManager } = require('./js/StorageManager.js');

// Test suite
console.log('🧪 Running StorageManager Tests...');
console.log('============================================================');

let passedTests = 0;
let totalTests = 0;

function test(testName, testFunction) {
    totalTests++;
    try {
        testFunction();
        console.log(`✅ PASS: ${testName}`);
        passedTests++;
    } catch (error) {
        console.log(`❌ FAIL: ${testName}`);
        console.log(`   Error: ${error.message}`);
    }
}

// Mock localStorage for testing different scenarios
class MockLocalStorage {
    constructor(shouldThrow = false, shouldThrowOn = null, allowDetection = false) {
        this.storage = new Map();
        this.shouldThrow = shouldThrow;
        this.shouldThrowOn = shouldThrowOn;
        this.allowDetection = allowDetection;
        
        // Pre-populate the test key for detection if allowed
        if (allowDetection) {
            this.storage.set('__storage_test__', 'test');
        }
    }

    getItem(key) {
        if (this.shouldThrow) {
            throw new Error('localStorage is not available');
        }
        if (this.shouldThrowOn === 'getItem' && key !== '__storage_test__') {
            throw new Error('localStorage is not available');
        }
        return this.storage.get(key) || null;
    }

    setItem(key, value) {
        if (this.shouldThrow) {
            throw new Error('localStorage quota exceeded');
        }
        if (this.shouldThrowOn === 'setItem' && key !== '__storage_test__') {
            throw new Error('localStorage quota exceeded');
        }
        this.storage.set(key, String(value)); // LocalStorage always stores as string
    }

    removeItem(key) {
        if (this.shouldThrow) {
            throw new Error('localStorage is not available');
        }
        if (this.shouldThrowOn === 'removeItem' && key !== '__storage_test__') {
            throw new Error('localStorage is not available');
        }
        this.storage.delete(key);
    }

    clear() {
        if (this.shouldThrow || this.shouldThrowOn === 'clear') {
            throw new Error('localStorage is not available');
        }
        this.storage.clear();
    }

    get length() {
        if (this.shouldThrow || this.shouldThrowOn === 'length') {
            throw new Error('localStorage is not available');
        }
        return this.storage.size;
    }

    key(index) {
        if (this.shouldThrow || this.shouldThrowOn === 'key') {
            throw new Error('localStorage is not available');
        }
        const keys = Array.from(this.storage.keys());
        return keys[index] || null;
    }
}

// Test 1: Normal localStorage functionality
test('Should work with normal localStorage', () => {
    global.localStorage = new MockLocalStorage();
    const storage = new StorageManager();
    
    if (storage.getStorageType() !== 'localStorage') {
        throw new Error(`Expected localStorage, got ${storage.getStorageType()}`);
    }
    
    if (!storage.isLocalStorageAvailable()) {
        throw new Error('Expected localStorage to be available');
    }
});

// Test 2: Fallback when localStorage throws on detection
test('Should fallback to memory when localStorage unavailable', () => {
    global.localStorage = new MockLocalStorage(true);
    const storage = new StorageManager();
    
    if (storage.getStorageType() !== 'memory') {
        throw new Error(`Expected memory storage, got ${storage.getStorageType()}`);
    }
    
    if (storage.isLocalStorageAvailable()) {
        throw new Error('Expected localStorage to be unavailable');
    }
});

// Test 3: Basic storage operations with localStorage
test('Should perform basic storage operations with localStorage', () => {
    global.localStorage = new MockLocalStorage();
    const storage = new StorageManager();
    
    storage.setItem('test', 'value');
    const retrieved = storage.getItem('test');
    
    if (retrieved !== 'value') {
        throw new Error(`Expected 'value', got '${retrieved}'`);
    }
});

// Test 4: Basic storage operations with memory fallback
test('Should perform basic storage operations with memory fallback', () => {
    global.localStorage = new MockLocalStorage(true);
    const storage = new StorageManager();
    
    storage.setItem('test', 'value');
    const retrieved = storage.getItem('test');
    
    if (retrieved !== 'value') {
        throw new Error(`Expected 'value', got '${retrieved}'`);
    }
});

// Test 5: Runtime fallback when localStorage fails during operation
test('Should fallback to memory when localStorage fails at runtime', () => {
    global.localStorage = new MockLocalStorage(false, 'setItem', true);
    const storage = new StorageManager();
    
    // Initially should be localStorage since detection passes
    if (storage.getStorageType() !== 'localStorage') {
        throw new Error('Should initially detect localStorage');
    }
    
    // This should trigger fallback
    const success = storage.setItem('test', 'value');
    
    if (success !== false) {
        throw new Error('setItem should return false when localStorage fails');
    }
    
    if (storage.getStorageType() !== 'memory') {
        throw new Error('Should fallback to memory after localStorage failure');
    }
});

// Test 6: Remove operations
test('Should handle removeItem operations', () => {
    global.localStorage = new MockLocalStorage();
    const storage = new StorageManager();
    
    storage.setItem('test', 'value');
    storage.removeItem('test');
    const retrieved = storage.getItem('test');
    
    if (retrieved !== null) {
        throw new Error('Item should be null after removal');
    }
});

// Test 7: Clear operations
test('Should handle clear operations', () => {
    global.localStorage = new MockLocalStorage();
    const storage = new StorageManager();
    
    storage.setItem('test1', 'value1');
    storage.setItem('test2', 'value2');
    storage.clear();
    
    if (storage.length !== 0) {
        throw new Error('Storage should be empty after clear');
    }
});

// Test 8: Length property
test('Should report correct length', () => {
    global.localStorage = new MockLocalStorage();
    const storage = new StorageManager();
    
    storage.setItem('test1', 'value1');
    storage.setItem('test2', 'value2');
    
    if (storage.length !== 2) {
        throw new Error(`Expected length 2, got ${storage.length}`);
    }
});

// Test 9: Key access by index
test('Should access keys by index', () => {
    global.localStorage = new MockLocalStorage();
    const storage = new StorageManager();
    
    storage.setItem('test1', 'value1');
    const key = storage.key(0);
    
    if (key !== 'test1') {
        throw new Error(`Expected 'test1', got '${key}'`);
    }
});

// Test 10: Storage info
test('Should provide storage info', () => {
    global.localStorage = new MockLocalStorage();
    const storage = new StorageManager();
    
    const info = storage.getStorageInfo();
    
    if (typeof info !== 'object') {
        throw new Error('Storage info should be an object');
    }
    
    if (!info.hasOwnProperty('type') || !info.hasOwnProperty('isLocalStorageAvailable') || !info.hasOwnProperty('itemCount')) {
        throw new Error('Storage info should have required properties');
    }
});

// Test 11: JSON persistence (real-world scenario)
test('Should handle JSON data persistence', () => {
    global.localStorage = new MockLocalStorage();
    const storage = new StorageManager();
    
    const testData = { todos: [{ id: '1', text: 'Test todo', completed: false }] };
    storage.setItem('todos', JSON.stringify(testData));
    
    const retrieved = storage.getItem('todos');
    const parsed = JSON.parse(retrieved);
    
    if (parsed.todos[0].text !== 'Test todo') {
        throw new Error('JSON data should be persisted correctly');
    }
});

// Test 12: Multiple storage instances should be independent
test('Should handle multiple storage instances independently', () => {
    global.localStorage = new MockLocalStorage();
    const storage1 = new StorageManager();
    
    global.localStorage = new MockLocalStorage(true);
    const storage2 = new StorageManager();
    
    if (storage1.getStorageType() === storage2.getStorageType()) {
        throw new Error('Different storage instances should be independent');
    }
});

// Test 13: Graceful handling of null/undefined values
test('Should handle null and undefined values gracefully', () => {
    global.localStorage = new MockLocalStorage();
    const storage = new StorageManager();
    
    // Test getting non-existent key
    const nonExistent = storage.getItem('non-existent');
    if (nonExistent !== null) {
        throw new Error('Non-existent key should return null');
    }
    
    // Test storing and retrieving string values  
    storage.setItem('test', 'value');
    const retrieved = storage.getItem('test');
    if (retrieved !== 'value') {
        throw new Error('String value should be stored and retrieved correctly');
    }
});

// Test 14: Error logging (console.warn should be called)
test('Should log warnings when falling back to memory', () => {
    let warningCalled = false;
    const originalWarn = console.warn;
    console.warn = (...args) => {
        if (args[0] && args[0].includes('LocalStorage unavailable')) {
            warningCalled = true;
        }
    };
    
    global.localStorage = new MockLocalStorage(true);
    const storage = new StorageManager();
    
    console.warn = originalWarn;
    
    if (!warningCalled) {
        throw new Error('Should log warning when localStorage is unavailable');
    }
});

// Test 15: Edge case - localStorage available but quota exceeded
test('Should handle localStorage quota exceeded scenario', () => {
    global.localStorage = new MockLocalStorage(false, 'setItem', true);
    const storage = new StorageManager();
    
    // Should initially detect localStorage as available
    if (!storage.isLocalStorageAvailable()) {
        throw new Error('Should initially detect localStorage as available');
    }
    
    // This should fail and trigger fallback
    storage.setItem('large-data', 'x'.repeat(10000));
    
    // Should now be using memory storage
    if (storage.isLocalStorageAvailable()) {
        throw new Error('Should have fallen back to memory after quota exceeded');
    }
});

// Cleanup global after tests
delete global.localStorage;

// Summary
console.log('============================================================');
console.log(`📊 Test Results: ${passedTests} passed, ${totalTests - passedTests} failed`);
if (passedTests === totalTests) {
    console.log('🎉 All StorageManager tests passed!');
} else {
    console.log('❌ Some tests failed.');
    process.exit(1);
}