/**
 * TodoController - Handles user interactions and coordinates between Model and View
 */
class TodoController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.searchTerm = '';
        this.draggedId = null;
        this.dragDropSupported = this.checkDragDropSupport();
        this.init();
    }

    /**
     * Check if browser supports HTML5 Drag and Drop API
     * @returns {boolean} True if drag and drop is supported
     */
    checkDragDropSupport() {
        // Check for essential drag and drop features
        const testElement = document.createElement('div');
        
        return (
            'draggable' in testElement &&
            'ondragstart' in testElement &&
            'ondrop' in testElement &&
            typeof DataTransfer !== 'undefined' &&
            typeof DragEvent !== 'undefined'
        );
    }

    /**
     * Initialize the controller and set up event listeners
     */
    init() {
        this.bindEvents();
        this.handleDragDropCompatibility();
        this.render();
    }

    /**
     * Handle drag and drop compatibility
     */
    handleDragDropCompatibility() {
        if (!this.dragDropSupported) {
            this.view.showDragDropUnsupportedMessage();
        }
    }

    /**
     * Set up all event listeners using event delegation
     */
    bindEvents() {
        this.bindAddTodoForm();
        this.bindSearchInput();
        this.bindTodoListClick();
        this.bindTodoListSubmit();
        this.bindTodoListChange();
        this.bindDragAndDrop();
        this.bindKeyboardShortcuts();
    }

    /**
     * Bind add todo form submission event
     */
    bindAddTodoForm() {
        const addTodoForm = document.getElementById('addTodoForm');
        addTodoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddTodo();
        });
    }

    /**
     * Bind search input event handler
     */
    bindSearchInput() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
    }

    /**
     * Bind todo list click event delegation
     */
    bindTodoListClick() {
        this.view.todoList.addEventListener('click', (e) => {
            this.handleTodoListClick(e);
        });
    }

    /**
     * Bind todo list form submission event delegation
     */
    bindTodoListSubmit() {
        this.view.todoList.addEventListener('submit', (e) => {
            this.handleTodoListSubmit(e);
        });
    }

    /**
     * Bind todo list checkbox change event delegation
     */
    bindTodoListChange() {
        this.view.todoList.addEventListener('change', (e) => {
            this.handleTodoListChange(e);
        });
    }

    /**
     * Bind keyboard shortcuts event handler
     */
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Add keyboard support for drag handles
        this.view.todoList.addEventListener('keydown', (e) => {
            this.handleDragHandleKeyboard(e);
        });
    }

    /**
     * Bind drag and drop event handlers
     */
    bindDragAndDrop() {
        // Only bind drag and drop events if supported
        if (!this.dragDropSupported) {
            return;
        }

        this.view.todoList.addEventListener('dragstart', (e) => {
            this.handleDragStart(e);
        });

        this.view.todoList.addEventListener('dragover', (e) => {
            this.handleDragOver(e);
        });

        this.view.todoList.addEventListener('drop', (e) => {
            this.handleDrop(e);
        });

        this.view.todoList.addEventListener('dragend', (e) => {
            this.handleDragEnd(e);
        });

        this.view.todoList.addEventListener('dragenter', (e) => {
            this.handleDragEnter(e);
        });

        this.view.todoList.addEventListener('dragleave', (e) => {
            this.handleDragLeave(e);
        });
    }

    /**
     * Handle adding a new todo
     */
    handleAddTodo() {
        const text = this.view.getInputValue();
        
        if (!text) {
            this.view.showMessage('Please enter a todo item', 'error');
            return;
        }

        try {
            this.model.addTodo(text);
            this.view.clearInput();
            this.render();
            this.view.focusInput();
        } catch (error) {
            this.view.showMessage(error.message, 'error');
        }
    }

    /**
     * Handle search input changes
     * @param {string} searchTerm - The search term
     */
    handleSearch(searchTerm) {
        this.searchTerm = searchTerm.toLowerCase().trim();
        this.render();
    }

    /**
     * Handle click events in the todo list
     * @param {Event} e - Click event
     */
    handleTodoListClick(e) {
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;

        if (!action || !id) return;

        switch (action) {
            case 'edit':
                this.handleEditTodo(id);
                break;
            case 'delete':
                this.handleDeleteTodo(id);
                break;
            case 'cancel-edit':
                this.handleCancelEdit();
                break;
        }
    }

    /**
     * Handle form submissions in the todo list
     * @param {Event} e - Submit event
     */
    handleTodoListSubmit(e) {
        e.preventDefault();
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;

        if (action === 'save-edit' && id) {
            this.handleSaveEdit(id, e.target);
        }
    }

    /**
     * Handle change events in the todo list (checkboxes)
     * @param {Event} e - Change event
     */
    handleTodoListChange(e) {
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;

        if (action === 'toggle' && id) {
            this.handleToggleTodo(id);
        }
    }

    /**
     * Handle keyboard shortcuts
     * @param {Event} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        // Escape key to cancel editing
        if (e.key === 'Escape' && this.view.isEditing()) {
            this.handleCancelEdit();
        }
        
        // Ctrl+S to save when editing
        if (e.key === 's' && e.ctrlKey && this.view.isEditing()) {
            e.preventDefault(); // Prevent browser's default save dialog
            const editingId = this.view.getEditingId();
            const editForm = document.querySelector(`.edit-form[data-id="${editingId}"]`);
            if (editForm) {
                this.handleSaveEdit(editingId, editForm);
            }
        }
    }

    /**
     * Handle keyboard interactions for drag handles
     * @param {Event} e - Keyboard event
     */
    handleDragHandleKeyboard(e) {
        // Only handle if target is a drag handle
        if (!e.target.classList.contains('drag-handle') || !this.dragDropSupported) {
            return;
        }

        const todoItem = e.target.closest('.todo-item');
        if (!todoItem) return;

        const todoId = todoItem.dataset.id;
        const currentTodos = this.getCurrentTodos();
        const currentIndex = currentTodos.findIndex(t => t.id === todoId);
        
        if (currentIndex === -1) return;

        let newIndex = currentIndex;
        let moved = false;

        // Arrow keys for reordering
        switch (e.key) {
            case 'ArrowUp':
                if (currentIndex > 0) {
                    newIndex = currentIndex - 1;
                    moved = true;
                }
                break;
            case 'ArrowDown':
                if (currentIndex < currentTodos.length - 1) {
                    newIndex = currentIndex + 1;
                    moved = true;
                }
                break;
            case 'Home':
                if (currentIndex > 0) {
                    newIndex = 0;
                    moved = true;
                }
                break;
            case 'End':
                if (currentIndex < currentTodos.length - 1) {
                    newIndex = currentTodos.length - 1;
                    moved = true;
                }
                break;
            case 'Enter':
            case ' ':
                // Activate drag handle (could be extended for alternative reorder UI)
                e.preventDefault();
                this.view.showMessage(`Todo "${currentTodos[currentIndex].text}" selected. Use arrow keys to move.`, 'info');
                return;
        }

        if (moved) {
            e.preventDefault();
            this.handleReorderTodo(todoId, newIndex);
            
            // Keep focus on the drag handle after reorder
            setTimeout(() => {
                const newTodoItem = document.querySelector(`[data-id="${todoId}"] .drag-handle`);
                if (newTodoItem) {
                    newTodoItem.focus();
                }
            }, 100);
        }
    }

    /**
     * Handle toggling todo completion
     * @param {string} id - Todo ID
     */
    handleToggleTodo(id) {
        const updatedTodo = this.model.toggleTodo(id);
        if (updatedTodo) {
            this.render();
        }
    }

    /**
     * Handle starting edit mode for a todo
     * @param {string} id - Todo ID
     */
    handleEditTodo(id) {
        // Cancel any existing edit first
        if (this.view.isEditing()) {
            this.view.cancelEdit();
        }

        this.view.startEdit(id);
        this.render();
    }

    /**
     * Handle saving an edited todo
     * @param {string} id - Todo ID
     * @param {HTMLFormElement} form - The edit form element
     */
    handleSaveEdit(id, form) {
        const input = form.querySelector('.edit-input');
        const newText = input.value.trim();

        if (!newText) {
            this.view.showMessage('Todo text cannot be empty', 'error');
            input.focus();
            return;
        }

        try {
            const updatedTodo = this.model.updateTodo(id, newText);
            if (updatedTodo) {
                this.view.cancelEdit();
                this.render();
            }
        } catch (error) {
            this.view.showMessage(error.message, 'error');
            input.focus();
        }
    }

    /**
     * Handle canceling edit mode
     */
    handleCancelEdit() {
        this.view.cancelEdit();
        this.render();
    }

    /**
     * Handle deleting a todo
     * @param {string} id - Todo ID
     */
    handleDeleteTodo(id) {
        const todo = this.model.getTodo(id);
        if (!todo) return;

        const confirmMessage = `Are you sure you want to delete "${todo.text}"?`;
        if (this.view.showConfirmation(confirmMessage)) {
            const wasDeleted = this.model.deleteTodo(id);
            if (wasDeleted) {
                // If we were editing this todo, cancel the edit
                if (this.view.getEditingId() === id) {
                    this.view.cancelEdit();
                }
                this.render();
            }
        }
    }

    /**
     * Render the current state
     */
    render() {
        const allTodos = this.model.getAllTodos();
        const filteredTodos = this.model.filterTodos(this.searchTerm);
        this.view.render(filteredTodos, allTodos, this.searchTerm, this.dragDropSupported);
    }

    /**
     * Get application statistics
     * @returns {Object} Stats object with todo counts
     */
    getStats() {
        return this.model.getStats();
    }

    /**
     * Handle drag start event
     * @param {Event} e - Drag start event
     */
    handleDragStart(e) {
        const todoItem = e.target.closest('.todo-item');
        if (!todoItem) return;

        this.draggedId = todoItem.dataset.id;
        todoItem.classList.add('dragging');
        
        // Set drag effect
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', todoItem.outerHTML);
    }

    /**
     * Handle drag over event
     * @param {Event} e - Drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    /**
     * Handle drag enter event
     * @param {Event} e - Drag enter event
     */
    handleDragEnter(e) {
        const todoItem = e.target.closest('.todo-item');
        if (todoItem && todoItem.dataset.id !== this.draggedId) {
            todoItem.classList.add('drag-over');
        }
    }

    /**
     * Handle drag leave event
     * @param {Event} e - Drag leave event
     */
    handleDragLeave(e) {
        const todoItem = e.target.closest('.todo-item');
        if (todoItem) {
            todoItem.classList.remove('drag-over');
        }
    }

    /**
     * Handle drop event
     * @param {Event} e - Drop event
     */
    handleDrop(e) {
        e.preventDefault();
        
        const targetItem = e.target.closest('.todo-item');
        if (!targetItem || !this.draggedId) return;

        const targetId = targetItem.dataset.id;
        if (targetId === this.draggedId) return;

        // Calculate new index based on current filtered todos
        const currentTodos = this.searchTerm ? 
            this.model.filterTodos(this.searchTerm) : 
            this.model.getAllTodos();
        
        const targetIndex = currentTodos.findIndex(todo => todo.id === targetId);
        
        // If we're dealing with filtered results, we need to find the actual index in the full list
        if (this.searchTerm) {
            const allTodos = this.model.getAllTodos();
            const targetTodo = currentTodos[targetIndex];
            const actualTargetIndex = allTodos.findIndex(todo => todo.id === targetTodo.id);
            
            if (this.model.reorderTodo(this.draggedId, actualTargetIndex)) {
                this.render();
            }
        } else {
            if (this.model.reorderTodo(this.draggedId, targetIndex)) {
                this.render();
            }
        }

        // Clean up drag classes
        targetItem.classList.remove('drag-over');
    }

    /**
     * Handle drag end event
     * @param {Event} e - Drag end event
     */
    handleDragEnd(e) {
        const todoItem = e.target.closest('.todo-item');
        if (todoItem) {
            todoItem.classList.remove('dragging');
        }

        // Clean up all drag-over classes
        const dragOverItems = this.view.todoList.querySelectorAll('.drag-over');
        dragOverItems.forEach(item => item.classList.remove('drag-over'));

        this.draggedId = null;
    }

    /**
     * Get current todos based on search filter
     * @returns {Array} Current filtered todos
     */
    getCurrentTodos() {
        return this.searchTerm ? this.model.filterTodos(this.searchTerm) : this.model.getAllTodos();
    }
}