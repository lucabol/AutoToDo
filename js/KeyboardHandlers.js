/**
 * KeyboardHandlers - Centralized keyboard shortcut handler methods
 * 
 * This class organizes all keyboard shortcut handlers for the AutoToDo application,
 * separating them from the main controller logic for better maintainability.
 */
class KeyboardHandlers {
    constructor(controller) {
        this.controller = controller;
        this.model = controller.model;
        this.view = controller.view;
        this._initializeHandlerMaps();
    }

    /**
     * Initialize handler categorization maps for better organization
     * @private
     */
    _initializeHandlerMaps() {
        this.handlerCategories = {
            navigation: ['focusNewTodo', 'focusSearch'],
            todoManagement: ['addTodo', 'toggleFirstTodo', 'deleteFirstTodo', 'selectAll', 'clearCompleted'],
            editing: ['cancelEdit', 'saveEdit'],
            general: ['showHelp', 'toggleTheme']
        };
    }

    /**
     * Get all handler functions for keyboard shortcuts
     * @returns {Object} Object containing all handler functions
     */
    getAllHandlers() {
        return {
            // Navigation and focus shortcuts
            focusNewTodo: () => this._safeExecute('focusNewTodoInput', 'focusing new todo input'),
            focusSearch: (event) => this._safeExecute('focusSearchInput', 'focusing search input', event),
            
            // Todo management shortcuts
            addTodo: () => this._safeExecute('handleAddTodoFromShortcut', 'adding todo from shortcut'),
            toggleFirstTodo: () => this._safeExecute('handleToggleFirstTodo', 'toggling first todo'),
            deleteFirstTodo: () => this._safeExecute('handleDeleteFirstTodo', 'deleting first todo'),
            selectAll: () => this._safeExecute('handleSelectAllTodos', 'selecting all todos'),
            clearCompleted: () => this._safeExecute('handleClearCompleted', 'clearing completed todos'),
            
            // Editing shortcuts
            cancelEdit: () => this._safeExecute('handleCancelEdit', 'canceling edit'),
            saveEdit: () => this._safeExecute('handleSaveEditFromShortcut', 'saving edit from shortcut'),
            
            // General shortcuts
            showHelp: () => this._safeExecute('showKeyboardHelp', 'showing keyboard help'),
            toggleTheme: () => this._safeExecute(() => this.controller.toggleTheme(), 'toggling theme')
        };
    }

    /**
     * Safely execute a handler method with error handling
     * @param {string|Function} methodOrFunction - Method name or function to execute
     * @param {string} actionDescription - Description of the action for error logging
     * @param {...any} args - Arguments to pass to the method/function
     * @private
     */
    _safeExecute(methodOrFunction, actionDescription, ...args) {
        try {
            if (typeof methodOrFunction === 'string') {
                return this[methodOrFunction](...args);
            } else if (typeof methodOrFunction === 'function') {
                return methodOrFunction(...args);
            } else {
                throw new Error(`Invalid method or function: ${methodOrFunction}`);
            }
        } catch (error) {
            console.error(`KeyboardHandlers: Error ${actionDescription}:`, error);
            this._showErrorMessage(actionDescription, error);
        }
    }

    /**
     * Show user-friendly error message
     * @param {string} actionDescription - Description of the failed action
     * @param {Error} error - The error that occurred
     * @private
     */
    _showErrorMessage(actionDescription, error) {
        if (this.view && typeof this.view.showMessage === 'function') {
            this.view.showMessage(`Error ${actionDescription}. Please try again.`, 'error');
        }
    }

    /**
     * Get handlers for a specific category
     * @param {string} category - Category name (navigation, todoManagement, editing, general)
     * @returns {Object} Object containing handlers for the specified category
     */
    getHandlersByCategory(category) {
        const allHandlers = this.getAllHandlers();
        const categoryHandlers = {};
        
        if (this.handlerCategories[category]) {
            for (const handlerName of this.handlerCategories[category]) {
                if (allHandlers[handlerName]) {
                    categoryHandlers[handlerName] = allHandlers[handlerName];
                }
            }
        }
        
        return categoryHandlers;
    }

    /**
     * Get all available handler categories
     * @returns {Array} Array of category names
     */
    getAvailableCategories() {
        return Object.keys(this.handlerCategories);
    }

    // =================
    // Navigation Handlers
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
     * Focus the search input field and handle the '/' character appropriately
     * This is called when the '/' shortcut is triggered
     * @param {Event} event - The keyboard event that triggered this
     */
    focusSearchInput(event) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            const wasAlreadyFocused = document.activeElement === searchInput;
            
            if (!wasAlreadyFocused) {
                // Prevent the default '/' from being typed since we'll handle it ourselves
                if (event) {
                    event.preventDefault();
                }
                
                searchInput.focus();
                // Clear any existing text and add the '/' character
                searchInput.value = '/';
                // Position cursor after the '/' character (at index 1) so users can immediately continue typing their search query
                searchInput.setSelectionRange(1, 1);
                // Trigger input event to update search
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            // If already focused, don't prevent default - let the '/' be typed normally
        }
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