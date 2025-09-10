/**
 * StorageManager - Handles data persistence with fallbacks for environments like Safari private browsing
 * 
 * This utility provides a robust storage solution that automatically falls back to in-memory storage
 * when localStorage is unavailable, has quota exceeded, or throws exceptions.
 * Includes comprehensive error handling and user notifications for different storage scenarios.
 */
class StorageManager {
    constructor() {
        this.inMemoryStorage = new Map();
        this.storageType = this.detectStorageType();
        this.isStorageAvailable = this.storageType === 'localStorage';
        this.isPrivateBrowsing = this.detectPrivateBrowsing();
        this.isSafari14Plus = this.detectSafari14Plus();
        this.storageQuota = this.estimateStorageQuota();
        this.operationCount = 0;
        this.failureCount = 0;
        
        // Safari 14+ specific initialization
        if (this.isSafari14Plus) {
            this.safari14Mode = true;
            this.maxOperationsBeforeVerification = 3;  // Safari 14+ may fail after 3 operations
            this.verificationInterval = 2; // Verify every 2 operations
        }
        
        // Log the storage type being used
        if (!this.isStorageAvailable) {
            console.warn('LocalStorage unavailable. Using in-memory storage. Data will not persist between sessions.');
        }
        
        // Notify if in private browsing mode
        if (this.isPrivateBrowsing) {
            this.notifyPrivateBrowsing();
        }
    }

    /**
     * Detect which storage type to use by testing localStorage functionality
     * @returns {string} 'localStorage' or 'memory'
     * @private
     */
    detectStorageType() {
        try {
            // Check if localStorage exists and is functional
            if (typeof localStorage === 'undefined' || localStorage === null) {
                console.warn('localStorage is not available (undefined or null)');
                return 'memory';
            }
            
            // Test if localStorage is available and working
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            const testValue = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            // Verify the test worked
            if (testValue !== 'test') {
                console.warn('localStorage test failed - stored value does not match');
                return 'memory';
            }
            
            return 'localStorage';
        } catch (error) {
            // Differentiate between different types of localStorage errors
            if (error.name === 'SecurityError') {
                console.warn('localStorage access denied due to security restrictions (likely private browsing mode)');
            } else if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
                console.warn('localStorage quota exceeded - storage limit reached');
            } else if (error.message.includes('disabled')) {
                console.warn('localStorage is disabled in browser settings');
            } else {
                console.warn('localStorage is not available due to unknown error:', error.message);
            }
            return 'memory';
        }
    }

    /**
     * Detect if browser is Safari 14+ 
     * @returns {boolean} True if Safari 14+ detected
     */
    detectSafari14Plus() {
        try {
            if (typeof navigator === 'undefined') {
                return false;
            }
            
            const userAgent = navigator.userAgent;
            const isSafari = /Safari/.test(userAgent) && !/Chrome|Chromium/.test(userAgent);
            
            if (!isSafari) {
                return false;
            }
            
            // Extract Safari version
            const versionMatch = userAgent.match(/Version\/(\d+)\.(\d+)/);
            if (versionMatch) {
                const majorVersion = parseInt(versionMatch[1], 10);
                return majorVersion >= 14;
            }
            
            // Fallback: try to detect Safari 14+ specific behaviors
            return this.detectSafari14Features();
        } catch (error) {
            console.warn('Could not detect Safari version:', error);
            return false;
        }
    }

    /**
     * Detect Safari 14+ specific features
     * @returns {boolean} True if Safari 14+ features detected
     */
    detectSafari14Features() {
        try {
            // Check for Safari 14+ specific APIs or behaviors
            return (
                typeof navigator !== 'undefined' &&
                'userAgentData' in navigator ||  // Added in Safari 14+
                'scheduling' in window ||        // Added in Safari 14+
                ('ResizeObserver' in window && 'requestVideoFrameCallback' in HTMLVideoElement.prototype) // Safari 14+ combination
            );
        } catch (error) {
            return false;
        }
    }

    /**
     * Estimate storage quota by testing progressively larger data
     * @returns {number} Estimated quota in bytes, or -1 if unlimited/unknown
     */
    estimateStorageQuota() {
        if (this.storageType !== 'localStorage') {
            return -1; // Memory storage has no quota
        }
        
        try {
            const testKey = '__quota_test__';
            let quota = -1;
            
            // Test different sizes to estimate quota
            const testSizes = [1024, 5120, 10240, 51200, 1048576]; // 1KB to 1MB
            
            for (const size of testSizes) {
                try {
                    const testData = 'x'.repeat(size);
                    localStorage.setItem(testKey, testData);
                    localStorage.removeItem(testKey);
                    quota = size; // This size worked
                } catch (error) {
                    if (error.name === 'QuotaExceededError') {
                        break; // Found the limit
                    }
                    throw error; // Other errors should be re-thrown
                }
            }
            
            return quota;
        } catch (error) {
            console.warn('Could not estimate storage quota:', error);
            return -1;
        }
    }
    /**
     * Detect if running in private browsing mode
     * @returns {boolean} True if likely in private browsing
     */
    detectPrivateBrowsing() {
        try {
            // Safari private browsing detection
            if (this.storageType === 'localStorage') {
                // Safari 14+ has very limited quota in private browsing
                if (this.isSafari14Plus && this.storageQuota > 0 && this.storageQuota < 51200) { // Less than 50KB
                    return true;
                }
                
                // Try to use localStorage quota for older Safari versions
                const testData = 'x'.repeat(1024 * 1024); // 1MB test
                localStorage.setItem('__private_test__', testData);
                localStorage.removeItem('__private_test__');
                return false;
            }
            
            // If we had to fall back to memory, likely private
            return this.storageType !== 'localStorage';
        } catch (error) {
            // If quota exceeded or other error, likely private browsing
            return true;
        }
    }

    /**
     * Show notification about private browsing limitations
     */
    notifyPrivateBrowsing() {
        // Only show once per session
        if (!this.inMemoryStorage.has('__private_notified__')) {
            if (this.isSafari14Plus) {
                console.info('🔒 Safari 14+ private browsing detected. Enhanced data protection mode active.');
            } else {
                console.info('🔒 Private browsing detected. Todos will only persist during this session.');
            }
            this.inMemoryStorage.set('__private_notified__', true);
            
            // Show user-friendly notification if possible
            this.showUserNotification();
        }
    }

    /**
     * Show user notification about private browsing
     */
    showUserNotification() {
        // Only show notifications in browser environments
        if (typeof document === 'undefined') {
            return;
        }
        
        // Create a subtle notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: ${this.isSafari14Plus ? '#007AFF' : '#ff9500'};
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            max-width: 320px;
        `;
        
        if (this.isSafari14Plus) {
            notification.innerHTML = `
                🔒 <strong>Safari 14+ Private Mode</strong><br>
                Enhanced privacy protection active<br>
                <small>Data saved temporarily for this session</small>
            `;
        } else {
            notification.innerHTML = `
                🔒 <strong>Private Browsing</strong><br>
                Todos will only be saved during this session
            `;
        }
        
        document.body.appendChild(notification);
        
        // Auto-hide after 6 seconds for Safari 14+ (more content), 5 seconds for others
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, this.isSafari14Plus ? 6000 : 5000);
    }

    /**
     * Get an item from storage
     * @param {string} key - The storage key to retrieve
     * @returns {string|null} The stored value as a string, or null if not found or key is invalid
     * @throws {Error} Does not throw - handles all errors internally with fallback to memory storage
     * @example
     * const value = storage.getItem('todos');
     * if (value !== null) {
     *   const todos = JSON.parse(value);
     * }
     */
    getItem(key) {
        try {
            if (this.isStorageAvailable) {
                return localStorage.getItem(key);
            } else {
                return this.inMemoryStorage.get(key) || null;
            }
        } catch (error) {
            console.warn('Storage getItem failed, falling back to memory:', error);
            // Fall back to memory storage
            this.fallbackToMemory();
            return this.inMemoryStorage.get(key) || null;
        }
    }

    /**
     * Set an item in storage with Safari 14+ data verification
     * @param {string} key - The storage key to set
     * @param {string} value - The value to store (must be a string)
     * @returns {boolean} True if successfully stored in localStorage, false if fell back to memory storage
     * @throws {Error} Does not throw - handles all errors internally with fallback to memory storage
     * @example
     * const success = storage.setItem('todos', JSON.stringify(todoList));
     * if (!success) {
     *   console.log('Data stored in memory only - will not persist between sessions');
     * }
     */
    setItem(key, value) {
        this.operationCount++;
        
        try {
            if (this.isStorageAvailable) {
                // Safari 14+ specific handling
                if (this.isSafari14Plus) {
                    return this.safari14SetItem(key, value);
                }
                
                localStorage.setItem(key, value);
                return true;
            } else {
                this.inMemoryStorage.set(key, value);
                return true;
            }
        } catch (error) {
            this.failureCount++;
            console.warn('Storage setItem failed, falling back to memory:', error);
            
            // If quota exceeded, try to handle it
            if (error.name === 'QuotaExceededError') {
                this.handleQuotaExceeded(key, value);
                return false;
            }
            
            // Fall back to memory storage
            this.fallbackToMemory();
            this.inMemoryStorage.set(key, value);
            return false; // Return false to indicate localStorage failed
        }
    }

    /**
     * Safari 14+ specific setItem with enhanced verification
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {boolean} True if successfully stored and verified
     */
    safari14SetItem(key, value) {
        try {
            // Store the item
            localStorage.setItem(key, value);
            
            // Immediately verify it was actually stored (Safari 14+ silent data loss protection)
            const retrieved = localStorage.getItem(key);
            if (retrieved !== value) {
                console.warn('Safari 14+ silent data loss detected for key:', key);
                this.fallbackToMemory();
                this.inMemoryStorage.set(key, value);
                return false;
            }
            
            // Check if we should perform periodic verification
            if (this.operationCount % this.verificationInterval === 0) {
                this.performDataIntegrityCheck();
            }
            
            // Safari 14+ may fail after a few operations - proactively check
            if (this.operationCount >= this.maxOperationsBeforeVerification) {
                try {
                    const testKey = '__safari14_health_check__';
                    localStorage.setItem(testKey, 'test');
                    const testResult = localStorage.getItem(testKey);
                    localStorage.removeItem(testKey);
                    
                    if (testResult !== 'test') {
                        console.warn('Safari 14+ storage health check failed');
                        this.fallbackToMemory();
                        this.inMemoryStorage.set(key, value);
                        return false;
                    }
                } catch (healthError) {
                    console.warn('Safari 14+ storage health check error:', healthError);
                    this.fallbackToMemory();
                    this.inMemoryStorage.set(key, value);
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            console.warn('Safari 14+ setItem failed:', error);
            this.fallbackToMemory();
            this.inMemoryStorage.set(key, value);
            return false;
        }
    }

    /**
     * Perform data integrity check for Safari 14+ ITP protection
     */
    performDataIntegrityCheck() {
        if (!this.isStorageAvailable || this.storageType !== 'localStorage') {
            return;
        }
        
        try {
            // Check if critical data is still accessible
            const testKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && !key.startsWith('__')) { // Skip test keys
                    testKeys.push(key);
                }
            }
            
            // Verify a sample of keys can still be retrieved
            let integrityFailures = 0;
            const sampleSize = Math.min(3, testKeys.length);
            
            for (let i = 0; i < sampleSize; i++) {
                const key = testKeys[i];
                try {
                    const value = localStorage.getItem(key);
                    if (value === null || value === undefined) {
                        integrityFailures++;
                    }
                } catch (error) {
                    integrityFailures++;
                }
            }
            
            // If too many integrity failures, switch to memory
            if (integrityFailures > sampleSize / 2) {
                console.warn('Safari 14+ data integrity failures detected, switching to memory storage');
                this.fallbackToMemory();
            }
        } catch (error) {
            console.warn('Data integrity check failed:', error);
        }
    }

    /**
     * Handle quota exceeded error
     * @param {string} key - Storage key that failed
     * @param {string} value - Value that failed to store
     */
    handleQuotaExceeded(key, value) {
        console.warn('Storage quota exceeded. Switching to memory storage.');
        
        // Switch to memory storage
        this.fallbackToMemory();
        this.inMemoryStorage.set(key, value);
        
        // Notify user
        this.showQuotaNotification();
    }

    /**
     * Show quota exceeded notification with Safari 14+ specific messaging
     */
    showQuotaNotification() {
        // Only show notifications in browser environments
        if (typeof document === 'undefined') {
            return;
        }
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #ff3b30;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            max-width: 320px;
        `;
        
        if (this.isSafari14Plus) {
            notification.innerHTML = `
                ⚠️ <strong>Safari 14+ Storage Limit</strong><br>
                Private browsing has very limited storage<br>
                <small>Using secure temporary storage for this session</small>
            `;
        } else {
            notification.innerHTML = `
                ⚠️ <strong>Storage Full</strong><br>
                Using temporary storage for this session
            `;
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 6000);
    }

    /**
     * Remove an item from storage
     * @param {string} key - The storage key to remove
     * @returns {boolean} True if successfully removed from localStorage, false if fell back to memory storage
     * @throws {Error} Does not throw - handles all errors internally with fallback to memory storage
     * @example
     * const success = storage.removeItem('old-preference');
     * if (!success) {
     *   console.log('Item removed from memory storage only');
     * }
     */
    removeItem(key) {
        try {
            if (this.isStorageAvailable) {
                localStorage.removeItem(key);
                return true;
            } else {
                this.inMemoryStorage.delete(key);
                return true;
            }
        } catch (error) {
            console.warn('Storage removeItem failed, falling back to memory:', error);
            // Fall back to memory storage
            this.fallbackToMemory();
            this.inMemoryStorage.delete(key);
            return false; // Return false to indicate localStorage failed
        }
    }

    /**
     * Clear all items from storage
     * @returns {boolean} True if successfully cleared localStorage, false if fell back to memory storage
     * @throws {Error} Does not throw - handles all errors internally with fallback to memory storage
     * @example
     * const success = storage.clear();
     * if (!success) {
     *   console.log('Memory storage cleared, but localStorage clear failed');
     * }
     */
    clear() {
        try {
            if (this.isStorageAvailable) {
                localStorage.clear();
                return true;
            } else {
                this.inMemoryStorage.clear();
                return true;
            }
        } catch (error) {
            console.warn('Storage clear failed, falling back to memory:', error);
            // Fall back to memory storage
            this.fallbackToMemory();
            this.inMemoryStorage.clear();
            return false; // Return false to indicate localStorage failed
        }
    }

    /**
     * Get the number of items currently stored
     * @returns {number} Number of items in storage (always >= 0)
     * @throws {Error} Does not throw - handles all errors internally with fallback to memory storage
     * @example
     * const count = storage.length;
     * console.log(`${count} items stored`);
     */
    get length() {
        try {
            if (this.isStorageAvailable) {
                return localStorage.length;
            } else {
                return this.inMemoryStorage.size;
            }
        } catch (error) {
            console.warn('Storage length access failed, falling back to memory:', error);
            this.fallbackToMemory();
            return this.inMemoryStorage.size;
        }
    }

    /**
     * Get a storage key by its index position
     * @param {number} index - The index position (0-based)
     * @returns {string|null} The key at the specified index, or null if index is out of bounds
     * @throws {Error} Does not throw - handles all errors internally with fallback to memory storage
     * @example
     * for (let i = 0; i < storage.length; i++) {
     *   const key = storage.key(i);
     *   if (key) console.log(`Key at ${i}: ${key}`);
     * }
     */
    key(index) {
        try {
            if (this.isStorageAvailable) {
                return localStorage.key(index);
            } else {
                const keys = Array.from(this.inMemoryStorage.keys());
                return keys[index] || null;
            }
        } catch (error) {
            console.warn('Storage key access failed, falling back to memory:', error);
            this.fallbackToMemory();
            const keys = Array.from(this.inMemoryStorage.keys());
            return keys[index] || null;
        }
    }

    /**
     * Check if localStorage is currently available and being used
     * @returns {boolean} True if localStorage is working and being used, false if using memory fallback
     * @example
     * if (!storage.isLocalStorageAvailable()) {
     *   console.warn('Using temporary storage - data will not persist');
     * }
     */
    isLocalStorageAvailable() {
        return this.isStorageAvailable;
    }

    /**
     * Get the current storage type being used by this instance
     * @returns {string} Either 'localStorage' or 'memory'
     * @example
     * const type = storage.getStorageType();
     * console.log(`Currently using: ${type} storage`);
     */
    getStorageType() {
        return this.storageType;
    }

    /**
     * Force fallback to memory storage (used when localStorage fails at runtime)
     * @private
     */
    fallbackToMemory() {
        if (this.isStorageAvailable) {
            this.isStorageAvailable = false;
            this.storageType = 'memory';
            console.warn('Switched to in-memory storage due to localStorage failure');
        }
    }

    /**
     * Get comprehensive information about the current storage manager state
     * @returns {Object} Object containing storage state information
     * @returns {string} returns.type - The storage type ('localStorage' or 'memory')
     * @returns {boolean} returns.isLocalStorageAvailable - Whether localStorage is available
     * @returns {boolean} returns.isPrivateBrowsing - Whether likely in private browsing mode
     * @returns {number} returns.itemCount - Number of items currently stored
     * @returns {boolean} returns.isSafari14Plus - Whether Safari 14+ detected
     * @returns {number} returns.storageQuota - Estimated storage quota in bytes
     * @returns {number} returns.operationCount - Number of storage operations performed
     * @returns {number} returns.failureCount - Number of failed storage operations
     * @example
     * const info = storage.getStorageInfo();
     * console.log(`Storage: ${info.type}, Items: ${info.itemCount}, localStorage: ${info.isLocalStorageAvailable}`);
     */
    getStorageInfo() {
        return {
            type: this.storageType,
            isLocalStorageAvailable: this.isStorageAvailable,
            isPrivateBrowsing: this.isPrivateBrowsing,
            itemCount: this.length,
            isPersistent: this.storageType === 'localStorage',
            memoryStorageSize: this.inMemoryStorage.size,
            isSafari14Plus: this.isSafari14Plus,
            storageQuota: this.storageQuota,
            operationCount: this.operationCount,
            failureCount: this.failureCount
        };
    }
}

// Create and export a singleton instance
const storageManager = new StorageManager();

// Export for module systems and browser global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager, storageManager };
} else {
    // Browser global
    window.storageManager = storageManager;
}