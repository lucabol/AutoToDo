/**
 * StorageManager - Robust storage abstraction with fallback mechanisms
 * Handles localStorage limitations in Safari private browsing and other edge cases
 */
class StorageManager {
    constructor() {
        this.storageType = this.detectBestStorage();
        this.memoryStorage = new Map();
        this.isPrivateBrowsing = this.detectPrivateBrowsing();
        
        // Notify if in private browsing mode
        if (this.isPrivateBrowsing) {
            this.notifyPrivateBrowsing();
        }
    }

    /**
     * Detect the best available storage mechanism
     * @returns {string} Storage type: 'localStorage', 'sessionStorage', or 'memory'
     */
    detectBestStorage() {
        // Test localStorage
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return 'localStorage';
        } catch (error) {
            console.warn('localStorage not available:', error.message);
        }

        // Test sessionStorage
        try {
            const testKey = '__storage_test__';
            sessionStorage.setItem(testKey, 'test');
            sessionStorage.removeItem(testKey);
            return 'sessionStorage';
        } catch (error) {
            console.warn('sessionStorage not available:', error.message);
        }

        // Fallback to memory storage
        console.warn('Using memory storage - data will not persist between sessions');
        return 'memory';
    }

    /**
     * Detect if running in private browsing mode
     * @returns {boolean} True if likely in private browsing
     */
    detectPrivateBrowsing() {
        try {
            // Safari private browsing detection
            if (this.storageType === 'localStorage') {
                // Try to use localStorage quota
                const testData = 'x'.repeat(1024 * 1024); // 1MB test
                localStorage.setItem('__private_test__', testData);
                localStorage.removeItem('__private_test__');
                return false;
            }
            
            // If we had to fall back to sessionStorage or memory, likely private
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
        if (!this.memoryStorage.has('__private_notified__')) {
            console.info('🔒 Private browsing detected. Todos will only persist during this session.');
            this.memoryStorage.set('__private_notified__', true);
            
            // Show user-friendly notification if possible
            this.showUserNotification();
        }
    }

    /**
     * Show user notification about private browsing
     */
    showUserNotification() {
        // Create a subtle notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #ff9500;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            max-width: 300px;
        `;
        notification.innerHTML = `
            🔒 <strong>Private Browsing</strong><br>
            Todos will only be saved during this session
        `;
        
        document.body.appendChild(notification);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    /**
     * Get item from storage with fallback handling
     * @param {string} key - Storage key
     * @returns {string|null} Stored value or null
     */
    getItem(key) {
        try {
            switch (this.storageType) {
                case 'localStorage':
                    return localStorage.getItem(key);
                case 'sessionStorage':
                    return sessionStorage.getItem(key);
                case 'memory':
                    return this.memoryStorage.get(key) || null;
                default:
                    return null;
            }
        } catch (error) {
            console.warn(`Failed to get item "${key}":`, error.message);
            
            // Try memory storage as fallback
            if (this.storageType !== 'memory') {
                return this.memoryStorage.get(key) || null;
            }
            return null;
        }
    }

    /**
     * Set item in storage with fallback handling
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {boolean} True if successfully stored
     */
    setItem(key, value) {
        try {
            switch (this.storageType) {
                case 'localStorage':
                    localStorage.setItem(key, value);
                    break;
                case 'sessionStorage':
                    sessionStorage.setItem(key, value);
                    break;
                case 'memory':
                    this.memoryStorage.set(key, value);
                    break;
                default:
                    this.memoryStorage.set(key, value);
            }
            return true;
        } catch (error) {
            console.warn(`Failed to set item "${key}":`, error.message);
            
            // If quota exceeded, try to free up space
            if (error.name === 'QuotaExceededError') {
                this.handleQuotaExceeded(key, value);
                return false;
            }
            
            // Try memory storage as fallback
            if (this.storageType !== 'memory') {
                this.memoryStorage.set(key, value);
                this.storageType = 'memory'; // Switch to memory mode
                this.notifyStorageFallback();
                return true;
            }
            
            return false;
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
        this.storageType = 'memory';
        this.memoryStorage.set(key, value);
        
        // Notify user
        this.showQuotaNotification();
    }

    /**
     * Show storage fallback notification
     */
    notifyStorageFallback() {
        if (!this.memoryStorage.has('__fallback_notified__')) {
            console.warn('⚠️ Storage fallback activated. Data will only persist during this session.');
            this.memoryStorage.set('__fallback_notified__', true);
        }
    }

    /**
     * Show quota exceeded notification
     */
    showQuotaNotification() {
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
            max-width: 300px;
        `;
        notification.innerHTML = `
            ⚠️ <strong>Storage Full</strong><br>
            Using temporary storage for this session
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    /**
     * Remove item from storage
     * @param {string} key - Storage key to remove
     * @returns {boolean} True if successfully removed
     */
    removeItem(key) {
        try {
            switch (this.storageType) {
                case 'localStorage':
                    localStorage.removeItem(key);
                    break;
                case 'sessionStorage':
                    sessionStorage.removeItem(key);
                    break;
                case 'memory':
                    this.memoryStorage.delete(key);
                    break;
            }
            return true;
        } catch (error) {
            console.warn(`Failed to remove item "${key}":`, error.message);
            
            // Try memory storage as fallback
            if (this.storageType !== 'memory') {
                this.memoryStorage.delete(key);
                return true;
            }
            return false;
        }
    }

    /**
     * Clear all storage
     * @returns {boolean} True if successfully cleared
     */
    clear() {
        try {
            switch (this.storageType) {
                case 'localStorage':
                    localStorage.clear();
                    break;
                case 'sessionStorage':
                    sessionStorage.clear();
                    break;
                case 'memory':
                    this.memoryStorage.clear();
                    break;
            }
            return true;
        } catch (error) {
            console.warn('Failed to clear storage:', error.message);
            this.memoryStorage.clear();
            return false;
        }
    }

    /**
     * Get storage information
     * @returns {Object} Storage info including type, private browsing status, etc.
     */
    getStorageInfo() {
        return {
            type: this.storageType,
            isPrivateBrowsing: this.isPrivateBrowsing,
            isPersistent: this.storageType === 'localStorage',
            memoryStorageSize: this.memoryStorage.size
        };
    }
}

// Create singleton instance
const storageManager = new StorageManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager, storageManager };
} else {
    // Browser global
    window.storageManager = storageManager;
}