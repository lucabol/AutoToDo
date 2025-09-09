/**
 * TodoView - Handles UI rendering and DOM manipulation
 */
class TodoView {
    constructor() {
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.todoInput = document.getElementById('todoInput');
        this.editingId = null;
        this.dragDropMessageShown = false;
    }

    /**
     * Render the complete todo list
     * @param {Array} todos - Array of todo objects to display
     * @param {Array} allTodos - Array of all todos (for search context)
     * @param {string} searchTerm - Current search term
     * @param {boolean} dragDropSupported - Whether drag and drop is supported
     */
    render(todos, allTodos = [], searchTerm = '', dragDropSupported = true) {
        if (todos.length === 0) {
            this.showEmptyState(allTodos.length === 0, searchTerm);
            return;
        }

        this.hideEmptyState();
        this.renderTodoList(todos, dragDropSupported);
    }

    /**
     * Render the todo list items
     * @param {Array} todos - Array of todo objects
     * @param {boolean} dragDropSupported - Whether drag and drop is supported
     */
    renderTodoList(todos, dragDropSupported = true) {
        this.todoList.innerHTML = todos.map(todo => {
            if (this.editingId === todo.id) {
                return this.renderEditForm(todo, dragDropSupported);
            }
            return this.renderTodoItem(todo, dragDropSupported);
        }).join('');
    }

    /**
     * Render a single todo item
     * @param {Object} todo - Todo object
     * @param {boolean} dragDropSupported - Whether drag and drop is supported
     * @returns {string} HTML string for the todo item
     */
    renderTodoItem(todo, dragDropSupported = true) {
        const dragAttributes = dragDropSupported ? 'draggable="true"' : '';
        const dragHandle = dragDropSupported ? 
            '<span class="drag-handle" role="button" tabindex="0" aria-label="Drag to reorder todo" title="Drag to reorder this todo">≡</span>' : 
            '<span class="drag-handle-disabled" role="button" tabindex="0" aria-label="Drag to reorder (not supported)" title="Drag and drop not supported in this browser">≡</span>';

        return `
            <li class="todo-item" data-id="${todo.id}" ${dragAttributes} role="listitem" aria-label="Todo: ${this.escapeHtml(todo.text)}">
                ${dragHandle}
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''}
                    data-action="toggle"
                    data-id="${todo.id}"
                    aria-label="Mark todo as ${todo.completed ? 'incomplete' : 'complete'}"
                >
                <span class="todo-text ${todo.completed ? 'completed' : ''}">${this.escapeHtml(todo.text)}</span>
                <div class="todo-actions">
                    <button class="edit-btn" data-action="edit" data-id="${todo.id}" aria-label="Edit todo">Edit</button>
                    <button class="delete-btn" data-action="delete" data-id="${todo.id}" aria-label="Delete todo">Delete</button>
                </div>
            </li>
        `;
    }

    /**
     * Render the edit form for a todo
     * @param {Object} todo - Todo object being edited
     * @param {boolean} dragDropSupported - Whether drag and drop is supported
     * @returns {string} HTML string for the edit form
     */
    renderEditForm(todo, dragDropSupported = true) {
        const dragHandle = dragDropSupported ? 
            '<span class="drag-handle" style="opacity: 0.3;" role="button" tabindex="-1" aria-label="Drag disabled while editing" title="Drag disabled while editing">≡</span>' : 
            '<span class="drag-handle-disabled" style="opacity: 0.3;" role="button" tabindex="-1" aria-label="Drag to reorder (not supported)" title="Drag and drop not supported in this browser">≡</span>';

        return `
            <li class="todo-item" data-id="${todo.id}" role="listitem" aria-label="Editing todo">
                ${dragHandle}
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} disabled aria-label="Todo completion status (disabled while editing)">
                <form class="edit-form" data-action="save-edit" data-id="${todo.id}">
                    <input 
                        type="text" 
                        class="edit-input" 
                        value="${this.escapeHtml(todo.text)}"
                        data-original-text="${this.escapeHtml(todo.text)}"
                        autofocus
                        required
                        aria-label="Edit todo text"
                    >
                    <button type="submit" class="save-btn" aria-label="Save changes">Save</button>
                    <button type="button" class="cancel-btn" data-action="cancel-edit" aria-label="Cancel editing">Cancel</button>
                </form>
            </li>
        `;
    }

    /**
     * Show empty state when no todos exist or no search results
     * @param {boolean} noTodosExist - True if no todos exist at all
     * @param {string} searchTerm - Current search term
     */
    showEmptyState(noTodosExist = true, searchTerm = '') {
        this.todoList.style.display = 'none';
        this.emptyState.style.display = 'block';
        
        if (noTodosExist) {
            this.emptyState.textContent = 'No todos yet. Add one above to get started!';
        } else {
            this.emptyState.textContent = 'No todos match your search.';
        }
    }

    /**
     * Hide empty state when todos exist
     */
    hideEmptyState() {
        this.todoList.style.display = 'block';
        this.emptyState.style.display = 'none';
    }

    /**
     * Start editing a todo
     * @param {string} id - Todo ID to edit
     */
    startEdit(id) {
        this.editingId = id;
    }

    /**
     * Cancel editing
     */
    cancelEdit() {
        this.editingId = null;
    }

    /**
     * Check if currently editing a todo
     * @returns {boolean} True if editing, false otherwise
     */
    isEditing() {
        return this.editingId !== null;
    }

    /**
     * Get the currently editing todo ID
     * @returns {string|null} Todo ID being edited or null
     */
    getEditingId() {
        return this.editingId;
    }

    /**
     * Clear the todo input field
     */
    clearInput() {
        this.todoInput.value = '';
    }

    /**
     * Get the value from the todo input field
     * @returns {string} Input value trimmed
     */
    getInputValue() {
        return this.todoInput.value.trim();
    }

    /**
     * Focus on the todo input field
     */
    focusInput() {
        this.todoInput.focus();
    }

    /**
     * Show a user message (could be enhanced with toast notifications)
     * @param {string} message - Message to show
     * @param {string} type - Message type (info, success, error)
     */
    showMessage(message, type = 'info') {
        // For now, use browser alert. In a more advanced implementation,
        // this could show toast notifications or inline messages
        if (type === 'error') {
            alert(`Error: ${message}`);
        } else if (type === 'confirm') {
            return confirm(message);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML string
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show confirmation dialog
     * @param {string} message - Confirmation message
     * @returns {boolean} True if confirmed, false otherwise
     */
    showConfirmation(message) {
        return this.showMessage(message, 'confirm');
    }

    /**
     * Show drag and drop unsupported message
     */
    showDragDropUnsupportedMessage() {
        if (this.dragDropMessageShown) {
            return; // Don't show the message multiple times
        }

        const message = 'Your browser does not support drag and drop functionality. You can still add, edit, delete, and search todos normally.';
        this.showMessage(message, 'info');
        this.dragDropMessageShown = true;
    }
}