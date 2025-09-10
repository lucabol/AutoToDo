/**
 * KeyboardHandlers - Enhanced centralized keyboard shortcut handler methods
 * 
 * This class organizes all keyboard shortcut handlers for the AutoToDo application,
 * separating them from the main controller logic for better maintainability.
 * Enhanced with modular shortcut support and improved error handling.
 */
class KeyboardHandlers {
    constructor(controller) {
        this.controller = controller;
        this.model = controller.model;
        this.view = controller.view;
        
        // Initialize shortcut modules for enhanced functionality
        this.moduleManager = new ShortcutModuleManager();
        this.initializeModules();
    }

    /**
     * Initialize shortcut modules
     */
    initializeModules() {
        // Navigation module for focus management
        this.navigationModule = new NavigationShortcutModule({
            maxHistorySize: 50
        });
        
        // Register common focus targets
        this.navigationModule.registerFocusTarget('newTodo', '#todoInput', { selectText: true });
        this.navigationModule.registerFocusTarget('search', '#searchInput', { selectText: true });
        
        // Action module for todo operations with undo support
        this.actionModule = new ActionShortcutModule({
            enableUndo: true,
            maxUndoSize: 20
        });
        
        // Context-aware module for adaptive behavior
        this.contextModule = new ContextAwareShortcutModule({
            adaptiveMode: true,
            learningEnabled: true
        });
        
        // Register modules with the manager
        this.moduleManager.registerModule(this.navigationModule);
        this.moduleManager.registerModule(this.actionModule);
        this.moduleManager.registerModule(this.contextModule);
        
        // Register plugins for shortcut enhancement
        this.registerPlugins();
    }

    /**
     * Register plugins for shortcut behavior enhancement
     */
    registerPlugins() {
        // Performance monitoring plugin
        this.moduleManager.registerPlugin('performanceMonitor', (config) => {
            const originalAction = config.action;
            config.action = (...args) => {
                const start = performance.now();
                const result = originalAction(...args);
                const duration = performance.now() - start;
                
                if (duration > 10) { // Log slow operations
                    console.warn(`Slow shortcut execution: ${config.description} took ${duration.toFixed(2)}ms`);
                }
                
                return result;
            };
            return config;
        });
        
        // Error handling plugin
        this.moduleManager.registerPlugin('errorHandler', (config) => {
            const originalAction = config.action;
            config.action = (...args) => {
                try {
                    return originalAction(...args);
                } catch (error) {
                    console.error(`Shortcut error in "${config.description}":`, error);
                    this.view.showMessage(`Shortcut failed: ${error.message}`, 'error');
                    return false;
                }
            };
            return config;
        });
        
        // Usage tracking plugin
        this.moduleManager.registerPlugin('usageTracker', (config) => {
            const originalAction = config.action;
            let usageCount = 0;
            
            config.action = (...args) => {
                usageCount++;
                config.usageCount = usageCount;
                config.lastUsed = new Date().toISOString();
                return originalAction(...args);
            };
            return config;
        });
    }

    /**
     * Get all handler functions for keyboard shortcuts with modular enhancements
     * @returns {Object} Object containing all handler functions
     */
    getAllHandlers() {
        const baseHandlers = {
            // Navigation and focus shortcuts using navigation module
            focusNewTodo: this.navigationModule.createFocusAction('newTodo'),
            focusSearch: this.navigationModule.createFocusAction('search'),
            
            // Todo management shortcuts with undo support
            addTodo: this.actionModule.createUndoableAction(
                () => this.handleAddTodoFromShortcut(),
                null, // No undo for add todo (would need to track the added todo)
                'Add Todo'
            ),
            toggleFirstTodo: this.actionModule.createUndoableAction(
                () => this.handleToggleFirstTodo(),
                () => this.handleToggleFirstTodo(), // Toggle is its own undo
                'Toggle First Todo'
            ),
            deleteFirstTodo: this.createDeleteAction(),
            selectAll: () => this.handleSelectAllTodos(),
            clearCompleted: this.createClearCompletedAction(),
            
            // Editing shortcuts with context awareness
            cancelEdit: this.contextModule.createContextAwareAction({
                editing: () => this.handleCancelEdit(),
                global: () => false // No-op in global context
            }),
            saveEdit: this.contextModule.createContextAwareAction({
                editing: () => this.handleSaveEditFromShortcut(),
                global: () => false // No-op in global context
            }),
            
            // General shortcuts
            showHelp: () => this.showKeyboardHelp(),
            toggleTheme: () => this.controller.toggleTheme(),
            
            // New enhanced shortcuts
            undo: () => this.handleUndo(),
            showStats: () => this.showShortcutStats()
        };

        // Apply plugins to enhance all handlers
        const enhancedHandlers = {};
        for (const [key, handler] of Object.entries(baseHandlers)) {
            enhancedHandlers[key] = this.moduleManager.applyPlugins({
                action: handler,
                name: key,
                description: this.getHandlerDescription(key)
            }).action;
        }

        return enhancedHandlers;
    }

    /**
     * Get description for a handler
     */
    getHandlerDescription(handlerName) {
        const descriptions = {
            focusNewTodo: 'Focus new todo input',
            focusSearch: 'Focus search input',
            addTodo: 'Add new todo',
            toggleFirstTodo: 'Toggle first todo',
            deleteFirstTodo: 'Delete first todo',
            selectAll: 'Select all todos',
            clearCompleted: 'Clear completed todos',
            cancelEdit: 'Cancel editing',
            saveEdit: 'Save edit',
            showHelp: 'Show help',
            toggleTheme: 'Toggle theme',
            undo: 'Undo last action',
            showStats: 'Show shortcut statistics'
        };
        
        return descriptions[handlerName] || handlerName;
    }

    // =================
    // Enhanced Action Methods
    // =================

    /**
     * Create enhanced delete action with undo support
     */
    createDeleteAction() {
        return this.actionModule.createUndoableAction(
            () => {
                const allTodos = this.model.getAllTodos();
                if (allTodos.length === 0) {
                    this.view.showMessage('No todos to delete', 'info');
                    return false;
                }
                
                const firstTodo = allTodos[0];
                const todoData = { ...firstTodo }; // Store for potential undo
                
                this.controller.handleDeleteTodo(firstTodo.id);
                return { deletedTodo: todoData };
            },
            (result) => {
                if (result && result.deletedTodo) {
                    // Re-add the deleted todo (simplified undo)
                    this.model.addTodo(result.deletedTodo.text);
                    this.controller.render();
                }
            },
            'Delete First Todo'
        );
    }

    /**
     * Create enhanced clear completed action with undo support
     */
    createClearCompletedAction() {
        return this.actionModule.createUndoableAction(
            () => {
                const completedTodos = this.model.getAllTodos().filter(todo => todo.completed);
                if (completedTodos.length === 0) {
                    this.view.showMessage('No completed todos to clear', 'info');
                    return false;
                }

                const confirmMessage = `Are you sure you want to delete ${completedTodos.length} completed todo${completedTodos.length !== 1 ? 's' : ''}?`;
                if (!this.view.showConfirmation(confirmMessage)) {
                    return false;
                }
                
                // Store completed todos for undo
                const deletedTodos = [...completedTodos];
                
                let deletedCount = 0;
                completedTodos.forEach(todo => {
                    if (this.model.deleteTodo(todo.id)) {
                        deletedCount++;
                    }
                });
                
                // If we were editing a deleted todo, cancel the edit
                const editingId = this.view.getEditingId();
                if (editingId && completedTodos.some(todo => todo.id === editingId)) {
                    this.view.cancelEdit();
                }
                
                this.controller.render();
                this.view.showMessage(`Cleared ${deletedCount} completed todo${deletedCount !== 1 ? 's' : ''}`, 'success');
                
                return { deletedTodos, deletedCount };
            },
            (result) => {
                if (result && result.deletedTodos) {
                    // Re-add all cleared todos
                    result.deletedTodos.forEach(todo => {
                        const newTodo = this.model.addTodo(todo.text);
                        if (todo.completed) {
                            this.model.toggleTodo(newTodo.id);
                        }
                    });
                    this.controller.render();
                    this.view.showMessage(`Restored ${result.deletedCount} todo${result.deletedCount !== 1 ? 's' : ''}`, 'info');
                }
            },
            'Clear Completed Todos'
        );
    }

    /**
     * Handle undo action
     */
    handleUndo() {
        try {
            const success = this.actionModule.undo();
            if (success) {
                this.view.showMessage('Action undone', 'success');
            } else {
                this.view.showMessage('Nothing to undo', 'info');
            }
            return success;
        } catch (error) {
            this.view.showMessage(`Undo failed: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Show shortcut statistics
     */
    showShortcutStats() {
        const stats = this.moduleManager.getAllModuleStats();
        
        const statsMessage = Object.entries(stats).map(([moduleName, moduleStats]) => {
            if (moduleStats.error) {
                return `${moduleName}: Error - ${moduleStats.error}`;
            }
            
            if (moduleStats.totalNavigations !== undefined) {
                return `Navigation: ${moduleStats.totalNavigations} navigations`;
            }
            
            if (moduleStats.totalActions !== undefined) {
                return `Actions: ${moduleStats.successfulActions}/${moduleStats.totalActions} successful (${moduleStats.successRate.toFixed(1)}%), ${moduleStats.undoAvailable} undo available`;
            }
            
            if (moduleStats.totalEntries !== undefined) {
                return `Context: ${moduleStats.totalEntries} context changes tracked`;
            }
            
            return `${moduleName}: ${moduleStats.shortcutCount} shortcuts, ${moduleStats.enabled ? 'enabled' : 'disabled'}`;
        }).join('\n');
        
        alert(`Shortcut Statistics:\n\n${statsMessage}`);
        return true;
    }

    // =================
    // Navigation Handlers (Legacy - maintained for backwards compatibility)
    // Note: The enhanced versions are now handled by NavigationShortcutModule
    // =================

    /**
     * Focus the new todo input field
     */
    focusNewTodoInput() {
        // Add small delay to ensure DOM is ready and avoid race conditions
        setTimeout(() => {
            const todoInput = document.getElementById('todoInput');
            if (todoInput && typeof todoInput.focus === 'function') {
                try {
                    todoInput.focus();
                    // Only select text if focus was successful and element is focusable
                    if (document.activeElement === todoInput && typeof todoInput.select === 'function') {
                        todoInput.select();
                    }
                } catch (error) {
                    console.warn('KeyboardHandlers: Failed to focus todo input:', error.message);
                }
            } else {
                console.warn('KeyboardHandlers: Todo input element not found or not focusable');
            }
        }, 0);
    }

    /**
     * Focus the search input field
     */
    focusSearchInput() {
        // Add small delay to ensure DOM is ready and avoid race conditions
        setTimeout(() => {
            const searchInput = document.getElementById('searchInput');
            if (searchInput && typeof searchInput.focus === 'function') {
                try {
                    searchInput.focus();
                    // Only select text if focus was successful and element is focusable
                    if (document.activeElement === searchInput && typeof searchInput.select === 'function') {
                        searchInput.select();
                    }
                } catch (error) {
                    console.warn('KeyboardHandlers: Failed to focus search input:', error.message);
                }
            } else {
                console.warn('KeyboardHandlers: Search input element not found or not focusable');
            }
        }, 0);
    }

    // =================
    // Todo Management Handlers
    // =================

    /**
     * Handle adding todo from keyboard shortcut
     */
    handleAddTodoFromShortcut() {
        const todoInput = document.getElementById('todoInput');
        if (todoInput && todoInput.value.trim()) {
            // If there's text in the input, add it as a todo
            this.controller.handleAddTodo();
        } else {
            // Otherwise, just focus the input
            this.focusNewTodoInput();
        }
    }

    /**
     * Toggle the first (topmost) todo item
     */
    handleToggleFirstTodo() {
        const allTodos = this.model.getAllTodos();
        if (allTodos.length > 0) {
            const firstTodo = allTodos[0];
            this.controller.handleToggleTodo(firstTodo.id);
            this.view.showMessage(`${firstTodo.completed ? 'Unchecked' : 'Checked'} "${firstTodo.text}"`, 'success');
        } else {
            this.view.showMessage('No todos to toggle', 'info');
        }
    }

    /**
     * Delete the first (topmost) todo item
     */
    handleDeleteFirstTodo() {
        const allTodos = this.model.getAllTodos();
        if (allTodos.length > 0) {
            const firstTodo = allTodos[0];
            this.controller.handleDeleteTodo(firstTodo.id);
        } else {
            this.view.showMessage('No todos to delete', 'info');
        }
    }

    /**
     * Handle select all todos (visual feedback only)
     */
    handleSelectAllTodos() {
        const todoItems = document.querySelectorAll('.todo-item');
        todoItems.forEach(item => {
            item.classList.add('selected');
        });
        
        // Remove selection after a short delay
        setTimeout(() => {
            todoItems.forEach(item => {
                item.classList.remove('selected');
            });
        }, 1000);
        
        const todoCount = this.model.getAllTodos().length;
        this.view.showMessage(`Selected ${todoCount} todo${todoCount !== 1 ? 's' : ''}`, 'info');
    }

    /**
     * Clear all completed todos
     */
    handleClearCompleted() {
        const completedTodos = this.model.getAllTodos().filter(todo => todo.completed);
        if (completedTodos.length === 0) {
            this.view.showMessage('No completed todos to clear', 'info');
            return;
        }

        const confirmMessage = `Are you sure you want to delete ${completedTodos.length} completed todo${completedTodos.length !== 1 ? 's' : ''}?`;
        if (this.view.showConfirmation(confirmMessage)) {
            let deletedCount = 0;
            completedTodos.forEach(todo => {
                if (this.model.deleteTodo(todo.id)) {
                    deletedCount++;
                }
            });
            
            // If we were editing a deleted todo, cancel the edit
            const editingId = this.view.getEditingId();
            if (editingId && completedTodos.some(todo => todo.id === editingId)) {
                this.view.cancelEdit();
            }
            
            this.controller.render();
            this.view.showMessage(`Cleared ${deletedCount} completed todo${deletedCount !== 1 ? 's' : ''}`, 'success');
        }
    }

    // =================
    // Editing Handlers
    // =================

    /**
     * Handle save edit triggered by keyboard shortcut
     */
    handleSaveEditFromShortcut() {
        const editingId = this.view.getEditingId();
        const editForm = document.querySelector(`.edit-form[data-id="${editingId}"]`);
        if (editForm) {
            this.controller.handleSaveEdit(editingId, editForm);
        }
    }

    /**
     * Handle canceling edit mode
     */
    handleCancelEdit() {
        this.controller.handleCancelEdit();
    }

    // =================
    // General Handlers
    // =================

    /**
     * Show keyboard shortcuts help modal
     */
    showKeyboardHelp() {
        // Check if help modal already exists
        let helpModal = document.getElementById('keyboardHelpModal');
        
        if (!helpModal) {
            helpModal = HelpModalBuilder.createKeyboardHelpModal(this.controller.keyboardManager);
            document.body.appendChild(helpModal);
        }
        
        helpModal.style.display = 'flex';
        
        // Focus the close button for accessibility
        const closeButton = helpModal.querySelector('.help-close-btn');
        if (closeButton) {
            closeButton.focus();
        }
    }
}