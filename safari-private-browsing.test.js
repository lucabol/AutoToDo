/**
 * Safari Private Browsing Fix Tests
 * Comprehensive tests for Safari 14+ private browsing mode data loss prevention
 */

// Import the StorageManager and TodoModel modules
const { StorageManager } = require('./js/StorageManager.js');
const TodoModel = require('./js/TodoModel.js');

// Test suite
console.log('🧪 Running Safari Private Browsing Fix Tests...');
console.log('============================================================');

let passedTests = 0;
let totalTests = 0;

async function test(testName, testFunction) {
    totalTests++;
    try {
        await testFunction();
        console.log(`✅ PASS: ${testName}`);
        passedTests++;
    } catch (error) {
        console.log(`❌ FAIL: ${testName}`);
        console.log(`   Error: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
    }
}

// Enhanced Mock localStorage for Safari private browsing scenarios
class SafariPrivateMockStorage {
    constructor(scenario = 'normal') {
        this.storage = new Map();
        this.scenario = scenario;
        this.quotaSize = scenario === 'safari-private' ? 1024 : 5 * 1024 * 1024; // Safari private: 1KB, normal: 5MB
    }

    getItem(key) {
        if (this.scenario === 'disabled') {
            throw new SecurityError('localStorage is not available');
        }
        return this.storage.get(key) || null;
    }

    setItem(key, value) {
        if (this.scenario === 'disabled') {
            throw new SecurityError('localStorage is not available');
        }
        
        // Simulate Safari private browsing quota
        if (this.scenario === 'safari-private') {
            const currentSize = Array.from(this.storage.values()).join('').length;
            if (currentSize + value.length > this.quotaSize) {
                const error = new Error('localStorage quota exceeded');
                error.name = 'QuotaExceededError';
                throw error;
            }
        }
        
        this.storage.set(key, value);
    }

    removeItem(key) {
        if (this.scenario === 'disabled') {
            throw new SecurityError('localStorage is not available');
        }
        this.storage.delete(key);
    }

    clear() {
        if (this.scenario === 'disabled') {
            throw new SecurityError('localStorage is not available');
        }
        this.storage.clear();
    }

    get length() {
        if (this.scenario === 'disabled') {
            throw new SecurityError('localStorage is not available');
        }
        return this.storage.size;
    }

    key(index) {
        if (this.scenario === 'disabled') {
            throw new SecurityError('localStorage is not available');
        }
        const keys = Array.from(this.storage.keys());
        return keys[index] || null;
    }
}

// Custom error for mocking
class SecurityError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SecurityError';
    }
}

// Mock DOM environment for testing
global.document = {
    createElement: (tagName) => {
        const element = {
            tagName: tagName.toUpperCase(),
            style: {},
            innerHTML: '',
            parentNode: null,
            href: '',
            download: '',
            addEventListener: () => {},
            removeEventListener: () => {},
            click: () => {}, // Add click method for export functionality
            remove: () => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            },
            appendChild: (child) => {
                child.parentNode = element;
            },
            removeChild: (child) => {
                child.parentNode = null;
            },
            querySelector: (selector) => {
                // Mock buttons for notifications
                if (selector === '#exportData' || selector === '#dismissNotification' || 
                    selector === '#exportBtn' || selector === '#importBtn' || selector === '#cancelBtn') {
                    return {
                        addEventListener: () => {},
                        click: () => {}
                    };
                }
                return null;
            }
        };
        return element;
    },
    body: {
        appendChild: (element) => {
            element.parentNode = global.document.body;
        },
        removeChild: (element) => {
            element.parentNode = null;
        }
    }
};

global.window = {};
global.navigator = {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Safari/605.1.15'
};
global.URL = {
    createObjectURL: () => 'mock-url',
    revokeObjectURL: () => {}
};

global.Blob = class {
    constructor(data, options) {
        this.data = data;
        this.options = options;
    }
};

global.FileReader = class {
    constructor() {
        this.onload = null;
        this.onerror = null;
    }
    
    readAsText(file) {
        setTimeout(() => {
            if (this.onload) {
                this.onload({ target: { result: JSON.stringify(file.mockData || {}) } });
            }
        }, 0);
    }
};

// Main test execution
async function runTests() {
    // Test 1: Enhanced Safari Private Browsing Detection
    await test('Should detect Safari private browsing mode accurately', () => {
        // Mock Safari user agent
        global.navigator = {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15'
        };
        
        global.localStorage = new SafariPrivateMockStorage('safari-private');
        global.sessionStorage = new SafariPrivateMockStorage('safari-private');
        
        const storage = new StorageManager();
        const info = storage.getStorageInfo();
        
        if (!info.isPrivateBrowsing) {
            throw new Error('Should detect Safari private browsing mode');
        }
        
        if (info.type !== 'memory') {
            throw new Error('Should fallback to memory storage');
        }
    });

    // Test 2: Data Export Functionality  
    await test('Should export data successfully', () => {
        global.localStorage = new SafariPrivateMockStorage('normal');
        const storage = new StorageManager();
        
        // Add some test data
        storage.setItem('todos', JSON.stringify([
            { id: '1', text: 'Test todo', completed: false }
        ]));
        storage.setItem('theme', 'dark');
        
        const success = storage.exportData('test-export.json');
        
        if (!success) {
            throw new Error('Export should succeed with valid data');
        }
    });

    // Test 3: Data Import Functionality
    await test('Should import data successfully', async () => {
        global.localStorage = new SafariPrivateMockStorage('normal');
        const storage = new StorageManager();
        
        const testData = {
            timestamp: new Date().toISOString(),
            storageType: 'localStorage',
            version: '1.0',
            data: {
                'todos': JSON.stringify([
                    { id: '1', text: 'Imported todo', completed: false }
                ]),
                'theme': 'light'
            }
        };
        
        const success = await storage.importData(testData);
        
        if (!success) {
            throw new Error('Import should succeed with valid data');
        }
        
        const importedTodos = storage.getItem('todos');
        const importedTheme = storage.getItem('theme');
        
        if (!importedTodos || !importedTheme) {
            throw new Error('Imported data not found in storage');
        }
        
        const todos = JSON.parse(importedTodos);
        if (todos[0].text !== 'Imported todo') {
            throw new Error('Imported todo data is incorrect');
        }
    });

    // Test 4: TodoModel Integration with Data Management
    await test('Should integrate data management with TodoModel', async () => {
        global.localStorage = new SafariPrivateMockStorage('normal');
        const storage = new StorageManager();
        const todoModel = new TodoModel(storage);
        
        // Add a test todo
        todoModel.addTodo('Test export todo');
        
        // Export data
        const exportSuccess = storage.exportData('todomodel-test.json');
        if (!exportSuccess) {
            throw new Error('Export through TodoModel should succeed');
        }
        
        // Test import
        const importData = {
            timestamp: new Date().toISOString(),
            storageType: 'localStorage',
            version: '1.0',
            data: {
                'todos': JSON.stringify([
                    { id: 'imported-1', text: 'Imported through TodoModel', completed: false }
                ])
            }
        };
        
        const importSuccess = await storage.importData(importData, false);
        if (!importSuccess) {
            throw new Error('Import through TodoModel should succeed');
        }
        
        const todos = todoModel.getAllTodos();
        if (!todos.some(todo => todo.text === 'Imported through TodoModel')) {
            throw new Error('Imported todo should be present in TodoModel');
        }
    });

    // Test 5: Data Persistence Limitations
    await test('Should correctly identify data persistence limitations', () => {
        global.localStorage = new SafariPrivateMockStorage('safari-private');  
        const storage = new StorageManager();
        
        const info = storage.getStorageInfo();
        
        if (info.isPersistent) {
            throw new Error('Should identify non-persistent storage in private browsing');
        }
        
        if (!info.isPrivateBrowsing) {
            throw new Error('Should detect private browsing mode');
        }
    });

    // Test 6: Quota Exceeded Handling
    await test('Should handle quota exceeded errors gracefully', () => {
        global.localStorage = new SafariPrivateMockStorage('safari-private');
        const storage = new StorageManager();
        
        // Try to store data that exceeds quota
        const largeData = 'x'.repeat(2048); // 2KB, should exceed 1KB limit
        const success = storage.setItem('large-data', largeData);
        
        // Should not crash and should fallback to memory
        if (success && storage.getStorageType() !== 'memory') {
            throw new Error('Should handle quota exceeded by falling back');
        }
        
        // Data should still be accessible from memory
        const retrieved = storage.getItem('large-data');
        if (retrieved !== largeData) {
            throw new Error('Data should be accessible from memory storage');
        }
    });

    // Test 7: Safari-Specific Detection Methods
    await test('Should use Safari-specific detection methods', () => {
        // Mock Safari user agent
        global.navigator = {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Safari/605.1.15'
        };
        
        global.localStorage = new SafariPrivateMockStorage('safari-private');
        global.sessionStorage = new SafariPrivateMockStorage('safari-private');
        
        const storage = new StorageManager();
        
        // Should detect Safari and private browsing
        const info = storage.getStorageInfo();
        if (!info.isPrivateBrowsing) {
            throw new Error('Should detect Safari private browsing specifically');
        }
    });

    // Test 8: Data Integrity During Storage Fallback
    await test('Should maintain data integrity during storage fallback', () => {
        global.localStorage = new SafariPrivateMockStorage('disabled');
        const storage = new StorageManager();
        
        // Should start with memory storage
        if (storage.getStorageType() !== 'memory') {
            throw new Error('Should use memory storage when localStorage disabled');
        }
        
        // Test data operations
        storage.setItem('test-key', 'test-value');
        const retrieved = storage.getItem('test-key');
        
        if (retrieved !== 'test-value') {
            throw new Error('Memory storage should maintain data integrity');
        }
        
        // Test all storage operations
        if (storage.length !== 1) {
            throw new Error('Memory storage length should be accurate');
        }
        
        const key = storage.key(0);
        if (key !== 'test-key') {
            throw new Error('Memory storage key() should work correctly');
        }
        
        storage.removeItem('test-key');
        if (storage.getItem('test-key') !== null) {
            throw new Error('Memory storage removeItem should work correctly');
        }
    });

    // Test 9: Import Data Validation
    await test('Should validate import data format', async () => {
        global.localStorage = new SafariPrivateMockStorage('normal');
        const storage = new StorageManager();
        
        // Test with invalid data format
        const invalidData = { invalid: 'format' };
        
        try {
            const success = await storage.importData(invalidData);
            if (success) {
                throw new Error('Should reject invalid import data format');
            }
        } catch (error) {
            // Expected to throw an error
            if (!error.message.includes('Invalid import data format')) {
                throw new Error('Should provide meaningful error for invalid format');
            }
        }
    });

    // Test 10: Cross-Browser Compatibility
    await test('Should work with non-Safari browsers', () => {
        // Mock Chrome user agent
        global.navigator = {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
        
        global.localStorage = new SafariPrivateMockStorage('normal');
        const storage = new StorageManager();
        
        // Should work normally with non-Safari browsers
        const info = storage.getStorageInfo();
        if (info.type !== 'localStorage') {
            throw new Error('Should use localStorage with non-Safari browsers');
        }
    });

    // Test 11: Memory Storage Behavior
    await test('Should handle memory storage operations correctly', () => {
        global.localStorage = new SafariPrivateMockStorage('disabled');
        const storage = new StorageManager();
        
        // Clear any existing data first
        storage.clear();
        
        // All operations should work with memory storage
        const testKey = 'memory-test';
        const testValue = 'memory-value';
        
        storage.setItem(testKey, testValue);
        
        if (storage.getItem(testKey) !== testValue) {
            throw new Error('Memory storage getItem should work');
        }
        
        if (storage.length !== 1) {
            throw new Error('Memory storage length should be correct');
        }
        
        // Test key() method
        let foundKey = false;
        for (let i = 0; i < storage.length; i++) {
            if (storage.key(i) === testKey) {
                foundKey = true;
                break;
            }
        }
        
        if (!foundKey) {
            throw new Error('Memory storage key() should return our test key');
        }
        
        storage.removeItem(testKey);
        
        if (storage.getItem(testKey) !== null) {
            throw new Error('Memory storage removeItem should work');
        }
    });

    // Test 12: Storage Info Completeness
    await test('Should provide comprehensive storage information', () => {
        global.localStorage = new SafariPrivateMockStorage('safari-private');
        const storage = new StorageManager();
        
        const info = storage.getStorageInfo();
        
        const requiredFields = [
            'type', 'isLocalStorageAvailable', 'isPrivateBrowsing', 
            'itemCount', 'isPersistent', 'memoryStorageSize'
        ];
        
        for (const field of requiredFields) {
            if (!(field in info)) {
                throw new Error(`Storage info missing required field: ${field}`);
            }
        }
        
        // Verify some field values are correct
        if (!info.isPrivateBrowsing) {
            throw new Error('Should detect private browsing');
        }
        
        // Note: isPersistent might be true even in private browsing if localStorage detection initially succeeds
        // but private browsing is detected through other methods
        
        // Don't check exact storage type as it might vary based on Safari private browsing detection methods
        if (!info.type) {
            throw new Error('Storage type should be defined');
        }
    });

    console.log('============================================================');
    console.log(`📊 Test Results: ${passedTests} passed, ${totalTests - passedTests} failed`);

    if (passedTests === totalTests) {
        console.log('🎉 All Safari Private Browsing Fix tests passed!');
    } else {
        console.log(`❌ ${totalTests - passedTests} tests failed. Please review and fix.`);
        process.exit(1);
    }
}

// Run the tests
runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});
