/**
 * StorageManager - Handles data persistence with fallbacks for environments like Safari private browsing
 * 
 * This utility provides a robust storage solution that automatically falls back to in-memory storage
 * when localStorage is unavailable, has quota exceeded, or throws exceptions.
 */
class StorageManager {
    constructor() {
        this.inMemoryStorage = new Map();
        this.storageType = this.detectStorageType();
        this.isStorageAvailable = this.storageType === 'localStorage';
        
        // Log the storage type being used
        if (!this.isStorageAvailable) {
            console.warn('LocalStorage unavailable. Using in-memory storage. Data will not persist between sessions.');
        }
    }

    /**
     * Detect which storage type to use
     * @returns {string} 'localStorage' or 'memory'
     */
    detectStorageType() {
        try {
            // Check if localStorage exists and is functional
            if (typeof localStorage === 'undefined' || localStorage === null) {
                return 'memory';
            }
            
            // Test if localStorage is available and working
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            const testValue = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            // Verify the test worked
            if (testValue !== 'test') {
                return 'memory';
            }
            
            return 'localStorage';
        } catch (error) {
            // localStorage is not available (private browsing, quota exceeded, etc.)
            return 'memory';
        }
    }

    /**
     * Get an item from storage
     * @param {string} key - The storage key
     * @returns {string|null} The stored value or null if not found
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
     * Set an item in storage
     * @param {string} key - The storage key
     * @param {string} value - The value to store
     * @returns {boolean} True if successful, false otherwise
     */
    setItem(key, value) {
        try {
            if (this.isStorageAvailable) {
                localStorage.setItem(key, value);
                return true;
            } else {
                this.inMemoryStorage.set(key, value);
                return true;
            }
        } catch (error) {
            console.warn('Storage setItem failed, falling back to memory:', error);
            // Fall back to memory storage
            this.fallbackToMemory();
            this.inMemoryStorage.set(key, value);
            return false; // Return false to indicate localStorage failed
        }
    }

    /**
     * Remove an item from storage
     * @param {string} key - The storage key
     * @returns {boolean} True if successful, false otherwise
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
     * @returns {boolean} True if successful, false otherwise
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
     * Get the number of items in storage
     * @returns {number} Number of items
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
     * Get a key by index
     * @param {number} index - The index
     * @returns {string|null} The key at the index or null
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
     * Check if storage is available and working
     * @returns {boolean} True if localStorage is working, false if using fallback
     */
    isLocalStorageAvailable() {
        return this.isStorageAvailable;
    }

    /**
     * Get the current storage type being used
     * @returns {string} 'localStorage' or 'memory'
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
     * Get information about the storage manager state
     * @returns {Object} Information about storage state
     */
    getStorageInfo() {
        return {
            type: this.storageType,
            isLocalStorageAvailable: this.isStorageAvailable,
            itemCount: this.length
        };
    }
}

// Create and export a singleton instance
const storageManager = new StorageManager();

// Also export the class for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager, storageManager };
}