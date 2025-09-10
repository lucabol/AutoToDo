/**
 * TodoController - Handles user interactions and coordinates between Model and View
 */
class TodoController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.searchTerm = '';
        
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
        // Check Safari version for compatibility workarounds
        this.safariVersionInfo = PerformanceUtils.getSafariVersionInfo();
        
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

        // Apply Safari 14.0-14.2 specific workarounds
        if (this.safariVersionInfo?.needsThemeWorkaround) {
            this.applySafariThemeWorkaround(theme);
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
        
        // Show user notification for Safari 14.0-14.2 if theme doesn't update smoothly
        if (this.safariVersionInfo?.needsThemeWorkaround) {
            this.showSafariThemeNotification();
        }
    }

    /**
     * Apply Safari 14.0-14.2 specific workarounds for theme switching
     * @param {string} theme - The theme being applied
     */
    applySafariThemeWorkaround(theme) {
        // Force CSS recalculation by triggering a reflow
        const body = document.body;
        
        // Method 1: Force style recalculation by temporarily hiding and showing
        body.style.visibility = 'hidden';
        body.offsetHeight; // Trigger reflow
        body.style.visibility = 'visible';
        
        // Method 2: Force repaint by manipulating transform
        const container = document.querySelector('.container');
        if (container) {
            const originalTransform = container.style.transform;
            container.style.transform = 'translateZ(0.01px)';
            requestAnimationFrame(() => {
                container.style.transform = originalTransform;
            });
        }
        
        // Method 3: Ensure CSS custom properties are properly updated
        this.forceCSSCustomPropertyUpdate();
    }

    /**
     * Force update of CSS custom properties for Safari 14.0-14.2
     */
    forceCSSCustomPropertyUpdate() {
        const root = document.documentElement;
        const currentThemeClass = document.body.classList.contains('dark-theme') ? 'dark-theme' : '';
        
        // Temporarily remove and re-add the theme class to force CSS variable updates
        if (currentThemeClass) {
            document.body.classList.remove('dark-theme');
            requestAnimationFrame(() => {
                document.body.classList.add('dark-theme');
            });
        }
    }

    /**
     * Show notification to Safari users about theme refresh
     */
    showSafariThemeNotification() {
        // Only show notification once per session
        if (this.safariNotificationShown) return;
        
        const notification = this.createSafariNotification();
        document.body.appendChild(notification);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        this.safariNotificationShown = true;
    }

    /**
     * Create Safari notification element
     * @returns {Element} Notification element
     */
    createSafariNotification() {
        const notification = document.createElement('div');
        notification.className = 'safari-theme-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">ℹ️</span>
                <span class="notification-text">
                    Safari ${this.safariVersionInfo.versionString}: If theme colors don't update properly, 
                    please refresh the page (⌘+R or Ctrl+R).
                </span>
                <button class="notification-close" onclick="this.parentNode.parentNode.remove()">×</button>
            </div>
        `;
        
        return notification;
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
}