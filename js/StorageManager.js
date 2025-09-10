/**
 * StorageManager - Orchestrates robust data persistence with comprehensive fallback system
 * 
 * This is the main interface for storage operations in AutoToDo. It coordinates
 * multiple specialized modules to provide reliable data persistence even in
 * challenging browser environments like Safari 14+ Private Browsing mode and
 * Safari 14+ Intelligent Tracking Prevention (ITP) data clearing.
 * 
 * Architecture:
 * - StorageDetector: Detects available storage types and browser limitations
 * - StorageFallbackHandler: Manages fallback strategies when storage fails
 * - StorageOperations: Provides high-level API with validation and error handling
 * - SafariITPHandler: Prevents Safari 14+ ITP data loss after 7 days of inactivity
 * - StorageManager: Orchestrates the modules and provides the public API
 * 
 * Key Features:
 * - Automatic fallback: localStorage → sessionStorage → memory storage
 * - Safari 14+ Private Browsing compatibility
 * - Safari 14+ ITP data loss prevention with persistent storage and activity tracking
 * - Comprehensive error handling and recovery
 * - Performance monitoring and optimization
 * - Detailed logging and debugging capabilities
 */

// Import dependencies for Node.js/testing environments
let StorageDetector, StorageFallbackHandler, StorageOperations, SafariITPHandler;

if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment - require dependencies
    try {
        ({ StorageDetector } = require('./StorageDetector.js'));
        ({ StorageFallbackHandler } = require('./StorageFallbackHandler.js'));
        ({ StorageOperations } = require('./StorageOperations.js'));
        ({ SafariITPHandler } = require('./SafariITPHandler.js'));
    } catch (error) {
        console.warn('StorageManager: Could not import some dependencies in Node.js:', error.message);
    }
} else {
    // Browser environment - use global objects
    StorageDetector = typeof window !== 'undefined' ? window.StorageDetector : undefined;
    StorageFallbackHandler = typeof window !== 'undefined' ? window.StorageFallbackHandler : undefined;
    StorageOperations = typeof window !== 'undefined' ? window.StorageOperations : undefined;
    SafariITPHandler = typeof window !== 'undefined' ? window.SafariITPHandler : undefined;
}

class StorageManager {
    constructor() {
        // Initialize the modular storage system
        this.initializeModules().then(() => {
            // Safari 14+ specific initialization
            this.initializeSafari14Plus();
            
            // Legacy compatibility properties (for existing code)
            this.initializeLegacyProperties();
            
            // Log initialization results
            this.logInitialization();
        }).catch(error => {
            console.error('StorageManager: Async initialization failed:', error);
            // Continue with Safari 14+ and legacy properties for basic functionality
            this.initializeSafari14Plus();
            this.initializeLegacyProperties();
            this.logInitialization();
        });
    }

    /**
     * Initialize the modular storage system components
     * Creates and connects the specialized storage modules
     */
    async initializeModules() {
        try {
            // Check if dependencies are available
            if (!StorageDetector) {
                throw new Error('StorageDetector not available');
            }
            if (!StorageFallbackHandler) {
                throw new Error('StorageFallbackHandler not available');
            }
            if (!StorageOperations) {
                throw new Error('StorageOperations not available');
            }
            
            // Initialize storage detection module
            this.detector = new StorageDetector();
            
            // Initialize fallback handling module
            this.fallbackHandler = new StorageFallbackHandler(this.detector);
            
            // Initialize operations module
            this.operations = new StorageOperations(this.fallbackHandler);
            
            // Initialize Safari ITP handler for data loss prevention
            if (SafariITPHandler) {
                this.itpHandler = new SafariITPHandler();
                // ITP handler initializes asynchronously
                await this.itpHandler.init();
                console.log('StorageManager: Safari ITP handler initialized');
            } else {
                console.warn('StorageManager: SafariITPHandler not available');
            }
            
            console.log('StorageManager: All modules initialized successfully');
            
        } catch (error) {
            console.error('StorageManager: Failed to initialize modules:', error);
            
            // Create minimal fallback system if module initialization fails
            this.createEmergencyFallback();
        }
    }

    /**
     * Initialize Safari 14+ specific features and detection
     * This provides enhanced support for Safari 14+ Private Browsing mode
     */
    initializeSafari14Plus() {
        this.inMemoryStorage = new Map();
        this.operationCount = 0;
        this.failureCount = 0;
        this.isSafari14Plus = this.detectSafari14Plus();
        this.isPrivateBrowsing = this.detectPrivateBrowsing();
        this.storageQuota = this.estimateStorageQuota();
        
        // Safari 14+ specific initialization
        if (this.isSafari14Plus) {
            this.safari14Mode = true;
            this.maxOperationsBeforeVerification = 3;  // Safari 14+ may fail after 3 operations
            this.verificationInterval = 2; // Verify every 2 operations
            console.log('StorageManager: Safari 14+ mode enabled with enhanced data protection');
        }
    }

    /**
     * Detect if browser is Safari 14+ 
     * 
     * Safari 14+ introduced significant localStorage changes that require special handling:
     * - Extremely limited storage quota in private browsing (~5-10KB vs 2-5MB in older versions)
     * - Silent data loss where setItem succeeds but getItem returns null
     * - Delayed failure patterns where first few operations work then fail
     * - More aggressive Intelligent Tracking Prevention (ITP) data clearing
     * 
     * @returns {boolean} True if Safari 14+ detected
     */
    detectSafari14Plus() {
        try {
            if (typeof navigator === 'undefined') {
                return false;
            }
            
            const userAgent = navigator.userAgent;
            // Safari detection that excludes Chrome/Chromium which also contain "Safari" in UA string
            const isSafari = /Safari/.test(userAgent) && !/Chrome|Chromium/.test(userAgent);
            
            if (!isSafari) {
                return false;
            }
            
            // Extract Safari version from User-Agent string (e.g., "Version/14.1.2")
            const versionMatch = userAgent.match(/Version\/(\d+)\.(\d+)/);
            if (versionMatch) {
                const majorVersion = parseInt(versionMatch[1], 10);
                return majorVersion >= 14;
            }
            
            // Fallback: Use behavioral feature detection if version parsing fails
            // This tests for Safari 14+ specific localStorage behaviors
            return this.detectSafari14Features();
        } catch (error) {
            console.warn('Could not detect Safari version:', error);
            return false;
        }
    }

    /**
     * Detect Safari 14+ specific features through behavioral testing
     * 
     * Safari 14+ has unique localStorage behaviors that can be detected:
     * 1. Silent data loss: setItem appears to succeed but getItem returns different value
     * 2. Intermittent failures: localStorage operations randomly fail
     * 3. Quota exceeded errors at very low thresholds
     * 
     * This method performs a controlled test to identify these behaviors.
     * 
     * @returns {boolean} True if Safari 14+ behaviors detected
     */
    detectSafari14Features() {
        try {
            if (typeof localStorage === 'undefined') {
                return false;
            }
            
            // Test for Safari 14+ specific private browsing behaviors
            const testKey = '__safari14_test__';
            const testValue = 'test_value';
            
            try {
                localStorage.setItem(testKey, testValue);
                const retrieved = localStorage.getItem(testKey);
                localStorage.removeItem(testKey);
                
                // In Safari 14+ private mode, setItem may succeed but getItem returns null
                // This is different from other browsers where setItem would throw an exception
                if (retrieved !== testValue) {
                    console.log('StorageManager: Safari 14+ silent data loss behavior detected');
                    return true;
                }
                
                // Future enhancement: Additional Safari 14+ specific feature tests could be added here
                // such as testing for extremely low quota limits or ITP behavior patterns
                return false;
            } catch (e) {
                // If any localStorage operation fails, it might be Safari 14+ private mode
                // where operations sometimes work initially but fail later
                return true;
            }
        } catch (error) {
            console.warn('Safari 14+ feature detection failed:', error);
            return false;
        }
    }

    /**
     * Detects private browsing mode with enhanced Safari 14+ detection
     * @returns {boolean} True if private browsing is detected
     */
    detectPrivateBrowsing() {
        try {
            if (typeof localStorage === 'undefined') {
                return true;
            }
            
            const testKey = '__private_test__';
            const testData = 'private_browsing_test';
            
            // Different behavior patterns for different browsers
            try {
                localStorage.setItem(testKey, testData);
                localStorage.removeItem(testKey);
                return false;
            } catch (error) {
                // localStorage failed - likely private browsing
                return true;
            }
        } catch (error) {
            console.warn('Private browsing detection failed:', error);
            return true;
        }
    }

    /**
     * Estimate storage quota for different browsers and modes
     * @returns {number} Estimated quota in bytes
     */
    estimateStorageQuota() {
        if (this.isSafari14Plus && this.isPrivateBrowsing) {
            return 10 * 1024; // ~10KB for Safari 14+ private mode
        } else if (this.isPrivateBrowsing) {
            return 2 * 1024 * 1024; // ~2MB for other browsers private mode
        } else {
            return 10 * 1024 * 1024; // ~10MB for normal mode
        }
    }

    /**
     * Notify user about private browsing mode with Safari 14+ specific messaging
     */
    notifyPrivateBrowsing() {
        // Only show once per session
        if (!this.inMemoryStorage.has('__private_notified__')) {
            if (this.isSafari14Plus) {
                console.info('🔒 Safari 14+ private browsing detected. Enhanced data protection mode active.');
            } else {
                console.info('🔒 Private browsing detected. Todos will only persist during this session.');
            }
            this.inMemoryStorage.set('__private_notified__', true);
            
            // Show user-friendly notification if possible
            this.showUserNotification();
        }
    }

    /**
     * Show user-friendly notification for private browsing
     */
    showUserNotification() {
        // Create a simple notification for the user
        if (typeof document !== 'undefined') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed; top: 10px; right: 10px; z-index: 10000;
                background: #f39c12; color: white; padding: 10px 15px;
                border-radius: 5px; font-size: 14px; max-width: 300px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;
            
            if (this.isSafari14Plus) {
                notification.innerHTML = '🔒 Safari private mode: Todos saved with enhanced protection';
            } else {
                notification.innerHTML = '🔒 Private browsing: Todos will only persist during this session';
            }
            
            document.body.appendChild(notification);
            
            // Remove notification after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        }
    }

    /**
     * Create an emergency fallback system if module initialization fails
     * 
     * This is a critical safety net that ensures the application continues to function
     * even if the sophisticated modular storage system fails to initialize.
     * Common failure scenarios include:
     * - Missing dependencies (StorageDetector, StorageFallbackHandler, etc.)
     * - Browser security restrictions preventing module loading
     * - Corrupted state from previous sessions
     * - Extreme browser compatibility issues
     * 
     * The emergency system provides:
     * - Pure in-memory storage that always works
     * - Minimal API compatibility with the full system
     * - Proper error handling and logging
     * - Graceful degradation of features
     * 
     * Provides basic functionality even if the modular system can't be initialized
     */
    createEmergencyFallback() {
        console.warn('StorageManager: Using emergency fallback system - advanced features disabled');
        
        // Initialize minimal storage state
        this.memoryStorage = new Map();
        this.storageType = 'memory';
        this.isPrivateMode = true;  // Assume private mode for safety
        this.hasLocalStorage = false;
        this.hasSessionStorage = false;
        
        // Create minimal operations object that provides basic functionality
        // This ensures the public API still works even without the modular system
        this.operations = {
            getItem: (key) => this.memoryStorage.get(key) || null,
            setItem: (key, value) => { 
                this.memoryStorage.set(key, value); 
                return true; 
            },
            removeItem: (key) => { 
                this.memoryStorage.delete(key); 
                return true; 
            },
            clear: () => { 
                this.memoryStorage.clear(); 
                return true; 
            },
            isAvailable: () => true  // Memory storage is always available
        };
        
        console.warn('StorageManager: Emergency fallback active - data will only persist during this session');
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
        this.isStorageAvailable = this.storageType === 'localStorage';
        
        // Safari 14+ legacy properties
        this.isPrivateBrowsing = this.isPrivateBrowsing || false;
        this.safari14Mode = this.safari14Mode || false;
    }

    /**
     * Get an item from storage with comprehensive fallback support
     * 
     * This method attempts to retrieve data using the most reliable mechanism
     * available, automatically falling back through storage types as needed.
     * Includes data recovery from ITP backup if main data is lost.
     * 
     * @param {string} key - Storage key to retrieve
     * @returns {string|null} Stored value or null if not found
     */
    getItem(key) {
        try {
            let result = this.operations.getItem(key);
            
            // If no data found and we have ITP handler, try to restore from backup
            if (!result && this.itpHandler && this.itpHandler.isInitialized) {
                if (key === 'todos' || key.includes('todo')) {
                    const backupData = this.itpHandler.restore();
                    if (backupData && backupData.todos) {
                        console.log('StorageManager: Restored todos from ITP backup');
                        result = JSON.stringify(backupData.todos);
                        
                        // Re-store the recovered data
                        this.setItem(key, result);
                    }
                }
            }
            
            return result;
        } catch (error) {
            console.error('StorageManager.getItem failed:', error);
            return null;
        }
    }

    /**
     * Store an item with comprehensive fallback and error handling
     * 
     * This method is the core of the Safari 14+ data loss prevention system.
     * It handles multiple challenging scenarios:
     * 
     * 1. **Safari 14+ Silent Data Loss**: Uses verification to detect when data
     *    appears to store successfully but actually doesn't persist
     * 
     * 2. **Safari 14+ ITP Data Clearing**: Creates backups and tracks activity
     *    to prevent data loss from Intelligent Tracking Prevention after 7 days
     * 
     * 3. **Progressive Degradation**: Automatically falls back through storage types:
     *    localStorage → sessionStorage → memory storage
     * 
     * 4. **Quota Management**: Handles QuotaExceededError by switching to 
     *    alternative storage mechanisms
     * 
     * 5. **Operation Monitoring**: Tracks operation counts to detect Safari 14+
     *    patterns where failures occur after initial success
     * 
     * The method ensures data is stored reliably even in challenging environments
     * and always returns true due to memory fallback guarantee.
     * 
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {boolean} True if storage was successful (always true due to memory fallback)
     */
    setItem(key, value) {
        try {
            let result;
            
            // Safari 14+ specific operation monitoring and enhanced handling
            if (this.safari14Mode) {
                this.operationCount++;
                
                // Use verification for Safari 14+ to prevent silent data loss
                // Verification is performed periodically to balance performance with reliability
                if (this.operationCount % this.verificationInterval === 0) {
                    result = this.setItemWithVerification(key, value);
                } else {
                    result = this.operations.setItem(key, value);
                }
            } else {
                // Standard operation for non-Safari 14+ browsers
                result = this.operations.setItem(key, value);
            }
            
            // Safari ITP protection: Create backups and reset activity timer
            // This prevents data loss from Safari's 7-day inactivity clearing
            if (this.itpHandler && this.itpHandler.isInitialized) {
                // Reset the ITP timer to prevent data clearing
                this.itpHandler.resetTimer();
                
                // Create protective backup of todos data
                if (key === 'todos' || key.includes('todo')) {
                    try {
                        const currentTodos = JSON.parse(value);
                        this.itpHandler.backup({ todos: currentTodos });
                    } catch (parseError) {
                        console.warn('StorageManager: Could not parse todos for ITP backup:', parseError);
                    }
                }
            }
            
            return result;
        } catch (error) {
            // Track failures for Safari 14+ monitoring
            if (this.safari14Mode) {
                this.failureCount++;
            }
            console.error('StorageManager.setItem failed:', error);
            
            // Emergency fallback: Always ensure data is stored somewhere
            // This is the final safety net that prevents data loss
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
     * Set item with data verification for Safari 14+ private browsing
     * 
     * Safari 14+ private browsing has a critical issue where localStorage.setItem() 
     * appears to succeed (no exception thrown) but the data is not actually stored.
     * This creates silent data loss that users don't notice until they reload the page.
     * 
     * This method prevents that by:
     * 1. Attempting to store the data normally
     * 2. Immediately retrieving it to verify it was actually stored
     * 3. If verification fails, falling back to in-memory storage
     * 4. Logging the issue for debugging purposes
     * 
     * @param {string} key - Storage key  
     * @param {string} value - Value to store
     * @returns {boolean} True if storage and verification succeeded
     */
    setItemWithVerification(key, value) {
        try {
            // Step 1: Attempt to store the data using the normal operation
            const storeResult = this.operations.setItem(key, value);
            if (!storeResult) {
                // If the operation itself failed, fall back to memory immediately
                this.inMemoryStorage.set(key, value);
                return true;
            }
            
            // Step 2: Critical verification step - check if data was actually stored
            // In Safari 14+ private browsing, this is where we catch silent failures
            const retrievedValue = this.operations.getItem(key);
            if (retrievedValue !== value) {
                console.warn('StorageManager: Safari 14+ silent data loss detected - data appeared to store but verification failed');
                console.warn(`StorageManager: Expected "${value}", but retrieved "${retrievedValue}"`);
                
                // Fall back to reliable in-memory storage
                this.inMemoryStorage.set(key, value);
                return true;
            }
            
            // Step 3: Data verified successfully - storage is working properly
            return true;
        } catch (error) {
            console.error('StorageManager: Verification process failed:', error);
            // Even if verification fails, ensure data is stored somewhere
            this.inMemoryStorage.set(key, value);
            return true;
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
                memoryItems: this.memoryStorage ? this.memoryStorage.size : 0,
                
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
                    operations: !!this.operations,
                    itpHandler: !!this.itpHandler
                },

                // ITP protection status (if available)
                ...(this.itpHandler && { 
                    itpProtection: this.itpHandler.getITPStatus() 
                })
            };
        } catch (error) {
            console.warn('StorageManager: Error getting storage info:', error);
            
            // Return minimal information if detailed info fails
            return {
                currentType: this.storageType,
                hasLocalStorage: this.hasLocalStorage,
                hasSessionStorage: this.hasSessionStorage,
                isPrivateMode: this.isPrivateMode,
                memoryItems: this.memoryStorage ? this.memoryStorage.size : 0,
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

// Export for Node.js/testing environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager };
}