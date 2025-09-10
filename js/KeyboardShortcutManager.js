/**
 * KeyboardShortcutManager - Enhanced modular and maintainable keyboard shortcut handling
 * 
 * This class provides a configuration-driven approach to keyboard shortcuts
 * with context awareness, validation, debugging capabilities and easy extensibility.
 */
class KeyboardShortcutManager {
    constructor(options = {}) {
        this.shortcuts = new Map();
        this.contexts = new Map();
        this.contextHandlers = new Map();
        this.eventStats = new Map();
        
        // Configuration options
        this.options = {
            debug: options.debug || false,
            enableLogging: options.enableLogging || false,
            validateConflicts: options.validateConflicts !== false, // true by default
            maxShortcutsPerContext: options.maxShortcutsPerContext || 50
        };
        
        // Backward compatibility for debugMode
        this.debugMode = this.options.debug;
        
        this.setupDefaultShortcuts();
        
        if (this.options.debug) {
            console.log('KeyboardShortcutManager initialized with debug mode enabled');
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
     */
    registerShortcut(config) {
        const normalizedConfig = this._normalizeShortcutConfig(config);
        
        // Enhanced validation
        this._validateShortcutConfig(normalizedConfig);

        const shortcutKey = this._generateAndValidateShortcutKey(normalizedConfig);
        
        // Store the shortcut and initialize statistics
        this._storeShortcut(shortcutKey, normalizedConfig);
        this._logRegistration(shortcutKey, normalizedConfig);
    }

    /**
     * Normalize shortcut configuration with defaults
     * @param {Object} config - Raw shortcut configuration
     * @returns {Object} Normalized configuration
     * @private
     */
    _normalizeShortcutConfig(config) {
        const {
            key,
            ctrlKey = false,
            altKey = false,
            shiftKey = false,
            context = 'global',
            action,
            preventDefault = false,
            description = '',
            category = 'Other'
        } = config;

        return {
            key,
            ctrlKey,
            altKey,
            shiftKey,
            context,
            action,
            preventDefault,
            description,
            category,
            registeredAt: new Date().toISOString()
        };
    }

    /**
     * Generate shortcut key and perform validation checks
     * @param {Object} config - Normalized shortcut configuration
     * @returns {string} The generated shortcut key
     * @private
     */
    _generateAndValidateShortcutKey(config) {
        const shortcutKey = this.generateShortcutKey(
            config.key, config.ctrlKey, config.altKey, config.shiftKey, config.context
        );
        
        // Check for conflicts if validation is enabled
        if (this.options.validateConflicts) {
            this._checkForConflicts(shortcutKey, config);
        }
        
        // Check context limits
        this._checkContextLimits(config.context);

        return shortcutKey;
    }

    /**
     * Store the shortcut configuration and initialize statistics
     * @param {string} shortcutKey - The shortcut key
     * @param {Object} config - The shortcut configuration
     * @private
     */
    _storeShortcut(shortcutKey, config) {
        this.shortcuts.set(shortcutKey, config);
        
        // Initialize event stats for this shortcut
        this.eventStats.set(shortcutKey, {
            triggerCount: 0,
            lastTriggered: null,
            errors: []
        });
    }

    /**
     * Log shortcut registration if debug mode is enabled
     * @param {string} shortcutKey - The shortcut key
     * @param {Object} config - The shortcut configuration
     * @private
     */
    _logRegistration(shortcutKey, config) {
        if (this.options.debug) {
            console.log(`Registered shortcut: ${shortcutKey}`, config);
        }
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
     * Generate a unique key for the shortcut
     * @private
     */
    generateShortcutKey(key, ctrlKey, altKey, shiftKey, context) {
        const modifierStr = this.createModifierString(ctrlKey, altKey, shiftKey);
        return `${context}:${modifierStr}${key.toLowerCase()}`;
    }

    /**
     * Create a modifier string for shortcut key generation
     * @param {boolean} ctrlKey - Whether Ctrl key is required
     * @param {boolean} altKey - Whether Alt key is required
     * @param {boolean} shiftKey - Whether Shift key is required
     * @returns {string} Modifier string with trailing '+' if modifiers exist
     * @private
     */
    createModifierString(ctrlKey, altKey, shiftKey) {
        const modifiers = [];
        if (ctrlKey) modifiers.push('ctrl');
        if (altKey) modifiers.push('alt');
        if (shiftKey) modifiers.push('shift');
        
        // Return only the modifier portion for key generation - context and key
        // are handled separately in generateShortcutKey() for proper separation of concerns
        return modifiers.length > 0 ? modifiers.join('+') + '+' : '';
    }

    /**
     * Handle keyboard events with enhanced error handling and debugging
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyboard(event) {
        if (!this._validateKeyboardEvent(event)) {
            return false;
        }
        
        const startTime = this.options.debug ? performance.now() : 0;
        const keyInfo = this._extractKeyInfo(event);
        
        this._logKeyEvent(keyInfo, event);
        
        const matchingShortcut = this.findMatchingShortcut(event);
        
        if (matchingShortcut) {
            const result = this.executeShortcut(matchingShortcut, event);
            this._logShortcutExecution(keyInfo, matchingShortcut, startTime);
            return result;
        }
        
        this._logNoMatch(startTime);
        return false; // No shortcut was handled
    }

    /**
     * Validate the keyboard event object
     * @param {KeyboardEvent} event - The keyboard event to validate
     * @returns {boolean} True if event is valid
     * @private
     */
    _validateKeyboardEvent(event) {
        if (!event || typeof event !== 'object') {
            if (this.options.debug) {
                console.warn('KeyboardShortcutManager: Invalid event object received');
            }
            return false;
        }
        return true;
    }

    /**
     * Extract key information from the event
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {Object} Object containing key information
     * @private
     */
    _extractKeyInfo(event) {
        return {
            key: event.key || '',
            ctrlKey: Boolean(event.ctrlKey),
            altKey: Boolean(event.altKey),
            shiftKey: Boolean(event.shiftKey)
        };
    }

    /**
     * Log key event for debugging
     * @param {Object} keyInfo - Key information object
     * @param {KeyboardEvent} event - The keyboard event
     * @private
     */
    _logKeyEvent(keyInfo, event) {
        if (this.options.debug) {
            console.log('KeyboardShortcutManager: Processing key event', {
                ...keyInfo,
                target: event.target?.tagName || 'unknown'
            });
        }
    }

    /**
     * Log shortcut execution for debugging
     * @param {Object} keyInfo - Key information object
     * @param {Object} matchingShortcut - The executed shortcut
     * @param {number} startTime - Start time for performance measurement
     * @private
     */
    _logShortcutExecution(keyInfo, matchingShortcut, startTime) {
        if (this.options.debug) {
            const endTime = performance.now();
            const shortcutKey = this.generateShortcutKey(
                keyInfo.key, keyInfo.ctrlKey, keyInfo.altKey, keyInfo.shiftKey, matchingShortcut.context
            );
            console.log(`Shortcut ${shortcutKey} executed in ${endTime - startTime}ms`);
        }
    }

    /**
     * Log when no shortcut matches
     * @param {number} startTime - Start time for performance measurement
     * @private
     */
    _logNoMatch(startTime) {
        if (this.options.debug) {
            const endTime = performance.now();
            console.log(`Keyboard handling completed in ${endTime - startTime}ms (no match)`);
        }
    }

    /**
     * Find the first matching shortcut for the given keyboard event
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {Object|null} The matching shortcut configuration, or null if no shortcut matches
     * @private
     */
    findMatchingShortcut(event) {
        const activeContexts = this._getActiveContextsCached();
        const contextOrder = [...activeContexts, 'global'];
        
        if (this.options.debug) {
            console.log('Keyboard event:', {
                key: event.key,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
                activeContexts
            });
        }

        return this._findShortcutInContexts(event, contextOrder);
    }

    /**
     * Get active contexts with caching for performance
     * @returns {Array} Array of active context names
     * @private
     */
    _getActiveContextsCached() {
        // Cache contexts for a short time to avoid redundant checks
        const now = Date.now();
        if (this._contextCache && (now - this._contextCacheTime < 100)) {
            return this._contextCache;
        }

        const activeContexts = this.getActiveContexts();
        this._contextCache = activeContexts;
        this._contextCacheTime = now;
        
        return activeContexts;
    }

    /**
     * Find shortcut in the given contexts
     * @param {KeyboardEvent} event - The keyboard event
     * @param {Array} contextOrder - Array of contexts to check in order
     * @returns {Object|null} The matching shortcut or null
     * @private
     */
    _findShortcutInContexts(event, contextOrder) {
        for (const context of contextOrder) {
            const shortcutKey = this.generateShortcutKey(
                event.key,
                event.ctrlKey,
                event.altKey,
                event.shiftKey,
                context
            );

            const shortcut = this.shortcuts.get(shortcutKey);
            if (shortcut) {
                this._updateShortcutStats(shortcutKey);
                return shortcut;
            }
        }
        
        this._logNoShortcutFound(event);
        return null;
    }

    /**
     * Update shortcut statistics
     * @param {string} shortcutKey - The shortcut key
     * @private
     */
    _updateShortcutStats(shortcutKey) {
        const stats = this.eventStats.get(shortcutKey);
        if (stats) {
            stats.triggerCount++;
            stats.lastTriggered = new Date().toISOString();
        }
    }

    /**
     * Log when no shortcut is found
     * @param {KeyboardEvent} event - The keyboard event
     * @private
     */
    _logNoShortcutFound(event) {
        if (this.debugMode || this.options.debug) {
            console.debug(`KeyboardShortcutManager: No shortcut matches key combination: ${event.key} (Ctrl: ${event.ctrlKey}, Alt: ${event.altKey}, Shift: ${event.shiftKey})`);
        }
    }

    /**
     * Execute a shortcut action with proper error handling
     * @param {Object} shortcut - The shortcut configuration
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {boolean} True if shortcut was executed successfully
     * @private
     */
    executeShortcut(shortcut, event) {
        const shortcutKey = this.generateShortcutKey(
            event.key, event.ctrlKey, event.altKey, event.shiftKey, shortcut.context
        );
        
        if (shortcut.preventDefault) {
            event.preventDefault();
        }
        
        try {
            shortcut.action(event);
            this._logShortcutSuccess(shortcutKey);
            return true; // Shortcut was handled
        } catch (error) {
            this._handleExecutionError(error, shortcut, shortcutKey);
            return false;
        }
    }

    /**
     * Log successful shortcut execution
     * @param {string} shortcutKey - The shortcut key
     * @private
     */
    _logShortcutSuccess(shortcutKey) {
        if (this.options.enableLogging) {
            console.log(`Shortcut executed: ${shortcutKey}`);
        }
    }

    /**
     * Handle execution errors consistently
     * @param {Error} error - The error that occurred
     * @param {Object} shortcut - The shortcut configuration
     * @param {string} shortcutKey - The shortcut key
     * @private
     */
    _handleExecutionError(error, shortcut, shortcutKey) {
        this.handleShortcutError(error, shortcut, shortcutKey);
    }

    /**
     * Handle errors that occur during shortcut execution
     * @param {Error} error - The error that occurred
     * @param {Object} shortcut - The shortcut configuration that caused the error
     * @param {string} shortcutKey - The shortcut key for error tracking
     * @private
     */
    handleShortcutError(error, shortcut, shortcutKey) {
        // Log error with specific shortcut information for better troubleshooting
        const shortcutInfo = shortcut ? 
            `${shortcut.context}:${this.createModifierString(shortcut.ctrlKey, shortcut.altKey, shortcut.shiftKey)}${shortcut.key}` :
            'unknown shortcut';
        
        console.error(`KeyboardShortcutManager: Error executing shortcut '${shortcutInfo}':`, error.message || error);
        
        // Log error to statistics
        if (shortcutKey) {
            const stats = this.eventStats.get(shortcutKey);
            if (stats) {
                const errorInfo = {
                    error: error.message,
                    timestamp: new Date().toISOString(),
                    shortcutKey,
                    event: shortcut.key
                };
                
                stats.errors.push(errorInfo);
                // Keep only last 10 errors per shortcut
                if (stats.errors.length > 10) {
                    stats.errors = stats.errors.slice(-10);
                }
            }
        }
        
        // In debug mode, provide more detailed error information
        if (this.options.debug) {
            console.error('Shortcut configuration:', shortcut);
            console.error('Full error object:', error);
        }
        
        // In production, you might want to send this to an error reporting service
        // or display a user-friendly message
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
     * Clear all shortcuts
     */
    clearShortcuts() {
        this.shortcuts.clear();
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
    // Validation Methods
    // =================

    /**
     * Validate shortcut configuration
     * @private
     */
    _validateShortcutConfig(config) {
        const { key, action } = config;

        if (!key || typeof key !== 'string' || key.trim() === '') {
            throw new Error('Shortcut must have a non-empty key string');
        }

        if (!action || typeof action !== 'function') {
            throw new Error('Shortcut must have a valid action function');
        }

        // Validate modifier combinations
        if (config.ctrlKey && config.altKey && config.shiftKey) {
            console.warn(`Shortcut with key "${key}" uses all three modifiers, which may be difficult for users`);
        }

        // Check for potentially problematic keys
        const problematicKeys = ['Tab', 'F5', 'F12'];
        if (problematicKeys.includes(key)) {
            console.warn(`Key "${key}" may conflict with browser functionality`);
        }
    }

    /**
     * Check for shortcut conflicts
     * @private
     */
    _checkForConflicts(shortcutKey, config) {
        if (this.shortcuts.has(shortcutKey)) {
            const existing = this.shortcuts.get(shortcutKey);
            console.warn(`Shortcut conflict detected: ${shortcutKey} is already registered`, {
                existing: existing.description || 'No description',
                new: config.description || 'No description'
            });
        }
    }

    /**
     * Check context limits
     * @private
     */
    _checkContextLimits(context) {
        const contextShortcuts = this.getShortcutsForContext(context);
        if (contextShortcuts.length >= this.options.maxShortcutsPerContext) {
            throw new Error(`Context "${context}" has reached maximum shortcuts limit (${this.options.maxShortcutsPerContext})`);
        }
    }

    // =================
    // Debugging and Statistics Methods
    // =================

    /**
     * Get usage statistics for all shortcuts
     * @returns {Array} Array of shortcuts with usage statistics
     */
    getUsageStatistics() {
        const stats = [];
        
        for (const [shortcutKey, shortcut] of this.shortcuts.entries()) {
            const eventStats = this.eventStats.get(shortcutKey) || {
                triggerCount: 0,
                lastTriggered: null,
                errors: []
            };

            stats.push({
                shortcutKey,
                description: shortcut.description,
                context: shortcut.context,
                triggerCount: eventStats.triggerCount,
                lastTriggered: eventStats.lastTriggered,
                errorCount: eventStats.errors.length,
                registeredAt: shortcut.registeredAt
            });
        }

        return stats.sort((a, b) => b.triggerCount - a.triggerCount);
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
            shortcutsByContext: this._getShortcutsByContextDebug()
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
        const issues = [];
        
        // Basic system shortcuts to check against
        const systemShortcuts = [
            { key: 'F5', ctrlKey: false },
            { key: 'F12', ctrlKey: false },
            { key: 'Tab', ctrlKey: false },
            { key: 'r', ctrlKey: true },
            { key: 'w', ctrlKey: true },
            { key: 't', ctrlKey: true }
        ];
        
        for (const [shortcutKey, shortcut] of this.shortcuts.entries()) {
            // Check for system shortcut conflicts
            const hasSystemConflict = systemShortcuts.some(sysShortcut => 
                sysShortcut.key === shortcut.key && 
                sysShortcut.ctrlKey === shortcut.ctrlKey
            );
            
            if (hasSystemConflict) {
                issues.push({
                    type: 'system_conflict',
                    shortcutKey,
                    message: `May conflict with system shortcut`,
                    shortcut
                });
            }
            
            // Check for unused shortcuts
            const stats = this.eventStats.get(shortcutKey);
            if (stats && stats.triggerCount === 0) {
                issues.push({
                    type: 'unused',
                    shortcutKey,
                    message: 'Shortcut has never been used',
                    shortcut
                });
            }
            
            // Check for error-prone shortcuts
            if (stats && stats.errors.length > 0) {
                issues.push({
                    type: 'error_prone',
                    shortcutKey,
                    message: `Shortcut has ${stats.errors.length} execution errors`,
                    shortcut,
                    errorCount: stats.errors.length
                });
            }
        }
        
        return issues;
    }

    /**
     * Reset usage statistics
     */
    resetStatistics() {
        this.eventStats.clear();
        for (const shortcutKey of this.shortcuts.keys()) {
            this.eventStats.set(shortcutKey, {
                triggerCount: 0,
                lastTriggered: null,
                errors: []
            });
        }
        
        if (this.options.debug) {
            console.log('Usage statistics reset');
        }
    }
}