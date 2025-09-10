/**
 * Centralized Keyboard Shortcuts Configuration
 * 
 * This module provides a centralized configuration for all keyboard shortcuts
 * in the AutoToDo application, making it easy to manage and extend shortcuts.
 */

class ShortcutsConfig {
    // Cache for validation results to improve performance
    static _validationCache = new Map();
    static _cacheMaxSize = 100;
    
    /**
     * Get all keyboard shortcuts configuration for the AutoToDo application
     * @param {Object} handlers - Object containing handler functions
     * @returns {Array} Array of shortcut configurations
     */
    static getShortcuts(handlers) {
        const {
            // Navigation and focus shortcuts
            focusNewTodo,
            focusSearch,
            
            // Todo management shortcuts  
            addTodo,
            toggleFirstTodo,
            deleteFirstTodo,
            
            // Editing shortcuts
            cancelEdit,
            saveEdit,
            
            // General shortcuts
            showHelp,
            toggleTheme,
            selectAll,
            clearCompleted
        } = handlers;

        return [
            // Global navigation shortcuts
            {
                key: 'n',
                ctrlKey: true,
                context: 'global',
                action: focusNewTodo,
                preventDefault: true,
                description: 'Focus new todo input (Ctrl+N)',
                category: 'Navigation'
            },
            {
                key: 'f',
                ctrlKey: true,
                context: 'global', 
                action: focusSearch,
                preventDefault: true,
                description: 'Focus search input (Ctrl+F)',
                category: 'Navigation'
            },
            {
                key: '/',
                context: 'global',
                action: focusSearch,
                preventDefault: false, // We'll handle preventDefault conditionally in the action
                description: 'Focus search input and start typing (/)',
                category: 'Navigation'
            },
            
            // Todo management shortcuts
            {
                key: 'Enter',
                ctrlKey: true,
                context: 'global',
                action: addTodo,
                preventDefault: true,
                description: 'Add new todo (Ctrl+Enter)',
                category: 'Todo Management'
            },
            {
                key: 't',
                ctrlKey: true,
                context: 'global',
                action: toggleFirstTodo,
                preventDefault: true,
                description: 'Toggle first todo (Ctrl+T)',
                category: 'Todo Management'
            },
            {
                key: 'Delete',
                ctrlKey: true,
                context: 'global',
                action: deleteFirstTodo,
                preventDefault: true,
                description: 'Delete first todo (Ctrl+Delete)',
                category: 'Todo Management'
            },
            {
                key: 'a',
                ctrlKey: true,
                context: 'global',
                action: selectAll,
                preventDefault: true,
                description: 'Select all todos (Ctrl+A)',
                category: 'Todo Management'
            },
            {
                key: 'd',
                ctrlKey: true,
                shiftKey: true,
                context: 'global',
                action: clearCompleted,
                preventDefault: true,
                description: 'Clear completed todos (Ctrl+Shift+D)',
                category: 'Todo Management'
            },
            
            // Editing mode shortcuts
            {
                key: 'Escape',
                context: 'editing',
                action: cancelEdit,
                description: 'Cancel editing (Escape)',
                category: 'Editing'
            },
            {
                key: 's',
                ctrlKey: true,
                context: 'editing',
                action: saveEdit,
                preventDefault: true,
                description: 'Save changes (Ctrl+S)',
                category: 'Editing'
            },
            {
                key: 'Enter',
                context: 'editing',
                action: saveEdit,
                preventDefault: true,
                description: 'Save changes (Enter)',
                category: 'Editing'
            },
            
            // General application shortcuts
            {
                key: 'h',
                ctrlKey: true,
                context: 'global',
                action: showHelp,
                preventDefault: true,
                description: 'Show keyboard shortcuts help (Ctrl+H)',
                category: 'General'
            },
            {
                key: '?',
                context: 'global',
                action: showHelp,
                preventDefault: true,
                description: 'Show keyboard shortcuts help (?)',
                category: 'General'
            },
            {
                key: 'F1',
                context: 'global',
                action: showHelp,
                preventDefault: true,
                description: 'Show keyboard shortcuts help (F1)',
                category: 'General'
            },
            {
                key: 'm',
                ctrlKey: true,
                context: 'global',
                action: toggleTheme,
                preventDefault: true,
                description: 'Toggle theme (Ctrl+M)',
                category: 'General'
            }
        ];
    }

    /**
     * Get shortcuts grouped by category for display purposes
     * @param {Array} shortcuts - Array of shortcut configurations
     * @returns {Object} Object with categories as keys and shortcut arrays as values
     */
    static groupByCategory(shortcuts) {
        const grouped = {};
        
        for (const shortcut of shortcuts) {
            const category = shortcut.category || 'Other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(shortcut);
        }
        
        return grouped;
    }

    /**
     * Format shortcut key combination for display
     * @param {Object} shortcut - Shortcut configuration
     * @returns {string} Formatted key combination
     */
    static formatKeyCombo(shortcut) {
        const modifiers = [];
        if (shortcut.ctrlKey) modifiers.push('Ctrl');
        if (shortcut.altKey) modifiers.push('Alt');
        if (shortcut.shiftKey) modifiers.push('Shift');
        
        let key = shortcut.key;
        
        // Format special keys for better display
        const keyMappings = {
            ' ': 'Space',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'ArrowLeft': '←',
            'ArrowRight': '→',
            'Enter': '↵',
            'Escape': 'Esc',
            'Delete': 'Del',
            'Backspace': '⌫'
        };
        
        if (keyMappings[key]) {
            key = keyMappings[key];
        }
        
        return modifiers.length > 0 
            ? `${modifiers.join('+')}+${key}`
            : key;
    }

    /**
     * Get shortcut validation rules
     * @returns {Object} Enhanced validation configuration
     */
    static getValidationRules() {
        return {
            // Keys that should not be overridden in certain contexts
            reservedGlobalKeys: [
                'F5', // Refresh
                'F12', // DevTools
                'Tab', // Navigation
            ],
            
            // Common modifier combinations to avoid conflicts
            systemShortcuts: [
                { key: 's', ctrlKey: true }, // Save (browser)
                { key: 'r', ctrlKey: true }, // Refresh
                { key: 'l', ctrlKey: true }, // Location bar
                { key: 'k', ctrlKey: true }, // Search bar
                { key: 'u', ctrlKey: true }, // View source
                { key: 'w', ctrlKey: true }, // Close tab
                { key: 't', ctrlKey: true }, // New tab
                { key: 'n', ctrlKey: true }, // New window
                { key: 'p', ctrlKey: true }, // Print
                { key: 'f', ctrlKey: true }, // Find
                { key: 'g', ctrlKey: true }, // Find next
                { key: 'h', ctrlKey: true }, // History
                { key: 'j', ctrlKey: true }, // Downloads
                { key: 'a', ctrlKey: true }, // Select all
                { key: 'c', ctrlKey: true }, // Copy
                { key: 'v', ctrlKey: true }, // Paste
                { key: 'x', ctrlKey: true }, // Cut
                { key: 'z', ctrlKey: true }, // Undo
                { key: 'y', ctrlKey: true }, // Redo
            ],
            
            // Accessibility-friendly key combinations
            accessibleShortcuts: [
                { key: 'Enter' },
                { key: 'Escape' },
                { key: ' ' }, // Space
                { key: 'ArrowUp' },
                { key: 'ArrowDown' },
                { key: 'ArrowLeft' },
                { key: 'ArrowRight' },
                { key: 'Home' },
                { key: 'End' },
                { key: 'PageUp' },
                { key: 'PageDown' },
            ],
            
            // Maximum number of shortcuts per context
            maxShortcutsPerContext: 20,
            
            // Recommended modifier combinations for custom shortcuts
            recommendedModifiers: [
                { ctrlKey: true, altKey: false, shiftKey: false },
                { ctrlKey: true, shiftKey: true, altKey: false },
                { ctrlKey: false, altKey: true, shiftKey: false },
                { ctrlKey: false, altKey: false, shiftKey: true },
            ]
        };
    }

    /**
     * Validate a shortcut configuration against the validation rules
     * @param {Object} shortcut - Shortcut configuration to validate
     * @returns {Object} Validation result with warnings and errors
     */
    static validateShortcut(shortcut) {
        // Create cache key for this shortcut
        const cacheKey = this._createValidationCacheKey(shortcut);
        
        // Check cache first
        if (this._validationCache.has(cacheKey)) {
            return this._validationCache.get(cacheKey);
        }
        
        const result = this._performShortcutValidation(shortcut);
        
        // Cache the result (with size limit)
        this._cacheValidationResult(cacheKey, result);
        
        return result;
    }

    /**
     * Create a cache key for validation results
     * @param {Object} shortcut - Shortcut configuration
     * @returns {string} Cache key
     * @private
     */
    static _createValidationCacheKey(shortcut) {
        return `${shortcut.key || ''}:${shortcut.ctrlKey || false}:${shortcut.altKey || false}:${shortcut.shiftKey || false}:${shortcut.context || 'global'}`;
    }

    /**
     * Cache validation result with size management
     * @param {string} cacheKey - Cache key
     * @param {Object} result - Validation result
     * @private
     */
    static _cacheValidationResult(cacheKey, result) {
        // Manage cache size
        if (this._validationCache.size >= this._cacheMaxSize) {
            // Remove oldest entry (first in Map)
            const firstKey = this._validationCache.keys().next().value;
            this._validationCache.delete(firstKey);
        }
        
        this._validationCache.set(cacheKey, result);
    }

    /**
     * Perform the actual shortcut validation
     * @param {Object} shortcut - Shortcut configuration to validate
     * @returns {Object} Validation result
     * @private
     */
    static _performShortcutValidation(shortcut) {
        const rules = this.getValidationRules();
        const result = {
            valid: true,
            warnings: [],
            errors: [],
            suggestions: []
        };

        this._validateSystemConflicts(shortcut, rules, result);
        this._validateReservedKeys(shortcut, rules, result);
        this._validateModifierUsage(shortcut, result);
        this._validateAccessibility(shortcut, rules, result);
        this._validateRequiredFields(shortcut, result);

        return result;
    }

    /**
     * Validate system shortcut conflicts
     * @private
     */
    static _validateSystemConflicts(shortcut, rules, result) {
        const systemConflict = rules.systemShortcuts.some(sysShortcut => 
            sysShortcut.key === shortcut.key && 
            (sysShortcut.ctrlKey === shortcut.ctrlKey) &&
            (sysShortcut.altKey === shortcut.altKey) &&
            (sysShortcut.shiftKey === shortcut.shiftKey)
        );

        if (systemConflict) {
            result.warnings.push(`May conflict with system shortcut: ${this.formatKeyCombo(shortcut)}`);
        }
    }

    /**
     * Validate reserved keys
     * @private
     */
    static _validateReservedKeys(shortcut, rules, result) {
        if (rules.reservedGlobalKeys.includes(shortcut.key)) {
            result.warnings.push(`Key "${shortcut.key}" is reserved and may not work as expected`);
        }
    }

    /**
     * Validate modifier usage
     * @private
     */
    static _validateModifierUsage(shortcut, result) {
        if (shortcut.ctrlKey && shortcut.altKey && shortcut.shiftKey) {
            result.warnings.push('Using all three modifiers may be difficult for users to execute');
        }
    }

    /**
     * Validate accessibility
     * @private
     */
    static _validateAccessibility(shortcut, rules, result) {
        const isAccessible = rules.accessibleShortcuts.some(accShortcut => 
            accShortcut.key === shortcut.key
        );
        
        if (!isAccessible && !shortcut.ctrlKey && !shortcut.altKey && !shortcut.shiftKey) {
            result.suggestions.push('Consider using modifier keys for better accessibility');
        }
    }

    /**
     * Validate required fields
     * @private
     */
    static _validateRequiredFields(shortcut, result) {
        if (!shortcut.key) {
            result.errors.push('Shortcut must have a key');
            result.valid = false;
        }

        if (!shortcut.action || typeof shortcut.action !== 'function') {
            result.errors.push('Shortcut must have a valid action function');
            result.valid = false;
        }

        if (!shortcut.description) {
            result.warnings.push('Shortcut should have a description for better usability');
        }
    }

    /**
     * Validate a collection of shortcuts for conflicts and issues
     * @param {Array} shortcuts - Array of shortcut configurations
     * @returns {Object} Validation summary
     */
    static validateShortcutCollection(shortcuts) {
        const summary = {
            totalShortcuts: shortcuts.length,
            validShortcuts: 0,
            warnings: 0,
            errors: 0,
            conflicts: [],
            issues: []
        };

        const shortcutKeys = new Set();
        const contextCounts = new Map();

        shortcuts.forEach((shortcut, index) => {
            const validation = this.validateShortcut(shortcut);
            
            if (validation.valid) {
                summary.validShortcuts++;
            }
            
            summary.warnings += validation.warnings.length;
            summary.errors += validation.errors.length;

            // Add validation issues to summary
            validation.warnings.forEach(warning => {
                summary.issues.push({ type: 'warning', shortcut: index, message: warning });
            });
            
            validation.errors.forEach(error => {
                summary.issues.push({ type: 'error', shortcut: index, message: error });
            });

            // Check for duplicate shortcuts
            const keyCombo = this.formatKeyCombo(shortcut);
            const contextKey = `${shortcut.context || 'global'}:${keyCombo}`;
            
            if (shortcutKeys.has(contextKey)) {
                summary.conflicts.push({
                    keyCombo,
                    context: shortcut.context || 'global',
                    indices: [shortcutKeys.get(contextKey), index]
                });
            } else {
                shortcutKeys.add(contextKey);
            }

            // Count shortcuts per context
            const context = shortcut.context || 'global';
            contextCounts.set(context, (contextCounts.get(context) || 0) + 1);
        });

        // Check context limits
        const rules = this.getValidationRules();
        for (const [context, count] of contextCounts.entries()) {
            if (count > rules.maxShortcutsPerContext) {
                summary.issues.push({
                    type: 'error',
                    message: `Context "${context}" exceeds maximum shortcuts (${count}/${rules.maxShortcutsPerContext})`
                });
                summary.errors++;
            }
        }

        return summary;
    }

    /**
     * Generate shortcut suggestions based on existing shortcuts
     * @param {Array} existingShortcuts - Current shortcuts to avoid conflicts with
     * @param {string} purpose - Purpose of the new shortcut (for suggestion context)
     * @returns {Array} Array of suggested shortcut configurations
     */
    static generateShortcutSuggestions(existingShortcuts, purpose = 'action') {
        const rules = this.getValidationRules();
        const suggestions = [];
        const usedKeys = new Set(existingShortcuts.map(s => this.formatKeyCombo(s)));

        // Common action keys
        const actionKeys = ['q', 'w', 'e', 'i', 'o', 'p', 'b', 'j', 'x', 'z'];
        
        for (const modifier of rules.recommendedModifiers) {
            for (const key of actionKeys) {
                const suggestion = { key, ...modifier };
                const keyCombo = this.formatKeyCombo(suggestion);
                
                if (!usedKeys.has(keyCombo)) {
                    const validation = this.validateShortcut({ ...suggestion, action: () => {}, description: `${purpose} shortcut` });
                    
                    if (validation.valid && validation.warnings.length === 0) {
                        suggestions.push({
                            ...suggestion,
                            keyCombo,
                            purpose,
                            score: this._calculateShortcutScore(suggestion)
                        });
                    }
                }
            }
        }

        // Sort by score (lower is better)
        return suggestions.sort((a, b) => a.score - b.score).slice(0, 5);
    }

    /**
     * Calculate a usability score for a shortcut (lower is better)
     * @private
     */
    static _calculateShortcutScore(shortcut) {
        let score = 0;
        
        // Prefer simple modifier combinations
        if (shortcut.ctrlKey) score += 1;
        if (shortcut.altKey) score += 2; // Alt is less common
        if (shortcut.shiftKey) score += 1;
        
        // Prefer keys on the left side of keyboard
        const leftKeys = ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'];
        if (!leftKeys.includes(shortcut.key.toLowerCase())) {
            score += 2;
        }
        
        return score;
    }
}