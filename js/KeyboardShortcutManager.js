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

        // Enhanced validation
        this._validateShortcutConfig(config);

        const shortcutKey = this.generateShortcutKey(key, ctrlKey, altKey, shiftKey, context);
        
        // Check for conflicts if validation is enabled
        if (this.options.validateConflicts) {
            this._checkForConflicts(shortcutKey, config);
        }
        
        // Check context limits
        this._checkContextLimits(context);

        const shortcutConfig = {
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
        
        this.shortcuts.set(shortcutKey, shortcutConfig);
        
        // Initialize event stats for this shortcut
        this.eventStats.set(shortcutKey, {
            triggerCount: 0,
            lastTriggered: null,
            errors: []
        });

        if (this.options.debug) {
            console.log(`Registered shortcut: ${shortcutKey}`, shortcutConfig);
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
        const modifiers = [];
        if (ctrlKey) modifiers.push('ctrl');
        if (altKey) modifiers.push('alt');
        if (shiftKey) modifiers.push('shift');
        
        const modifierStr = modifiers.length > 0 ? modifiers.join('+') + '+' : '';
        return `${context}:${modifierStr}${key.toLowerCase()}`;
    }

    /**
     * Handle keyboard events with enhanced error handling and debugging
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyboard(event) {
        const startTime = this.options.debug ? performance.now() : 0;
        const activeContexts = this.getActiveContexts();
        
        // Check shortcuts in order of context specificity (most specific first)
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
                // Update statistics
                const stats = this.eventStats.get(shortcutKey);
                if (stats) {
                    stats.triggerCount++;
                    stats.lastTriggered = new Date().toISOString();
                }

                if (shortcut.preventDefault) {
                    event.preventDefault();
                }
                
                // Execute the action with enhanced error handling
                try {
                    shortcut.action(event);
                    
                    if (this.options.enableLogging) {
                        console.log(`Shortcut executed: ${shortcutKey}`);
                    }
                    
                    if (this.options.debug) {
                        const endTime = performance.now();
                        console.log(`Shortcut ${shortcutKey} executed in ${endTime - startTime}ms`);
                    }
                    
                    return true; // Shortcut was handled
                } catch (error) {
                    const errorInfo = {
                        error: error.message,
                        timestamp: new Date().toISOString(),
                        shortcutKey,
                        event: {
                            key: event.key,
                            ctrlKey: event.ctrlKey,
                            altKey: event.altKey,
                            shiftKey: event.shiftKey
                        }
                    };

                    // Log error to statistics
                    if (stats) {
                        stats.errors.push(errorInfo);
                        // Keep only last 10 errors per shortcut
                        if (stats.errors.length > 10) {
                            stats.errors = stats.errors.slice(-10);
                        }
                    }

                    console.error('Error executing keyboard shortcut:', errorInfo);
                    
                    // In debug mode, provide more detailed error information
                    if (this.options.debug) {
                        console.error('Shortcut configuration:', shortcut);
                        console.error('Full error object:', error);
                    }
                }
                break; // Stop checking after first match
            }
        }
        
        if (this.options.debug) {
            const endTime = performance.now();
            console.log(`Keyboard handling completed in ${endTime - startTime}ms (no match)`);
        }
        
        return false; // No shortcut was handled
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
                console.error(`Error checking context ${contextName}:`, error);
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
                const modifiers = [];
                if (shortcut.ctrlKey) modifiers.push('Ctrl');
                if (shortcut.altKey) modifiers.push('Alt');
                if (shortcut.shiftKey) modifiers.push('Shift');
                
                const keyCombo = modifiers.length > 0 
                    ? `${modifiers.join('+')}+${shortcut.key}`
                    : shortcut.key;
                
                descriptions.push({
                    keys: keyCombo,
                    description: shortcut.description,
                    context: shortcut.context,
                    category: shortcut.category || 'Other'
                });
            }
        }
        
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
        const systemShortcuts = ShortcutsConfig.getValidationRules().systemShortcuts;
        
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