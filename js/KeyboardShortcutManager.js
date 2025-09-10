/**
 * KeyboardShortcutManager - Enhanced modular and maintainable keyboard shortcut handling
 * 
 * This class provides a configuration-driven approach to keyboard shortcuts
 * with context awareness, validation, debugging capabilities and easy extensibility.
 * 
 * Refactored to use specialized utility classes for better code organization:
 * - ShortcutValidator: Handles validation logic
 * - ShortcutCache: Manages caching functionality  
 * - ShortcutStatistics: Tracks usage statistics
 * - DebugLogger: Handles debugging and logging
 */

// Constants
const DEFAULT_CONFIG = {
    MAX_SHORTCUTS_PER_CONTEXT: 50,
    MAX_ERRORS_PER_SHORTCUT: 10,
    PERFORMANCE_LOG_THRESHOLD: 10 // ms
};

const SYSTEM_SHORTCUTS = [
    'F5', 'F12', 'Tab'
];

const MODIFIER_KEYS = {
    CTRL: 'ctrl',
    ALT: 'alt',
    SHIFT: 'shift'
};
class KeyboardShortcutManager {
    constructor(options = {}) {
        this.shortcuts = new Map();
        this.contexts = new Map();
        this.contextHandlers = new Map();
        
        // Performance optimization: Pre-built lookup tables for enhanced features
        this.globalShortcuts = new Map();
        this.contextShortcuts = new Map();
        this.shortcutsByPriority = new Map(); // High, medium, low priority shortcuts
        
        // Configuration options
        this.options = {
            debug: options.debug || false,
            enableLogging: options.enableLogging || false,
            validateConflicts: options.validateConflicts !== false, // true by default
            maxShortcutsPerContext: options.maxShortcutsPerContext || DEFAULT_CONFIG.MAX_SHORTCUTS_PER_CONTEXT,
            maxErrorsPerShortcut: options.maxErrorsPerShortcut || DEFAULT_CONFIG.MAX_ERRORS_PER_SHORTCUT,
            problematicKeys: options.problematicKeys || SYSTEM_SHORTCUTS,
            enableCaching: options.enableCaching !== false, // true by default
            enablePriority: options.enablePriority !== false, // Enable priority system by default
            cacheContexts: options.cacheContexts !== false // Enable context caching for performance
        };
        
        // Backward compatibility for debugMode
        this.debugMode = this.options.debug;
        
        // Performance tracking
        this.performanceMetrics = {
            lookupTime: [],
            averageLookupTime: 0,
            totalLookups: 0
        };
        
        // Context caching for performance
        this.cachedActiveContexts = null;
        this.lastContextCheck = 0;
        this.contextCacheTimeout = 50; // ms
        
        // Initialize utility classes for specialized functionality
        this.validator = new ShortcutValidator(this.options);
        this.cache = new ShortcutCache(this.options);
        this.statistics = new ShortcutStatistics(this.options);
        this.logger = new DebugLogger(this.options);
        
        this.setupDefaultShortcuts();
        
        if (this.options.debug) {
            console.log('KeyboardShortcutManager initialized with enhanced features', {
                priorityEnabled: this.options.enablePriority,
                contextCaching: this.options.cacheContexts,
                maxShortcuts: this.options.maxShortcutsPerContext
            });
        }
    }

    /**
     * Register a keyboard shortcut with enhanced validation and conflict detection
     * @param {Object} config - Shortcut configuration
     * @param {string} config.key - Key to listen for (e.g., 'Escape', 's')
     * @param {boolean} [config.ctrlKey] - Whether Ctrl key is required
     * @param {boolean} [config.altKey] - Whether Alt key is required
     * @param {boolean} [config.shiftKey] - Whether Shift key is required
     * @param {string} [config.context] - Context where shortcut is active (optional)
     * @param {Function} config.action - Function to execute when shortcut is triggered
     * @param {boolean} [config.preventDefault] - Whether to prevent default browser behavior
     * @param {string} [config.description] - Human-readable description of the shortcut
     * @param {string} [config.category] - Category for organization (optional)
     * @param {string} [config.priority] - Priority level: 'high', 'medium', 'low' (default: 'medium')
     * @param {boolean} [config.enabled] - Whether shortcut is enabled (default: true)
     */
    registerShortcut(config) {
        const normalizedConfig = this._normalizeShortcutConfig(config);
        
        // Use validator for enhanced validation
        this.validator.validateShortcutConfig(normalizedConfig);

        const shortcutKey = this.cache.generateShortcutKey(
            normalizedConfig.key, 
            normalizedConfig.ctrlKey, 
            normalizedConfig.altKey, 
            normalizedConfig.shiftKey, 
            normalizedConfig.context
        );
        
        // Check for conflicts and context limits using validator
        this.validator.checkForConflicts(shortcutKey, normalizedConfig, this.shortcuts);
        const contextShortcuts = this.getShortcutsForContext(normalizedConfig.context);
        this.validator.checkContextLimits(normalizedConfig.context, contextShortcuts);

        const shortcutConfig = {
            ...normalizedConfig,
            registeredAt: new Date().toISOString()
        };
        
        this.shortcuts.set(shortcutKey, shortcutConfig);
        
        // Performance optimization: Update lookup tables for enhanced features
        this._updateLookupTables(shortcutKey, shortcutConfig);
        
        this.statistics.initializeShortcutStatistics(shortcutKey);
        this.logger.logShortcutRegistration(shortcutKey, shortcutConfig);
    }

    /**
     * Normalize and provide defaults for shortcut configuration including enhanced features
     * @param {Object} config - Raw shortcut configuration
     * @returns {Object} Normalized configuration with defaults
     * @private
     */
    _normalizeShortcutConfig(config) {
        return {
            key: config.key,
            ctrlKey: config.ctrlKey || false,
            altKey: config.altKey || false,
            shiftKey: config.shiftKey || false,
            context: config.context || 'global',
            action: config.action,
            preventDefault: config.preventDefault || false,
            description: config.description || '',
            category: config.category || 'Other',
            priority: config.priority || 'medium', // Enhanced: priority support
            enabled: config.enabled !== false, // Enhanced: enabled/disabled support
            registeredAt: new Date().toISOString()
        };
    }

    /**
     * Update lookup tables for performance optimization (Enhanced feature)
     * @private
     */
    _updateLookupTables(shortcutKey, shortcutConfig) {
        if (shortcutConfig.context === 'global') {
            this.globalShortcuts.set(shortcutKey, shortcutConfig);
        } else {
            if (!this.contextShortcuts.has(shortcutConfig.context)) {
                this.contextShortcuts.set(shortcutConfig.context, new Map());
            }
            this.contextShortcuts.get(shortcutConfig.context).set(shortcutKey, shortcutConfig);
        }
        
        // Update priority table if enabled
        if (this.options.enablePriority) {
            if (!this.shortcutsByPriority.has(shortcutConfig.priority)) {
                this.shortcutsByPriority.set(shortcutConfig.priority, new Map());
            }
            this.shortcutsByPriority.get(shortcutConfig.priority).set(shortcutKey, shortcutConfig);
        }
        
        // Clear context cache when shortcuts change
        this._clearContextCache();
    }

    /**
     * Clear context cache to force re-evaluation (Enhanced feature)
     * @private
     */
    _clearContextCache() {
        this.cachedActiveContexts = null;
        this.lastContextCheck = 0;
    }

    /**
     * Register a context and its condition checker
     * @param {string} contextName - Name of the context
     * @param {Function} conditionChecker - Function that returns true if context is active
     */
    registerContext(contextName, conditionChecker) {
        if (typeof conditionChecker !== 'function') {
            throw new Error('Context condition checker must be a function');
        }
        this.contexts.set(contextName, conditionChecker);
    }

    /**
     * Register a handler for context-specific actions
     * @param {string} contextName - Name of the context
     * @param {Object} handlers - Object with handler methods
     */
    registerContextHandlers(contextName, handlers) {
        this.contextHandlers.set(contextName, handlers);
    }

    /**
     * Generate a unique key for the shortcut with optional caching (Enhanced feature)
     * @param {string} key - The key
     * @param {boolean} ctrlKey - Whether Ctrl key is required
     * @param {boolean} altKey - Whether Alt key is required  
     * @param {boolean} shiftKey - Whether Shift key is required
     * @param {string} context - The context
     * @returns {string} Unique shortcut key identifier
     */
    generateShortcutKey(key, ctrlKey, altKey, shiftKey, context) {
        return this.cache.generateShortcutKey(key, ctrlKey, altKey, shiftKey, context);
    }

    /**
     * Create a modifier string for shortcut key generation
     * @param {boolean} ctrlKey - Whether Ctrl key is required
     * @param {boolean} altKey - Whether Alt key is required
     * @param {boolean} shiftKey - Whether Shift key is required
     * @returns {string} Modifier string with trailing '+' if modifiers exist
     */
    createModifierString(ctrlKey, altKey, shiftKey) {
        return this.cache.createModifierString(ctrlKey, altKey, shiftKey);
    }

    /**
     * Handle keyboard events with enhanced error handling, debugging, and performance tracking
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyboard(event) {
        if (!this._isValidEvent(event)) {
            this.logger.logInvalidEvent();
            return false;
        }
        
        const startTime = performance.now();
        const debugSession = this.logger.startDebugSession();
        this.logger.logKeyEventProcessing(event);
        
        const matchingShortcut = this.findMatchingShortcut(event);
        
        if (matchingShortcut) {
            const result = this.executeShortcut(matchingShortcut, event);
            
            // Performance tracking
            const endTime = performance.now();
            const lookupTime = endTime - startTime;
            this._updatePerformanceMetrics(lookupTime);
            
            this.logger.endDebugSession(debugSession, matchingShortcut, event, 
                (key, ctrl, alt, shift, context) => this.generateShortcutKey(key, ctrl, alt, shift, context));
            return result;
        }
        
        // Performance tracking even for non-matches
        const endTime = performance.now();
        this._updatePerformanceMetrics(endTime - startTime);
        
        this.logger.endDebugSession(debugSession);
        return false; // No shortcut was handled
    }

    /**
     * Validate event object
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {boolean} True if event is valid
     * @private
     */
    _isValidEvent(event) {
        return event && typeof event === 'object';
    }

    /**
    /**
     * Find the first matching shortcut for the given keyboard event using optimized lookup
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {Object|null} The matching shortcut configuration, or null if no shortcut matches
     */
    findMatchingShortcut(event) {
        const activeContexts = this.getActiveContexts();
        
        // Performance optimization: Use priority-based lookup if enabled
        if (this.options.enablePriority) {
            return this._findMatchingShortcutWithPriority(event, activeContexts);
        }
        
        // Fallback to context-based lookup with logging
        const contextOrder = [...activeContexts, 'global'];
        this.logger.logKeyboardEvent(event, activeContexts);

        for (const context of contextOrder) {
            const shortcutKey = this.generateShortcutKey(
                event.key, event.ctrlKey, event.altKey, event.shiftKey, context
            );

            const shortcut = this.shortcuts.get(shortcutKey);
            if (shortcut && shortcut.enabled !== false) {
                this._updateShortcutStats(shortcutKey);
                return shortcut;
            }
        }
        
        this.logger.logNoMatchFound(event);
        return null;
    }

    /**
     * Find matching shortcut using priority-based lookup (Enhanced feature)
     * @private
     */
    _findMatchingShortcutWithPriority(event, activeContexts) {
        const priorityOrder = ['high', 'medium', 'low'];
        const contextOrder = [...activeContexts, 'global'];
        
        for (const priority of priorityOrder) {
            const priorityShortcuts = this.shortcutsByPriority.get(priority);
            if (!priorityShortcuts) continue;

            for (const context of contextOrder) {
                const shortcutKey = this.generateShortcutKey(
                    event.key, event.ctrlKey, event.altKey, event.shiftKey, context
                );

                const shortcut = priorityShortcuts.get(shortcutKey);
                if (shortcut && shortcut.enabled !== false) {
                    this._updateShortcutStats(shortcutKey);
                    return shortcut;
                }
            }
        }
        
        return null;
    }

    /**
     * Update shortcut statistics (Enhanced feature)
     * @private
     */
    _updateShortcutStats(shortcutKey) {
        this.statistics.updateShortcutStatistics(shortcutKey);
    }
    
    /**
     * Find a shortcut in a specific context
     * @param {KeyboardEvent} event - The keyboard event
     * @param {string} context - Context to search in
     * @returns {Object|null} The matching shortcut configuration, or null if no shortcut matches
     * @private
     */
    _findShortcutInContext(event, context) {
        const shortcutKey = this.generateShortcutKey(
            event.key,
            event.ctrlKey,
            event.altKey,
            event.shiftKey,
            context
        );
        
        return this.shortcuts.get(shortcutKey) || null;
    }

    /**
     * Execute a shortcut action with proper error handling
     * @param {Object} shortcut - The shortcut configuration
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {boolean} True if shortcut was executed successfully
     */
    executeShortcut(shortcut, event) {
        if (shortcut.preventDefault) {
            event.preventDefault();
        }
        
        try {
            shortcut.action(event);
            this._logShortcutExecution(shortcut, event);
            return true; // Shortcut was handled
        } catch (error) {
            this._handleShortcutExecutionError(error, shortcut, event);
            return false;
        }
    }

    /**
     * Log successful shortcut execution
     * @param {Object} shortcut - The shortcut configuration
     * @param {KeyboardEvent} event - The keyboard event
     * @private
     */
    _logShortcutExecution(shortcut, event) {
        const shortcutKey = this.generateShortcutKey(
            event.key, event.ctrlKey, event.altKey, event.shiftKey, shortcut.context
        );
        this.logger.logShortcutExecution(shortcutKey);
    }

    /**
     * Handle errors that occur during shortcut execution
     * @param {Error} error - The error that occurred
     * @param {Object} shortcut - The shortcut configuration that caused the error
     * @param {KeyboardEvent} event - The keyboard event
     * @private
    /**
     * Handle errors that occur during shortcut execution
     * @param {Error} error - The error that occurred
     * @param {Object} shortcut - The shortcut configuration that caused the error
     * @param {KeyboardEvent} event - The keyboard event
     * @private
     */
    _handleShortcutExecutionError(error, shortcut, event) {
        this.logger.logShortcutError(error, shortcut, 
            (ctrl, alt, shift) => this.createModifierString(ctrl, alt, shift));
        
        const shortcutKey = this.generateShortcutKey(
            event.key, event.ctrlKey, event.altKey, event.shiftKey, shortcut.context
        );
        this.statistics.recordShortcutError(error, shortcut, shortcutKey);
    }

    /**
     * Get currently active contexts with enhanced caching for performance (Enhanced feature)
     * @private
     */
    getActiveContexts() {
        const now = performance.now();
        
        // Use cached contexts if caching is enabled and cache is still valid
        if (this.options.cacheContexts && 
            this.cachedActiveContexts !== null && 
            (now - this.lastContextCheck) < this.contextCacheTimeout) {
            return this.cachedActiveContexts;
        }
        
        const active = [];
        for (const [contextName, checker] of this.contexts.entries()) {
            try {
                if (checker()) {
                    active.push(contextName);
                }
            } catch (error) {
                // Use consistent error handling format
                console.error(`KeyboardShortcutManager: Error checking context '${contextName}':`, error.message || error);
            }
        }
        
        // Cache the result if caching is enabled
        if (this.options.cacheContexts) {
            this.cachedActiveContexts = active;
            this.lastContextCheck = now;
        }
        
        return active;
    }

    /**
     * Setup default shortcuts for the AutoToDo application
     * @private
     */
    setupDefaultShortcuts() {
        // These will be configured by the TodoController when it initializes
        // This keeps the manager flexible while providing sensible defaults
    }

    /**
     * Get all registered shortcuts for debugging/documentation
     * @returns {Array} Array of shortcut configurations
     */
    getAllShortcuts() {
        return Array.from(this.shortcuts.values());
    }

    /**
     * Get shortcuts for a specific context
     * @param {string} contextName - Context to filter by
     * @returns {Array} Array of shortcuts for the context
     */
    getShortcutsForContext(contextName) {
        return Array.from(this.shortcuts.values()).filter(
            shortcut => shortcut.context === contextName
        );
    }

    /**
     * Remove a shortcut and update lookup tables
     * @param {string} key - Key of the shortcut
     * @param {string} [context] - Context of the shortcut (default: 'global')
     * @param {boolean} [ctrlKey] - Whether Ctrl key is required
     * @param {boolean} [altKey] - Whether Alt key is required
     * @param {boolean} [shiftKey] - Whether Shift key is required
     */
    removeShortcut(key, context = 'global', ctrlKey = false, altKey = false, shiftKey = false) {
        const shortcutKey = this.generateShortcutKey(key, ctrlKey, altKey, shiftKey, context);
        const shortcut = this.shortcuts.get(shortcutKey);
        
        if (shortcut) {
            // Remove from main map
            const result = this.shortcuts.delete(shortcutKey);
            
            // Remove from lookup tables
            if (context === 'global') {
                this.globalShortcuts.delete(shortcutKey);
            } else {
                const contextMap = this.contextShortcuts.get(context);
                if (contextMap) {
                    contextMap.delete(shortcutKey);
                    if (contextMap.size === 0) {
                        this.contextShortcuts.delete(context);
                    }
                }
            }
            
            // Remove from priority table
            if (this.options.enablePriority && shortcut.priority) {
                const priorityMap = this.shortcutsByPriority.get(shortcut.priority);
                if (priorityMap) {
                    priorityMap.delete(shortcutKey);
                    if (priorityMap.size === 0) {
                        this.shortcutsByPriority.delete(shortcut.priority);
                    }
                }
            }
            
            // Remove statistics using the statistics utility
            this.statistics.eventStats.delete(shortcutKey);
            
            // Clear context cache
            this._clearContextCache();
            
            if (this.options.debug) {
                console.log(`Removed shortcut: ${shortcutKey}`);
            }
            
            return result;
        }
        
        return false;
    }

    /**
     * Clear all shortcuts and reset lookup tables (Enhanced feature)
     */
    clearShortcuts() {
        this.shortcuts.clear();
        this.globalShortcuts.clear();
        this.contextShortcuts.clear();
        this.shortcutsByPriority.clear();
        this.statistics.clearStatistics();
        this.cache.clearCaches();
        this._clearContextCache();
        
        if (this.options.debug) {
            console.log('All shortcuts cleared');
        }
    }
    }

    /**
     * Get a formatted list of shortcuts for display
     * @returns {Array} Array of formatted shortcut descriptions
     */
    getShortcutDescriptions() {
        const descriptions = [];
        
        for (const shortcut of this.shortcuts.values()) {
            if (shortcut.description) {
                const formattedDescription = this.formatShortcutDescription(shortcut);
                descriptions.push(formattedDescription);
            }
        }
        
        return this.sortShortcutDescriptions(descriptions);
    }

    /**
     * Format a single shortcut into a description object
     * @param {Object} shortcut - The shortcut configuration
     * @returns {Object} Formatted description object
     * @private
     */
    formatShortcutDescription(shortcut) {
        const keyCombo = this.createKeyComboString(shortcut);
        
        return {
            keys: keyCombo,
            description: shortcut.description,
            context: shortcut.context,
            category: shortcut.category || 'Other'
        };
    }

    /**
     * Create a formatted key combination string
     * @param {Object} shortcut - The shortcut configuration
     * @returns {string} Formatted key combination string
     * @private
     */
    createKeyComboString(shortcut) {
        const modifiers = this.getModifierStrings(shortcut);
        
        return modifiers.length > 0 
            ? `${modifiers.join('+')}+${shortcut.key}`
            : shortcut.key;
    }

    /**
     * Get modifier strings for a shortcut
     * @param {Object} shortcut - The shortcut configuration
     * @returns {Array} Array of modifier strings
     * @private
     */
    getModifierStrings(shortcut) {
        const modifiers = [];
        if (shortcut.ctrlKey) modifiers.push('Ctrl');
        if (shortcut.altKey) modifiers.push('Alt');
        if (shortcut.shiftKey) modifiers.push('Shift');
        return modifiers;
    }

    /**
     * Sort shortcut descriptions by context and key combination
     * @param {Array} descriptions - Array of description objects
     * @returns {Array} Sorted array of descriptions
     * @private
     */
    sortShortcutDescriptions(descriptions) {
        return descriptions.sort((a, b) => {
            // Sort by context first, then by key combination
            if (a.context !== b.context) {
                return a.context.localeCompare(b.context);
            }
            return a.keys.localeCompare(b.keys);
        });
    }

    // =================
    // Performance and Utility Methods (Enhanced Features)
    // =================

    /**
     * Update performance metrics (Enhanced feature)
     * @private
     */
    _updatePerformanceMetrics(lookupTime) {
        this.performanceMetrics.lookupTime.push(lookupTime);
        this.performanceMetrics.totalLookups++;
        
        // Keep only last 100 measurements for rolling average
        if (this.performanceMetrics.lookupTime.length > 100) {
            this.performanceMetrics.lookupTime.shift();
        }
        
        // Calculate rolling average
        const sum = this.performanceMetrics.lookupTime.reduce((a, b) => a + b, 0);
        this.performanceMetrics.averageLookupTime = sum / this.performanceMetrics.lookupTime.length;
    }

    /**
     * Enable or disable a specific shortcut (Enhanced feature)
     * @param {string} key - Key of the shortcut
     * @param {string} [context] - Context of the shortcut (default: 'global')
     * @param {boolean} [ctrlKey] - Whether Ctrl key is required
     * @param {boolean} [altKey] - Whether Alt key is required
     * @param {boolean} [shiftKey] - Whether Shift key is required
     * @param {boolean} enabled - Whether to enable or disable the shortcut
     */
    enableShortcut(key, context = 'global', ctrlKey = false, altKey = false, shiftKey = false, enabled = true) {
        const shortcutKey = this.generateShortcutKey(key, ctrlKey, altKey, shiftKey, context);
        const shortcut = this.shortcuts.get(shortcutKey);
        
        if (shortcut) {
            shortcut.enabled = enabled;
            
            if (this.options.debug) {
                console.log(`Shortcut ${shortcutKey} ${enabled ? 'enabled' : 'disabled'}`);
            }
        }
    }

    /**
     * Get performance metrics (Enhanced feature)
     * @returns {Object} Performance metrics object
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            shortcutsRegistered: this.shortcuts.size,
            contextsRegistered: this.contexts.size
        };
    }

    /**
     * Get shortcuts by priority level (Enhanced feature)
     * @param {string} priority - Priority level ('high', 'medium', 'low')
     * @returns {Array} Array of shortcuts with the specified priority
     */
    getShortcutsByPriority(priority) {
        const priorityShortcuts = this.shortcutsByPriority.get(priority);
        return priorityShortcuts ? Array.from(priorityShortcuts.values()) : [];
    }

    /**
     * Register multiple shortcuts at once (Enhanced feature)
     * @param {Array} shortcuts - Array of shortcut configurations
     * @returns {Object} Registration summary
     */
    registerShortcuts(shortcuts) {
        const summary = {
            total: shortcuts.length,
            registered: 0,
            failed: 0,
            errors: []
        };

        shortcuts.forEach((shortcut, index) => {
            try {
                this.registerShortcut(shortcut);
                summary.registered++;
            } catch (error) {
                summary.failed++;
                summary.errors.push({ index, shortcut, error: error.message });
            }
        });

        if (this.options.debug) {
            console.log('Bulk shortcut registration completed:', summary);
        }

        return summary;
    }

    // =================
    // Debugging and Statistics Methods  
    // =================

    /**
     * Get enhanced usage statistics for all shortcuts
     * @returns {Array} Array of shortcuts with usage statistics
     */
    getUsageStatistics() {
        return this.statistics.getUsageStatistics(this.shortcuts);
    }

    /**
     * Get enhanced debug information including performance metrics
     * @returns {Object} Debug information object
     */
    getDebugInfo() {
        return {
            totalShortcuts: this.shortcuts.size,
            totalContexts: this.contexts.size,
            usageStatistics: this.getUsageStatistics(),
            contexts: Array.from(this.contexts.keys()),
            options: this.options,
            performanceMetrics: this.getPerformanceMetrics(), // Enhanced: performance metrics
            shortcutsByContext: this._getShortcutsByContextDebug(),
            shortcutsByPriority: this._getShortcutsByPriorityDebug(), // Enhanced: priority debugging
            lookupTableSizes: { // Enhanced: lookup table stats
                global: this.globalShortcuts.size,
                contexts: this.contextShortcuts.size,
                priorities: this.shortcutsByPriority.size
            },
            cacheStats: this.cache.getCacheStats(),
            statisticsSummary: this.statistics.getStatisticsSummary()
        };
    }

    /**
     * Get shortcuts grouped by context for debugging
     * @private
     */
    _getShortcutsByContextDebug() {
        const byContext = {};
        
        for (const shortcut of this.shortcuts.values()) {
            const context = shortcut.context;
            if (!byContext[context]) {
                byContext[context] = [];
            }
            byContext[context].push({
                key: shortcut.key,
                description: shortcut.description,
                modifiers: {
                    ctrl: shortcut.ctrlKey,
                    alt: shortcut.altKey,
                    shift: shortcut.shiftKey
                }
            });
        }
        
        return byContext;
    }

    /**
     * Get shortcuts grouped by priority for debugging
     * @private
     */
    _getShortcutsByPriorityDebug() {
        const byPriority = {};
        
        for (const shortcut of this.shortcuts.values()) {
            const priority = shortcut.priority || 'medium';
            if (!byPriority[priority]) {
                byPriority[priority] = [];
            }
            byPriority[priority].push({
                key: shortcut.key,
                context: shortcut.context,
                description: shortcut.description,
                enabled: shortcut.enabled !== false,
                modifiers: {
                    ctrl: shortcut.ctrlKey,
                    alt: shortcut.altKey,
                    shift: shortcut.shiftKey
                }
            });
        }
        
        return byPriority;
    }

    /**
     * Validate all registered shortcuts for potential issues
     * @returns {Array} Array of validation issues found
     */
    validateAllShortcuts() {
        return this.validator.validateAllShortcuts(this.shortcuts, this.statistics.eventStats);
    }

    /**
     * Reset usage statistics
     */
    resetStatistics() {
        this.statistics.resetStatistics(this.shortcuts);
        this.logger.logStatisticsReset();
    }
}