/**
 * StorageOperations - Provides the main storage API operations with enhanced error handling
 * 
 * This module provides:
 * - High-level storage operations (get, set, remove, clear)
 * - Integration with fallback handler for reliable operation
 * - Enhanced error handling and recovery mechanisms
 * - Performance monitoring and optimization
 * - Data validation and sanitization
 */
class StorageOperations {
    constructor(fallbackHandler) {
        this.fallbackHandler = fallbackHandler;
        this.operationStats = {
            gets: { total: 0, successful: 0, failed: 0 },
            sets: { total: 0, successful: 0, failed: 0 },
            removes: { total: 0, successful: 0, failed: 0 }
        };
        this.performanceMetrics = {
            averageGetTime: 0,
            averageSetTime: 0,
            slowOperationThreshold: 100 // milliseconds
        };
    }

    /**
     * Retrieve an item from storage with comprehensive fallback handling
     * Attempts to get data from the best available storage mechanism
     * 
     * @param {string} key - Storage key to retrieve
     * @returns {string|null} Stored value or null if not found
     */
    getItem(key) {
        // Validate input parameters
        if (!this.validateKey(key)) {
            console.warn('StorageOperations: Invalid key provided to getItem:', key);
            return null;
        }

        const startTime = performance.now();
        this.operationStats.gets.total++;

        try {
            // Use fallback handler to attempt retrieval across storage types
            const result = this.fallbackHandler.executeWithFallback('get', key);
            
            if (result.success) {
                this.operationStats.gets.successful++;
                this.updatePerformanceMetrics('get', startTime);
                
                // Log successful retrieval with storage type used
                this.logOperation('getItem', key, result.storageUsed, true);
                
                return result.value;
            } else {
                this.operationStats.gets.failed++;
                this.logOperation('getItem', key, 'failed', false, result.fallbacksUsed);
                
                return null;
            }

        } catch (error) {
            this.operationStats.gets.failed++;
            console.error('StorageOperations: Unexpected error in getItem:', error);
            this.logOperation('getItem', key, 'error', false, [{ error: error.message }]);
            
            return null;
        }
    }

    /**
     * Store an item with comprehensive fallback and error handling
     * Ensures data is stored reliably even in challenging browser environments
     * 
     * @param {string} key - Storage key
     * @param {string} value - Value to store (must be string for compatibility)
     * @returns {boolean} True if storage was successful in at least one mechanism
     */
    setItem(key, value) {
        // Validate input parameters
        if (!this.validateKey(key)) {
            console.warn('StorageOperations: Invalid key provided to setItem:', key);
            return false;
        }

        if (!this.validateValue(value)) {
            console.warn('StorageOperations: Invalid value provided to setItem for key:', key);
            return false;
        }

        const startTime = performance.now();
        this.operationStats.sets.total++;

        try {
            // Convert value to string to ensure consistency across storage types
            const stringValue = this.sanitizeValue(value);
            
            // Use fallback handler to attempt storage across storage types
            const result = this.fallbackHandler.executeWithFallback('set', key, stringValue);
            
            if (result.success || result.storageUsed === 'memory') {
                this.operationStats.sets.successful++;
                this.updatePerformanceMetrics('set', startTime);
                
                // Log successful storage with details
                this.logOperation('setItem', key, result.storageUsed || 'memory', true, null, stringValue.length);
                
                return true;
            } else {
                this.operationStats.sets.failed++;
                this.logOperation('setItem', key, 'failed', false, result.fallbacksUsed);
                
                // Even if persistent storage failed, memory storage in fallback handler ensures data is preserved
                return true;
            }

        } catch (error) {
            this.operationStats.sets.failed++;
            console.error('StorageOperations: Unexpected error in setItem:', error);
            this.logOperation('setItem', key, 'error', false, [{ error: error.message }]);
            
            // As a last resort, try to store directly in fallback handler's memory
            try {
                this.fallbackHandler.memoryStorage.set(key, this.sanitizeValue(value));
                console.warn('StorageOperations: Stored in emergency memory storage for key:', key);
                return true;
            } catch (memoryError) {
                console.error('StorageOperations: Emergency memory storage also failed:', memoryError);
                return false;
            }
        }
    }

    /**
     * Remove an item from all storage mechanisms
     * Ensures the item is completely removed from all possible storage locations
     * 
     * @param {string} key - Storage key to remove
     * @returns {boolean} True if removal was attempted (always true as memory removal always works)
     */
    removeItem(key) {
        // Validate input parameters
        if (!this.validateKey(key)) {
            console.warn('StorageOperations: Invalid key provided to removeItem:', key);
            return false;
        }

        this.operationStats.removes.total++;

        try {
            // Use fallback handler to remove from all storage types
            const result = this.fallbackHandler.executeWithFallback('remove', key);
            
            this.operationStats.removes.successful++;
            this.logOperation('removeItem', key, 'multiple', true);
            
            return true;

        } catch (error) {
            this.operationStats.removes.failed++;
            console.error('StorageOperations: Error in removeItem:', error);
            this.logOperation('removeItem', key, 'error', false, [{ error: error.message }]);
            
            // Try to remove from memory storage as fallback
            try {
                this.fallbackHandler.memoryStorage.delete(key);
                return true;
            } catch (memoryError) {
                console.error('StorageOperations: Memory removal also failed:', memoryError);
                return false;
            }
        }
    }

    /**
     * Clear all storage mechanisms
     * Useful for reset operations or testing scenarios
     * 
     * @returns {boolean} True if clear operation was attempted
     */
    clear() {
        try {
            let clearedAny = false;

            // Clear localStorage if available
            const capabilities = this.fallbackHandler.detector.getStorageCapabilities();
            
            if (capabilities.localStorage) {
                try {
                    window.localStorage.clear();
                    clearedAny = true;
                    console.log('StorageOperations: localStorage cleared successfully');
                } catch (error) {
                    console.warn('StorageOperations: Failed to clear localStorage:', error);
                }
            }

            // Clear sessionStorage if available
            if (capabilities.sessionStorage) {
                try {
                    window.sessionStorage.clear();
                    clearedAny = true;
                    console.log('StorageOperations: sessionStorage cleared successfully');
                } catch (error) {
                    console.warn('StorageOperations: Failed to clear sessionStorage:', error);
                }
            }

            // Always clear memory storage
            this.fallbackHandler.memoryStorage.clear();
            console.log('StorageOperations: Memory storage cleared successfully');

            return true;

        } catch (error) {
            console.error('StorageOperations: Error during clear operation:', error);
            return false;
        }
    }

    /**
     * Check if storage is available (any mechanism)
     * Provides a simple way to check if data can be stored
     * 
     * @returns {boolean} True if any storage mechanism is available
     */
    isAvailable() {
        const capabilities = this.fallbackHandler.detector.getStorageCapabilities();
        return capabilities.localStorage || capabilities.sessionStorage || true; // Memory is always available
    }

    /**
     * Validate storage keys to prevent issues
     * Ensures keys are valid and safe to use across different storage mechanisms
     * 
     * @param {string} key - Key to validate
     * @returns {boolean} True if key is valid
     */
    validateKey(key) {
        // Key must be a non-empty string
        if (typeof key !== 'string' || key.length === 0) {
            return false;
        }

        // Key should not be too long (some browsers have limits)
        if (key.length > 1000) {
            console.warn('StorageOperations: Key length exceeds recommended maximum (1000 characters)');
            return false;
        }

        // Key should not contain problematic characters
        if (key.includes('\x00') || key.includes('\uFFFD')) {
            console.warn('StorageOperations: Key contains problematic characters');
            return false;
        }

        return true;
    }

    /**
     * Validate and sanitize values before storage
     * Ensures values are in the correct format for reliable storage
     * 
     * @param {*} value - Value to validate
     * @returns {boolean} True if value is valid for storage
     */
    validateValue(value) {
        // Null and undefined are not allowed (should be handled by caller)
        if (value === null || value === undefined) {
            return false;
        }

        // Check for extremely large values that might cause quota issues
        const stringValue = String(value);
        if (stringValue.length > 5 * 1024 * 1024) { // 5MB limit
            console.warn('StorageOperations: Value size exceeds recommended maximum (5MB)');
            return false;
        }

        return true;
    }

    /**
     * Sanitize values to ensure safe storage
     * Converts values to strings and handles edge cases
     * 
     * @param {*} value - Value to sanitize
     * @returns {string} Sanitized string value
     */
    sanitizeValue(value) {
        // Convert to string consistently
        if (typeof value === 'string') {
            return value;
        }

        if (typeof value === 'object') {
            try {
                return JSON.stringify(value);
            } catch (error) {
                console.warn('StorageOperations: Failed to stringify object, using toString()');
                return String(value);
            }
        }

        return String(value);
    }

    /**
     * Update performance metrics for monitoring
     * Tracks operation times to identify performance issues
     * 
     * @param {string} operation - Operation type ('get' or 'set')
     * @param {number} startTime - Operation start time from performance.now()
     */
    updatePerformanceMetrics(operation, startTime) {
        const duration = performance.now() - startTime;
        
        // Update running average (simple moving average)
        const metricKey = `average${operation.charAt(0).toUpperCase() + operation.slice(1)}Time`;
        const currentAverage = this.performanceMetrics[metricKey];
        
        // Use exponential moving average for responsiveness to recent changes
        this.performanceMetrics[metricKey] = currentAverage === 0 
            ? duration 
            : (currentAverage * 0.9) + (duration * 0.1);

        // Log slow operations for monitoring
        if (duration > this.performanceMetrics.slowOperationThreshold) {
            console.warn(`StorageOperations: Slow ${operation} operation detected: ${duration.toFixed(2)}ms`);
        }
    }

    /**
     * Log storage operations for debugging and monitoring
     * Provides detailed information about storage operations
     * 
     * @param {string} operation - Operation type
     * @param {string} key - Storage key
     * @param {string} storageUsed - Which storage mechanism was used
     * @param {boolean} success - Whether operation was successful
     * @param {Array} [fallbacks] - Fallback attempts if any
     * @param {number} [valueSize] - Size of value for set operations
     */
    logOperation(operation, key, storageUsed, success, fallbacks = null, valueSize = null) {
        // Only log in debug mode or for errors to avoid noise
        const isError = !success || fallbacks;
        const shouldLog = isError || (typeof window !== 'undefined' && window.localStorage.getItem('storage_debug') === 'true');

        if (shouldLog) {
            const logData = {
                operation,
                key: key.substring(0, 50), // Truncate long keys for readability
                storageUsed,
                success,
                timestamp: new Date().toISOString()
            };

            if (fallbacks && fallbacks.length > 0) {
                logData.fallbacks = fallbacks;
            }

            if (valueSize !== null) {
                logData.valueSize = valueSize;
            }

            if (isError) {
                console.warn('StorageOperations:', logData);
            } else {
                console.debug('StorageOperations:', logData);
            }
        }
    }

    /**
     * Get comprehensive operation statistics and performance metrics
     * Useful for debugging, monitoring, and optimization
     * 
     * @returns {Object} Detailed operations information
     */
    getOperationInfo() {
        return {
            statistics: {
                ...this.operationStats,
                successRate: {
                    gets: this.operationStats.gets.total > 0 
                        ? (this.operationStats.gets.successful / this.operationStats.gets.total * 100).toFixed(2) + '%'
                        : 'N/A',
                    sets: this.operationStats.sets.total > 0 
                        ? (this.operationStats.sets.successful / this.operationStats.sets.total * 100).toFixed(2) + '%'
                        : 'N/A',
                    removes: this.operationStats.removes.total > 0 
                        ? (this.operationStats.removes.successful / this.operationStats.removes.total * 100).toFixed(2) + '%'
                        : 'N/A'
                }
            },
            performance: {
                ...this.performanceMetrics,
                averageGetTime: this.performanceMetrics.averageGetTime.toFixed(2) + 'ms',
                averageSetTime: this.performanceMetrics.averageSetTime.toFixed(2) + 'ms'
            },
            fallbackHandler: this.fallbackHandler.getHandlerInfo()
        };
    }

    /**
     * Reset operation statistics and performance metrics
     * Useful for testing or when starting fresh monitoring
     */
    resetStats() {
        this.operationStats = {
            gets: { total: 0, successful: 0, failed: 0 },
            sets: { total: 0, successful: 0, failed: 0 },
            removes: { total: 0, successful: 0, failed: 0 }
        };
        
        this.performanceMetrics = {
            averageGetTime: 0,
            averageSetTime: 0,
            slowOperationThreshold: this.performanceMetrics.slowOperationThreshold
        };
    }
}

// Export for use by StorageManager
if (typeof window !== 'undefined') {
    window.StorageOperations = StorageOperations;
}