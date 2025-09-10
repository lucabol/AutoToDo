/**
 * TodoController - Handles user interactions and coordinates between Model and View
 */
class TodoController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.searchTerm = '';
        
        // Drag and drop functionality
        this.draggedId = null;
        this.dragDropSupported = this.checkDragDropSupport();
        
        // Performance optimizations
        this.searchMonitor = PerformanceUtils.createMonitor('Search Performance');
        this.debouncedSearch = PerformanceUtils.debounce(this.performSearch.bind(this), 300);
        
        this.keyboardManager = new KeyboardShortcutManager({
            debug: false, // Set to true for debugging
            enableLogging: false,
            validateConflicts: true
        });
        this.keyboardHandlers = new KeyboardHandlers(this);
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
        this.initializeTheme();
        this.setupKeyboardShortcuts();
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
     * Initialize theme management
     */
    initializeTheme() {
        // Use the same storage manager as the model
        this.storage = this.model.storage;
        
        // Check for saved theme preference or system preference
        const savedTheme = this.storage.getItem('todo-theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        this.setTheme(initialTheme, false); // false = don't save to storage on init
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!this.storage.getItem('todo-theme')) {
                this.setTheme(e.matches ? 'dark' : 'light', false);
            }
        });
    }

    /**
     * Set the application theme
     * @param {string} theme - 'light' or 'dark'
     * @param {boolean} save - Whether to save preference to storage
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

        if (save && this.storage) {
            this.storage.setItem('todo-theme', theme);
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
     * Set up all event listeners using event delegation
     */
    bindEvents() {
        this.bindAddTodoForm();
        this.bindSearchInput();
        this.bindClearSearchButton();
        this.bindArchiveControls();
        this.bindTodoListClick();
        this.bindTodoListSubmit();
        this.bindTodoListChange();
        this.bindDragAndDrop();
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
     * Bind clear search button event handler
     */
    bindClearSearchButton() {
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        clearSearchBtn.addEventListener('click', () => {
            this.handleClearSearch();
        });
    }

    /**
     * Bind archive controls event handlers
     */
    bindArchiveControls() {
        const archiveCompletedBtn = document.getElementById('archiveCompletedBtn');
        const viewToggleBtn = document.getElementById('viewToggleBtn');
        const searchArchivedToggle = document.getElementById('searchArchivedToggle');

        if (archiveCompletedBtn) {
            archiveCompletedBtn.addEventListener('click', () => {
                this.handleArchiveCompleted();
            });
        }

        if (viewToggleBtn) {
            viewToggleBtn.addEventListener('click', () => {
                this.handleToggleArchivedView();
            });
        }

        if (searchArchivedToggle) {
            searchArchivedToggle.addEventListener('change', () => {
                this.handleSearchArchivedToggle();
            });
        }
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
     * Handle search input changes with intelligent debouncing for optimal performance
     * 
     * This method implements a dual-strategy approach to search input handling:
     * 1. Immediate UI feedback: Updates searchTerm instantly for responsive interface
     * 2. Debounced execution: Delays expensive filtering operations to reduce CPU usage
     * 
     * Performance Benefits:
     * - Prevents excessive DOM updates during rapid typing (was causing 100ms+ delays)
     * - Maintains UI responsiveness by updating search state immediately
     * - Reduces server/storage load by avoiding rapid successive searches
     * - Improves battery life on mobile devices by reducing CPU cycles
     * 
     * Debouncing Strategy:
     * - 300ms delay balances responsiveness with performance
     * - Shorter delays (100ms) felt laggy with large datasets
     * - Longer delays (500ms) felt sluggish for users
     * 
     * @param {string} searchTerm - The search term entered by user
     */
    handleSearch(searchTerm) {
        // Immediate UI feedback: Update search term for instant state synchronization
        // This ensures UI elements like clear button and search highlighting work immediately
        this.searchTerm = searchTerm;
        
        // Debounced execution: Delay expensive filtering operations
        // Only the final search in a rapid sequence will execute, dramatically improving performance
        this.debouncedSearch(searchTerm);
    }
    
    /**
     * Perform the actual search operation with performance monitoring
     * 
     * This is the debounced search handler that performs the heavy lifting of
     * filtering todos and updating the display. It includes several performance
     * optimizations and safeguards:
     * 
     * Race Condition Prevention:
     * - Validates searchTerm hasn't changed during debounce delay
     * - Prevents outdated search results from overwriting current state
     * - Critical for fast typers and rapid search term changes
     * 
     * Performance Monitoring:
     * - Tracks search operation timing for performance analysis
     * - Helps identify performance regressions in production
     * - Data used for optimizing search algorithm thresholds
     * 
     * Search Algorithm Features (implemented in TodoModel.filterTodos):
     * - Multi-word AND logic: "buy coffee" finds todos containing both "buy" AND "coffee"
     * - Case-insensitive matching for better user experience
     * - Whitespace normalization prevents formatting issues
     * - Optional archived todo inclusion for comprehensive search
     * 
     * @param {string} searchTerm - The search term to filter by
     * @private
     */
    performSearch(searchTerm) {
        // Start performance monitoring to track search operation timing
        this.searchMonitor.start();
        
        try {
            // Race condition check: Only proceed if search term hasn't changed
            // This prevents outdated search results from overwriting newer searches
            // Critical when users type rapidly or change search terms quickly
            if (this.searchTerm === searchTerm) {
                this.render();
            }
        } finally {
            // Always end monitoring even if render() throws an error
            // Ensures consistent performance metrics and prevents memory leaks
            this.searchMonitor.end();
        }
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
            case 'archive':
                this.handleArchiveTodo(id);
                break;
            case 'unarchive':
                this.handleUnarchiveTodo(id);
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
     * Handle reordering a todo
     * @param {string} todoId - ID of todo to reorder
     * @param {number} newIndex - New index position
     */
    handleReorderTodo(todoId, newIndex) {
        // Calculate actual index if we're dealing with filtered results
        if (this.searchTerm) {
            const filteredTodos = this.model.filterTodos(this.searchTerm);
            const allTodos = this.model.getAllTodos();
            const targetTodo = filteredTodos[newIndex];
            const actualTargetIndex = allTodos.findIndex(todo => todo.id === targetTodo.id);
            
            if (this.model.reorderTodo(todoId, actualTargetIndex)) {
                this.render();
            }
        } else {
            if (this.model.reorderTodo(todoId, newIndex)) {
                this.render();
            }
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
     * Get application statistics including performance data
     * @returns {Object} Stats object with todo counts and performance metrics
     */
    getStats() {
        const modelStats = this.model.getStats();
        const viewStats = this.view.getPerformanceStats();
        const searchStats = this.searchMonitor.getStats();
        
        return {
            ...modelStats,
            performance: {
                view: viewStats,
                search: searchStats,
                isMobile: PerformanceUtils.isMobile(),
                isSafari: PerformanceUtils.isSafari()
            }
        };
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
     * Get current todos based on search filter and archive view state
     * @returns {Array} Current filtered todos
     */
    getCurrentTodos() {
        if (this.searchTerm) {
            return this.model.filterTodos(this.searchTerm, this.view.getSearchIncludesArchived());
        }
        
        return this.view.showingArchived ? this.model.getArchivedTodos() : this.model.getActiveTodos();
    }

    /**
     * Handle archiving a single todo
     * Moves a todo to archived state while preserving its data and completion status.
     * Archived todos are excluded from the main view but remain searchable when enabled.
     * 
     * @param {string} id - Todo ID to archive
     */
    handleArchiveTodo(id) {
        const todo = this.model.archiveTodo(id);
        if (todo) {
            this.view.showArchiveSuccess('archived');
            this.render(); // Re-render to update UI without the archived todo
        }
    }

    /**
     * Handle unarchiving a single todo
     * Restores an archived todo back to active state, making it visible
     * in the main todo list again while preserving all its properties.
     * 
     * @param {string} id - Todo ID to unarchive
     */
    handleUnarchiveTodo(id) {
        const todo = this.model.unarchiveTodo(id);
        if (todo) {
            this.view.showArchiveSuccess('unarchived');
            this.render(); // Re-render to show the unarchived todo
        }
    }

    /**
     * Handle bulk archiving of all completed todos
     * This is a performance-optimized operation that archives multiple todos
     * in a single transaction, ideal for cleaning up completed tasks.
     * Shows user feedback with the count of archived items.
     */
    handleArchiveCompleted() {
        const archivedCount = this.model.archiveCompleted();
        if (archivedCount > 0) {
            this.view.showArchiveSuccess('archive-completed', archivedCount);
            this.render(); // Re-render to remove archived todos from view
        }
    }

    /**
     * Handle toggling between active and archived view
     * Switches the main view between showing active todos (default) and archived todos.
     * This allows users to review and manage their archived todos when needed.
     */
    handleToggleArchivedView() {
        this.view.toggleArchivedView();
        this.render(); // Re-render with the new view mode
    }

    /**
     * Handle toggling search archived checkbox with intelligent re-search behavior
     * 
     * This method manages the "Include archived todos in search" functionality,
     * providing users with the ability to search across their entire todo history
     * or limit searches to only active (non-archived) todos.
     * 
     * Search Scope Behavior:
     * - When toggled ON: Search includes both active AND archived todos
     * - When toggled OFF: Search limited to active todos only (default)
     * - State persists until user manually changes it again
     * 
     * Performance Optimization:
     * - Only re-executes search if a search term is currently active
     * - Avoids unnecessary filtering when no search is in progress
     * - Uses existing performSearch() method to maintain consistency
     * 
     * User Experience Features:
     * - Immediate feedback: Results update instantly when toggled
     * - Search history: Previously found archived todos become visible/hidden
     * - Visual distinction: Archived todos are styled differently in results
     * 
     * Use Cases:
     * - Finding old completed projects: Toggle ON to search archived todos
     * - Reducing clutter: Toggle OFF to focus only on current active todos
     * - Reference lookup: Quickly access archived information when needed
     */
    handleSearchArchivedToggle() {
        if (this.searchTerm) {
            // Re-run current search with new archive inclusion setting
            // This provides immediate feedback to users about the scope change
            this.performSearch();
        }
        // Note: If no search is active, the toggle state is simply stored
        // for the next search operation, avoiding unnecessary processing
    }

    /**
     * Update the render method to handle archive controls
     */
    render() {
        const currentTodos = this.getCurrentTodos();
        const allTodos = this.model.getAllTodos();
        const stats = this.model.getStats();
        
        // Update archive controls
        this.view.updateArchiveControls(stats);
        
        // Render todos
        this.view.render(currentTodos, allTodos, this.searchTerm, this.dragDropSupported);
    }
}