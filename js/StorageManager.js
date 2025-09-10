/**
 * StorageManager - Orchestrates robust data persistence with comprehensive fallback system
 * 
 * This is the main interface for storage operations in AutoToDo. It coordinates
 * multiple specialized modules to provide reliable data persistence even in
 * challenging browser environments like Safari 14+ Private Browsing mode.
 * 
 * Architecture:
 * - StorageDetector: Detects available storage types and browser limitations
 * - StorageFallbackHandler: Manages fallback strategies when storage fails
 * - StorageOperations: Provides high-level API with validation and error handling
 * - StorageManager: Orchestrates the modules and provides the public API
 * 
 * Key Features:
 * - Automatic fallback: localStorage → sessionStorage → memory storage
 * - Safari 14+ Private Browsing compatibility
 * - Comprehensive error handling and recovery
 * - Performance monitoring and optimization
 * - Detailed logging and debugging capabilities
 */
class StorageManager {
    constructor() {
        // Initialize the modular storage system
        this.initializeModules();
        
        // Legacy compatibility properties (for existing code)
        this.initializeLegacyProperties();
        
        // Log initialization results
        this.logInitialization();
    }

    /**
     * Initialize the modular storage system components
     * Creates and connects the specialized storage modules
     */
    initializeModules() {
        try {
            // Initialize storage detection module
            this.detector = new StorageDetector();
            
            // Initialize fallback handling module
            this.fallbackHandler = new StorageFallbackHandler(this.detector);
            
            // Initialize operations module
            this.operations = new StorageOperations(this.fallbackHandler);
            
            console.log('StorageManager: All modules initialized successfully');
            
        } catch (error) {
            console.error('StorageManager: Failed to initialize modules:', error);
            
            // Create minimal fallback system if module initialization fails
            this.createEmergencyFallback();
        }
    }

    /**
     * Initialize legacy compatibility properties
     * Maintains compatibility with existing code that expects certain properties
     */
    initializeLegacyProperties() {
        // Get current capabilities for legacy properties
        const capabilities = this.getStorageInfo();
        
        // Legacy properties for backward compatibility
        this.storageType = capabilities.currentType || 'memory';
        this.isPrivateMode = capabilities.isPrivateMode || false;
        this.hasLocalStorage = capabilities.hasLocalStorage || false;
        this.hasSessionStorage = capabilities.hasSessionStorage || false;
        this.memoryStorage = this.fallbackHandler ? this.fallbackHandler.memoryStorage : new Map();
    }

    /**
     * Create an emergency fallback system if module initialization fails
     * Provides basic functionality even if the modular system can't be initialized
     */
    createEmergencyFallback() {
        console.warn('StorageManager: Using emergency fallback system');
        
        this.memoryStorage = new Map();
        this.storageType = 'memory';
        this.isPrivateMode = true;
        this.hasLocalStorage = false;
        this.hasSessionStorage = false;
        
        // Create minimal operations object for emergency use
        this.operations = {
            getItem: (key) => this.memoryStorage.get(key) || null,
            setItem: (key, value) => { this.memoryStorage.set(key, value); return true; },
            removeItem: (key) => { this.memoryStorage.delete(key); return true; },
            clear: () => { this.memoryStorage.clear(); return true; },
            isAvailable: () => true
        };
    }

    /**
     * Log initialization results for debugging and monitoring
     * Provides detailed information about the storage system setup
     */
    logInitialization() {
        const info = this.getStorageInfo();
        
        console.log(`StorageManager initialized successfully:`, {
            primaryStorage: info.currentType,
            privateMode: info.isPrivateMode,
            capabilities: {
                localStorage: info.hasLocalStorage,
                sessionStorage: info.hasSessionStorage
            },
            modulesLoaded: {
                detector: !!this.detector,
                fallbackHandler: !!this.fallbackHandler,
                operations: !!this.operations
            }
        });

        if (info.isPrivateMode) {
            console.warn('StorageManager: Private browsing mode detected - enhanced fallbacks active');
        }
    }

    // ============================================================================
    // PUBLIC API METHODS
    // These methods provide the main interface for storage operations
    // ============================================================================

    /**
     * Get an item from storage with comprehensive fallback support
     * 
     * This method attempts to retrieve data using the most reliable mechanism
     * available, automatically falling back through storage types as needed.
     * 
     * @param {string} key - Storage key to retrieve
     * @returns {string|null} Stored value or null if not found
     */
    getItem(key) {
        try {
            return this.operations.getItem(key);
        } catch (error) {
            console.error('StorageManager.getItem failed:', error);
            return null;
        }
    }

    /**
     * Store an item with comprehensive fallback and error handling
     * 
     * This method ensures data is stored reliably even in challenging environments
     * like Safari 14+ Private Browsing mode. It automatically handles:
     * - QuotaExceededError by falling back to alternative storage
     * - Storage unavailability by using memory storage
     * - Large data by optimizing storage strategy
     * 
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {boolean} True if storage was successful (always true due to memory fallback)
     */
    setItem(key, value) {
        try {
            return this.operations.setItem(key, value);
        } catch (error) {
            console.error('StorageManager.setItem failed:', error);
            // Emergency fallback to memory storage
            try {
                this.memoryStorage.set(key, value);
                console.warn('StorageManager: Used emergency memory storage for key:', key);
                return true;
            } catch (memoryError) {
                console.error('StorageManager: Emergency memory storage failed:', memoryError);
                return false;
            }
        }
    }

    /**
     * Remove an item from all storage mechanisms
     * 
     * Ensures complete removal of data from all possible storage locations
     * to prevent stale data from being retrieved later.
     * 
     * @param {string} key - Storage key to remove
     * @returns {boolean} True if removal was attempted
     */
    removeItem(key) {
        try {
            return this.operations.removeItem(key);
        } catch (error) {
            console.error('StorageManager.removeItem failed:', error);
            // Try to remove from memory storage at minimum
            try {
                this.memoryStorage.delete(key);
                return true;
            } catch (memoryError) {
                console.error('StorageManager: Memory removal failed:', memoryError);
                return false;
            }
        }
    }

    /**
     * Clear all storage mechanisms
     * 
     * Useful for reset operations, testing, or when user requests data clearing.
     * Attempts to clear all possible storage locations.
     * 
     * @returns {boolean} True if clear operation was attempted
     */
    clear() {
        try {
            return this.operations.clear();
        } catch (error) {
            console.error('StorageManager.clear failed:', error);
            // At minimum, clear memory storage
            try {
                this.memoryStorage.clear();
                return true;
            } catch (memoryError) {
                console.error('StorageManager: Memory clear failed:', memoryError);
                return false;
            }
        }
    }

    // ============================================================================
    // INFORMATION AND DEBUGGING METHODS
    // These methods provide insight into storage status and performance
    // ============================================================================

    /**
     * Get comprehensive storage information for debugging and monitoring
     * 
     * Provides detailed information about:
     * - Current storage capabilities and status
     * - Performance metrics and statistics
     * - Fallback history and error information
     * - Browser compatibility details
     * 
     * @returns {Object} Comprehensive storage status information
     */
    getStorageInfo() {
        try {
            // Get base information from detector if available
            const baseInfo = this.detector ? this.detector.getStorageCapabilities() : {
                localStorage: this.hasLocalStorage,
                sessionStorage: this.hasSessionStorage,
                isPrivateMode: this.isPrivateMode,
                recommendedStorage: this.storageType,
                browser: { isSafari: false, userAgent: '' }
            };

            // Get operation statistics if available
            const operationInfo = this.operations ? this.operations.getOperationInfo() : null;

            // Combine all information
            return {
                // Current configuration
                currentType: this.storageType,
                hasLocalStorage: this.hasLocalStorage,
                hasSessionStorage: this.hasSessionStorage,
                isPrivateMode: this.isPrivateMode,
                memoryItems: this.memoryStorage.size,
                
                // Enhanced information from modules
                ...baseInfo,
                
                // Legacy compatibility
                isSafari: baseInfo.browser.isSafari,
                
                // Performance and statistics (if available)
                ...(operationInfo && { 
                    operationStats: operationInfo.statistics,
                    performanceMetrics: operationInfo.performance,
                    fallbackInfo: operationInfo.fallbackHandler
                }),

                // Module status
                modulesLoaded: {
                    detector: !!this.detector,
                    fallbackHandler: !!this.fallbackHandler,
                    operations: !!this.operations
                }
            };
        } catch (error) {
            console.warn('StorageManager: Error getting storage info:', error);
            
            // Return minimal information if detailed info fails
            return {
                currentType: this.storageType,
                hasLocalStorage: this.hasLocalStorage,
                hasSessionStorage: this.hasSessionStorage,
                isPrivateMode: this.isPrivateMode,
                memoryItems: this.memoryStorage.size,
                error: 'Failed to get detailed storage info'
            };
        }
    }

    /**
     * Check if any storage mechanism is available
     * 
     * This method provides a simple boolean check for storage availability.
     * Memory storage is always available as a fallback.
     * 
     * @returns {boolean} True if any storage mechanism is available (always true)
     */
    isAvailable() {
        try {
            return this.operations ? this.operations.isAvailable() : true;
        } catch (error) {
            console.warn('StorageManager: Error checking availability:', error);
            return true; // Memory storage is always available
        }
    }

    // ============================================================================
    // LEGACY COMPATIBILITY METHODS
    // These methods maintain compatibility with existing code
    // ============================================================================

    /**
     * Legacy method: Detect private browsing mode
     * @deprecated Use getStorageInfo().isPrivateMode instead
     * @returns {boolean} True if private browsing is detected
     */
    detectPrivateMode() {
        if (this.detector) {
            return this.detector.detectPrivateMode();
        }
        return this.isPrivateMode;
    }

    /**
     * Legacy method: Test storage availability
     * @deprecated Use getStorageInfo() for comprehensive storage information
     * @param {string} type - 'localStorage' or 'sessionStorage'
     * @returns {boolean} True if storage is available
     */
    testStorage(type) {
        if (this.detector) {
            return this.detector.testStorage(type);
        }
        return type === 'localStorage' ? this.hasLocalStorage : this.hasSessionStorage;
    }

    /**
     * Legacy method: Detect best storage
     * @deprecated Storage type is now managed automatically by fallback handler
     * @returns {string} The recommended storage type
     */
    detectBestStorage() {
        if (this.detector) {
            return this.detector.detectBestStorage();
        }
        return this.storageType;
    }

    /**
     * Legacy method: Handle storage errors
     * @deprecated Error handling is now managed automatically by fallback handler
     * @param {Error} error - The storage error
     */
    handleStorageError(error) {
        console.warn('StorageManager: Legacy handleStorageError called:', error);
        
        if (this.fallbackHandler) {
            // Let the fallback handler manage error handling
            this.fallbackHandler.recordStorageError('unknown', error);
        } else {
            // Minimal legacy error handling
            console.warn('StorageManager: No fallback handler available for error:', error);
        }
    }
}

// Create a global instance for the application if in browser environment
if (typeof window !== 'undefined') {
    window.storageManager = new StorageManager();
}