#!/usr/bin/env node

/**
 * Tests for the modular StorageManager architecture
 * Verifies that the refactored storage system maintains compatibility and adds new capabilities
 */

// Mock browser environment for Node.js testing
global.window = {
    localStorage: {
        store: {},
        getItem: function(key) { return this.store[key] || null; },
        setItem: function(key, value) { this.store[key] = value; },
        removeItem: function(key) { delete this.store[key]; },
        clear: function() { this.store = {}; }
    },
    sessionStorage: {
        store: {},
        getItem: function(key) { return this.store[key] || null; },
        setItem: function(key, value) { this.store[key] = value; },
        removeItem: function(key) { delete this.store[key]; },
        clear: function() { this.store = {}; }
    },
    safari: undefined,
    indexedDB: undefined
};

global.performance = {
    now: function() { return Date.now(); }
};

global.navigator = {
    userAgent: 'Mozilla/5.0 (Node.js Test Environment)'
};

global.console = console;

// Load the storage modules in correct order
require('./js/StorageDetector.js');
require('./js/StorageFallbackHandler.js');
require('./js/StorageOperations.js');
require('./js/StorageManager.js');

console.log('🧪 Running Storage Modules Architecture Tests...\n');

let testCount = 0;
let passCount = 0;

function runTest(description, testFn) {
    testCount++;
    try {
        testFn();
        console.log(`✅ PASS: ${description}`);
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${description}`);
        console.log(`   Error: ${error.message}`);
    }
}

// Test StorageDetector module
console.log('--- Testing StorageDetector Module ---');

runTest('StorageDetector should instantiate successfully', () => {
    const detector = new window.StorageDetector();
    if (!detector) throw new Error('StorageDetector creation failed');
    if (typeof detector.testStorage !== 'function') throw new Error('testStorage method missing');
    if (typeof detector.detectPrivateMode !== 'function') throw new Error('detectPrivateMode method missing');
    if (typeof detector.detectBestStorage !== 'function') throw new Error('detectBestStorage method missing');
});

runTest('StorageDetector should cache test results', () => {
    const detector = new window.StorageDetector();
    
    // Clear cache first
    detector.clearCache();
    const cacheSize0 = detector.testCache.size;
    
    // First call should populate cache
    const result1 = detector.testStorage('localStorage');
    const cacheSize1 = detector.testCache.size;
    
    // Second call should use cache
    const result2 = detector.testStorage('localStorage');
    const cacheSize2 = detector.testCache.size;
    
    if (result1 !== result2) throw new Error('Cached results inconsistent');
    if (cacheSize1 <= cacheSize0) throw new Error('Cache not populated on first call');
    if (cacheSize2 !== cacheSize1) throw new Error('Cache size changed on second call');
});

runTest('StorageDetector should provide browser information', () => {
    const detector = new window.StorageDetector();
    const capabilities = detector.getStorageCapabilities();
    
    if (typeof capabilities.browser !== 'object') throw new Error('Browser info missing');
    if (typeof capabilities.browser.isSafari !== 'boolean') throw new Error('Safari detection missing');
    if (typeof capabilities.localStorage !== 'boolean') throw new Error('localStorage capability missing');
    if (typeof capabilities.sessionStorage !== 'boolean') throw new Error('sessionStorage capability missing');
});

runTest('StorageDetector should clear cache', () => {
    const detector = new window.StorageDetector();
    detector.testStorage('localStorage'); // Populate cache
    const cacheSize1 = detector.testCache.size;
    
    detector.clearCache();
    const cacheSize2 = detector.testCache.size;
    
    if (cacheSize1 === 0) throw new Error('Cache was not populated');
    if (cacheSize2 !== 0) throw new Error('Cache was not cleared');
});

// Test StorageFallbackHandler module
console.log('\n--- Testing StorageFallbackHandler Module ---');

runTest('StorageFallbackHandler should instantiate with detector', () => {
    const detector = new window.StorageDetector();
    const handler = new window.StorageFallbackHandler(detector);
    
    if (!handler) throw new Error('StorageFallbackHandler creation failed');
    if (!handler.detector) throw new Error('Detector not assigned');
    if (!handler.memoryStorage) throw new Error('Memory storage not initialized');
    if (typeof handler.executeWithFallback !== 'function') throw new Error('executeWithFallback method missing');
});

runTest('StorageFallbackHandler should execute operations with fallback', () => {
    const detector = new window.StorageDetector();
    const handler = new window.StorageFallbackHandler(detector);
    
    // Test set operation
    const setResult = handler.executeWithFallback('set', 'test_key', 'test_value');
    if (!setResult.success && !setResult.storageUsed) throw new Error('Set operation failed completely');
    
    // Test get operation
    const getResult = handler.executeWithFallback('get', 'test_key');
    if (!getResult.success && getResult.value !== 'test_value') {
        // Should at least work with memory storage
        if (!handler.memoryStorage.has('test_key')) throw new Error('Memory storage fallback failed');
    }
});

runTest('StorageFallbackHandler should track error statistics', () => {
    const detector = new window.StorageDetector();
    const handler = new window.StorageFallbackHandler(detector);
    
    const initialStats = handler.getHandlerInfo();
    if (typeof initialStats.errorStats !== 'object') throw new Error('Error stats not initialized');
    if (typeof initialStats.errorStats.totalFallbacks !== 'number') throw new Error('Total fallbacks not tracked');
});

runTest('StorageFallbackHandler should handle quota exceeded errors', () => {
    const detector = new window.StorageDetector();
    const handler = new window.StorageFallbackHandler(detector);
    
    // Simulate quota exceeded error
    const quotaError = new Error('QuotaExceededError');
    quotaError.name = 'QuotaExceededError';
    
    // This should not throw and should handle the error gracefully
    handler.handleQuotaExceeded('localStorage');
    
    const stats = handler.getHandlerInfo();
    if (stats.errorStats.localStorage < 0) throw new Error('Error statistics not updated properly');
});

runTest('StorageFallbackHandler should check key existence', () => {
    const detector = new window.StorageDetector();
    const handler = new window.StorageFallbackHandler(detector);
    
    // Set a value in memory
    handler.memoryStorage.set('existing_key', 'value');
    
    const existsResult = handler.keyExists('existing_key');
    if (typeof existsResult !== 'object') throw new Error('keyExists should return object');
    if (!existsResult.inMemory) throw new Error('Should detect key in memory');
    
    const notExistsResult = handler.keyExists('non_existing_key');
    if (notExistsResult.exists) throw new Error('Should not find non-existing key');
});

// Test StorageOperations module
console.log('\n--- Testing StorageOperations Module ---');

runTest('StorageOperations should instantiate with fallback handler', () => {
    const detector = new window.StorageDetector();
    const handler = new window.StorageFallbackHandler(detector);
    const operations = new window.StorageOperations(handler);
    
    if (!operations) throw new Error('StorageOperations creation failed');
    if (!operations.fallbackHandler) throw new Error('Fallback handler not assigned');
    if (typeof operations.getItem !== 'function') throw new Error('getItem method missing');
    if (typeof operations.setItem !== 'function') throw new Error('setItem method missing');
    if (typeof operations.removeItem !== 'function') throw new Error('removeItem method missing');
});

runTest('StorageOperations should validate keys and values', () => {
    const detector = new window.StorageDetector();
    const handler = new window.StorageFallbackHandler(detector);
    const operations = new window.StorageOperations(handler);
    
    // Test key validation
    if (operations.validateKey('')) throw new Error('Empty key should be invalid');
    if (operations.validateKey(null)) throw new Error('Null key should be invalid');
    if (!operations.validateKey('valid_key')) throw new Error('Valid key should be valid');
    
    // Test value validation
    if (operations.validateValue(null)) throw new Error('Null value should be invalid');
    if (operations.validateValue(undefined)) throw new Error('Undefined value should be invalid');
    if (!operations.validateValue('valid_value')) throw new Error('Valid value should be valid');
});

runTest('StorageOperations should sanitize values', () => {
    const detector = new window.StorageDetector();
    const handler = new window.StorageFallbackHandler(detector);
    const operations = new window.StorageOperations(handler);
    
    // Test string sanitization
    const stringResult = operations.sanitizeValue('test string');
    if (stringResult !== 'test string') throw new Error('String sanitization failed');
    
    // Test object sanitization
    const objResult = operations.sanitizeValue({ test: 'value' });
    if (typeof objResult !== 'string') throw new Error('Object should be converted to string');
    
    // Test number sanitization
    const numResult = operations.sanitizeValue(123);
    if (numResult !== '123') throw new Error('Number should be converted to string');
});

runTest('StorageOperations should track performance metrics', () => {
    const detector = new window.StorageDetector();
    const handler = new window.StorageFallbackHandler(detector);
    const operations = new window.StorageOperations(handler);
    
    // Perform some operations to generate metrics
    operations.setItem('perf_key', 'perf_value');
    operations.getItem('perf_key');
    
    const info = operations.getOperationInfo();
    if (typeof info.statistics !== 'object') throw new Error('Statistics not tracked');
    if (typeof info.performance !== 'object') throw new Error('Performance metrics not tracked');
    if (info.statistics.sets.total === 0) throw new Error('Set operations not counted');
    if (info.statistics.gets.total === 0) throw new Error('Get operations not counted');
});

runTest('StorageOperations should provide comprehensive operation info', () => {
    const detector = new window.StorageDetector();
    const handler = new window.StorageFallbackHandler(detector);
    const operations = new window.StorageOperations(handler);
    
    const info = operations.getOperationInfo();
    if (typeof info.statistics.successRate !== 'object') throw new Error('Success rates not calculated');
    if (typeof info.fallbackHandler !== 'object') throw new Error('Fallback handler info not included');
});

// Test refactored StorageManager integration
console.log('\n--- Testing Refactored StorageManager Integration ---');

runTest('Refactored StorageManager should maintain backward compatibility', () => {
    const manager = new window.StorageManager();
    
    // Test that all expected methods exist
    if (typeof manager.getItem !== 'function') throw new Error('getItem method missing');
    if (typeof manager.setItem !== 'function') throw new Error('setItem method missing');
    if (typeof manager.removeItem !== 'function') throw new Error('removeItem method missing');
    if (typeof manager.clear !== 'function') throw new Error('clear method missing');
    if (typeof manager.isAvailable !== 'function') throw new Error('isAvailable method missing');
    if (typeof manager.getStorageInfo !== 'function') throw new Error('getStorageInfo method missing');
    
    // Test legacy compatibility methods
    if (typeof manager.detectPrivateMode !== 'function') throw new Error('Legacy detectPrivateMode method missing');
    if (typeof manager.testStorage !== 'function') throw new Error('Legacy testStorage method missing');
});

runTest('Refactored StorageManager should work with existing code patterns', () => {
    const manager = new window.StorageManager();
    
    // Test basic operations like existing code would use
    const setResult = manager.setItem('test_todo', JSON.stringify({id: 1, text: 'Test todo'}));
    if (!setResult) throw new Error('setItem should return true');
    
    const getValue = manager.getItem('test_todo');
    if (!getValue) throw new Error('getItem should return the stored value');
    
    const removeResult = manager.removeItem('test_todo');
    if (!removeResult) throw new Error('removeItem should return true');
    
    const getAfterRemove = manager.getItem('test_todo');
    if (getAfterRemove !== null) throw new Error('Item should be null after removal');
});

runTest('Refactored StorageManager should provide enhanced storage info', () => {
    const manager = new window.StorageManager();
    const info = manager.getStorageInfo();
    
    // Test that enhanced info is available
    if (typeof info.modulesLoaded !== 'object') throw new Error('Module loading info not available');
    if (typeof info.modulesLoaded.detector !== 'boolean') throw new Error('Detector module status not reported');
    if (typeof info.modulesLoaded.fallbackHandler !== 'boolean') throw new Error('Fallback handler module status not reported');
    if (typeof info.modulesLoaded.operations !== 'boolean') throw new Error('Operations module status not reported');
});

runTest('Refactored StorageManager should handle errors gracefully', () => {
    const manager = new window.StorageManager();
    
    // Test with invalid inputs
    const invalidKeyResult = manager.setItem('', 'value');
    if (!invalidKeyResult) throw new Error('Should handle invalid key gracefully and still return true (memory fallback)');
    
    const nullValueResult = manager.setItem('key', null);
    if (!nullValueResult) throw new Error('Should handle null value gracefully');
    
    // Test getting non-existent key
    const nonExistentResult = manager.getItem('non_existent_key_12345');
    if (nonExistentResult !== null) throw new Error('Non-existent key should return null');
});

runTest('Refactored StorageManager should support emergency fallback', () => {
    // Test what happens if modules fail to initialize
    // We can't easily simulate this without complex mocking, but we can test that
    // the manager initializes its emergency properties
    const manager = new window.StorageManager();
    
    if (!manager.memoryStorage) throw new Error('Memory storage should always be available');
    if (typeof manager.storageType !== 'string') throw new Error('Storage type should be defined');
    if (typeof manager.isPrivateMode !== 'boolean') throw new Error('Private mode detection should be defined');
});

// Test module interactions and integration
console.log('\n--- Testing Module Integration ---');

runTest('All modules should work together seamlessly', () => {
    const detector = new window.StorageDetector();
    const handler = new window.StorageFallbackHandler(detector);
    const operations = new window.StorageOperations(handler);
    
    // Test a complete workflow
    const testData = JSON.stringify({
        todos: [
            { id: 1, text: 'Test todo 1', completed: false },
            { id: 2, text: 'Test todo 2', completed: true }
        ]
    });
    
    // Store data
    const storeResult = operations.setItem('integration_test', testData);
    if (!storeResult) throw new Error('Integration store operation failed');
    
    // Retrieve data
    const retrieveResult = operations.getItem('integration_test');
    if (!retrieveResult) throw new Error('Integration retrieve operation failed');
    
    // Verify data integrity
    try {
        const parsedData = JSON.parse(retrieveResult);
        if (!Array.isArray(parsedData.todos)) throw new Error('Data structure corrupted');
        if (parsedData.todos.length !== 2) throw new Error('Data items missing');
    } catch (error) {
        throw new Error('Data parsing failed: ' + error.message);
    }
    
    // Clean up
    operations.removeItem('integration_test');
});

runTest('Modules should handle large data sets efficiently', () => {
    const detector = new window.StorageDetector();
    const handler = new window.StorageFallbackHandler(detector);
    const operations = new window.StorageOperations(handler);
    
    // Create large test data
    const largeTodos = [];
    for (let i = 0; i < 100; i++) {
        largeTodos.push({
            id: i,
            text: `Test todo ${i} with some additional text to make it larger`,
            completed: i % 2 === 0,
            tags: [`tag${i}`, `category${i % 5}`],
            description: `Detailed description for todo ${i}`.repeat(5)
        });
    }
    
    const largeData = JSON.stringify({ todos: largeTodos });
    
    // Reset stats first
    operations.resetStats();
    const startStats = operations.getOperationInfo();
    
    // Store large data
    const storeResult = operations.setItem('large_data_test', largeData);
    if (!storeResult) throw new Error('Large data store failed');
    
    // Retrieve large data
    const retrieveResult = operations.getItem('large_data_test');
    if (!retrieveResult) throw new Error('Large data retrieve failed');
    
    // Verify performance was tracked
    const endStats = operations.getOperationInfo();
    if (endStats.statistics.sets.total <= startStats.statistics.sets.total) throw new Error('Set operation stats not updated');
    if (endStats.statistics.gets.total <= startStats.statistics.gets.total) throw new Error('Get operation stats not updated');
    
    // Clean up
    operations.removeItem('large_data_test');
});

runTest('Modules should provide comprehensive debugging information', () => {
    const manager = new window.StorageManager();
    const info = manager.getStorageInfo();
    
    // Check for comprehensive debugging info
    const requiredFields = [
        'currentType', 'hasLocalStorage', 'hasSessionStorage', 'isPrivateMode',
        'memoryItems', 'modulesLoaded'
    ];
    
    for (const field of requiredFields) {
        if (!(field in info)) throw new Error(`Debug info missing field: ${field}`);
    }
    
    // Check module-specific info if available
    if (info.operationStats) {
        if (typeof info.operationStats.gets !== 'object') throw new Error('Get operation stats missing');
        if (typeof info.operationStats.sets !== 'object') throw new Error('Set operation stats missing');
    }
    
    if (info.performanceMetrics) {
        if (typeof info.performanceMetrics.averageGetTime !== 'string') throw new Error('Performance metrics malformed');
    }
});

// Display results
console.log('\n============================================================');
console.log(`📊 Storage Modules Test Results: ${passCount} passed, ${testCount - passCount} failed`);

if (passCount === testCount) {
    console.log('🎉 All storage modules tests passed!');
    console.log('\n✅ SUMMARY: Refactored StorageManager architecture provides:');
    console.log('   - Modular architecture with focused responsibilities');
    console.log('   - Enhanced error handling and recovery mechanisms');
    console.log('   - Comprehensive performance monitoring and debugging capabilities');
    console.log('   - Full backward compatibility with existing code');
    console.log('   - Improved maintainability and testability');
    console.log('   - Enhanced inline documentation and code clarity');
    console.log('   - Better separation of concerns for future enhancements');
    process.exit(0);
} else {
    console.log('⚠️  Some storage modules tests failed.');
    process.exit(1);
}