/**
 * KeyboardShortcutManager - Modular and maintainable keyboard shortcut handling
 * 
 * This class provides a configuration-driven approach to keyboard shortcuts
 * with context awareness and easy extensibility.
 */
class KeyboardShortcutManager {
    constructor() {
        this.shortcuts = new Map();
        this.contexts = new Map();
        this.contextHandlers = new Map();
        this.debugMode = false; // Can be enabled for debugging shortcut matching
        this.setupDefaultShortcuts();
    }

    /**
     * Register a keyboard shortcut
     * @param {Object} config - Shortcut configuration
     * @param {string} config.key - Key to listen for (e.g., 'Escape', 's')
     * @param {boolean} [config.ctrlKey] - Whether Ctrl key is required
     * @param {boolean} [config.altKey] - Whether Alt key is required
     * @param {boolean} [config.shiftKey] - Whether Shift key is required
     * @param {string} [config.context] - Context where shortcut is active (optional)
     * @param {Function} config.action - Function to execute when shortcut is triggered
     * @param {boolean} [config.preventDefault] - Whether to prevent default browser behavior
     * @param {string} [config.description] - Human-readable description of the shortcut
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
            description = ''
        } = config;

        if (!key || typeof action !== 'function') {
            throw new Error('Shortcut must have a key and action function');
        }

        const shortcutKey = this.generateShortcutKey(key, ctrlKey, altKey, shiftKey, context);
        
        this.shortcuts.set(shortcutKey, {
            key,
            ctrlKey,
            altKey,
            shiftKey,
            context,
            action,
            preventDefault,
            description
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
     * Handle keyboard events
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyboard(event) {
        const matchingShortcut = this.findMatchingShortcut(event);
        
        if (matchingShortcut) {
            return this.executeShortcut(matchingShortcut, event);
        }
        
        return false; // No shortcut was handled
    }

    /**
     * Find the first matching shortcut for the given keyboard event
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {Object|null} The matching shortcut configuration, or null if no shortcut matches
     * @private
     */
    findMatchingShortcut(event) {
        const activeContexts = this.getActiveContexts();
        
        // Check shortcuts in order of context specificity (most specific first)
        const contextOrder = [...activeContexts, 'global'];
        
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
                return shortcut;
            }
        }
        
        // No matching shortcut found - this is expected behavior when
        // user presses keys that aren't configured as shortcuts
        // Log for debugging purposes when needed
        if (this.debugMode) {
            console.debug(`KeyboardShortcutManager: No shortcut matches key combination: ${event.key} (Ctrl: ${event.ctrlKey}, Alt: ${event.altKey}, Shift: ${event.shiftKey})`);
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
        if (shortcut.preventDefault) {
            event.preventDefault();
        }
        
        try {
            shortcut.action(event);
            return true; // Shortcut was handled
        } catch (error) {
            this.handleShortcutError(error, shortcut);
            return false;
        }
    }

    /**
     * Handle errors that occur during shortcut execution
     * @param {Error} error - The error that occurred
     * @param {Object} shortcut - The shortcut configuration that caused the error
     * @private
     */
    handleShortcutError(error, shortcut) {
        // Log error with specific shortcut information for better troubleshooting
        const shortcutInfo = shortcut ? 
            `${shortcut.context}:${this.createModifierString(shortcut.ctrlKey, shortcut.altKey, shortcut.shiftKey)}${shortcut.key}` :
            'unknown shortcut';
        
        console.error(`KeyboardShortcutManager: Error executing shortcut '${shortcutInfo}':`, error.message || error);
        
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
            context: shortcut.context
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
}