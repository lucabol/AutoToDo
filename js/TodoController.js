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
     * Initialize enhanced theme management with Safari 14.3+ support
     * Sets up theme based on user preference or system settings, with automatic theme switching
     */
    initializeTheme() {
        // Use the same storage manager as the model for consistency
        this.storage = this.model.storage;
        
        // Priority order: 1) saved user preference, 2) system preference, 3) default light theme
        const savedTheme = this.storage.getItem('todo-theme');
        
        // Safari 14.3+ enhanced system theme detection using matchMedia API
        // This provides better compatibility than older detection methods
        const systemPrefersDark = this._getSystemThemePreference();
        
        // Determine initial theme: user preference takes precedence over system
        const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        
        // Set initial theme without saving to avoid overriding system preference behavior
        // The 'false' parameter prevents automatic storage of the initial theme
        this.setTheme(initialTheme, false);
        
        // Set up dynamic system theme change listener for automatic switching
        // Only affects users who haven't manually set a theme preference
        this._setupSystemThemeListener();
    }

    /**
     * Get system theme preference with Safari 14.3+ enhanced support
     * Uses matchMedia API which is more reliable than other detection methods
     * @returns {boolean} Whether system prefers dark theme
     */
    _getSystemThemePreference() {
        try {
            // Safari 14.3+ enhanced media query matching for dark mode preference
            // matchMedia provides real-time system preference detection
            const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            return darkMediaQuery.matches;
        } catch (error) {
            // Fallback for browsers that don't support prefers-color-scheme
            // Log warning but don't block theme initialization
            console.warn('System theme detection not supported in this browser:', error.message);
            return false; // Default to light theme when detection fails
        }
    }

    /**
     * Setup system theme change listener with Safari 14.3+ compatibility
     * Automatically switches theme when system preference changes (for users without manual preference)
     */
    _setupSystemThemeListener() {
        try {
            const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // Safari 14.3+ compatible event listener for system theme changes
            // This handles both automatic switching and respects user preferences
            const handleThemeChange = (mediaQueryEvent) => {
                // Only auto-switch if user hasn't manually set a preference
                // This prevents overriding user's explicit choice with system changes
                if (!this.storage.getItem('todo-theme')) {
                    const newTheme = mediaQueryEvent.matches ? 'dark' : 'light';
                    // Don't save auto-switched themes to maintain system preference behavior
                    this.setTheme(newTheme, false);
                }
            };

            // Use modern addEventListener if available (Safari 14+)
            // Otherwise fall back to legacy addListener for older Safari versions
            if (darkMediaQuery.addEventListener) {
                darkMediaQuery.addEventListener('change', handleThemeChange);
            } else if (darkMediaQuery.addListener) {
                // Legacy fallback for Safari < 14
                darkMediaQuery.addListener(handleThemeChange);
            } else {
                throw new Error('MediaQueryList event handling not supported');
            }
        } catch (error) {
            // Log specific error details for better debugging
            console.warn('Failed to setup system theme change listener:', {
                error: error.message,
                browser: navigator.userAgent,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Set the application theme with Safari 14.3+ enhancements
     * Updates DOM classes, UI elements, and browser color-scheme for optimal integration
     * @param {string} theme - 'light' or 'dark'
     * @param {boolean} save - Whether to save preference to storage (default: true)
     */
    setTheme(theme, save = true) {
        // Validate theme parameter
        const validThemes = ['light', 'dark'];
        if (!validThemes.includes(theme)) {
            console.error('Invalid theme provided to setTheme:', {
                providedTheme: theme,
                validThemes: validThemes,
                timestamp: new Date().toISOString()
            });
            theme = 'light'; // Fallback to light theme
        }

        try {
            const body = document.body;
            const themeToggle = document.getElementById('themeToggle');
            const themeIcon = themeToggle?.querySelector('.theme-icon');
            const themeText = themeToggle?.querySelector('.theme-text');

            // Safari 14.3+ enhanced theme switching with CSS class management
            // Remove existing theme classes first to avoid conflicts
            if (theme === 'dark') {
                body.classList.remove('light-theme');
                body.classList.add('dark-theme');
                // Update toggle button to show opposite theme (what clicking will switch to)
                if (themeIcon) themeIcon.textContent = '☀️'; // Sun icon = switch to light
                if (themeText) themeText.textContent = 'Light';
            } else {
                body.classList.remove('dark-theme');
                body.classList.add('light-theme');
                // Update toggle button to show opposite theme (what clicking will switch to)
                if (themeIcon) themeIcon.textContent = '🌙'; // Moon icon = switch to dark
                if (themeText) themeText.textContent = 'Dark';
            }

            // Safari 14.3+ color-scheme meta tag support for enhanced system integration
            // This improves form controls, scrollbars, and other native UI elements
            this._updateColorSchemeMeta(theme);

            // Save user preference to localStorage for persistence across sessions
            // Only save when explicitly requested (manual theme changes, not system changes)
            if (save && this.storage) {
                try {
                    this.storage.setItem('todo-theme', theme);
                } catch (storageError) {
                    console.warn('Failed to save theme preference to storage:', {
                        error: storageError.message,
                        theme: theme,
                        storageAvailable: !!this.storage,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            // Track current theme for internal state management
            this.currentTheme = theme;
            
            // Dispatch custom event for potential future component integration
            // Allows other parts of the app to react to theme changes
            this._dispatchThemeChangeEvent(theme);
            
        } catch (error) {
            console.error('Critical error in setTheme method:', {
                error: error.message,
                stack: error.stack,
                theme: theme,
                bodyExists: !!document.body,
                timestamp: new Date().toISOString()
            });
            
            // Attempt minimal fallback
            try {
                if (document.body) {
                    document.body.className = document.body.className.replace(/\b(light|dark)-theme\b/g, '');
                    document.body.classList.add(`${theme}-theme`);
                }
            } catch (fallbackError) {
                console.error('Even fallback theme setting failed:', fallbackError.message);
            }
        }
    }

    /**
     * Update color-scheme meta tag for Safari 14.3+ enhanced support
     * This improves native browser UI elements (scrollbars, form controls, etc.)
     * @param {string} theme - Current theme ('light' or 'dark')
     */
    _updateColorSchemeMeta(theme) {
        try {
            let metaColorScheme = document.querySelector('meta[name="color-scheme"]');
            
            // Create meta tag if it doesn't exist
            if (!metaColorScheme) {
                metaColorScheme = document.createElement('meta');
                metaColorScheme.name = 'color-scheme';
                document.head.appendChild(metaColorScheme);
            }
            
            // Set content to current theme first, fallback second
            // This tells Safari which color scheme to prefer for native UI elements
            metaColorScheme.content = theme === 'dark' ? 'dark light' : 'light dark';
        } catch (error) {
            // Provide specific error context for debugging
            console.warn('Failed to update color-scheme meta tag:', {
                error: error.message,
                theme: theme,
                headElementExists: !!document.head,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Dispatch custom theme change event for component integration
     * Enables other parts of the application to react to theme changes
     * @param {string} theme - New theme that was applied
     */
    _dispatchThemeChangeEvent(theme) {
        try {
            const event = new CustomEvent('themechange', {
                detail: { 
                    theme, 
                    timestamp: Date.now(),
                    source: 'TodoController' // Identifies the source of the theme change
                }
            });
            document.dispatchEvent(event);
        } catch (error) {
            // Log detailed error information for debugging
            console.warn('Failed to dispatch theme change event:', {
                error: error.message,
                theme: theme,
                customEventSupported: typeof CustomEvent !== 'undefined',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Toggle between light and dark themes
     * This is the main method called by the theme toggle button and keyboard shortcut (Ctrl+M)
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        // Always save manual theme changes to override system preference behavior
        this.setTheme(newTheme, true);
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
        this.bindKeyboardShortcuts();
    }

    /**
     * Bind theme toggle button event with error handling 
     */
    bindThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                try {
                    this.toggleTheme();
                } catch (error) {
                    console.error('Failed to toggle theme via button click:', {
                        error: error.message,
                        stack: error.stack,
                        elementId: 'themeToggle',
                        timestamp: new Date().toISOString()
                    });
                    // Fallback: try to at least toggle CSS classes manually
                    try {
                        document.body.classList.toggle('dark-theme');
                        document.body.classList.toggle('light-theme');
                    } catch (fallbackError) {
                        console.error('Fallback theme toggle also failed:', fallbackError.message);
                    }
                }
            });
        } else {
            console.warn('Theme toggle button not found in DOM:', {
                expectedId: 'themeToggle',
                availableElements: Array.from(document.querySelectorAll('[id]')).map(el => el.id),
                timestamp: new Date().toISOString()
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
}