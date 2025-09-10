/**
 * TodoView - Handles UI rendering and DOM manipulation with performance optimizations
 */
class TodoView {
    constructor() {
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.todoInput = document.getElementById('todoInput');
        this.editingId = null;
        this.dragDropMessageShown = false;
        
        // Performance optimizations
        this.useVirtualScrolling = true;
        this.virtualScrollThreshold = 50; // Use virtual scrolling for 50+ items
        this.virtualScrollManager = null;
        this.renderMonitor = PerformanceUtils.createMonitor('TodoView Render');
        
        // DOM element pool for reusing elements
        this.elementPool = PerformanceUtils.createObjectPool(
            () => this.createTodoElement(),
            (element) => this.resetTodoElement(element)
        );
        
        this.initializePerformanceOptimizations();
    }

    
    /**
     * Initialize performance optimizations
     */
    initializePerformanceOptimizations() {
        // Apply CSS optimizations for better performance
        if (this.todoList) {
            this.todoList.style.cssText += `
                contain: layout style paint;
                transform: translateZ(0);
            `;
        }
        
        // Safari-specific optimizations
        if (PerformanceUtils.isSafari()) {
            this.applySafariOptimizations();
        }
    }
    
    /**
     * Apply Safari-specific performance optimizations
     */
    applySafariOptimizations() {
        if (this.todoList) {
            this.todoList.style.cssText += `
                -webkit-transform: translateZ(0);
                -webkit-backface-visibility: hidden;
                -webkit-perspective: 1000;
            `;
        }
    }

    render(todos, allTodos = [], searchTerm = '', dragDropSupported = true) {
        this.renderMonitor.start();
        
        try {
            if (todos.length === 0) {
                this.showEmptyState(allTodos.length === 0, searchTerm);
                return;
            }

            this.hideEmptyState();
            
            // Use virtual scrolling for large lists (but disable for drag & drop)
            if (this.useVirtualScrolling && todos.length >= this.virtualScrollThreshold && !dragDropSupported) {
                this.renderWithVirtualScrolling(todos);
            } else {
                this.renderTraditional(todos, dragDropSupported);
            }
        } finally {
            this.renderMonitor.end();
        }
    
    /**
     * Render using virtual scrolling for performance
     * @param {Array} todos - Array of todo objects
     */
    renderWithVirtualScrolling(todos) {
        if (!this.virtualScrollManager) {
            this.initVirtualScrolling();
        }
        
        this.virtualScrollManager.setItems(todos);
    }
    
    /**
     * Initialize virtual scrolling manager
     */
    initVirtualScrolling() {
        // Clear existing content
        this.todoList.innerHTML = '';
        
        this.virtualScrollManager = new VirtualScrollManager({
            container: this.todoList,
            itemHeight: 60, // Estimated height of each todo item
            bufferSize: 5,
            renderCallback: (todo, index) => this.renderVirtualTodoItem(todo, index)
        });
    }
    
    /**
     * Render a todo item for virtual scrolling
     * @param {Object} todo - Todo object
     * @param {number} index - Item index
     * @returns {Element} DOM element for the todo
     */
    renderVirtualTodoItem(todo, index) {
        const element = this.elementPool.acquire();
        this.populateTodoElement(element, todo);
        return element;
    }
    
    /**
     * Create a reusable todo element
     * @returns {Element} Empty todo element
     */
    createTodoElement() {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox">
            <span class="todo-text"></span>
            <div class="todo-actions">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        `;
        return li;
    }
    
    /**
     * Reset a todo element for reuse
     * @param {Element} element - Element to reset
     */
    resetTodoElement(element) {
        const checkbox = element.querySelector('.todo-checkbox');
        const textSpan = element.querySelector('.todo-text');
        
        if (checkbox) {
            checkbox.checked = false;
            checkbox.removeAttribute('data-id');
            checkbox.removeAttribute('data-action');
        }
        
        if (textSpan) {
            textSpan.textContent = '';
            textSpan.className = 'todo-text';
        }
        
        element.removeAttribute('data-id');
        element.className = 'todo-item';
    }
    
    /**
     * Populate a todo element with data
     * @param {Element} element - Element to populate
     * @param {Object} todo - Todo data
     */
    populateTodoElement(element, todo) {
        const checkbox = element.querySelector('.todo-checkbox');
        const textSpan = element.querySelector('.todo-text');
        const editBtn = element.querySelector('.edit-btn');
        const deleteBtn = element.querySelector('.delete-btn');
        
        element.setAttribute('data-id', todo.id);
        
        if (checkbox) {
            checkbox.checked = todo.completed;
            checkbox.setAttribute('data-action', 'toggle');
            checkbox.setAttribute('data-id', todo.id);
        }
        
        if (textSpan) {
            textSpan.textContent = todo.text;
            textSpan.className = todo.completed ? 'todo-text completed' : 'todo-text';
        }
        
        if (editBtn) {
            editBtn.setAttribute('data-action', 'edit');
            editBtn.setAttribute('data-id', todo.id);
        }
        
        if (deleteBtn) {
            deleteBtn.setAttribute('data-action', 'delete');
            deleteBtn.setAttribute('data-id', todo.id);
        }
        
        // Handle editing state
        if (this.editingId === todo.id) {
            this.convertToEditForm(element, todo);
        }
    }
    
    /**
     * Convert element to edit form
     * @param {Element} element - Element to convert
     * @param {Object} todo - Todo data
     */
    convertToEditForm(element, todo) {
        element.innerHTML = `
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
        `;
    }
    
    /**
     * Render using traditional DOM manipulation
     * @param {Array} todos - Array of todo objects
     * @param {boolean} dragDropSupported - Whether drag and drop is supported
     */
    renderTraditional(todos, dragDropSupported = true) {
        // Clean up virtual scrolling if it was active
        if (this.virtualScrollManager) {
            this.virtualScrollManager.destroy();
            this.virtualScrollManager = null;
        }
        
        // Use efficient rendering with DocumentFragment
        PerformanceUtils.batchDOMOperations(() => {
            this.renderTodoList(todos, dragDropSupported);
        });
    }

    renderTodoList(todos, dragDropSupported = true) {
        // Use DocumentFragment for performance when not using virtual scrolling
        const fragment = document.createDocumentFragment();
        
        todos.forEach(todo => {
            if (this.editingId === todo.id) {
                fragment.appendChild(this.createEditFormElement(todo, dragDropSupported));
            } else {
                fragment.appendChild(this.createTodoItemElement(todo, dragDropSupported));
            }
        });
        
        // Batch DOM update
        this.todoList.innerHTML = '';
        this.todoList.appendChild(fragment);
    }
    
    createTodoItemElement(todo, dragDropSupported = true) {
        const dragAttributes = dragDropSupported ? 'draggable="true"' : '';
        const dragHandle = dragDropSupported ? 
            '<span class="drag-handle" role="button" tabindex="0" aria-label="Drag to reorder todo" title="Drag to reorder this todo">≡</span>' : 
            '<span class="drag-handle-disabled" role="button" tabindex="0" aria-label="Drag to reorder (not supported)" title="Drag and drop not supported in this browser">≡</span>';

        const li = document.createElement('li');
        li.className = 'todo-item';
        li.setAttribute('data-id', todo.id);
        if (dragDropSupported) {
            li.setAttribute('draggable', 'true');
        }
        li.setAttribute('role', 'listitem');
        li.setAttribute('aria-label', `Todo: ${todo.text}`);
        
        li.innerHTML = `
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
        `;
        
        return li;
    }
    
    createEditFormElement(todo, dragDropSupported = true) {
        const dragHandle = dragDropSupported ? 
            '<span class="drag-handle" style="opacity: 0.3;" role="button" tabindex="-1" aria-label="Drag disabled while editing" title="Drag disabled while editing">≡</span>' : 
            '<span class="drag-handle-disabled" style="opacity: 0.3;" role="button" tabindex="-1" aria-label="Drag to reorder (not supported)" title="Drag and drop not supported in this browser">≡</span>';

        const li = document.createElement('li');
        li.className = 'todo-item';
        li.setAttribute('data-id', todo.id);
        li.setAttribute('role', 'listitem');
        li.setAttribute('aria-label', 'Editing todo');
        
        li.innerHTML = `
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
        `;
        
        return li;
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
     * Clean up resources
     */
    destroy() {
        if (this.virtualScrollManager) {
            this.virtualScrollManager.destroy();
            this.virtualScrollManager = null;
        }
        
        this.elementPool.clear();
    }
    
    /**
     * Get performance statistics
     * @returns {Object} Performance statistics
     */
    getPerformanceStats() {
        return {
            renderStats: this.renderMonitor.getStats(),
            isUsingVirtualScrolling: !!this.virtualScrollManager,
            poolSize: this.elementPool.size()
        };
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