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
            
            // Show enhanced user-friendly notification
            this.showEnhancedNotification('private');
        }
    }

    /**
     * Show user notification about private browsing (legacy method for compatibility)
     */
    showUserNotification() {
        this.showEnhancedNotification('private');
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
        
        // Notify user with enhanced notification
        this.showEnhancedNotification('quota');
    }

    /**
     * Show storage fallback notification
     */
    notifyStorageFallback() {
        if (!this.memoryStorage.has('__fallback_notified__')) {
            console.warn('⚠️ Storage fallback activated. Data will only persist during this session.');
            this.memoryStorage.set('__fallback_notified__', true);
            this.showEnhancedNotification('fallback');
        }
    }

    /**
     * Show quota exceeded notification (legacy method for compatibility)
     */
    showQuotaNotification() {
        this.showEnhancedNotification('quota');
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
     * Validate storage key format
     * @param {string} key - Storage key to validate
     * @returns {boolean} True if key is valid
     */
    isValidKey(key) {
        if (typeof key !== 'string') return false;
        if (key.length === 0) return false;
        if (key.length > 255) return false; // Reasonable key length limit
        return true;
    }

    /**
     * Validate storage value
     * @param {*} value - Value to validate
     * @returns {boolean} True if value can be stored
     */
    isValidValue(value) {
        if (value === null || value === undefined) return true;
        if (typeof value !== 'string') return false;
        
        // Check if value is too large (approximate check)
        try {
            const size = new Blob([value]).size;
            return size < 5 * 1024 * 1024; // 5MB limit
        } catch (error) {
            // Fallback for older browsers
            return value.length < 5 * 1024 * 1024;
        }
    }

    /**
     * Get available storage quota (approximate)
     * @returns {Promise<Object>} Storage quota information
     */
    async getStorageQuota() {
        if (typeof navigator !== 'undefined' && 
            navigator.storage && 
            typeof navigator.storage.estimate === 'function') {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    quota: estimate.quota,
                    usage: estimate.usage,
                    available: estimate.quota - estimate.usage,
                    supported: true
                };
            } catch (error) {
                console.warn('Failed to get storage estimate:', error);
            }
        }
        
        return {
            quota: null,
            usage: null,
            available: null,
            supported: false
        };
    }

    /**
     * Test storage functionality
     * @returns {Object} Test results
     */
    testStorage() {
        const results = {
            canWrite: false,
            canRead: false,
            canDelete: false,
            persistent: false,
            errors: []
        };

        const testKey = '__storage_test_' + Date.now();
        const testValue = 'test_value_' + Math.random();

        try {
            // Test write
            this.setItem(testKey, testValue);
            results.canWrite = true;

            // Test read
            const readValue = this.getItem(testKey);
            results.canRead = readValue === testValue;

            // Test delete
            this.removeItem(testKey);
            const deletedValue = this.getItem(testKey);
            results.canDelete = deletedValue === null;

            // Test persistence
            results.persistent = this.storageType === 'localStorage';

        } catch (error) {
            results.errors.push(error.message);
        }

        return results;
    }

    /**
     * Safely set item with validation
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {Object} Result with success status and validation info
     */
    safeSetItem(key, value) {
        const result = {
            success: false,
            error: null,
            validation: {
                keyValid: this.isValidKey(key),
                valueValid: this.isValidValue(value)
            }
        };

        if (!result.validation.keyValid) {
            result.error = 'Invalid key format';
            return result;
        }

        if (!result.validation.valueValid) {
            result.error = 'Invalid value format or too large';
            return result;
        }

        try {
            result.success = this.setItem(key, value);
        } catch (error) {
            result.error = error.message;
        }

        return result;
    }

    /**
     * Show enhanced user notification with better UX
     * @param {string} type - Notification type ('private', 'quota', 'fallback')
     * @param {string} message - Custom message
     * @param {number} duration - Display duration in milliseconds
     */
    showEnhancedNotification(type = 'private', message = '', duration = 8000) {
        // Check if we're in a browser environment
        if (typeof document === 'undefined' || typeof window === 'undefined') {
            // In Node.js or non-browser environment, just log the message
            console.info(`📢 ${type.toUpperCase()}: ${message || 'Storage notification'}`);
            return;
        }

        // Don't show multiple notifications of the same type
        const notificationKey = `__notification_${type}_shown__`;
        if (this.memoryStorage.has(notificationKey)) {
            return;
        }
        this.memoryStorage.set(notificationKey, true);

        const notifications = {
            private: {
                icon: '🔒',
                title: 'Private Browsing Mode',
                message: message || 'Your todos will only be saved during this browser session.',
                color: '#ff9500'
            },
            quota: {
                icon: '⚠️',
                title: 'Storage Quota Reached',
                message: message || 'Storage is full. Using temporary storage for this session.',
                color: '#ff3b30'
            },
            fallback: {
                icon: '🔄',
                title: 'Storage Fallback Active',
                message: message || 'Using backup storage. Data may not persist.',
                color: '#ff9500'
            }
        };

        const config = notifications[type] || notifications.private;
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${config.color};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            max-width: 350px;
            min-width: 300px;
            animation: slideIn 0.3s ease-out;
            cursor: pointer;
        `;

        // Add slide-in animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <span style="font-size: 18px; flex-shrink: 0;">${config.icon}</span>
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 4px;">${config.title}</div>
                    <div style="opacity: 0.9; line-height: 1.4;">${config.message}</div>
                </div>
                <button style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    border-radius: 4px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 12px;
                    margin-left: 10px;
                    flex-shrink: 0;
                " onclick="this.parentNode.parentNode.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-hide with animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);

        // Click to dismiss
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        });
    }

    /**
     * Get storage information with enhanced details
     * @returns {Object} Comprehensive storage info
     */
    getStorageInfo() {
        const hasQuotaAPI = typeof navigator !== 'undefined' && 
                           navigator.storage !== undefined && 
                           navigator.storage !== null &&
                           typeof navigator.storage.estimate === 'function';
        
        return {
            type: this.storageType,
            isPrivateBrowsing: this.isPrivateBrowsing,
            isPersistent: this.storageType === 'localStorage',
            memoryStorageSize: this.memoryStorage.size,
            browserSupport: {
                localStorage: typeof localStorage !== 'undefined',
                sessionStorage: typeof sessionStorage !== 'undefined',
                quotaAPI: hasQuotaAPI
            },
            capabilities: {
                canWrite: true,
                canRead: true,
                canDelete: true,
                hasQuotaAPI: hasQuotaAPI
            }
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