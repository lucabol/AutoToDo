/**
 * Centralized Keyboard Shortcuts Configuration
 * 
 * This module provides a centralized configuration for all keyboard shortcuts
 * in the AutoToDo application, making it easy to manage and extend shortcuts.
 */

class ShortcutsConfig {
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
     * @returns {Object} Validation configuration
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
            ],
            
            // Maximum number of shortcuts per context
            maxShortcutsPerContext: 20
        };
    }
}