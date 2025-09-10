/**
 * StorageManager - Handles robust data persistence with fallbacks for Safari 14+ Private Browsing
 * 
 * Safari 14+ in Private Browsing mode has severe localStorage limitations:
 * - Storage quota may be 0 bytes or very limited
 * - Data may be cleared when tabs are closed
 * - Writing to localStorage may throw exceptions
 * 
 * This class provides fallback mechanisms to ensure data persistence even in restricted environments.
 */
class StorageManager {
    constructor() {
        this.storageType = this.detectBestStorage();
        this.memoryStorage = new Map();
        this.isPrivateMode = this.detectPrivateMode();
        
        // Initialize storage availability flags
        this.hasLocalStorage = this.testStorage('localStorage');
        this.hasSessionStorage = this.testStorage('sessionStorage');
        
        console.log(`StorageManager initialized with ${this.storageType} storage`);
        if (this.isPrivateMode) {
            console.warn('Private browsing mode detected - using enhanced storage fallbacks');
        }
    }

    /**
     * Detect if we're running in private browsing mode (primarily Safari)
     * @returns {boolean} True if private browsing is detected
     */
    detectPrivateMode() {
        try {
            // Safari private mode test
            if (window.safari && window.safari.pushNotification) {
                return false; // Not private mode
            }
            
            // Test localStorage quota in Safari private mode
            if (this.hasLocalStorage) {
                const testKey = '__storage_test__';
                const testValue = 'x'.repeat(1024); // 1KB test
                
                try {
                    window.localStorage.setItem(testKey, testValue);
                    window.localStorage.removeItem(testKey);
                    return false; // Storage works normally
                } catch (e) {
                    return true; // Storage quota exceeded - likely private mode
                }
            }
            
            // Additional checks for other browsers
            return false;
        } catch (e) {
            return true; // Error indicates restricted environment
        }
    }

    /**
     * Test if a storage mechanism is available and functional
     * @param {string} type - 'localStorage' or 'sessionStorage'
     * @returns {boolean} True if storage is available
     */
    testStorage(type) {
        try {
            const storage = window[type];
            if (!storage) return false;
            
            const testKey = '__test__';
            storage.setItem(testKey, 'test');
            storage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Detect the best available storage mechanism
     * @returns {string} The storage type to use
     */
    detectBestStorage() {
        // Test localStorage first (preferred)
        if (this.testStorage('localStorage')) {
            return 'localStorage';
        }
        
        // Fallback to sessionStorage
        if (this.testStorage('sessionStorage')) {
            return 'sessionStorage';
        }
        
        // Final fallback to memory storage
        return 'memory';
    }

    /**
     * Get an item from storage with fallback mechanisms
     * @param {string} key - Storage key
     * @returns {string|null} Stored value or null if not found
     */
    getItem(key) {
        try {
            // Try the detected storage type first
            if (this.storageType === 'localStorage' && this.hasLocalStorage) {
                const value = window.localStorage.getItem(key);
                if (value !== null) return value;
            }
            
            if (this.storageType === 'sessionStorage' && this.hasSessionStorage) {
                const value = window.sessionStorage.getItem(key);
                if (value !== null) return value;
            }
            
            // Check other storage types as fallback
            if (this.storageType !== 'localStorage' && this.hasLocalStorage) {
                const value = window.localStorage.getItem(key);
                if (value !== null) return value;
            }
            
            if (this.storageType !== 'sessionStorage' && this.hasSessionStorage) {
                const value = window.sessionStorage.getItem(key);
                if (value !== null) return value;
            }
            
            // Check memory storage as final fallback
            return this.memoryStorage.get(key) || null;
            
        } catch (e) {
            console.warn(`Storage getItem failed for key "${key}":`, e);
            // Return from memory storage as last resort
            return this.memoryStorage.get(key) || null;
        }
    }

    /**
     * Set an item in storage with fallback mechanisms and error handling
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {boolean} True if storage was successful
     */
    setItem(key, value) {
        let success = false;
        
        // Always store in memory as backup
        this.memoryStorage.set(key, value);
        
        try {
            // Try primary storage type
            if (this.storageType === 'localStorage' && this.hasLocalStorage) {
                window.localStorage.setItem(key, value);
                success = true;
            } else if (this.storageType === 'sessionStorage' && this.hasSessionStorage) {
                window.sessionStorage.setItem(key, value);
                success = true;
            }
            
            // Try fallback storage if primary failed
            if (!success) {
                if (this.hasLocalStorage) {
                    try {
                        window.localStorage.setItem(key, value);
                        success = true;
                    } catch (e) {
                        console.warn('localStorage fallback failed:', e);
                    }
                }
                
                if (!success && this.hasSessionStorage) {
                    try {
                        window.sessionStorage.setItem(key, value);
                        success = true;
                    } catch (e) {
                        console.warn('sessionStorage fallback failed:', e);
                    }
                }
            }
            
        } catch (e) {
            console.warn(`Storage setItem failed for key "${key}":`, e);
            
            // Try to switch to a different storage type
            this.handleStorageError(e);
        }
        
        return success || true; // Memory storage always works as final fallback
    }

    /**
     * Remove an item from all storage mechanisms
     * @param {string} key - Storage key to remove
     * @returns {boolean} True if removal was attempted
     */
    removeItem(key) {
        let success = false;
        
        try {
            // Remove from all available storage types
            if (this.hasLocalStorage) {
                window.localStorage.removeItem(key);
                success = true;
            }
            
            if (this.hasSessionStorage) {
                window.sessionStorage.removeItem(key);
                success = true;
            }
            
            // Always remove from memory
            this.memoryStorage.delete(key);
            
        } catch (e) {
            console.warn(`Storage removeItem failed for key "${key}":`, e);
        }
        
        return success;
    }

    /**
     * Handle storage errors and adapt storage strategy
     * @param {Error} error - The storage error
     */
    handleStorageError(error) {
        console.warn('Storage error detected:', error);
        
        // Check if we need to switch storage types
        if (this.storageType === 'localStorage') {
            if (this.testStorage('sessionStorage')) {
                console.log('Switching to sessionStorage due to localStorage error');
                this.storageType = 'sessionStorage';
            } else {
                console.log('Switching to memory storage due to storage errors');
                this.storageType = 'memory';
            }
        } else if (this.storageType === 'sessionStorage') {
            console.log('Switching to memory storage due to sessionStorage error');
            this.storageType = 'memory';
        }
        
        // Re-test storage availability
        this.hasLocalStorage = this.testStorage('localStorage');
        this.hasSessionStorage = this.testStorage('sessionStorage');
    }

    /**
     * Get storage information for debugging
     * @returns {Object} Storage status information
     */
    getStorageInfo() {
        return {
            currentType: this.storageType,
            hasLocalStorage: this.hasLocalStorage,
            hasSessionStorage: this.hasSessionStorage,
            isPrivateMode: this.isPrivateMode,
            memoryItems: this.memoryStorage.size,
            isSafari: (typeof navigator !== 'undefined') ? /^((?!chrome|android).)*safari/i.test(navigator.userAgent) : false
        };
    }

    /**
     * Clear all storage (for testing or reset purposes)
     * @returns {boolean} True if clear was attempted
     */
    clear() {
        try {
            if (this.hasLocalStorage) {
                window.localStorage.clear();
            }
            
            if (this.hasSessionStorage) {
                window.sessionStorage.clear();
            }
            
            this.memoryStorage.clear();
            
            return true;
        } catch (e) {
            console.warn('Storage clear failed:', e);
            return false;
        }
    }

    /**
     * Check if storage is available (any type)
     * @returns {boolean} True if any storage mechanism is available
     */
    isAvailable() {
        return this.hasLocalStorage || this.hasSessionStorage || true; // Memory is always available
    }
}

// Create a global instance for the application
window.storageManager = new StorageManager();