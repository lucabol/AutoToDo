/**
 * ShortcutModules - Modular shortcut type definitions and behaviors
 * 
 * This module provides specialized shortcut types and behaviors that can be
 * plugged into the KeyboardShortcutManager for enhanced functionality.
 */

/**
 * Base class for all shortcut modules
 */
class ShortcutModule {
    constructor(name, options = {}) {
        this.name = name;
        this.options = options;
        this.shortcuts = new Map();
        this.enabled = options.enabled !== false;
    }

    /**
     * Register a shortcut in this module
     */
    registerShortcut(config) {
        const enhancedConfig = this.enhanceShortcutConfig(config);
        this.shortcuts.set(this.generateKey(config), enhancedConfig);
        return enhancedConfig;
    }

    /**
     * Enhance shortcut configuration with module-specific properties
     */
    enhanceShortcutConfig(config) {
        return {
            ...config,
            module: this.name,
            moduleEnabled: this.enabled
        };
    }

    /**
     * Generate a unique key for the shortcut within this module
     */
    generateKey(config) {
        return `${config.context || 'global'}:${config.key}:${config.ctrlKey || false}:${config.altKey || false}:${config.shiftKey || false}`;
    }

    /**
     * Get all shortcuts in this module
     */
    getAllShortcuts() {
        return Array.from(this.shortcuts.values());
    }

    /**
     * Enable or disable this module
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        for (const shortcut of this.shortcuts.values()) {
            shortcut.moduleEnabled = enabled;
        }
    }
}

/**
 * Navigation shortcuts module
 */
class NavigationShortcutModule extends ShortcutModule {
    constructor(options = {}) {
        super('navigation', options);
        this.focusTargets = new Map();
        this.navigationHistory = [];
        this.maxHistorySize = options.maxHistorySize || 50;
    }

    /**
     * Register a focus target for navigation shortcuts
     */
    registerFocusTarget(name, selector, options = {}) {
        this.focusTargets.set(name, {
            selector,
            options,
            lastFocused: null,
            focusCount: 0
        });
    }

    /**
     * Enhanced focus action with history and error handling
     */
    createFocusAction(targetName) {
        return () => {
            const target = this.focusTargets.get(targetName);
            if (!target) {
                console.warn(`NavigationShortcutModule: Focus target "${targetName}" not found`);
                return false;
            }

            const element = document.querySelector(target.selector);
            if (!element) {
                console.warn(`NavigationShortcutModule: Element "${target.selector}" not found`);
                return false;
            }

            try {
                // Store current focus for navigation history
                const previousFocus = document.activeElement;
                
                element.focus();
                
                // Update target statistics
                target.lastFocused = new Date().toISOString();
                target.focusCount++;
                
                // Add to navigation history
                this.addToHistory(previousFocus, element, targetName);
                
                // Select text if it's an input and configured to do so
                if (target.options.selectText && typeof element.select === 'function') {
                    element.select();
                }
                
                return true;
            } catch (error) {
                console.error(`NavigationShortcutModule: Error focusing "${targetName}":`, error);
                return false;
            }
        };
    }

    /**
     * Add navigation to history
     */
    addToHistory(from, to, targetName) {
        this.navigationHistory.push({
            from: from?.id || from?.tagName || 'unknown',
            to: to.id || to.tagName || 'unknown',
            targetName,
            timestamp: new Date().toISOString()
        });

        // Trim history to max size
        if (this.navigationHistory.length > this.maxHistorySize) {
            this.navigationHistory.shift();
        }
    }

    /**
     * Get navigation statistics
     */
    getNavigationStats() {
        return {
            totalNavigations: this.navigationHistory.length,
            focusTargets: Array.from(this.focusTargets.entries()).map(([name, target]) => ({
                name,
                selector: target.selector,
                focusCount: target.focusCount,
                lastFocused: target.lastFocused
            })),
            recentHistory: this.navigationHistory.slice(-10)
        };
    }
}

/**
 * Action shortcuts module for todo operations
 */
class ActionShortcutModule extends ShortcutModule {
    constructor(options = {}) {
        super('action', options);
        this.actionQueue = [];
        this.maxQueueSize = options.maxQueueSize || 100;
        this.enableUndo = options.enableUndo !== false;
        this.undoStack = [];
        this.maxUndoSize = options.maxUndoSize || 20;
    }

    /**
     * Create an action with undo support
     */
    createUndoableAction(actionFn, undoFn, description) {
        return () => {
            try {
                // Execute the action
                const result = actionFn();
                
                // Add to undo stack if undo function is provided
                if (this.enableUndo && undoFn) {
                    this.addToUndoStack({
                        undo: undoFn,
                        description,
                        timestamp: new Date().toISOString(),
                        originalResult: result
                    });
                }
                
                // Add to action queue for tracking
                this.addToActionQueue({
                    action: description,
                    timestamp: new Date().toISOString(),
                    success: true
                });
                
                return result;
            } catch (error) {
                // Log failed action
                this.addToActionQueue({
                    action: description,
                    timestamp: new Date().toISOString(),
                    success: false,
                    error: error.message
                });
                
                throw error;
            }
        };
    }

    /**
     * Add action to tracking queue
     */
    addToActionQueue(actionInfo) {
        this.actionQueue.push(actionInfo);
        
        // Trim queue to max size
        if (this.actionQueue.length > this.maxQueueSize) {
            this.actionQueue.shift();
        }
    }

    /**
     * Add action to undo stack
     */
    addToUndoStack(undoInfo) {
        this.undoStack.push(undoInfo);
        
        // Trim undo stack to max size
        if (this.undoStack.length > this.maxUndoSize) {
            this.undoStack.shift();
        }
    }

    /**
     * Execute undo for the last action
     */
    undo() {
        if (this.undoStack.length === 0) {
            console.warn('ActionShortcutModule: No actions to undo');
            return false;
        }
        
        const lastAction = this.undoStack.pop();
        
        try {
            lastAction.undo();
            
            this.addToActionQueue({
                action: `Undo: ${lastAction.description}`,
                timestamp: new Date().toISOString(),
                success: true
            });
            
            return true;
        } catch (error) {
            // Put the action back on the stack if undo fails
            this.undoStack.push(lastAction);
            
            this.addToActionQueue({
                action: `Undo: ${lastAction.description}`,
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message
            });
            
            throw error;
        }
    }

    /**
     * Get action statistics
     */
    getActionStats() {
        const successfulActions = this.actionQueue.filter(a => a.success).length;
        const failedActions = this.actionQueue.filter(a => !a.success).length;
        
        return {
            totalActions: this.actionQueue.length,
            successfulActions,
            failedActions,
            successRate: this.actionQueue.length > 0 ? (successfulActions / this.actionQueue.length) * 100 : 0,
            undoAvailable: this.undoStack.length,
            recentActions: this.actionQueue.slice(-10)
        };
    }
}

/**
 * Context-aware shortcuts module
 */
class ContextAwareShortcutModule extends ShortcutModule {
    constructor(options = {}) {
        super('context-aware', options);
        this.contextRules = new Map();
        this.contextHistory = [];
        this.adaptiveMode = options.adaptiveMode !== false;
        this.learningEnabled = options.learningEnabled !== false;
    }

    /**
     * Register context-specific behavior rules
     */
    registerContextRule(contextName, rule) {
        this.contextRules.set(contextName, rule);
    }

    /**
     * Create context-aware action
     */
    createContextAwareAction(actions, fallbackAction = null) {
        return (event, activeContexts) => {
            // Track context usage
            this.trackContextUsage(activeContexts);
            
            // Find the best matching action based on active contexts
            for (const context of activeContexts) {
                if (actions[context]) {
                    return actions[context](event);
                }
            }
            
            // Use global action if available
            if (actions.global) {
                return actions.global(event);
            }
            
            // Use fallback action
            if (fallbackAction) {
                return fallbackAction(event);
            }
            
            return false;
        };
    }

    /**
     * Track context usage for adaptive behavior
     */
    trackContextUsage(activeContexts) {
        if (!this.learningEnabled) return;
        
        this.contextHistory.push({
            contexts: [...activeContexts],
            timestamp: new Date().toISOString()
        });
        
        // Keep only recent history
        if (this.contextHistory.length > 1000) {
            this.contextHistory = this.contextHistory.slice(-500);
        }
    }

    /**
     * Get context usage statistics
     */
    getContextStats() {
        const contextCounts = new Map();
        
        for (const entry of this.contextHistory) {
            for (const context of entry.contexts) {
                contextCounts.set(context, (contextCounts.get(context) || 0) + 1);
            }
        }
        
        return {
            totalEntries: this.contextHistory.length,
            contextUsage: Array.from(contextCounts.entries()).map(([context, count]) => ({
                context,
                count,
                percentage: (count / this.contextHistory.length) * 100
            })).sort((a, b) => b.count - a.count),
            recentContexts: this.contextHistory.slice(-10)
        };
    }
}

/**
 * Module manager to coordinate multiple shortcut modules
 */
class ShortcutModuleManager {
    constructor() {
        this.modules = new Map();
        this.plugins = new Map();
        this.globalConfig = {
            enableModules: true,
            enablePlugins: true,
            debugMode: false
        };
    }

    /**
     * Register a shortcut module
     */
    registerModule(module) {
        if (!(module instanceof ShortcutModule)) {
            throw new Error('Module must be an instance of ShortcutModule');
        }
        
        this.modules.set(module.name, module);
        
        if (this.globalConfig.debugMode) {
            console.log(`ShortcutModuleManager: Registered module "${module.name}"`);
        }
    }

    /**
     * Get a module by name
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * Get all shortcuts from all modules
     */
    getAllShortcuts() {
        const allShortcuts = [];
        
        for (const module of this.modules.values()) {
            if (module.enabled && this.globalConfig.enableModules) {
                allShortcuts.push(...module.getAllShortcuts());
            }
        }
        
        return allShortcuts;
    }

    /**
     * Register a plugin function
     */
    registerPlugin(name, pluginFn) {
        if (typeof pluginFn !== 'function') {
            throw new Error('Plugin must be a function');
        }
        
        this.plugins.set(name, pluginFn);
        
        if (this.globalConfig.debugMode) {
            console.log(`ShortcutModuleManager: Registered plugin "${name}"`);
        }
    }

    /**
     * Apply plugins to a shortcut configuration
     */
    applyPlugins(shortcutConfig) {
        if (!this.globalConfig.enablePlugins) {
            return shortcutConfig;
        }
        
        let processedConfig = { ...shortcutConfig };
        
        for (const [name, plugin] of this.plugins.entries()) {
            try {
                processedConfig = plugin(processedConfig) || processedConfig;
            } catch (error) {
                console.error(`ShortcutModuleManager: Error in plugin "${name}":`, error);
            }
        }
        
        return processedConfig;
    }

    /**
     * Get statistics from all modules
     */
    getAllModuleStats() {
        const stats = {};
        
        for (const [name, module] of this.modules.entries()) {
            try {
                if (module.getNavigationStats) {
                    stats[name] = module.getNavigationStats();
                } else if (module.getActionStats) {
                    stats[name] = module.getActionStats();
                } else if (module.getContextStats) {
                    stats[name] = module.getContextStats();
                } else {
                    stats[name] = {
                        shortcutCount: module.shortcuts.size,
                        enabled: module.enabled
                    };
                }
            } catch (error) {
                console.error(`Error getting stats for module "${name}":`, error);
                stats[name] = { error: error.message };
            }
        }
        
        return stats;
    }

    /**
     * Configure global module settings
     */
    configure(config) {
        Object.assign(this.globalConfig, config);
    }
}

// Export modules for use
if (typeof window !== 'undefined') {
    window.ShortcutModule = ShortcutModule;
    window.NavigationShortcutModule = NavigationShortcutModule;
    window.ActionShortcutModule = ActionShortcutModule;
    window.ContextAwareShortcutModule = ContextAwareShortcutModule;
    window.ShortcutModuleManager = ShortcutModuleManager;
}