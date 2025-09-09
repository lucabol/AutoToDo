/**
 * TodoView - Handles UI rendering and DOM manipulation
 */
class TodoView {
    constructor() {
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.todoInput = document.getElementById('todoInput');
        this.editingId = null;
    }

    /**
     * Render the complete todo list
     * @param {Array} todos - Array of todo objects
     */
    render(todos) {
        if (todos.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();
        this.renderTodoList(todos);
    }

    /**
     * Render the todo list items
     * @param {Array} todos - Array of todo objects
     */
    renderTodoList(todos) {
        this.todoList.innerHTML = todos.map(todo => {
            if (this.editingId === todo.id) {
                return this.renderEditForm(todo);
            }
            return this.renderTodoItem(todo);
        }).join('');
    }

    /**
     * Render a single todo item
     * @param {Object} todo - Todo object
     * @returns {string} HTML string for the todo item
     */
    renderTodoItem(todo) {
        return `
            <li class="todo-item" data-id="${todo.id}">
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''}
                    data-action="toggle"
                    data-id="${todo.id}"
                >
                <span class="todo-text ${todo.completed ? 'completed' : ''}">${this.escapeHtml(todo.text)}</span>
                <div class="todo-actions">
                    <button class="edit-btn" data-action="edit" data-id="${todo.id}">Edit</button>
                    <button class="delete-btn" data-action="delete" data-id="${todo.id}">Delete</button>
                </div>
            </li>
        `;
    }

    /**
     * Render the edit form for a todo
     * @param {Object} todo - Todo object being edited
     * @returns {string} HTML string for the edit form
     */
    renderEditForm(todo) {
        return `
            <li class="todo-item" data-id="${todo.id}">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} disabled>
                <form class="edit-form" data-action="save-edit" data-id="${todo.id}">
                    <input 
                        type="text" 
                        class="edit-input" 
                        value="${this.escapeHtml(todo.text)}"
                        data-original-text="${this.escapeHtml(todo.text)}"
                        autofocus
                        required
                    >
                    <button type="submit" class="save-btn">Save</button>
                    <button type="button" class="cancel-btn" data-action="cancel-edit">Cancel</button>
                </form>
            </li>
        `;
    }

    /**
     * Show empty state when no todos exist
     */
    showEmptyState() {
        this.todoList.style.display = 'none';
        this.emptyState.style.display = 'block';
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
}