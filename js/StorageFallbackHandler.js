/**
 * StorageFallbackHandler - Manages fallback strategies when storage operations fail
 * 
 * This module handles:
 * - Automatic fallback between storage types when operations fail
 * - Error recovery and retry mechanisms
 * - Storage type switching based on error conditions
 * - Memory storage as final fallback for critical data persistence
 */
class StorageFallbackHandler {
    constructor(storageDetector) {
        this.detector = storageDetector;
        this.memoryStorage = new Map();
        this.currentStorageType = this.detector.detectBestStorage();
        this.fallbackHistory = [];
        this.errorStats = {
            localStorage: 0,
            sessionStorage: 0,
            totalFallbacks: 0
        };
    }

    /**
     * Execute a storage operation with automatic fallback handling
     * This is the core method that attempts operations across different storage types
     * 
     * @param {'get'|'set'|'remove'} operation - The type of storage operation
     * @param {string} key - Storage key
     * @param {string} [value] - Value for set operations
     * @returns {Object} Result object with success status and value/error information
     */
    executeWithFallback(operation, key, value = null) {
        const result = {
            success: false,
            value: null,
            storageUsed: null,
            fallbacksUsed: [],
            error: null
        };

        // Define the fallback sequence based on current storage type
        const fallbackSequence = this.getFallbackSequence();
        
        // Always ensure memory storage is available as final fallback for critical operations
        if (operation === 'set') {
            this.memoryStorage.set(key, value);
        }

        // Attempt the operation across the fallback sequence
        for (const storageType of fallbackSequence) {
            try {
                const operationResult = this.attemptOperation(operation, storageType, key, value);
                
                if (operationResult.success) {
                    result.success = true;
                    result.value = operationResult.value;
                    result.storageUsed = storageType;
                    
                    // Update current storage type if we had to fall back
                    if (storageType !== this.currentStorageType) {
                        this.handleStorageTypeChange(storageType, 'fallback_success');
                    }
                    
                    break;
                }
                
                // Track failed attempts
                result.fallbacksUsed.push({
                    type: storageType,
                    error: operationResult.error
                });
                
            } catch (error) {
                // Record the error and continue to next fallback
                result.fallbacksUsed.push({
                    type: storageType,
                    error: error.message
                });
                
                this.recordStorageError(storageType, error);
            }
        }

        // For get operations, check memory storage as final fallback
        if (!result.success && operation === 'get') {
            const memoryValue = this.memoryStorage.get(key);
            if (memoryValue !== undefined) {
                result.success = true;
                result.value = memoryValue;
                result.storageUsed = 'memory';
            }
        }

        // For remove operations, always attempt to remove from memory
        if (operation === 'remove') {
            this.memoryStorage.delete(key);
            // Consider remove successful if it worked in any storage or memory
            result.success = result.success || true;
        }

        // Track overall fallback statistics
        if (result.fallbacksUsed.length > 0) {
            this.errorStats.totalFallbacks++;
        }

        return result;
    }

    /**
     * Attempt a single storage operation on a specific storage type
     * Encapsulates the actual storage API calls with error handling
     * 
     * @param {'get'|'set'|'remove'} operation - Operation type
     * @param {string} storageType - 'localStorage' or 'sessionStorage'
     * @param {string} key - Storage key
     * @param {string} [value] - Value for set operations
     * @returns {Object} Operation result with success flag and value/error
     */
    attemptOperation(operation, storageType, key, value = null) {
        const result = { success: false, value: null, error: null };

        // Skip memory storage here - it's handled separately
        if (storageType === 'memory') {
            return result;
        }

        try {
            const storage = window[storageType];
            
            if (!storage) {
                result.error = `${storageType} not available`;
                return result;
            }

            switch (operation) {
                case 'get':
                    result.value = storage.getItem(key);
                    result.success = true;
                    break;

                case 'set':
                    storage.setItem(key, value);
                    result.success = true;
                    break;

                case 'remove':
                    storage.removeItem(key);
                    result.success = true;
                    break;

                default:
                    result.error = `Unsupported operation: ${operation}`;
                    return result;
            }

        } catch (error) {
            // Capture specific error types for better handling
            result.error = `${storageType} ${operation} failed: ${error.name} - ${error.message}`;
            
            // Handle quota exceeded errors specifically
            if (error.name === 'QuotaExceededError') {
                console.warn(`StorageFallbackHandler: Quota exceeded in ${storageType} for key "${key}"`);
                this.handleQuotaExceeded(storageType);
            }
        }

        return result;
    }

    /**
     * Get the fallback sequence based on current storage type and availability
     * Orders storage types by preference and availability
     * 
     * @returns {string[]} Array of storage types to try in order
     */
    getFallbackSequence() {
        const capabilities = this.detector.getStorageCapabilities();
        const sequence = [];

        // Start with current storage type if it's still available
        if (this.currentStorageType !== 'memory' && capabilities[this.currentStorageType]) {
            sequence.push(this.currentStorageType);
        }

        // Add other available storage types
        if (this.currentStorageType !== 'localStorage' && capabilities.localStorage) {
            sequence.push('localStorage');
        }

        if (this.currentStorageType !== 'sessionStorage' && capabilities.sessionStorage) {
            sequence.push('sessionStorage');
        }

        // Memory storage is handled separately as it always works
        return sequence;
    }

    /**
     * Handle storage type changes due to failures or improvements
     * Updates internal state and logs the change for monitoring
     * 
     * @param {string} newStorageType - The new storage type to use
     * @param {string} reason - Reason for the change
     */
    handleStorageTypeChange(newStorageType, reason) {
        const previousType = this.currentStorageType;
        this.currentStorageType = newStorageType;
        
        // Record the change in fallback history for debugging
        this.fallbackHistory.push({
            timestamp: Date.now(),
            from: previousType,
            to: newStorageType,
            reason: reason
        });

        console.warn(`StorageFallbackHandler: Storage type changed from ${previousType} to ${newStorageType} (${reason})`);

        // Keep fallback history size manageable
        if (this.fallbackHistory.length > 50) {
            this.fallbackHistory = this.fallbackHistory.slice(-25);
        }
    }

    /**
     * Handle quota exceeded errors with specific recovery strategies
     * Attempts to free up space or switch to alternative storage
     * 
     * @param {string} storageType - The storage type that exceeded quota
     */
    handleQuotaExceeded(storageType) {
        console.warn(`StorageFallbackHandler: Quota exceeded in ${storageType}, attempting recovery`);

        try {
            // Strategy 1: Try to clear some space by removing old test keys
            const storage = window[storageType];
            if (storage) {
                // Remove any test keys that might be lingering
                const testKeys = ['__storage_test__', '__private_mode_quota_test__', '__storage_detector_test__'];
                testKeys.forEach(key => {
                    try {
                        storage.removeItem(key);
                    } catch (e) {
                        // Ignore errors during cleanup
                    }
                });
            }

            // Strategy 2: Mark this storage type as problematic temporarily
            this.errorStats[storageType]++;
            
            // Strategy 3: If this storage type has had many quota errors, avoid it
            if (this.errorStats[storageType] > 3) {
                console.warn(`StorageFallbackHandler: ${storageType} has exceeded quota multiple times, switching storage type`);
                
                const fallbackType = storageType === 'localStorage' ? 'sessionStorage' : 'memory';
                this.handleStorageTypeChange(fallbackType, 'quota_exceeded_multiple');
            }

        } catch (error) {
            console.warn('StorageFallbackHandler: Error during quota exceeded recovery:', error);
        }
    }

    /**
     * Record storage errors for monitoring and analytics
     * Helps identify patterns in storage failures for better fallback strategies
     * 
     * @param {string} storageType - The storage type that failed
     * @param {Error} error - The error that occurred
     */
    recordStorageError(storageType, error) {
        if (this.errorStats[storageType] !== undefined) {
            this.errorStats[storageType]++;
        }

        // Log detailed error information for debugging
        console.warn(`StorageFallbackHandler: ${storageType} error (count: ${this.errorStats[storageType]}):`, {
            name: error.name,
            message: error.message,
            timestamp: Date.now()
        });
    }

    /**
     * Get comprehensive fallback handler statistics and state
     * Useful for debugging and monitoring storage behavior
     * 
     * @returns {Object} Detailed fallback handler information
     */
    getHandlerInfo() {
        return {
            currentStorageType: this.currentStorageType,
            memoryStorageSize: this.memoryStorage.size,
            errorStats: { ...this.errorStats },
            fallbackHistory: [...this.fallbackHistory],
            recentFallbacks: this.fallbackHistory.slice(-5),
            capabilities: this.detector.getStorageCapabilities()
        };
    }

    /**
     * Clear memory storage and reset error statistics
     * Useful for testing or when resetting the application state
     */
    reset() {
        this.memoryStorage.clear();
        this.errorStats = {
            localStorage: 0,
            sessionStorage: 0,
            totalFallbacks: 0
        };
        this.fallbackHistory = [];
        this.currentStorageType = this.detector.detectBestStorage();
    }

    /**
     * Get all keys from memory storage
     * Useful for debugging or data export scenarios
     * 
     * @returns {string[]} Array of keys stored in memory
     */
    getMemoryKeys() {
        return Array.from(this.memoryStorage.keys());
    }

    /**
     * Check if a key exists in any storage mechanism
     * Performs a quick check across all available storage types
     * 
     * @param {string} key - Key to check for existence
     * @returns {Object} Information about where the key was found
     */
    keyExists(key) {
        const result = {
            exists: false,
            foundIn: [],
            inMemory: this.memoryStorage.has(key)
        };

        // Check persistent storage types
        const capabilities = this.detector.getStorageCapabilities();
        
        if (capabilities.localStorage) {
            try {
                if (window.localStorage.getItem(key) !== null) {
                    result.foundIn.push('localStorage');
                }
            } catch (e) {
                // Ignore errors during existence check
            }
        }

        if (capabilities.sessionStorage) {
            try {
                if (window.sessionStorage.getItem(key) !== null) {
                    result.foundIn.push('sessionStorage');
                }
            } catch (e) {
                // Ignore errors during existence check
            }
        }

        result.exists = result.foundIn.length > 0 || result.inMemory;
        return result;
    }
}

// Export for use by StorageManager
if (typeof window !== 'undefined') {
    window.StorageFallbackHandler = StorageFallbackHandler;
}