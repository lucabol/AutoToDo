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
            PerformanceUtils.applySafariOptimizations(this.todoList);
            
            // Create Safari-optimized scroll handling
            this.safariScrollOptimization = PerformanceUtils.createSafariScrollOptimization(this.todoList);
            this.safariScrollOptimization.enable();
        }
    }

    /**
     * Enhanced render method with pagination support
     * @param {Array|Object} todosOrPaginatedData - Either array of todos or paginated data object
     * @param {Array} allTodos - All todos for context
     * @param {string} searchTerm - Current search term
     * @param {boolean} dragDropSupported - Whether drag and drop is supported
     */
    render(todosOrPaginatedData, allTodos = [], searchTerm = '', dragDropSupported = true) {
        this.renderMonitor.start();
        
        try {
            // Handle both paginated and non-paginated data
            let todos, paginationInfo;
            if (todosOrPaginatedData && typeof todosOrPaginatedData === 'object' && todosOrPaginatedData.todos) {
                // Paginated data
                todos = todosOrPaginatedData.todos;
                paginationInfo = todosOrPaginatedData;
            } else {
                // Simple array
                todos = Array.isArray(todosOrPaginatedData) ? todosOrPaginatedData : [];
                paginationInfo = null;
            }

            if (todos.length === 0) {
                this.showEmptyState(allTodos.length === 0, searchTerm);
                this.hidePaginationControls();
                return;
            }

            this.hideEmptyState();
            
            // Show pagination controls if needed
            if (paginationInfo && paginationInfo.totalPages > 1) {
                this.showPaginationControls(paginationInfo);
            } else {
                this.hidePaginationControls();
            }
            
            // Use virtual scrolling for large lists (but disable for drag & drop)
            if (this.useVirtualScrolling && todos.length >= this.virtualScrollThreshold && !dragDropSupported) {
                this.renderWithVirtualScrolling(todos);
            } else {
                this.renderTraditional(todos, dragDropSupported);
            }
        } finally {
            this.renderMonitor.end();
        }
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

    /**
     * Show pagination controls
     * @param {Object} paginationInfo - Pagination information
     */
    showPaginationControls(paginationInfo) {
        let paginationContainer = document.getElementById('paginationContainer');
        
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'paginationContainer';
            paginationContainer.className = 'pagination-container';
            
            // Insert after the todo list
            this.todoList.parentNode.insertBefore(paginationContainer, this.todoList.nextSibling);
        }

        const { currentPage, totalPages, totalCount, hasNextPage, hasPrevPage } = paginationInfo;
        
        paginationContainer.innerHTML = `
            <div class="pagination-info">
                <span>Page ${currentPage + 1} of ${totalPages} (${totalCount} total items)</span>
            </div>
            <div class="pagination-controls">
                <button 
                    class="pagination-btn" 
                    id="prevPageBtn" 
                    ${!hasPrevPage ? 'disabled' : ''}
                    aria-label="Previous page"
                >
                    ← Previous
                </button>
                <span class="page-numbers" id="pageNumbers"></span>
                <button 
                    class="pagination-btn" 
                    id="nextPageBtn" 
                    ${!hasNextPage ? 'disabled' : ''}
                    aria-label="Next page"
                >
                    Next →
                </button>
            </div>
        `;

        // Generate page numbers
        this.generatePageNumbers(currentPage, totalPages);
        
        // Apply CSS for pagination
        this.applyPaginationStyles(paginationContainer);
    }

    /**
     * Generate page number buttons
     * @param {number} currentPage - Current page (0-based)
     * @param {number} totalPages - Total number of pages
     */
    generatePageNumbers(currentPage, totalPages) {
        const pageNumbers = document.getElementById('pageNumbers');
        if (!pageNumbers) return;

        let html = '';
        const maxVisiblePages = 5;
        
        let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(0, endPage - maxVisiblePages + 1);
        }

        // Add first page and ellipsis if needed
        if (startPage > 0) {
            html += `<button class="page-btn" data-page="0">1</button>`;
            if (startPage > 1) {
                html += `<span class="page-ellipsis">...</span>`;
            }
        }

        // Add visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === currentPage;
            html += `<button class="page-btn ${isActive ? 'active' : ''}" data-page="${i}">${i + 1}</button>`;
        }

        // Add last page and ellipsis if needed
        if (endPage < totalPages - 1) {
            if (endPage < totalPages - 2) {
                html += `<span class="page-ellipsis">...</span>`;
            }
            html += `<button class="page-btn" data-page="${totalPages - 1}">${totalPages}</button>`;
        }

        pageNumbers.innerHTML = html;
    }

    /**
     * Apply pagination styles
     * @param {HTMLElement} container - Pagination container
     */
    applyPaginationStyles(container) {
        const style = document.createElement('style');
        style.textContent = `
            .pagination-container {
                margin: 20px 0;
                text-align: center;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            }
            
            .pagination-info {
                margin-bottom: 10px;
                font-size: 14px;
                color: #666;
            }
            
            .pagination-controls {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .pagination-btn, .page-btn {
                padding: 8px 12px;
                border: 1px solid #ddd;
                background: white;
                cursor: pointer;
                border-radius: 4px;
                font-size: 14px;
                transition: all 0.2s ease;
            }
            
            .pagination-btn:hover:not(:disabled), .page-btn:hover {
                background: #f5f5f5;
                border-color: #007aff;
            }
            
            .pagination-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .page-btn.active {
                background: #007aff;
                color: white;
                border-color: #007aff;
            }
            
            .page-ellipsis {
                padding: 8px 4px;
                color: #666;
            }
            
            .page-numbers {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            /* Dark mode support */
            body.dark-theme .pagination-container {
                color: #ffffff;
            }
            
            body.dark-theme .pagination-info {
                color: #cccccc;
            }
            
            body.dark-theme .pagination-btn, 
            body.dark-theme .page-btn {
                background: #2c2c2e;
                border-color: #48484a;
                color: #ffffff;
            }
            
            body.dark-theme .pagination-btn:hover:not(:disabled), 
            body.dark-theme .page-btn:hover {
                background: #48484a;
            }
            
            body.dark-theme .page-btn.active {
                background: #0a84ff;
                border-color: #0a84ff;
            }
            
            @media (max-width: 768px) {
                .pagination-controls {
                    flex-direction: column;
                    gap: 15px;
                }
                
                .page-numbers {
                    order: -1;
                }
            }
        `;
        
        if (!document.getElementById('paginationStyles')) {
            style.id = 'paginationStyles';
            document.head.appendChild(style);
        }
    }

    /**
     * Hide pagination controls
     */
    hidePaginationControls() {
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
    }

    /**
     * Set up pagination event listeners
     * @param {Function} onPageChange - Callback for page changes
     */
    setupPaginationEventListeners(onPageChange) {
        const paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer) return;

        // Remove existing listeners
        const oldContainer = paginationContainer.cloneNode(true);
        paginationContainer.parentNode.replaceChild(oldContainer, paginationContainer);

        // Add new listeners
        oldContainer.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.id === 'prevPageBtn' && !target.disabled) {
                const currentPage = parseInt(target.dataset.currentPage || '0');
                onPageChange(Math.max(0, currentPage - 1));
            } else if (target.id === 'nextPageBtn' && !target.disabled) {
                const currentPage = parseInt(target.dataset.currentPage || '0');
                onPageChange(currentPage + 1);
            } else if (target.classList.contains('page-btn')) {
                const page = parseInt(target.dataset.page);
                if (!isNaN(page)) {
                    onPageChange(page);
                }
            }
        });

        // Store pagination container reference for cleanup
        this.paginationContainer = oldContainer;
    }
}