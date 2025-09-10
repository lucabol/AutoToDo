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
    }

    /**
     * Get all handler functions for keyboard shortcuts
     * @returns {Object} Object containing all handler functions
     */
    getAllHandlers() {
        return {
            // Navigation and focus shortcuts
            focusNewTodo: () => this.focusNewTodoInput(),
            focusSearch: () => this.focusSearchInput(),
            
            // Todo management shortcuts
            addTodo: () => this.handleAddTodoFromShortcut(),
            toggleFirstTodo: () => this.handleToggleFirstTodo(),
            deleteFirstTodo: () => this.handleDeleteFirstTodo(),
            selectAll: () => this.handleSelectAllTodos(),
            clearCompleted: () => this.handleClearCompleted(),
            
            // Editing shortcuts
            cancelEdit: () => this.handleCancelEdit(),
            saveEdit: () => this.handleSaveEditFromShortcut(),
            
            // General shortcuts
            showHelp: () => this.showKeyboardHelp(),
            toggleTheme: () => this.controller.toggleTheme()
        };
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