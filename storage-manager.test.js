/**
 * Storage Manager Tests
 * Tests the storage fallback functionality for Safari private browsing
 */

// Mock DOM environment for Node.js testing
if (typeof document === 'undefined') {
    global.document = {
        createElement: () => ({
            className: '',
            innerHTML: '',
            style: {},
            appendChild: () => {},
            remove: () => {},
            parentElement: null
        }),
        head: { appendChild: () => {} },
        body: { appendChild: () => {} }
    };
    
    global.window = {
        localStorage: {
            getItem: (key) => null,
            setItem: (key, value) => {},
            removeItem: (key) => {}
        },
        sessionStorage: {
            getItem: (key) => null,
            setItem: (key, value) => {},
            removeItem: (key) => {}
        }
    };
    
    global.console = console;
    global.setTimeout = setTimeout;
    global.Map = Map;
}

// Load the StorageManager class by evaluating the file content
const fs = require('fs');
const path = require('path');
const storageManagerPath = path.join(__dirname, 'js', 'StorageManager.js');
const storageManagerCode = fs.readFileSync(storageManagerPath, 'utf8');

// Remove the class declaration and add it to global scope
eval(storageManagerCode.replace('class StorageManager', 'global.StorageManager = class StorageManager'));
const StorageManager = global.StorageManager;

/**
 * Test runner setup
 */
let testCount = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(description, testFunction) {
    testCount++;
    try {
        testFunction();
        console.log(`✅ PASS: ${description}`);
        passedTests++;
    } catch (error) {
        console.log(`❌ FAIL: ${description}`);
        console.log(`   Error: ${error.message}`);
        failedTests++;
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertTrue(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertFalse(condition, message) {
    if (condition) {
        throw new Error(message);
    }
}

console.log('🧪 Running StorageManager Tests...\n');

/**
 * Test StorageManager initialization
 */
runTest('should create StorageManager instance', () => {
    const storageManager = new StorageManager();
    assertTrue(storageManager instanceof StorageManager, 'Should create instance');
    assertTrue(typeof storageManager.initialize === 'function', 'Should have initialize method');
});

/**
 * Test storage detection
 */
runTest('should detect storage type', () => {
    const storageManager = new StorageManager();
    assertTrue(typeof storageManager.storageType === 'string', 'Should set storage type');
    assertTrue(['localStorage', 'sessionStorage', 'memory'].includes(storageManager.storageType), 
        'Should use valid storage type');
});

/**
 * Test memory storage fallback
 */
runTest('should use memory storage when other storage fails', () => {
    // Mock failing storage
    const originalLocalStorage = global.window.localStorage;
    const originalSessionStorage = global.window.sessionStorage;
    
    global.window.localStorage = null;
    global.window.sessionStorage = null;
    
    const storageManager = new StorageManager();
    assertEqual(storageManager.storageType, 'memory', 'Should fallback to memory storage');
    
    // Restore original storage
    global.window.localStorage = originalLocalStorage;
    global.window.sessionStorage = originalSessionStorage;
});

/**
 * Test setItem and getItem functionality
 */
runTest('should store and retrieve data', () => {
    const storageManager = new StorageManager();
    const testKey = 'test-key';
    const testValue = 'test-value';
    
    storageManager.setItem(testKey, testValue);
    const retrieved = storageManager.getItem(testKey);
    
    assertEqual(retrieved, testValue, 'Should retrieve stored data');
});

/**
 * Test JSON data storage
 */
runTest('should handle JSON data storage', () => {
    const storageManager = new StorageManager();
    const testKey = 'todos';
    const testData = [
        { id: '1', text: 'Test todo', completed: false },
        { id: '2', text: 'Another todo', completed: true }
    ];
    
    storageManager.setItem(testKey, JSON.stringify(testData));
    const retrieved = storageManager.getItem(testKey);
    const parsedData = JSON.parse(retrieved);
    
    assertEqual(parsedData.length, 2, 'Should store array data');
    assertEqual(parsedData[0].text, 'Test todo', 'Should preserve object properties');
});

/**
 * Test removeItem functionality
 */
runTest('should remove stored data', () => {
    const storageManager = new StorageManager();
    const testKey = 'test-remove';
    const testValue = 'will-be-removed';
    
    storageManager.setItem(testKey, testValue);
    assertEqual(storageManager.getItem(testKey), testValue, 'Should store data initially');
    
    storageManager.removeItem(testKey);
    assertEqual(storageManager.getItem(testKey), null, 'Should remove data');
});

/**
 * Test storage info
 */
runTest('should provide storage information', () => {
    const storageManager = new StorageManager();
    const info = storageManager.getStorageInfo();
    
    assertTrue(typeof info === 'object', 'Should return object');
    assertTrue(typeof info.type === 'string', 'Should include storage type');
    assertTrue(typeof info.isPersistent === 'boolean', 'Should include persistence info');
    assertTrue(typeof info.isSessionBased === 'boolean', 'Should include session info');
    assertTrue(typeof info.isInMemory === 'boolean', 'Should include memory info');
});

/**
 * Test quota exceeded error detection
 */
runTest('should detect quota exceeded errors', () => {
    const storageManager = new StorageManager();
    
    const quotaError = new Error('Quota exceeded');
    quotaError.name = 'QuotaExceededError';
    
    assertTrue(storageManager.isQuotaExceededError(quotaError), 
        'Should detect QuotaExceededError');
    
    const regularError = new Error('Some other error');
    assertFalse(storageManager.isQuotaExceededError(regularError), 
        'Should not detect regular errors as quota errors');
});

/**
 * Test storage testing functionality
 */
runTest('should test storage availability', () => {
    const storageManager = new StorageManager();
    
    // Test with available storage
    const result = storageManager.testStorage('localStorage');
    assertTrue(typeof result === 'boolean', 'Should return boolean result');
});

/**
 * Test fallback storage determination
 */
runTest('should determine fallback storage correctly', () => {
    const storageManager = new StorageManager();
    
    storageManager.storageType = 'localStorage';
    const fallback1 = storageManager.getFallbackStorage();
    assertTrue(['sessionStorage', 'memory'].includes(fallback1), 
        'Should provide valid fallback from localStorage');
    
    storageManager.storageType = 'sessionStorage';
    const fallback2 = storageManager.getFallbackStorage();
    assertEqual(fallback2, 'memory', 'Should fallback to memory from sessionStorage');
    
    storageManager.storageType = 'memory';
    const fallback3 = storageManager.getFallbackStorage();
    assertEqual(fallback3, null, 'Should have no fallback from memory');
});

/**
 * Test memory storage map functionality
 */
runTest('should use memory storage map correctly', () => {
    const storageManager = new StorageManager();
    storageManager.storageType = 'memory';
    
    const key = 'memory-test';
    const value = 'memory-value';
    
    storageManager.setItem(key, value);
    assertTrue(storageManager.memoryStorage.has(key), 'Should store in memory map');
    
    const retrieved = storageManager.getItem(key);
    assertEqual(retrieved, value, 'Should retrieve from memory map');
    
    storageManager.removeItem(key);
    assertFalse(storageManager.memoryStorage.has(key), 'Should remove from memory map');
});

// Print test results
console.log('\n============================================================');
console.log(`📊 StorageManager Test Results: ${passedTests} passed, ${failedTests} failed`);

if (failedTests === 0) {
    console.log('🎉 All StorageManager tests passed!');
} else {
    console.log(`⚠️  ${failedTests} test(s) failed.`);
    process.exit(1);
}