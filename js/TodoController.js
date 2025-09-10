/**
 * TodoController - Handles user interactions and coordinates between Model and View
 */
class TodoController {
    constructor(model, view, storageManager = window.storageManager) {
        this.model = model;
        this.view = view;
        this.storage = storageManager;
        this.searchTerm = '';
        
        // Drag and drop functionality
        this.draggedId = null;
        this.dragDropSupported = this.checkDragDropSupport();
        
        // Performance optimizations for search functionality
        // Search monitoring: Tracks search performance for large todo lists
        this.searchMonitor = PerformanceUtils.createMonitor('Search Performance');
        // Debounced search: Prevents excessive search operations during fast typing (300ms delay)
        this.debouncedSearch = PerformanceUtils.debounce(this.performSearch.bind(this), 300);
        
        // Safari notification system state management
        this.safariNotificationShown = false;
        
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
        try {
            // Check Safari version for compatibility workarounds
            this.safariVersionInfo = PerformanceUtils.getSafariVersionInfo();
            
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
        } catch (e) {
            console.warn('Failed to initialize theme, using default light theme:', e);
            this.setTheme('light', false);
        }
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

        // Apply Safari 14.0-14.2 specific workarounds
        if (this.safariVersionInfo?.needsThemeWorkaround) {
            this.applySafariThemeWorkaround(theme);
        }

        if (save) {
            try {
                this.storage.setItem('todo-theme', theme);
            } catch (e) {
                console.warn('Failed to save theme preference:', e);
            }
        }

        this.currentTheme = theme;
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        
        // Show user notification for Safari 14.0-14.2 if theme doesn't update smoothly
        if (this.safariVersionInfo?.needsThemeWorkaround) {
            this.showSafariThemeNotification();
        }
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
        this.bindDragAndDrop();
        this.bindThemeToggle();
        this.bindArchiveEvents();
        this.bindKeyboardShortcuts();
    }

    /**
     * Bind archive-related events
     */
    bindArchiveEvents() {
        // Archive completed todos button
        const archiveBtn = document.getElementById('archiveBtn');
        if (archiveBtn) {
            archiveBtn.addEventListener('click', () => {
                this.handleArchiveCompleted();
            });
        }
        
        // Toggle archive view button
        const toggleArchiveBtn = document.getElementById('toggleArchiveBtn');
        if (toggleArchiveBtn) {
            toggleArchiveBtn.addEventListener('click', () => {
                this.handleToggleArchive();
            });
        }
        
        // Archive modal events (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('unarchive-btn')) {
                this.handleUnarchiveTodo(e.target.dataset.id);
            } else if (e.target.classList.contains('delete-archived-btn')) {
                this.handleDeleteArchivedTodo(e.target.dataset.id);
            }
        });
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
     * Handle search input changes with debouncing for performance
     * @param {string} searchTerm - The search term
     */
    handleSearch(searchTerm) {
        // Update search term immediately for UI responsiveness
        this.searchTerm = searchTerm;
        
        // Debounce the actual search to avoid excessive filtering
        this.debouncedSearch(searchTerm);
    }
    
    /**
     * Perform the actual search operation (debounced)
     * @param {string} searchTerm - The search term
     * @private
     */
    performSearch(searchTerm) {
        this.searchMonitor.start();
        
        try {
            // Only render if the search term hasn't changed
            if (this.searchTerm === searchTerm) {
                this.render();
            }
        } finally {
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
        
        // Update archive stats in the UI
        const stats = this.model.getStats();
        this.view.updateArchiveStats(stats);
    }

    /**
     * Handle archiving completed todos
     */
    handleArchiveCompleted() {
        const stats = this.model.getStats();
        if (stats.completed === 0) {
            this.view.showMessage('No completed todos to archive', 'info');
            return;
        }
        
        const confirmMessage = `Archive ${stats.completed} completed todo${stats.completed !== 1 ? 's' : ''}? This will improve performance by keeping your active list smaller.`;
        if (this.view.showConfirmation(confirmMessage)) {
            const result = this.model.archiveCompletedTodos();
            if (result.archived > 0) {
                this.view.showArchiveSuccess(result.archived);
                
                // Show performance improvement if significant
                const percentImprovement = Math.round((result.archived / (stats.total)) * 100);
                if (percentImprovement >= 10) {
                    this.view.showPerformanceImprovement({
                        archived: result.archived,
                        percentImprovement
                    });
                }
                
                this.render();
            }
        }
    }

    /**
     * Handle toggling archive view
     */
    handleToggleArchive() {
        const archivedTodos = this.model.getArchivedTodos(this.searchTerm);
        this.view.showArchivedTodos(archivedTodos);
    }

    /**
     * Handle unarchiving a todo
     * @param {string} id - Todo ID to unarchive
     */
    handleUnarchiveTodo(id) {
        const todo = this.model.unarchiveTodo(id);
        if (todo) {
            this.view.showMessage(`"${todo.text}" restored to active todos`, 'success');
            this.render();
            
            // Update the archive modal if still open
            const archivedTodos = this.model.getArchivedTodos(this.searchTerm);
            this.view.showArchivedTodos(archivedTodos);
        }
    }

    /**
     * Handle permanently deleting an archived todo
     * @param {string} id - Archived todo ID to delete
     */
    handleDeleteArchivedTodo(id) {
        // Find the archived todo for confirmation
        const archivedTodos = this.model.getArchivedTodos();
        const todo = archivedTodos.find(t => t.id === id);
        
        if (!todo) {
            this.view.showMessage('Archived todo not found', 'error');
            return;
        }
        
        const confirmMessage = `Permanently delete "${todo.text}"? This cannot be undone.`;
        if (this.view.showConfirmation(confirmMessage)) {
            const wasDeleted = this.model.deleteArchivedTodo(id);
            if (wasDeleted) {
                this.view.showMessage('Archived todo permanently deleted', 'success');
                
                // Update the archive modal
                const updatedArchivedTodos = this.model.getArchivedTodos(this.searchTerm);
                this.view.showArchivedTodos(updatedArchivedTodos);
                
                // Update stats
                this.render();
            }
        }
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
     * Get current todos based on search filter
     * @returns {Array} Current filtered todos
     */
    getCurrentTodos() {
        return this.searchTerm ? this.model.filterTodos(this.searchTerm) : this.model.getAllTodos();
    }

    /**
     * Apply Safari 14.0-14.2 specific workarounds for theme switching
     * 
     * Safari versions 14.0-14.2 have known issues with CSS custom property refresh
     * when theme classes are toggled dynamically. This method implements a multi-strategy
     * approach to force proper style recalculation and ensure theme colors update correctly.
     * 
     * The workaround combines three complementary techniques:
     * 1. Forced reflow to trigger style recalculation
     * 2. Hardware acceleration via transform manipulation 
     * 3. CSS class cycling to refresh custom properties
     * 
     * @param {string} theme - The theme being applied ('light' or 'dark')
     */
    applySafariThemeWorkaround(theme) {
        const body = document.body;
        
        // Method 1: Force style recalculation by temporarily hiding and showing
        // This triggers a complete reflow which forces Safari to recalculate all styles
        // including CSS custom properties that may have gotten "stuck" during theme changes
        body.style.visibility = 'hidden';
        body.offsetHeight; // Trigger synchronous reflow - this line is intentionally blocking
        body.style.visibility = 'visible';
        
        // Method 2: Force repaint by manipulating transform property
        // Safari's graphics engine sometimes caches paint layers incorrectly during theme changes
        // A minimal transform change forces layer invalidation and repaint
        const container = document.querySelector('.container');
        if (container) {
            const originalTransform = container.style.transform;
            // Use a minimal transform that doesn't visually impact layout
            container.style.transform = 'translateZ(0.01px)';
            // Restore original transform on next frame to minimize visual impact
            requestAnimationFrame(() => {
                container.style.transform = originalTransform;
            });
        }
        
        // Method 3: Ensure CSS custom properties are properly refreshed
        // This addresses the core issue where Safari fails to propagate new custom property values
        this.forceCSSCustomPropertyUpdate();
    }

    /**
     * Force update of CSS custom properties for Safari 14.0-14.2
     * 
     * Safari 14.0-14.2 has a specific bug where CSS custom properties (CSS variables)
     * defined in theme classes don't propagate properly when the class is toggled.
     * This can result in elements retaining old theme colors even after the theme
     * class has been successfully added/removed from the DOM.
     * 
     * This method implements a "class cycling" technique that temporarily removes
     * and re-adds the theme class, forcing Safari to re-evaluate and apply the
     * CSS custom properties correctly.
     * 
     * The technique works by:
     * 1. Removing the theme class (forces Safari to clear cached property values)
     * 2. Using requestAnimationFrame to ensure DOM changes are processed
     * 3. Re-adding the theme class (forces Safari to re-read and apply new values)
     */
    forceCSSCustomPropertyUpdate() {
        const root = document.documentElement;
        const currentThemeClass = document.body.classList.contains('dark-theme') ? 'dark-theme' : '';
        
        // Only cycle the class if we're in dark theme
        // Light theme doesn't need cycling since it uses the default :root values
        if (currentThemeClass) {
            // Temporarily remove the theme class to clear cached CSS custom property values
            document.body.classList.remove('dark-theme');
            
            // Use requestAnimationFrame to ensure the DOM change is processed
            // before re-adding the class. This timing is critical for Safari to
            // properly invalidate its CSS custom property cache.
            requestAnimationFrame(() => {
                document.body.classList.add('dark-theme');
            });
        }
    }

    /**
     * Show notification to Safari users about theme refresh
     * 
     * This notification system provides contextual guidance to users on Safari 14.0-14.2
     * when theme switching might not work perfectly due to browser bugs. The system
     * implements several smart behaviors:
     * 
     * 1. **Session-based limiting**: Shows notification only once per browser session
     *    to avoid overwhelming users with repeated messages
     * 
     * 2. **Auto-hide mechanism**: Automatically removes notification after 5 seconds
     *    to maintain clean UI, but allows manual dismissal for user control
     * 
     * 3. **Contextual messaging**: Provides specific Safari version information
     *    and clear instructions with keyboard shortcuts for page refresh
     * 
     * 4. **Progressive enhancement**: Only shown to affected Safari versions,
     *    ensuring other browsers have no disruption to their experience
     * 
     * The notification appears as a subtle overlay that doesn't interfere with
     * the main application functionality while providing helpful guidance.
     */
    showSafariThemeNotification() {
        // Implement session-based notification limiting to prevent notification fatigue
        // This ensures users only see the notification once per browser session,
        // maintaining a good user experience even with repeated theme toggles
        if (this.safariNotificationShown) return;
        
        // Create and inject the notification into the DOM
        const notification = this.createSafariNotification();
        document.body.appendChild(notification);
        
        // Implement auto-hide mechanism with 5-second timeout
        // This balances giving users enough time to read the message while
        // maintaining a clean interface that doesn't feel cluttered
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        // Mark notification as shown for this session to prevent duplicates
        this.safariNotificationShown = true;
    }

    /**
     * Create Safari notification element
     * 
     * Constructs a user-friendly notification specifically designed for Safari 14.0-14.2 users
     * experiencing theme switching issues. The notification includes:
     * 
     * - **Visual icon**: Information icon (ℹ️) for immediate recognition
     * - **Version-specific messaging**: Shows the detected Safari version for context
     * - **Clear instructions**: Provides keyboard shortcuts (⌘+R or Ctrl+R) for page refresh
     * - **Manual dismissal**: Close button (×) for user control over notification visibility
     * - **Accessible markup**: Proper semantic HTML structure for screen readers
     * 
     * The notification is styled to be non-intrusive while remaining visible enough
     * to provide helpful guidance when theme colors don't update properly.
     * 
     * @returns {Element} A complete notification DOM element ready for insertion
     */
    createSafariNotification() {
        const notification = document.createElement('div');
        notification.className = 'safari-theme-notification';
        
        // Build comprehensive notification content with contextual information
        // Include Safari version for user awareness and specific refresh instructions
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">ℹ️</span>
                <span class="notification-text">
                    Safari ${this.safariVersionInfo.version}: If theme colors don't update properly, 
                    please refresh the page (⌘+R or Ctrl+R).
                </span>
                <button class="notification-close" onclick="this.parentNode.parentNode.remove()">×</button>
            </div>
        `;
        
        return notification;
    }
}