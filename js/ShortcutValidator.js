/**
 * ShortcutValidator - Handles validation logic for keyboard shortcuts
 * 
 * Extracted from KeyboardShortcutManager to improve code organization
 * and maintainability by separating validation concerns.
 */
class ShortcutValidator {
    constructor(options = {}) {
        this.options = {
            problematicKeys: options.problematicKeys || ['Tab', 'F5', 'F12'],
            validateConflicts: options.validateConflicts !== false,
            maxShortcutsPerContext: options.maxShortcutsPerContext || 50
        };
    }

    /**
     * Validate shortcut configuration
     * @param {Object} config - Shortcut configuration to validate
     * @throws {Error} If configuration is invalid
     */
    validateShortcutConfig(config) {
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
        if (this.options.problematicKeys.includes(config.key)) {
            console.warn(`Key "${config.key}" may conflict with browser functionality`);
        }
    }

    /**
     * Check for shortcut conflicts
     * @param {string} shortcutKey - The shortcut key identifier
     * @param {Object} config - New shortcut configuration
     * @param {Map} existingShortcuts - Existing shortcuts map
     */
    checkForConflicts(shortcutKey, config, existingShortcuts) {
        if (!this.options.validateConflicts) return;

        if (existingShortcuts.has(shortcutKey)) {
            const existing = existingShortcuts.get(shortcutKey);
            console.warn(`Shortcut conflict detected: ${shortcutKey} is already registered`, {
                existing: existing.description || 'No description',
                new: config.description || 'No description'
            });
        }
    }

    /**
     * Check context limits
     * @param {string} context - Context name
     * @param {Array} contextShortcuts - Existing shortcuts for this context
     * @throws {Error} If context limit exceeded
     */
    checkContextLimits(context, contextShortcuts) {
        if (contextShortcuts.length >= this.options.maxShortcutsPerContext) {
            throw new Error(`Context "${context}" has reached maximum shortcuts limit (${this.options.maxShortcutsPerContext})`);
        }
    }

    /**
     * Validate all registered shortcuts for potential issues
     * @param {Map} shortcuts - All registered shortcuts
     * @param {Map} eventStats - Event statistics
     * @returns {Array} Array of validation issues found
     */
    validateAllShortcuts(shortcuts, eventStats) {
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
        
        for (const [shortcutKey, shortcut] of shortcuts.entries()) {
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
            const stats = eventStats.get(shortcutKey);
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
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShortcutValidator;
} else {
    window.ShortcutValidator = ShortcutValidator;
}