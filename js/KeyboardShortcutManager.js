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
class KeyboardShortcutManager {
    constructor(options = {}) {
        this.shortcuts = new Map();
        this.contexts = new Map();
        this.contextHandlers = new Map();
        
        // Configuration options
        this.options = {
            debug: options.debug || false,
            enableLogging: options.enableLogging || false,
            validateConflicts: options.validateConflicts !== false, // true by default
            maxShortcutsPerContext: options.maxShortcutsPerContext || 50,
            maxErrorsPerShortcut: options.maxErrorsPerShortcut || 10,
            problematicKeys: options.problematicKeys || ['Tab', 'F5', 'F12'],
            enableCaching: options.enableCaching !== false // true by default
        };
        
        // Backward compatibility for debugMode
        this.debugMode = this.options.debug;
        
        // Initialize utility classes for specialized functionality
        this.validator = new ShortcutValidator(this.options);
        this.cache = new ShortcutCache(this.options);
        this.statistics = new ShortcutStatistics(this.options);
        this.logger = new DebugLogger(this.options);
        
        this.setupDefaultShortcuts();
        this.logger.logInitialization();
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
        this.statistics.initializeShortcutStatistics(shortcutKey);

        this.logger.logShortcutRegistration(shortcutKey, shortcutConfig);
    }

    /**
     * Normalize and provide defaults for shortcut configuration
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
            registeredAt: new Date().toISOString()
        };
    }

    /**
     * Initialize statistics tracking for a new shortcut
     * @param {string} shortcutKey - The shortcut key identifier
     * @private
     * @deprecated Use statistics.initializeShortcutStatistics instead
     */
    _initializeShortcutStatistics(shortcutKey) {
        this.statistics.initializeShortcutStatistics(shortcutKey);
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
     * Generate a unique key for the shortcut with optional caching
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
     * Create a modifier string for shortcut key generation with optional caching
     * @param {boolean} ctrlKey - Whether Ctrl key is required
     * @param {boolean} altKey - Whether Alt key is required
     * @param {boolean} shiftKey - Whether Shift key is required
     * @returns {string} Modifier string with trailing '+' if modifiers exist
     */
    createModifierString(ctrlKey, altKey, shiftKey) {
        return this.cache.createModifierString(ctrlKey, altKey, shiftKey);
    }

    /**
     * Handle keyboard events with enhanced error handling and debugging
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {boolean} True if a shortcut was handled, false otherwise
     */
    handleKeyboard(event) {
        if (!this._isValidEvent(event)) {
            this.logger.logInvalidEvent();
            return false;
        }
        
        const debugSession = this.logger.startDebugSession();
        this.logger.logKeyEventProcessing(event);
        
        const matchingShortcut = this.findMatchingShortcut(event);
        
        if (matchingShortcut) {
            const result = this.executeShortcut(matchingShortcut, event);
            this.logger.endDebugSession(debugSession, matchingShortcut, event, 
                (key, ctrl, alt, shift, context) => this.generateShortcutKey(key, ctrl, alt, shift, context));
            return result;
        }
        
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
     * @deprecated Use logger.startDebugSession instead
     */
    _startDebugSession() {
        return this.logger.startDebugSession();
    }

    /**
     * @deprecated Use logger.endDebugSession instead
     */
    _endDebugSession(debugSession, shortcut = null, event = null) {
        this.logger.endDebugSession(debugSession, shortcut, event,
            (key, ctrl, alt, shift, context) => this.generateShortcutKey(key, ctrl, alt, shift, context));
    }

    /**
     * Find the first matching shortcut for the given keyboard event
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {Object|null} The matching shortcut configuration, or null if no shortcut matches
     */
    findMatchingShortcut(event) {
        const activeContexts = this.getActiveContexts();
        const contextOrder = [...activeContexts, 'global'];
        
        this.logger.logKeyboardEvent(event, activeContexts);

        for (const context of contextOrder) {
            const shortcut = this._findShortcutInContext(event, context);
            if (shortcut) {
                this._updateShortcutStatistics(event, context);
                return shortcut;
            }
        }
        
        this.logger.logNoMatchFound(event);
        return null;
    }

    /**
     * Find a shortcut in a specific context
     * @param {KeyboardEvent} event - The keyboard event
     * @param {string} context - The context to search in
     * @returns {Object|null} The matching shortcut or null
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
     * Update statistics for a triggered shortcut
     * @param {KeyboardEvent} event - The keyboard event
     * @param {string} context - The context where shortcut was found
     * @private
     */
    _updateShortcutStatistics(event, context) {
        const shortcutKey = this.generateShortcutKey(
            event.key, event.ctrlKey, event.altKey, event.shiftKey, context
        );
        
        this.statistics.updateShortcutStatistics(shortcutKey);
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
     * Get currently active contexts
     * @private
     */
    getActiveContexts() {
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
     * Remove a shortcut
     * @param {string} key - Key of the shortcut
     * @param {string} [context] - Context of the shortcut (default: 'global')
     * @param {boolean} [ctrlKey] - Whether Ctrl key is required
     * @param {boolean} [altKey] - Whether Alt key is required
     * @param {boolean} [shiftKey] - Whether Shift key is required
     */
    removeShortcut(key, context = 'global', ctrlKey = false, altKey = false, shiftKey = false) {
        const shortcutKey = this.generateShortcutKey(key, ctrlKey, altKey, shiftKey, context);
        return this.shortcuts.delete(shortcutKey);
    }

    /**
     * Clear all shortcuts and reset caches
     */
    clearShortcuts() {
        this.shortcuts.clear();
        this.statistics.clearStatistics();
        this.cache.clearCaches();
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
    // Debugging and Statistics Methods  
    // =================

    /**
     * Get usage statistics for all shortcuts
     * @returns {Array} Array of shortcuts with usage statistics
     */
    getUsageStatistics() {
        return this.statistics.getUsageStatistics(this.shortcuts);
    }

    /**
     * Get detailed debug information
     * @returns {Object} Debug information object
     */
    getDebugInfo() {
        return {
            totalShortcuts: this.shortcuts.size,
            totalContexts: this.contexts.size,
            usageStatistics: this.getUsageStatistics(),
            contexts: Array.from(this.contexts.keys()),
            options: this.options,
            shortcutsByContext: this._getShortcutsByContextDebug(),
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