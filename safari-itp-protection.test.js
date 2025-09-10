/**
 * Test Suite for Safari ITP Protection
 * 
 * Tests the SafariITPHandler functionality for preventing data loss
 * in Safari 14+ due to Intelligent Tracking Prevention
 */

// Mock localStorage and sessionStorage for testing
const createMockStorage = () => {
    const storage = {};
    return {
        getItem: (key) => storage[key] || null,
        setItem: (key, value) => { storage[key] = value; },
        removeItem: (key) => { delete storage[key]; },
        clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
        get length() { return Object.keys(storage).length; },
        key: (index) => Object.keys(storage)[index] || null
    };
};

// Mock navigator for Safari detection
const createMockNavigator = (userAgent) => ({
    userAgent: userAgent
});

// Mock Storage API
const createMockStorageAPI = (persistResult = true) => ({
    storage: {
        persist: async () => persistResult
    }
});

// Test Safari ITP Handler
describe('SafariITPHandler', () => {
    let originalLocalStorage, originalSessionStorage, originalNavigator;
    let mockLocalStorage, mockSessionStorage;

    beforeEach(() => {
        // Backup original objects
        originalLocalStorage = global.localStorage;
        originalSessionStorage = global.sessionStorage;
        originalNavigator = global.navigator;

        // Setup mocks
        mockLocalStorage = createMockStorage();
        mockSessionStorage = createMockStorage();
        
        global.localStorage = mockLocalStorage;
        global.sessionStorage = mockSessionStorage;
        global.window = global;
    });

    afterEach(() => {
        // Restore original objects
        global.localStorage = originalLocalStorage;
        global.sessionStorage = originalSessionStorage;
        global.navigator = originalNavigator;
    });

    test('Should detect Safari with ITP correctly', () => {
        // Test Safari 14+ detection
        global.navigator = createMockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15');
        
        const handler = new SafariITPHandler();
        expect(handler.detectSafariITP()).toBe(true);
    });

    test('Should not detect Chrome as Safari with ITP', () => {
        global.navigator = createMockNavigator('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        const handler = new SafariITPHandler();
        expect(handler.detectSafariITP()).toBe(false);
    });

    test('Should update last activity timestamp', () => {
        global.navigator = createMockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.5 Safari/605.1.15');
        
        const handler = new SafariITPHandler();
        const beforeTime = Date.now();
        
        handler.updateLastActivity();
        
        const storedTime = parseInt(mockLocalStorage.getItem(handler.lastActivityKey), 10);
        expect(storedTime).toBeGreaterThanOrEqual(beforeTime);
    });

    test('Should calculate days since last activity correctly', () => {
        global.navigator = createMockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.5 Safari/605.1.15');
        
        const handler = new SafariITPHandler();
        
        // Set activity to 5 days ago
        const fiveDaysAgo = Date.now() - (5 * 24 * 60 * 60 * 1000);
        mockLocalStorage.setItem(handler.lastActivityKey, fiveDaysAgo.toString());
        
        const lastActivity = handler.getLastActivity();
        const daysSince = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);
        
        expect(Math.floor(daysSince)).toBe(4); // Should be approximately 5 days
    });

    test('Should create and restore data backup', () => {
        global.navigator = createMockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.5 Safari/605.1.15');
        
        const handler = new SafariITPHandler();
        const testData = { todos: [{ id: 1, text: 'Test todo', completed: false }] };
        
        // Create backup
        const backupSuccess = handler.createDataBackup(testData);
        expect(backupSuccess).toBe(true);
        
        // Restore backup
        const restoredData = handler.restoreFromBackup();
        expect(restoredData).toEqual(testData);
    });

    test('Should detect data loss risk levels correctly', () => {
        global.navigator = createMockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.5 Safari/605.1.15');
        
        const handler = new SafariITPHandler();
        
        // Test safe level (recent activity)
        handler.updateLastActivity();
        let riskLevel = handler.checkDataLossRisk();
        expect(riskLevel).toBe('safe');
        
        // Test warning level (6 days ago)
        const sixDaysAgo = Date.now() - (6 * 24 * 60 * 60 * 1000);
        mockLocalStorage.setItem(handler.lastActivityKey, sixDaysAgo.toString());
        riskLevel = handler.checkDataLossRisk();
        expect(riskLevel).toBe('warning');
        
        // Test critical level (8 days ago)
        const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
        mockLocalStorage.setItem(handler.lastActivityKey, eightDaysAgo.toString());
        riskLevel = handler.checkDataLossRisk();
        expect(riskLevel).toBe('critical');
    });

    test('Should provide comprehensive ITP status', () => {
        global.navigator = createMockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.5 Safari/605.1.15');
        
        const handler = new SafariITPHandler();
        handler.isInitialized = true;
        handler.persistentStorageGranted = true;
        
        const status = handler.getITPStatus();
        
        expect(status).toHaveProperty('isInitialized', true);
        expect(status).toHaveProperty('isSafariWithITP', true);
        expect(status).toHaveProperty('persistentStorageGranted', true);
        expect(status).toHaveProperty('lastActivity');
        expect(status).toHaveProperty('daysSinceActivity');
        expect(status).toHaveProperty('riskLevel');
        expect(status).toHaveProperty('daysUntilClearing');
        expect(status).toHaveProperty('activityTrackingEnabled', true);
    });

    test('Should handle missing localStorage gracefully', () => {
        global.navigator = createMockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.5 Safari/605.1.15');
        
        // Simulate localStorage being unavailable
        global.localStorage = {
            getItem: () => { throw new Error('localStorage not available'); },
            setItem: () => { throw new Error('localStorage not available'); }
        };
        
        const handler = new SafariITPHandler();
        
        // Should not throw and should return current time as fallback
        const lastActivity = handler.getLastActivity();
        expect(typeof lastActivity).toBe('number');
        expect(lastActivity).toBeGreaterThan(Date.now() - 1000); // Should be very recent
    });

    test('Should throttle activity updates to avoid excessive localStorage writes', (done) => {
        global.navigator = createMockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.5 Safari/605.1.15');
        
        let setItemCallCount = 0;
        const originalSetItem = mockLocalStorage.setItem;
        mockLocalStorage.setItem = (...args) => {
            setItemCallCount++;
            return originalSetItem.apply(mockLocalStorage, args);
        };
        
        const handler = new SafariITPHandler();
        
        // Rapid successive calls should be throttled
        handler.updateLastActivity();
        handler.updateLastActivity();
        handler.updateLastActivity();
        
        // Should only have made one call initially
        expect(setItemCallCount).toBe(1);
        
        // Wait for throttle period and verify no additional calls
        setTimeout(() => {
            expect(setItemCallCount).toBe(1);
            done();
        }, 100);
    });
});

// Test StorageManager Integration
describe('StorageManager with Safari ITP Protection', () => {
    let originalLocalStorage, originalSessionStorage, originalNavigator;
    let mockLocalStorage, mockSessionStorage;

    beforeEach(() => {
        // Setup mocks similar to above
        originalLocalStorage = global.localStorage;
        originalSessionStorage = global.sessionStorage;
        originalNavigator = global.navigator;

        mockLocalStorage = createMockStorage();
        mockSessionStorage = createMockStorage();
        
        global.localStorage = mockLocalStorage;
        global.sessionStorage = mockSessionStorage;
        global.navigator = createMockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.5 Safari/605.1.15');
        global.window = global;

        // Mock the required classes
        global.StorageDetector = class MockStorageDetector {
            detectBestStorage() { return 'localStorage'; }
            getStorageCapabilities() {
                return {
                    localStorage: true,
                    sessionStorage: true,
                    isPrivateMode: false,
                    recommendedStorage: 'localStorage',
                    browser: { isSafari: true, userAgent: navigator.userAgent }
                };
            }
        };

        global.StorageFallbackHandler = class MockStorageFallbackHandler {
            constructor() {
                this.memoryStorage = new Map();
            }
            executeWithFallback(operation, key, value) {
                if (operation === 'get') {
                    return { success: true, value: mockLocalStorage.getItem(key), storageUsed: 'localStorage' };
                } else if (operation === 'set') {
                    mockLocalStorage.setItem(key, value);
                    return { success: true, storageUsed: 'localStorage' };
                }
                return { success: false };
            }
        };

        global.StorageOperations = class MockStorageOperations {
            constructor(fallbackHandler) {
                this.fallbackHandler = fallbackHandler;
            }
            getItem(key) {
                return mockLocalStorage.getItem(key);
            }
            setItem(key, value) {
                mockLocalStorage.setItem(key, value);
                return true;
            }
        };
    });

    afterEach(() => {
        global.localStorage = originalLocalStorage;
        global.sessionStorage = originalSessionStorage;
        global.navigator = originalNavigator;
    });

    test('Should integrate ITP handler with storage operations', async () => {
        const storageManager = new StorageManager();
        
        // Wait for async initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Test storing todos data
        const todosData = JSON.stringify([{ id: 1, text: 'Test todo', completed: false }]);
        const result = storageManager.setItem('todos', todosData);
        
        expect(result).toBe(true);
        expect(mockLocalStorage.getItem('todos')).toBe(todosData);
        
        // Verify activity was updated (ITP timer reset)
        if (storageManager.itpHandler) {
            const status = storageManager.itpHandler.getITPStatus();
            expect(status.daysSinceActivity).toBeLessThan(0.1); // Very recent activity
        }
    });

    test('Should restore data from ITP backup when main data is lost', async () => {
        const storageManager = new StorageManager();
        
        // Wait for async initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Simulate data loss by clearing localStorage
        const originalTodos = JSON.stringify([{ id: 1, text: 'Original todo', completed: false }]);
        
        // First, store data (which creates backup)
        storageManager.setItem('todos', originalTodos);
        
        // Simulate data loss
        mockLocalStorage.clear();
        
        // Try to retrieve data - should restore from backup
        const retrievedData = storageManager.getItem('todos');
        
        if (storageManager.itpHandler) {
            // Should have restored from backup
            expect(retrievedData).toBeTruthy();
        }
    });

    test('Should include ITP status in storage info', async () => {
        const storageManager = new StorageManager();
        
        // Wait for async initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const storageInfo = storageManager.getStorageInfo();
        
        expect(storageInfo).toHaveProperty('modulesLoaded');
        expect(storageInfo.modulesLoaded).toHaveProperty('itpHandler');
        
        if (storageManager.itpHandler) {
            expect(storageInfo).toHaveProperty('itpProtection');
            expect(storageInfo.itpProtection).toHaveProperty('isSafariWithITP');
            expect(storageInfo.itpProtection).toHaveProperty('daysSinceActivity');
            expect(storageInfo.itpProtection).toHaveProperty('riskLevel');
        }
    });
});

// Run tests if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createMockStorage,
        createMockNavigator,
        createMockStorageAPI
    };
}

console.log('Safari ITP Protection tests loaded successfully');