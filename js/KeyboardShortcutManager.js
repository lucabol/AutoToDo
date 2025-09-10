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
        
        // Performance optimization: Pre-built lookup tables
        this.globalShortcuts = new Map();
        this.contextShortcuts = new Map();
        this.shortcutsByPriority = new Map(); // High, medium, low priority shortcuts
        
        // Configuration options
        this.options = {
            debug: options.debug || false,
            enableLogging: options.enableLogging || false,
            validateConflicts: options.validateConflicts !== false, // true by default
            maxShortcutsPerContext: options.maxShortcutsPerContext || 50,
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
        const {
            key,
            ctrlKey = false,
            altKey = false,
            shiftKey = false,
            context = 'global',
            action,
            preventDefault = false,
            description = '',
            category = 'Other',
            priority = 'medium',
            enabled = true
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
            priority,
            enabled,
            registeredAt: new Date().toISOString()
        };
        
        this.shortcuts.set(shortcutKey, shortcutConfig);
        
        // Performance optimization: Update lookup tables
        this._updateLookupTables(shortcutKey, shortcutConfig);
        
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
     * Update lookup tables for performance optimization
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
     * Clear context cache to force re-evaluation
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
     * Handle keyboard events with enhanced error handling, debugging, and performance tracking
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyboard(event) {
        // Validate event object
        if (!event || typeof event !== 'object') {
            if (this.options.debug) {
                console.warn('KeyboardShortcutManager: Invalid event object received');
            }
            return false;
        }
        
        const startTime = performance.now();
        
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
            
            // Performance tracking
            const endTime = performance.now();
            const lookupTime = endTime - startTime;
            this._updatePerformanceMetrics(lookupTime);
            
            if (this.options.debug) {
                const shortcutKey = this.generateShortcutKey(
                    key, ctrlKey, altKey, shiftKey, matchingShortcut.context
                );
                console.log(`Shortcut ${shortcutKey} executed in ${lookupTime.toFixed(2)}ms`);
            }
            
            return result;
        }
        
        // Performance tracking even for non-matches
        const endTime = performance.now();
        this._updatePerformanceMetrics(endTime - startTime);
        
        if (this.options.debug) {
            console.log(`Keyboard handling completed in ${(endTime - startTime).toFixed(2)}ms (no match)`);
        }
        
        return false; // No shortcut was handled
    }

    /**
     * Find the first matching shortcut for the given keyboard event using optimized lookup
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {Object|null} The matching shortcut configuration, or null if no shortcut matches
     * @private
     */
    findMatchingShortcut(event) {
        const activeContexts = this.getActiveContexts();
        
        // Performance optimization: Use priority-based lookup if enabled
        if (this.options.enablePriority) {
            return this._findMatchingShortcutWithPriority(event, activeContexts);
        }
        
        // Fallback to original context-based lookup
        return this._findMatchingShortcutByContext(event, activeContexts);
    }

    /**
     * Find matching shortcut using priority-based lookup
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
     * Find matching shortcut using context-based lookup (optimized)
     * @private
     */
    _findMatchingShortcutByContext(event, activeContexts) {
        if (this.options.debug) {
            console.log('Keyboard event:', {
                key: event.key,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
                activeContexts
            });
        }

        // Check context-specific shortcuts first using priority system
        for (const context of activeContexts) {
            const contextMap = this.contextShortcuts.get(context);
            if (contextMap) {
                const shortcutKey = this.generateShortcutKey(
                    event.key, event.ctrlKey, event.altKey, event.shiftKey, context
                );
                
                const shortcut = contextMap.get(shortcutKey);
                if (shortcut && shortcut.enabled !== false) {
                    this._updateShortcutStats(shortcutKey);
                    return shortcut;
                }
            }
        }

        // Fallback to main branch optimized context lookup
        const shortcut = this._findShortcutInContexts(event, activeContexts);
        if (shortcut) {
            return shortcut;
        }

        // Check global shortcuts
        const globalShortcutKey = this.generateShortcutKey(
            event.key, event.ctrlKey, event.altKey, event.shiftKey, 'global'
        );
        
        const globalShortcut = this.globalShortcuts.get(globalShortcutKey);
        if (globalShortcut && globalShortcut.enabled !== false) {
            this._updateShortcutStats(globalShortcutKey);
            return globalShortcut;
        }
        
        // Debug logging for no match
        if (this.debugMode || this.options.debug) {
            console.debug(`KeyboardShortcutManager: No shortcut matches key combination: ${event.key} (Ctrl: ${event.ctrlKey}, Alt: ${event.altKey}, Shift: ${event.shiftKey})`);
        }
        
        return null;
    }

    /**
     * Update shortcut statistics
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
        return null;
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
            
            if (this.options.enableLogging) {
                console.log(`Shortcut executed: ${shortcutKey}`);
            }
            
            return true; // Shortcut was handled
        } catch (error) {
            this.handleShortcutError(error, shortcut, shortcutKey);
            return false;
        }
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
     * Get currently active contexts with optional caching for performance
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
            
            // Remove statistics
            this.eventStats.delete(shortcutKey);
            
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
     * Clear all shortcuts and reset lookup tables
     */
    clearShortcuts() {
        this.shortcuts.clear();
        this.globalShortcuts.clear();
        this.contextShortcuts.clear();
        this.shortcutsByPriority.clear();
        this.eventStats.clear();
        this._clearContextCache();
        
        if (this.options.debug) {
            console.log('All shortcuts cleared');
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
    // Performance and Utility Methods
    // =================

    /**
     * Update performance metrics
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
     * Enable or disable a specific shortcut
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
     * Get performance metrics
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
     * Get shortcuts by priority level
     * @param {string} priority - Priority level ('high', 'medium', 'low')
     * @returns {Array} Array of shortcuts with the specified priority
     */
    getShortcutsByPriority(priority) {
        const priorityShortcuts = this.shortcutsByPriority.get(priority);
        return priorityShortcuts ? Array.from(priorityShortcuts.values()) : [];
    }

    /**
     * Register multiple shortcuts at once
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
     * Get enhanced usage statistics for all shortcuts
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
                priority: shortcut.priority,
                enabled: shortcut.enabled !== false,
                triggerCount: eventStats.triggerCount,
                lastTriggered: eventStats.lastTriggered,
                errorCount: eventStats.errors.length,
                registeredAt: shortcut.registeredAt,
                category: shortcut.category
            });
        }

        return stats.sort((a, b) => b.triggerCount - a.triggerCount);
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
            performanceMetrics: this.getPerformanceMetrics(),
            shortcutsByContext: this._getShortcutsByContextDebug(),
            shortcutsByPriority: this._getShortcutsByPriorityDebug(),
            lookupTableSizes: {
                global: this.globalShortcuts.size,
                contexts: this.contextShortcuts.size,
                priorities: this.shortcutsByPriority.size
            }
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