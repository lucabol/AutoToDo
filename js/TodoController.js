/**
 * TodoController - Handles user interactions and coordinates between Model and View
 */
class TodoController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.searchTerm = '';
        this.keyboardManager = new KeyboardShortcutManager();
        this.init();
    }

    /**
     * Initialize the controller and set up event listeners
     */
    init() {
        this.bindEvents();
        this.initializeTheme();
        this.setupKeyboardShortcuts();
        this.render();
    }

    /**
     * Initialize theme management
     */
    initializeTheme() {
        // Check for saved theme preference or system preference
        const savedTheme = localStorage.getItem('todo-theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        this.setTheme(initialTheme, false); // false = don't save to localStorage on init
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('todo-theme')) {
                this.setTheme(e.matches ? 'dark' : 'light', false);
            }
        });
    }

    /**
     * Set the application theme
     * @param {string} theme - 'light' or 'dark'
     * @param {boolean} save - Whether to save preference to localStorage
     */
    setTheme(theme, save = true) {
        const body = document.body;
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = themeToggle?.querySelector('.theme-icon');
        const themeText = themeToggle?.querySelector('.theme-text');

        if (theme === 'dark') {
            body.classList.add('dark-theme');
            if (themeIcon) themeIcon.textContent = '☀️';
            if (themeText) themeText.textContent = 'Light';
        } else {
            body.classList.remove('dark-theme');
            if (themeIcon) themeIcon.textContent = '🌙';
            if (themeText) themeText.textContent = 'Dark';
        }

        if (save) {
            localStorage.setItem('todo-theme', theme);
        }

        this.currentTheme = theme;
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * Set up keyboard shortcuts using the KeyboardShortcutManager
     */
    setupKeyboardShortcuts() {
        // Register editing context
        this.keyboardManager.registerContext('editing', () => this.view.isEditing());
        
        // Create handler functions for all shortcuts
        const handlers = {
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
            toggleTheme: () => this.toggleTheme()
        };

        // Get shortcuts configuration and register all shortcuts
        const shortcuts = ShortcutsConfig.getShortcuts(handlers);
        shortcuts.forEach(shortcut => {
            this.keyboardManager.registerShortcut(shortcut);
        });
    }

    /**
     * Handle save edit triggered by keyboard shortcut
     */
    handleSaveEditFromShortcut() {
        const editingId = this.view.getEditingId();
        const editForm = document.querySelector(`.edit-form[data-id="${editingId}"]`);
        if (editForm) {
            this.handleSaveEdit(editingId, editForm);
        }
    }

    /**
     * Focus the new todo input field
     */
    focusNewTodoInput() {
        const todoInput = document.getElementById('todoInput');
        if (todoInput) {
            todoInput.focus();
            todoInput.select(); // Select any existing text
        }
    }

    /**
     * Focus the search input field
     */
    focusSearchInput() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select(); // Select any existing text
        }
    }

    /**
     * Handle adding todo from keyboard shortcut
     */
    handleAddTodoFromShortcut() {
        const todoInput = document.getElementById('todoInput');
        if (todoInput && todoInput.value.trim()) {
            // If there's text in the input, add it as a todo
            this.handleAddTodo();
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
            this.handleToggleTodo(firstTodo.id);
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
            this.handleDeleteTodo(firstTodo.id);
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
            
            this.render();
            this.view.showMessage(`Cleared ${deletedCount} completed todo${deletedCount !== 1 ? 's' : ''}`, 'success');
        }
    }

    /**
     * Show keyboard shortcuts help modal
     */
    showKeyboardHelp() {
        // Check if help modal already exists
        let helpModal = document.getElementById('keyboardHelpModal');
        
        if (!helpModal) {
            helpModal = this.createKeyboardHelpModal();
            document.body.appendChild(helpModal);
        }
        
        helpModal.style.display = 'flex';
        
        // Focus the close button for accessibility
        const closeButton = helpModal.querySelector('.help-close-btn');
        if (closeButton) {
            closeButton.focus();
        }
    }

    /**
     * Create the keyboard help modal
     */
    createKeyboardHelpModal() {
        const modal = document.createElement('div');
        modal.id = 'keyboardHelpModal';
        modal.className = 'help-modal';
        
        // Get all shortcuts and group by category
        const allShortcuts = this.keyboardManager.getAllShortcuts();
        const groupedShortcuts = ShortcutsConfig.groupByCategory(allShortcuts);
        
        let helpContent = `
            <div class="help-modal-content">
                <div class="help-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button class="help-close-btn" onclick="this.closest('.help-modal').style.display='none'">
                        <span aria-hidden="true">&times;</span>
                        <span class="sr-only">Close</span>
                    </button>
                </div>
                <div class="help-body">
        `;
        
        // Add shortcuts by category
        const categoryOrder = ['Navigation', 'Todo Management', 'Editing', 'General'];
        
        categoryOrder.forEach(categoryName => {
            if (groupedShortcuts[categoryName]) {
                helpContent += `<div class="help-category">
                    <h3>${categoryName}</h3>
                    <div class="shortcuts-list">`;
                
                groupedShortcuts[categoryName].forEach(shortcut => {
                    const keyCombo = ShortcutsConfig.formatKeyCombo(shortcut);
                    const description = shortcut.description.replace(/\s*\([^)]*\)\s*$/, ''); // Remove key combo from description
                    
                    helpContent += `
                        <div class="shortcut-item">
                            <kbd class="shortcut-keys">${keyCombo}</kbd>
                            <span class="shortcut-description">${description}</span>
                        </div>
                    `;
                });
                
                helpContent += `</div></div>`;
            }
        });
        
        helpContent += `
                </div>
                <div class="help-footer">
                    <p>Press <kbd>Escape</kbd> or click outside to close this help dialog.</p>
                </div>
            </div>
        `;
        
        modal.innerHTML = helpContent;
        
        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Add escape key to close
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.style.display = 'none';
            }
        });
        
        return modal;
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
        this.bindThemeToggle();
        this.bindKeyboardShortcuts();
    }

    /**
     * Bind theme toggle button event
     */
    bindThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
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
            this.keyboardManager.handleKeyboard(e);
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
        this.view.render(filteredTodos, allTodos, this.searchTerm);
    }

    /**
     * Get application statistics
     * @returns {Object} Stats object with todo counts
     */
    getStats() {
        return this.model.getStats();
    }
}