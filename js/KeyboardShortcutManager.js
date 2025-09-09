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
        const modifiers = [];
        if (ctrlKey) modifiers.push('ctrl');
        if (altKey) modifiers.push('alt');
        if (shiftKey) modifiers.push('shift');
        
        const modifierStr = modifiers.length > 0 ? modifiers.join('+') + '+' : '';
        return `${context}:${modifierStr}${key.toLowerCase()}`;
    }

    /**
     * Handle keyboard events
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyboard(event) {
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
                if (shortcut.preventDefault) {
                    event.preventDefault();
                }
                
                // Execute the action
                try {
                    shortcut.action(event);
                    return true; // Shortcut was handled
                } catch (error) {
                    console.error('Error executing keyboard shortcut:', error);
                }
                break; // Stop checking after first match
            }
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
                    context: shortcut.context
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
}