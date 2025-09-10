/**
 * StorageManager - Handles data persistence with fallback strategies for Safari private browsing
 * 
 * Provides graceful degradation:
 * 1. localStorage (preferred)
 * 2. sessionStorage (fallback for private browsing) 
 * 3. in-memory storage (last resort)
 */
class StorageManager {
    constructor() {
        this.storageType = null;
        this.memoryStorage = new Map();
        this.storageQuotaWarned = false;
        this.initialize();
    }

    /**
     * Initialize storage manager and detect best available storage method
     */
    initialize() {
        this.storageType = this.detectBestStorage();
        console.log(`StorageManager initialized with ${this.storageType} storage`);
    }

    /**
     * Detect the best available storage method
     * @returns {string} The storage type: 'localStorage', 'sessionStorage', or 'memory'
     */
    detectBestStorage() {
        // Test localStorage first
        if (this.testStorage('localStorage')) {
            return 'localStorage';
        }

        // Fallback to sessionStorage for private browsing
        if (this.testStorage('sessionStorage')) {
            this.showStorageWarning('localStorage', 'sessionStorage');
            return 'sessionStorage';
        }

        // Last resort: in-memory storage
        this.showStorageWarning('localStorage and sessionStorage', 'in-memory');
        return 'memory';
    }

    /**
     * Test if a storage method is available and functional
     * @param {string} storageType - 'localStorage' or 'sessionStorage'
     * @returns {boolean} True if storage is available and functional
     */
    testStorage(storageType) {
        try {
            const storage = window[storageType];
            if (!storage) return false;

            // Test write/read/delete functionality
            const testKey = '__storage_test__';
            const testValue = 'test';
            
            storage.setItem(testKey, testValue);
            const retrieved = storage.getItem(testKey);
            storage.removeItem(testKey);
            
            return retrieved === testValue;
        } catch (error) {
            // Storage unavailable or quota exceeded
            console.warn(`${storageType} test failed:`, error.message);
            return false;
        }
    }

    /**
     * Show warning about storage limitations
     * @param {string} unavailableStorage - Storage that's not available
     * @param {string} fallbackStorage - Storage being used as fallback
     */
    showStorageWarning(unavailableStorage, fallbackStorage) {
        if (this.storageQuotaWarned) return;
        
        const message = `Storage Notice: ${unavailableStorage} unavailable (likely private browsing mode). Using ${fallbackStorage} - data may not persist between sessions.`;
        
        console.warn(message);
        
        // Show user-friendly notification
        setTimeout(() => {
            this.showUserNotification(message);
            this.storageQuotaWarned = true;
        }, 1000);
    }

    /**
     * Show user notification about storage limitations
     * @param {string} message - Message to display
     */
    showUserNotification(message) {
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.className = 'storage-notification';
        notification.innerHTML = `
            <div class="storage-notification-content">
                <span class="storage-notification-icon">⚠️</span>
                <span class="storage-notification-text">Private browsing detected - todos will not persist between sessions</span>
                <button class="storage-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add notification styles
        const style = document.createElement('style');
        style.textContent = `
            .storage-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 0;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 350px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .storage-notification-content {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                gap: 8px;
            }
            .storage-notification-icon {
                flex-shrink: 0;
                font-size: 16px;
            }
            .storage-notification-text {
                flex: 1;
                font-size: 14px;
                color: #856404;
                line-height: 1.4;
            }
            .storage-notification-close {
                flex-shrink: 0;
                background: none;
                border: none;
                font-size: 18px;
                color: #856404;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
            }
            .storage-notification-close:hover {
                background: rgba(133, 100, 4, 0.1);
            }
            .dark-theme .storage-notification {
                background: #664d03;
                border-color: #b7950b;
                color: #fff3cd;
            }
            .dark-theme .storage-notification-text,
            .dark-theme .storage-notification-close {
                color: #fff3cd;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }

    /**
     * Store data using the best available storage method
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @throws {Error} If storage fails
     */
    setItem(key, value) {
        try {
            switch (this.storageType) {
                case 'localStorage':
                case 'sessionStorage':
                    window[this.storageType].setItem(key, value);
                    break;
                case 'memory':
                    this.memoryStorage.set(key, value);
                    break;
                default:
                    throw new Error('No storage method available');
            }
        } catch (error) {
            // Handle quota exceeded errors by trying fallback storage
            if (this.handleStorageError(error, key, value)) {
                return; // Successfully stored with fallback
            }
            throw new Error(`Failed to store data: ${error.message}`);
        }
    }

    /**
     * Retrieve data using the current storage method
     * @param {string} key - Storage key
     * @returns {string|null} Stored value or null if not found
     */
    getItem(key) {
        try {
            switch (this.storageType) {
                case 'localStorage':
                case 'sessionStorage':
                    return window[this.storageType].getItem(key);
                case 'memory':
                    return this.memoryStorage.get(key) || null;
                default:
                    return null;
            }
        } catch (error) {
            console.warn(`Failed to retrieve data for key "${key}":`, error.message);
            return null;
        }
    }

    /**
     * Remove data from storage
     * @param {string} key - Storage key to remove
     */
    removeItem(key) {
        try {
            switch (this.storageType) {
                case 'localStorage':
                case 'sessionStorage':
                    window[this.storageType].removeItem(key);
                    break;
                case 'memory':
                    this.memoryStorage.delete(key);
                    break;
            }
        } catch (error) {
            console.warn(`Failed to remove data for key "${key}":`, error.message);
        }
    }

    /**
     * Handle storage errors by attempting fallback storage
     * @param {Error} error - The storage error
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {boolean} True if fallback succeeded
     */
    handleStorageError(error, key, value) {
        // Check if it's a quota exceeded error
        if (this.isQuotaExceededError(error)) {
            console.warn(`Storage quota exceeded for ${this.storageType}, attempting fallback...`);
            
            // Try to fallback to the next storage method
            const fallbackType = this.getFallbackStorage();
            if (fallbackType) {
                try {
                    this.storageType = fallbackType;
                    this.setItem(key, value); // Recursive call with new storage type
                    this.showStorageWarning('previous storage method', fallbackType);
                    return true;
                } catch (fallbackError) {
                    console.error(`Fallback storage also failed:`, fallbackError.message);
                }
            }
        }
        return false;
    }

    /**
     * Check if error is a quota exceeded error
     * @param {Error} error - Error to check
     * @returns {boolean} True if quota exceeded
     */
    isQuotaExceededError(error) {
        return error.name === 'QuotaExceededError' || 
               error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
               error.message.toLowerCase().includes('quota');
    }

    /**
     * Get the next fallback storage type
     * @returns {string|null} Next storage type or null if no fallbacks
     */
    getFallbackStorage() {
        switch (this.storageType) {
            case 'localStorage':
                return this.testStorage('sessionStorage') ? 'sessionStorage' : 'memory';
            case 'sessionStorage':
                return 'memory';
            default:
                return null;
        }
    }

    /**
     * Get information about the current storage method
     * @returns {Object} Storage information
     */
    getStorageInfo() {
        return {
            type: this.storageType,
            isPersistent: this.storageType === 'localStorage',
            isSessionBased: this.storageType === 'sessionStorage',
            isInMemory: this.storageType === 'memory',
            warning: !this.storageType || this.storageType !== 'localStorage'
        };
    }

    /**
     * Estimate available storage space (best effort)
     * @returns {Object} Storage capacity information
     */
    getStorageCapacity() {
        if (this.storageType === 'memory') {
            return {
                available: Infinity,
                used: this.memoryStorage.size,
                canEstimate: false
            };
        }

        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                return navigator.storage.estimate().then(estimate => ({
                    available: estimate.quota,
                    used: estimate.usage,
                    canEstimate: true
                }));
            }
        } catch (error) {
            // Storage estimation not available
        }

        return {
            available: 'unknown',
            used: 'unknown', 
            canEstimate: false
        };
    }
}