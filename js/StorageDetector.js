/**
 * StorageDetector - Handles detection of available storage mechanisms and browser limitations
 * 
 * This module is responsible for:
 * - Detecting available storage types (localStorage, sessionStorage)
 * - Identifying Safari 14+ Private Browsing mode limitations
 * - Testing storage functionality and quotas
 * - Providing browser-specific compatibility information
 */
class StorageDetector {
    constructor() {
        // Cache test results to avoid repeated expensive operations
        this.testCache = new Map();
        this.browserInfo = this.detectBrowser();
    }

    /**
     * Detect browser type and version for storage compatibility
     * This helps optimize detection strategies for different browsers
     * @returns {Object} Browser information including type and version
     */
    detectBrowser() {
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        
        return {
            isSafari: /^((?!chrome|android).)*safari/i.test(userAgent),
            isFirefox: /firefox/i.test(userAgent),
            isChrome: /chrome/i.test(userAgent),
            userAgent: userAgent
        };
    }

    /**
     * Test if a specific storage mechanism is available and functional
     * Uses caching to avoid repeated expensive operations
     * 
     * @param {string} storageType - 'localStorage' or 'sessionStorage'
     * @returns {boolean} True if storage is available and functional
     */
    testStorage(storageType) {
        // Return cached result if available
        if (this.testCache.has(storageType)) {
            return this.testCache.get(storageType);
        }

        let isAvailable = false;
        
        try {
            const storage = window[storageType];
            
            // Check if storage object exists
            if (!storage) {
                this.testCache.set(storageType, false);
                return false;
            }
            
            // Perform a functional test with a small test value
            const testKey = '__storage_detector_test__';
            const testValue = 'test_value';
            
            storage.setItem(testKey, testValue);
            const retrievedValue = storage.getItem(testKey);
            storage.removeItem(testKey);
            
            // Verify the storage actually works as expected
            isAvailable = (retrievedValue === testValue);
            
        } catch (error) {
            // Storage might throw exceptions in private browsing or when quota is exceeded
            console.warn(`StorageDetector: ${storageType} test failed:`, error.name);
            isAvailable = false;
        }
        
        // Cache the result for future calls
        this.testCache.set(storageType, isAvailable);
        return isAvailable;
    }

    /**
     * Detect Safari 14+ Private Browsing mode using multiple detection strategies
     * 
     * Safari 14+ in Private Browsing has these characteristics:
     * - localStorage quota may be 0 bytes or severely limited
     * - Storage operations may throw QuotaExceededError even for small data
     * - sessionStorage may have similar but less severe limitations
     * 
     * @returns {boolean} True if private browsing mode is detected
     */
    detectPrivateMode() {
        // Cache the result since this is an expensive operation
        if (this.testCache.has('privateMode')) {
            return this.testCache.get('privateMode');
        }

        let isPrivate = false;

        try {
            // Strategy 1: Safari-specific pushNotification API test
            // In normal Safari, this object exists. In private mode, it may not.
            if (this.browserInfo.isSafari && window.safari && window.safari.pushNotification) {
                // This is a positive indicator that we're NOT in private mode
                // Continue with quota testing for verification
            }
            
            // Strategy 2: Quota testing - most reliable method
            // Try to store a moderately-sized piece of data (1KB)
            // Private mode often has very limited or zero quota
            if (this.testStorage('localStorage')) {
                try {
                    const testKey = '__private_mode_quota_test__';
                    const testValue = 'x'.repeat(1024); // 1KB test data
                    
                    window.localStorage.setItem(testKey, testValue);
                    
                    // If we got here, try to store more data to test quota limits
                    const largeTestValue = 'x'.repeat(10240); // 10KB test
                    window.localStorage.setItem(testKey + '_large', largeTestValue);
                    
                    // Clean up test data
                    window.localStorage.removeItem(testKey);
                    window.localStorage.removeItem(testKey + '_large');
                    
                    // If both operations succeeded, likely not in private mode
                    isPrivate = false;
                    
                } catch (quotaError) {
                    // QuotaExceededError strongly indicates private browsing mode
                    console.warn('StorageDetector: Quota exceeded during private mode test - likely private browsing');
                    isPrivate = true;
                }
            } else {
                // If localStorage is not available at all, likely in private mode
                isPrivate = true;
            }
            
            // Strategy 3: IndexedDB test (additional verification for some browsers)
            // Some browsers restrict IndexedDB in private mode
            if (!isPrivate && typeof window.indexedDB !== 'undefined') {
                try {
                    // This is a non-blocking test
                    const idbTest = window.indexedDB.open('__private_test__', 1);
                    idbTest.onerror = () => {
                        // IDB failure could indicate private mode in some browsers
                        console.warn('StorageDetector: IndexedDB test failed - possible private browsing');
                    };
                } catch (idbError) {
                    // IDB exception could indicate private mode
                    console.warn('StorageDetector: IndexedDB access restricted - possible private browsing');
                }
            }
            
        } catch (error) {
            // Any unexpected error during detection suggests restricted environment
            console.warn('StorageDetector: Private mode detection failed with error:', error);
            isPrivate = true;
        }
        
        // Cache the result to avoid repeated expensive testing
        this.testCache.set('privateMode', isPrivate);
        
        if (isPrivate) {
            console.warn('StorageDetector: Private browsing mode detected - storage will use enhanced fallbacks');
        }
        
        return isPrivate;
    }

    /**
     * Determine the best available storage mechanism based on testing results
     * Prioritizes localStorage > sessionStorage > memory (handled by caller)
     * 
     * @returns {string} The recommended storage type: 'localStorage', 'sessionStorage', or 'memory'
     */
    detectBestStorage() {
        // Test localStorage first (preferred for persistence)
        if (this.testStorage('localStorage')) {
            return 'localStorage';
        }
        
        // Fallback to sessionStorage (temporary persistence)
        if (this.testStorage('sessionStorage')) {
            console.warn('StorageDetector: localStorage unavailable, using sessionStorage');
            return 'sessionStorage';
        }
        
        // Final fallback to memory storage (no persistence)
        console.warn('StorageDetector: No persistent storage available, will use memory storage');
        return 'memory';
    }

    /**
     * Get comprehensive storage capability information for debugging and monitoring
     * @returns {Object} Detailed storage capability information
     */
    getStorageCapabilities() {
        return {
            localStorage: this.testStorage('localStorage'),
            sessionStorage: this.testStorage('sessionStorage'),
            isPrivateMode: this.detectPrivateMode(),
            recommendedStorage: this.detectBestStorage(),
            browser: this.browserInfo,
            testCacheSize: this.testCache.size
        };
    }

    /**
     * Clear the internal test cache
     * Useful for retesting storage capabilities after browser state changes
     */
    clearCache() {
        this.testCache.clear();
    }
}

// Export for use by StorageManager
if (typeof window !== 'undefined') {
    window.StorageDetector = StorageDetector;
}

// Export for Node.js/testing environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageDetector };
}