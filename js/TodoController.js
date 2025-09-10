/**
 * TodoController - Handles user interactions and coordinates between Model and View
 */
class TodoController {
    constructor(model, view, options = {}) {
        this.model = model;
        this.view = view;
        this.searchTerm = '';
        this.searchDebounceTimer = null;
        this.showArchived = false; // New flag for showing archived todos
        
        // Configuration options with defaults
        this.options = {
            searchDebounceDelay: 150, // Default 150ms debounce delay
            keyboardDebug: false,
            keyboardLogging: false,
            keyboardValidateConflicts: true,
            ...options
        };
        
        this.keyboardManager = new KeyboardShortcutManager({
            debug: this.options.keyboardDebug,
            enableLogging: this.options.keyboardLogging,
            validateConflicts: this.options.keyboardValidateConflicts
        });
        this.keyboardHandlers = new KeyboardHandlers(this);
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
     * Set up keyboard shortcuts using the enhanced KeyboardShortcutManager
     */
    setupKeyboardShortcuts() {
        try {
            this._initializeKeyboardContext();
            this._registerAllShortcuts();
            this._validateCriticalShortcuts();
            this._logSetupCompletion();
        } catch (error) {
            console.error('Failed to setup keyboard shortcuts:', error);
            this._registerEmergencyShortcuts();
        }
    }

    /**
     * Initialize keyboard context for editing
     * @private
     */
    _initializeKeyboardContext() {
        this.keyboardManager.registerContext('editing', () => this.view.isEditing());
    }

    /**
     * Register all keyboard shortcuts from configuration
     * @private
     */
    _registerAllShortcuts() {
        const handlers = this.keyboardHandlers.getAllHandlers();
        const shortcuts = ShortcutsConfig.getShortcuts(handlers);
        
        // Validate shortcuts before registering
        const validation = ShortcutsConfig.validateShortcutCollection(shortcuts);
        if (validation.errors > 0) {
            console.warn('Shortcut validation found errors:', validation);
        }
        
        // Register shortcuts with batch error handling
        this.registeredCount = 0;
        shortcuts.forEach((shortcut, index) => {
            try {
                this.keyboardManager.registerShortcut(shortcut);
                this.registeredCount++;
            } catch (error) {
                console.error(`Failed to register shortcut ${index}:`, shortcut, error);
            }
        });

        this.totalShortcuts = shortcuts.length;
    }

    /**
     * Validate that critical shortcuts are registered
     * @private
     */
    _validateCriticalShortcuts() {
        this.verifyCriticalShortcuts();
    }

    /**
     * Log setup completion information
     * @private
     */
    _logSetupCompletion() {
        if (this.keyboardManager.options.debug) {
            console.log(`Keyboard shortcuts setup completed: ${this.registeredCount}/${this.totalShortcuts} shortcuts registered`);
            console.log('Debug info:', this.keyboardManager.getDebugInfo());
        }
    }

    /**
     * Register emergency shortcuts if main setup fails
     * @private
     */
    _registerEmergencyShortcuts() {
        console.log('Registering emergency shortcuts due to setup failure...');
        this.registerFallbackShortcuts();
    }

    /**
     * Verify that critical shortcuts like Ctrl+F are properly registered
     * @private
     */
    verifyCriticalShortcuts() {
        const criticalShortcuts = [
            { key: 'f', ctrlKey: true, context: 'global', name: 'Ctrl+F (Focus Search)' },
            { key: '/', ctrlKey: false, context: 'global', name: '/ (Focus Search)' },
            { key: 'n', ctrlKey: true, context: 'global', name: 'Ctrl+N (Focus New Todo)' }
        ];
        
        for (const critical of criticalShortcuts) {
            const shortcutKey = this.keyboardManager.generateShortcutKey(
                critical.key, critical.ctrlKey, false, false, critical.context
            );
            
            const registered = this.keyboardManager.shortcuts.has(shortcutKey);
            if (!registered) {
                console.error(`Critical shortcut not registered: ${critical.name}`);
                // Try to re-register this specific shortcut
                this.registerFallbackShortcuts();
                break;
            }
        }
    }

    /**
     * Register fallback shortcuts for critical functionality
     * @private
     */
    registerFallbackShortcuts() {
        console.log('Registering fallback shortcuts...');
        
        // Ensure search focus shortcuts are available
        const searchFocus = () => this.keyboardHandlers.focusSearchInput();
        const todoFocus = () => this.keyboardHandlers.focusNewTodoInput();
        
        try {
            this.keyboardManager.registerShortcut({
                key: 'f',
                ctrlKey: true,
                context: 'global',
                action: searchFocus,
                preventDefault: true,
                description: 'Focus search input (Ctrl+F) - Fallback',
                category: 'Navigation'
            });
            
            this.keyboardManager.registerShortcut({
                key: '/',
                context: 'global',
                action: searchFocus,
                preventDefault: true,
                description: 'Focus search input (/) - Fallback',
                category: 'Navigation'
            });
            
            console.log('Fallback shortcuts registered successfully');
        } catch (error) {
            console.error('Failed to register fallback shortcuts:', error);
        }
    }

    /**
     * Show keyboard shortcuts help modal
     */
    showKeyboardHelp() {
        HelpModalBuilder.showHelpModal(this.keyboardManager);
    }

    /**
     * Set up all event listeners using event delegation
     */
    bindEvents() {
        this.bindAddTodoForm();
        this.bindSearchInput();
        this.bindClearSearchButton();
        this.bindTodoListClick();
        this.bindTodoListSubmit();
        this.bindTodoListChange();
        this.bindThemeToggle();
        this.bindKeyboardShortcuts();
        this.bindArchiveControls();
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
     * Bind clear search button event handler
     */
    bindClearSearchButton() {
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        clearSearchBtn.addEventListener('click', () => {
            this.handleClearSearch();
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
     * Bind archive control events
     */
    bindArchiveControls() {
        // Archive completed todos button
        const archiveBtn = document.getElementById('archiveCompletedBtn');
        if (archiveBtn) {
            archiveBtn.addEventListener('click', () => {
                this.handleArchiveCompleted();
            });
        }

        // Toggle archived todos view
        const toggleArchivedBtn = document.getElementById('toggleArchivedBtn');
        if (toggleArchivedBtn) {
            toggleArchivedBtn.addEventListener('click', () => {
                this.handleToggleArchived();
            });
        }
    }

    /**
     * Handle archiving all completed todos
     */
    handleArchiveCompleted() {
        const archived = this.model.archiveCompletedTodos();
        if (archived > 0) {
            this.view.showMessage(`Archived ${archived} completed todo(s)`, 'success');
            this.render();
        } else {
            this.view.showMessage('No completed todos to archive', 'info');
        }
    }

    /**
     * Handle toggling archived todos view
     */
    handleToggleArchived() {
        this.showArchived = !this.showArchived;
        
        // Update button text
        const toggleBtn = document.getElementById('toggleArchivedBtn');
        if (toggleBtn) {
            toggleBtn.textContent = this.showArchived ? 'Show Active' : 'Show Archived';
            toggleBtn.classList.toggle('active', this.showArchived);
        }
        
        this.render();
    }

    /**
     * Handle archiving individual todo
     * @param {string} id - Todo ID
     */
    handleArchiveTodo(id) {
        const archivedTodo = this.model.archiveTodo(id);
        if (archivedTodo) {
            this.render();
        }
    }

    /**
     * Handle unarchiving individual todo
     * @param {string} id - Todo ID
     */
    handleUnarchiveTodo(id) {
        const unarchivedTodo = this.model.unarchiveTodo(id);
        if (unarchivedTodo) {
            this.render();
        }
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
     * Handle search input changes with debouncing for better performance
     * @param {string} searchTerm - The search term
     */
    handleSearch(searchTerm) {
        // Clear previous timer
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
        
        // Debounce search for performance with large datasets
        // Use configurable delay (default 150ms)
        this.searchDebounceTimer = setTimeout(() => {
            this.searchTerm = searchTerm;
            this.render();
        }, this.options.searchDebounceDelay);
    }

    /**
     * Set the search debounce delay (useful for testing and customization)
     * @param {number} delay - The debounce delay in milliseconds
     */
    setSearchDebounceDelay(delay) {
        if (typeof delay === 'number' && delay >= 0) {
            this.options.searchDebounceDelay = delay;
        }
    }

    /**
     * Get the current search debounce delay
     * @returns {number} The current debounce delay in milliseconds
     */
    getSearchDebounceDelay() {
        return this.options.searchDebounceDelay;
    }

    /**
     * Handle clearing the search input
     */
    handleClearSearch() {
        const searchInput = document.getElementById('searchInput');
        searchInput.value = '';
        this.searchTerm = '';
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
            case 'archive':
                this.handleArchiveTodo(id);
                break;
            case 'unarchive':
                this.handleUnarchiveTodo(id);
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
     * Render the current state with archive filtering
     */
    render() {
        const allTodos = this.model.getTodosFiltered(this.showArchived);
        const filteredTodos = this.model.filterTodos(this.searchTerm, this.showArchived);
        this.view.render(filteredTodos, allTodos, this.searchTerm, this.showArchived);
    }

    /**
     * Get application statistics with archive information
     * @returns {Object} Stats object with todo counts including archived
     */
    getStats() {
        return this.model.getStats(this.showArchived);
    }
}