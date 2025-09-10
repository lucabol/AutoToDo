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
     * Detect if running in private browsing mode with enhanced Safari-specific checks
     * @returns {boolean} True if likely in private browsing
     */
    detectPrivateBrowsing() {
        try {
            // First check: If we're already using memory storage, likely private
            if (this.storageType !== 'localStorage') {
                return true;
            }
            
            // Enhanced Safari private browsing detection
            const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
            const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
            
            if (isSafari) {
                // Safari-specific private browsing detection methods
                
                // Method 1: Test localStorage quota with larger data
                try {
                    const testData = 'x'.repeat(2 * 1024 * 1024); // 2MB test for Safari
                    localStorage.setItem('__safari_private_test__', testData);
                    localStorage.removeItem('__safari_private_test__');
                } catch (quotaError) {
                    // Very small quota in Safari private browsing
                    return true;
                }
                
                // Method 2: Test sessionStorage behavior in Safari private mode
                try {
                    if (typeof sessionStorage !== 'undefined') {
                        sessionStorage.setItem('__safari_session_test__', 'test');
                        sessionStorage.removeItem('__safari_session_test__');
                    }
                } catch (sessionError) {
                    return true;
                }
                
                // Method 3: Safari private browsing has very limited localStorage size
                try {
                    const originalLength = localStorage.length;
                    const smallTestData = 'x'.repeat(10000); // 10KB test
                    localStorage.setItem('__safari_small_test__', smallTestData);
                    localStorage.removeItem('__safari_small_test__');
                    
                    // In Safari private browsing, even small writes can fail
                    return false;
                } catch (limitError) {
                    return true;
                }
            }
            
            // Generic private browsing detection for other browsers
            try {
                const testData = 'x'.repeat(1024 * 1024); // 1MB test
                localStorage.setItem('__generic_private_test__', testData);
                localStorage.removeItem('__generic_private_test__');
                return false;
            } catch (error) {
                // If quota exceeded or other error, likely private browsing
                return true;
            }
            
        } catch (error) {
            // Any error in detection suggests private browsing restrictions
            return true;
        }
    }

    /**
     * Show notification about private browsing limitations
     */
    notifyPrivateBrowsing() {
        // Only show once per session
        if (!this.inMemoryStorage.has('__private_notified__')) {
            console.info('🔒 Private browsing detected. Todos will only persist during this session.');
            this.inMemoryStorage.set('__private_notified__', true);
            
            // Show user-friendly notification if possible
            this.showUserNotification();
        }
    }

    /**
     * Show user notification about private browsing with enhanced guidance
     */
    showUserNotification() {
        // Only show notifications in browser environments
        if (typeof document === 'undefined') {
            return;
        }
        
        // Create a more informative notification with actions
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #ff9500;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        notification.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong>🔒 Private Browsing Detected</strong>
            </div>
            <div style="margin-bottom: 10px; font-size: 13px; opacity: 0.9;">
                Your todos will only be saved during this session. To preserve your data:
            </div>
            <div style="display: flex; gap: 8px; margin-top: 10px;">
                <button id="exportData" style="
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                ">Export Data</button>
                <button id="dismissNotification" style="
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                ">Dismiss</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add event listeners
        const exportBtn = notification.querySelector('#exportData');
        const dismissBtn = notification.querySelector('#dismissNotification');
        
        exportBtn.addEventListener('click', () => {
            this.exportData();
            notification.remove();
        });
        
        dismissBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto-hide after 10 seconds (longer for more complex notification)
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 10000);
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
     * Show quota exceeded notification
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
            memoryStorageSize: this.inMemoryStorage.size
        };
    }

    /**
     * Export all stored data as a downloadable JSON file
     * Useful for preserving data in private browsing mode
     * @param {string} filename - Optional filename for the export
     * @returns {boolean} True if export was successful
     */
    exportData(filename = null) {
        try {
            if (typeof document === 'undefined') {
                console.warn('Export functionality not available in non-browser environment');
                return false;
            }

            const data = {};
            const length = this.length;

            // Collect all stored data
            for (let i = 0; i < length; i++) {
                const key = this.key(i);
                if (key && !key.startsWith('__')) { // Skip internal test keys
                    data[key] = this.getItem(key);
                }
            }

            // Create export object with metadata
            const exportData = {
                timestamp: new Date().toISOString(),
                storageType: this.storageType,
                isPrivateBrowsing: this.isPrivateBrowsing,
                version: '1.0',
                data: data
            };

            // Create and download file
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || `autotodo-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('Data exported successfully');
            return true;
        } catch (error) {
            console.error('Failed to export data:', error);
            return false;
        }
    }

    /**
     * Import data from a JSON file or object
     * @param {File|Object} source - File object from input or parsed JSON object
     * @param {boolean} merge - Whether to merge with existing data (default: false, replaces all)
     * @returns {Promise<boolean>} True if import was successful
     */
    async importData(source, merge = false) {
        try {
            let importData;

            if (source instanceof File) {
                const text = await this.readFileAsText(source);
                importData = JSON.parse(text);
            } else if (typeof source === 'object') {
                importData = source;
            } else if (typeof source === 'string') {
                importData = JSON.parse(source);
            } else {
                throw new Error('Invalid source type for import');
            }

            // Validate import data structure
            if (!importData.data || typeof importData.data !== 'object') {
                throw new Error('Invalid import data format');
            }

            // Clear existing data if not merging
            if (!merge) {
                this.clear();
            }

            // Import each item
            const imported = [];
            const failed = [];
            
            for (const [key, value] of Object.entries(importData.data)) {
                try {
                    this.setItem(key, value);
                    imported.push(key);
                } catch (error) {
                    failed.push({ key, error: error.message });
                }
            }

            console.log(`Import completed: ${imported.length} items imported, ${failed.length} failed`);
            
            if (failed.length > 0) {
                console.warn('Failed to import items:', failed);
            }

            return failed.length === 0;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    /**
     * Helper method to read a file as text
     * @param {File} file - File object to read
     * @returns {Promise<string>} File contents as text
     * @private
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    /**
     * Create a file input element for importing data
     * @param {Function} callback - Callback function called with imported data status
     * @returns {HTMLElement} File input element
     */
    createImportInput(callback = null) {
        if (typeof document === 'undefined') {
            console.warn('Import input not available in non-browser environment');
            return null;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        
        input.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                const success = await this.importData(file);
                if (callback) {
                    callback(success, file.name);
                }
            }
        });

        return input;
    }

    /**
     * Show a notification with import/export options
     * Useful for private browsing scenarios
     */
    showDataManagementOptions() {
        if (typeof document === 'undefined') {
            return;
        }

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            margin: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        `;

        dialog.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: #333;">Data Management</h3>
            <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
                Since you're in private browsing mode, your data won't persist. 
                You can export your data now and import it in future sessions.
            </p>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="exportBtn" style="
                    background: #007AFF;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                ">Export Data</button>
                <button id="importBtn" style="
                    background: #34C759;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                ">Import Data</button>
                <button id="cancelBtn" style="
                    background: #8E8E93;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                ">Cancel</button>
            </div>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        // Create hidden file input for import
        const fileInput = this.createImportInput((success, filename) => {
            modal.remove();
            if (success) {
                console.log(`Successfully imported data from ${filename}`);
                // Reload the page to reflect imported data
                if (typeof location !== 'undefined') {
                    location.reload();
                }
            } else {
                alert('Failed to import data. Please check the file format.');
            }
        });
        document.body.appendChild(fileInput);

        // Event listeners
        dialog.querySelector('#exportBtn').addEventListener('click', () => {
            this.exportData();
            modal.remove();
        });

        dialog.querySelector('#importBtn').addEventListener('click', () => {
            fileInput.click();
        });

        dialog.querySelector('#cancelBtn').addEventListener('click', () => {
            modal.remove();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
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