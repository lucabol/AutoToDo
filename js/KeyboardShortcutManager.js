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
        
        // Performance optimization: cache frequently computed values
        this._shortcutKeyCache = new Map();
        this._modifierStringCache = new Map();
        
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

        const shortcutKey = this.generateShortcutKey(
            normalizedConfig.key, 
            normalizedConfig.ctrlKey, 
            normalizedConfig.altKey, 
            normalizedConfig.shiftKey, 
            normalizedConfig.context
        );
        
        // Check for conflicts if validation is enabled
        if (this.options.validateConflicts) {
            this._checkForConflicts(shortcutKey, normalizedConfig);
        }
        
        // Check context limits
        this._checkContextLimits(normalizedConfig.context);

        const shortcutConfig = {
            ...normalizedConfig,
            registeredAt: new Date().toISOString()
        };
        
        this.shortcuts.set(shortcutKey, shortcutConfig);
        this._initializeShortcutStatistics(shortcutKey);

        if (this.options.debug) {
            console.log(`Registered shortcut: ${shortcutKey}`, shortcutConfig);
        }
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
            category: config.category || 'Other'
        };
    }

    /**
     * Initialize statistics tracking for a new shortcut
     * @param {string} shortcutKey - The shortcut key identifier
     * @private
     */
    _initializeShortcutStatistics(shortcutKey) {
        this.eventStats.set(shortcutKey, {
            triggerCount: 0,
            lastTriggered: null,
            errors: []
        });
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
     * @private
     */
    generateShortcutKey(key, ctrlKey, altKey, shiftKey, context) {
        if (this.options.enableCaching) {
            const cacheKey = `${key}-${ctrlKey}-${altKey}-${shiftKey}-${context}`;
            
            if (this._shortcutKeyCache.has(cacheKey)) {
                return this._shortcutKeyCache.get(cacheKey);
            }
            
            const shortcutKey = this._computeShortcutKey(key, ctrlKey, altKey, shiftKey, context);
            this._shortcutKeyCache.set(cacheKey, shortcutKey);
            return shortcutKey;
        }
        
        return this._computeShortcutKey(key, ctrlKey, altKey, shiftKey, context);
    }

    /**
     * Compute the shortcut key without caching
     * @param {string} key - The key
     * @param {boolean} ctrlKey - Whether Ctrl key is required
     * @param {boolean} altKey - Whether Alt key is required
     * @param {boolean} shiftKey - Whether Shift key is required
     * @param {string} context - The context
     * @returns {string} Unique shortcut key identifier
     * @private
     */
    _computeShortcutKey(key, ctrlKey, altKey, shiftKey, context) {
        const modifierStr = this.createModifierString(ctrlKey, altKey, shiftKey);
        return `${context}:${modifierStr}${key.toLowerCase()}`;
    }

    /**
     * Create a modifier string for shortcut key generation with optional caching
     * @param {boolean} ctrlKey - Whether Ctrl key is required
     * @param {boolean} altKey - Whether Alt key is required
     * @param {boolean} shiftKey - Whether Shift key is required
     * @returns {string} Modifier string with trailing '+' if modifiers exist
     * @private
     */
    createModifierString(ctrlKey, altKey, shiftKey) {
        if (this.options.enableCaching) {
            const cacheKey = `${ctrlKey}-${altKey}-${shiftKey}`;
            
            if (this._modifierStringCache.has(cacheKey)) {
                return this._modifierStringCache.get(cacheKey);
            }
            
            const modifierString = this._computeModifierString(ctrlKey, altKey, shiftKey);
            this._modifierStringCache.set(cacheKey, modifierString);
            return modifierString;
        }
        
        return this._computeModifierString(ctrlKey, altKey, shiftKey);
    }

    /**
     * Compute modifier string without caching
     * @param {boolean} ctrlKey - Whether Ctrl key is required
     * @param {boolean} altKey - Whether Alt key is required
     * @param {boolean} shiftKey - Whether Shift key is required
     * @returns {string} Modifier string with trailing '+' if modifiers exist
     * @private
     */
    _computeModifierString(ctrlKey, altKey, shiftKey) {
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
     * @returns {boolean} True if a shortcut was handled, false otherwise
     */
    handleKeyboard(event) {
        // Validate event object
        if (!event || typeof event !== 'object') {
            if (this.options.debug) {
                console.warn('KeyboardShortcutManager: Invalid event object received');
            }
            return false;
        }
        
        const debugSession = this._startDebugSession();
        
        // Add defensive check for event properties
        const key = event.key || '';
        const ctrlKey = Boolean(event.ctrlKey);
        const altKey = Boolean(event.altKey);
        const shiftKey = Boolean(event.shiftKey);
        
        // Log key combination for debugging if enabled
        if (this.options.debug) {
            console.log('KeyboardShortcutManager: Processing key event', {
                key,
                ctrlKey,
                altKey,
                shiftKey,
                target: event.target?.tagName || 'unknown'
            });
        }
        
        const matchingShortcut = this.findMatchingShortcut(event);
        
        if (matchingShortcut) {
            const result = this.executeShortcut(matchingShortcut, event);
            this._endDebugSession(debugSession, matchingShortcut, event);
            return result;
        }
        
        this._endDebugSession(debugSession);
        return false; // No shortcut was handled
    }

    /**
     * Start a debug session for performance tracking and timing measurement.
     * Creates a session object with the current timestamp to measure execution time
     * of keyboard shortcut processing. Only creates the session if debug mode is enabled.
     * 
     * @returns {Object|null} Debug session object containing startTime property if debug 
     *                        mode is enabled, null otherwise. The startTime is captured 
     *                        using performance.now() for high-precision timing.
     * @private
     */
    _startDebugSession() {
        return this.options.debug ? { startTime: performance.now() } : null;
    }

    /**
     * End a debug session and log performance metrics to the console.
     * Calculates the elapsed time since the debug session started and logs timing
     * information. If a shortcut was executed, logs the specific shortcut and its
     * execution time. If no shortcut matched, logs general keyboard handling completion time.
     * Only performs logging if debug mode is enabled and a valid session object is provided.
     * 
     * @param {Object|null} debugSession - Debug session object returned from _startDebugSession().
     *                                     Should contain a startTime property with the session 
     *                                     start timestamp. Pass null if no session was created.
     * @param {Object} [shortcut] - Optional. The executed shortcut configuration object.
     *                              If provided along with event, logs specific shortcut timing.
     *                              Contains properties like context, key, ctrlKey, etc.
     * @param {KeyboardEvent} [event] - Optional. The keyboard event that triggered the shortcut.
     *                                  Used with shortcut parameter to generate the shortcut key
     *                                  for detailed logging. Contains key, ctrlKey, altKey, shiftKey.
     * @private
     */
    _endDebugSession(debugSession, shortcut = null, event = null) {
        if (!debugSession || !this.options.debug) return;
        
        const endTime = performance.now();
        const duration = endTime - debugSession.startTime;
        
        if (shortcut && event) {
            const shortcutKey = this.generateShortcutKey(
                event.key, event.ctrlKey, event.altKey, event.shiftKey, shortcut.context
            );
            console.log(`Shortcut ${shortcutKey} executed in ${duration}ms`);
        } else {
            console.log(`Keyboard handling completed in ${duration}ms (no match)`);
        }
    }

    /**
     * Find the first matching shortcut for the given keyboard event
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {Object|null} The matching shortcut configuration, or null if no shortcut matches
     * @private
     */
    findMatchingShortcut(event) {
        const activeContexts = this.getActiveContexts();
        const contextOrder = [...activeContexts, 'global'];
        
        this._logKeyboardEvent(event, activeContexts);

        for (const context of contextOrder) {
            const shortcut = this._findShortcutInContext(event, context);
            if (shortcut) {
                this._updateShortcutStatistics(event, context);
                return shortcut;
            }
        }
        
        this._logNoMatchFound(event);
        return null;
    }

    /**
     * Log keyboard event details for debugging
     * @param {KeyboardEvent} event - The keyboard event
     * @param {Array} activeContexts - Currently active contexts
     * @private
     */
    _logKeyboardEvent(event, activeContexts) {
        if (this.options.debug) {
            console.log('Keyboard event:', {
                key: event.key,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
                activeContexts
            });
        }
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
        
        const stats = this.eventStats.get(shortcutKey);
        if (stats) {
            stats.triggerCount++;
            stats.lastTriggered = new Date().toISOString();
        }
    }

    /**
     * Log when no matching shortcut is found (for debugging)
     * @param {KeyboardEvent} event - The keyboard event
     * @private
     */
    _logNoMatchFound(event) {
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
            this._logShortcutExecution(shortcutKey);
            return true; // Shortcut was handled
        } catch (error) {
            this._handleShortcutExecutionError(error, shortcut, shortcutKey);
            return false;
        }
    }

    /**
     * Log successful shortcut execution
     * @param {string} shortcutKey - The shortcut key identifier
     * @private
     */
    _logShortcutExecution(shortcutKey) {
        if (this.options.enableLogging) {
            console.log(`Shortcut executed: ${shortcutKey}`);
        }
    }

    /**
     * Handle errors that occur during shortcut execution
     * @param {Error} error - The error that occurred
     * @param {Object} shortcut - The shortcut configuration that caused the error
     * @param {string} shortcutKey - The shortcut key for error tracking
     * @private
     */
    _handleShortcutExecutionError(error, shortcut, shortcutKey) {
        this._logShortcutError(error, shortcut);
        this._recordShortcutError(error, shortcut, shortcutKey);
    }

    /**
     * Log shortcut execution error
     * @param {Error} error - The error that occurred
     * @param {Object} shortcut - The shortcut configuration
     * @private
     */
    _logShortcutError(error, shortcut) {
        const shortcutInfo = shortcut ? 
            `${shortcut.context}:${this.createModifierString(shortcut.ctrlKey, shortcut.altKey, shortcut.shiftKey)}${shortcut.key}` :
            'unknown shortcut';
        
        console.error(`KeyboardShortcutManager: Error executing shortcut '${shortcutInfo}':`, error.message || error);
        
        if (this.options.debug) {
            console.error('Shortcut configuration:', shortcut);
            console.error('Full error object:', error);
        }
    }

    /**
     * Record error in statistics for tracking
     * @param {Error} error - The error that occurred
     * @param {Object} shortcut - The shortcut configuration
     * @param {string} shortcutKey - The shortcut key identifier
     * @private
     */
    _recordShortcutError(error, shortcut, shortcutKey) {
        if (!shortcutKey) return;
        
        const stats = this.eventStats.get(shortcutKey);
        if (stats) {
            const errorInfo = {
                error: error.message,
                timestamp: new Date().toISOString(),
                shortcutKey,
                event: shortcut.key
            };
            
            stats.errors.push(errorInfo);
            // Keep only last 10 errors per shortcut to prevent memory bloat
            if (stats.errors.length > this._getMaxErrorsPerShortcut()) {
                stats.errors = stats.errors.slice(-this._getMaxErrorsPerShortcut());
            }
        }
    }

    /**
     * Get maximum number of errors to keep per shortcut
     * @returns {number} Maximum error count
     * @private
     */
    _getMaxErrorsPerShortcut() {
        return this.options.maxErrorsPerShortcut || 10;
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
        this.eventStats.clear();
        this._clearCaches();
    }

    /**
     * Clear performance caches
     * @private
     */
    _clearCaches() {
        if (this.options.enableCaching) {
            this._shortcutKeyCache.clear();
            this._modifierStringCache.clear();
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
    // Validation Methods
    // =================

    /**
     * Validate shortcut configuration
     * @param {Object} config - Shortcut configuration to validate
     * @throws {Error} If configuration is invalid
     * @private
     */
    _validateShortcutConfig(config) {
        this._validateRequiredFields(config);
        this._validateModifierUsage(config);
        this._validateProblematicKeys(config);
    }

    /**
     * Validate required fields in shortcut configuration
     * @param {Object} config - Shortcut configuration
     * @throws {Error} If required fields are missing or invalid
     * @private
     */
    _validateRequiredFields(config) {
        const { key, action } = config;

        if (!key || typeof key !== 'string' || key.trim() === '') {
            throw new Error('Shortcut must have a non-empty key string');
        }

        if (!action || typeof action !== 'function') {
            throw new Error('Shortcut must have a valid action function');
        }
    }

    /**
     * Validate modifier key usage
     * @param {Object} config - Shortcut configuration
     * @private
     */
    _validateModifierUsage(config) {
        if (config.ctrlKey && config.altKey && config.shiftKey) {
            console.warn(`Shortcut with key "${config.key}" uses all three modifiers, which may be difficult for users`);
        }
    }

    /**
     * Validate against potentially problematic keys
     * @param {Object} config - Shortcut configuration
     * @private
     */
    _validateProblematicKeys(config) {
        const problematicKeys = this._getProblematicKeys();
        if (problematicKeys.includes(config.key)) {
            console.warn(`Key "${config.key}" may conflict with browser functionality`);
        }
    }

    /**
     * Get list of keys that may cause issues
     * @returns {Array<string>} Array of problematic keys
     * @private
     */
    _getProblematicKeys() {
        return this.options.problematicKeys || ['Tab', 'F5', 'F12'];
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