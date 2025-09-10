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
     * Set an item in storage
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
     * @returns {number} returns.itemCount - Number of items currently stored
     * @example
     * const info = storage.getStorageInfo();
     * console.log(`Storage: ${info.type}, Items: ${info.itemCount}, localStorage: ${info.isLocalStorageAvailable}`);
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