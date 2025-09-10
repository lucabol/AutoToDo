/**
 * TodoModel - Handles data management and persistence for todos
 */
class TodoModel {
    constructor() {
        this.todos = this.loadTodos();
        this.archivedTodos = this.loadArchivedTodos();
        this.archiveEnabled = true; // Enable archiving for performance optimization
        
        // Enhanced search performance for large lists
        this.searchIndex = PerformanceUtils.createSearchIndex();
        this.initializeSearchIndex();
    }

    /**
     * Initialize search index with existing todos
     */
    initializeSearchIndex() {
        this.searchIndex.addItems(this.todos);
        this.searchIndex.addItems(this.archivedTodos);
    }

    /**
     * Load todos from localStorage
     * @returns {Array} Array of todo objects
     */
    loadTodos() {
        const saved = localStorage.getItem('todos');
        return saved ? JSON.parse(saved) : [];
    }

    /**
     * Save todos to localStorage
     */
    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    /**
     * Load archived todos from localStorage
     * @returns {Array} Array of archived todo objects
     */
    loadArchivedTodos() {
        const saved = localStorage.getItem('archivedTodos');
        return saved ? JSON.parse(saved) : [];
    }

    /**
     * Save archived todos to localStorage
     */
    saveArchivedTodos() {
        localStorage.setItem('archivedTodos', JSON.stringify(this.archivedTodos));
    }

    /**
     * Generate unique ID for new todos using crypto.randomUUID() with fallback
     * @returns {string} Unique identifier
     */
    generateId() {
        // Try to use crypto.randomUUID() for maximum uniqueness (supported in modern browsers)
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            let id;
            do {
                id = crypto.randomUUID();
            } while (this.todos.some(todo => todo.id === id));
            return id;
        }
        
        // Fallback for older browsers: enhanced timestamp + crypto random
        let id;
        do {
            // Use performance.now() for higher precision than Date.now()
            const timestamp = (typeof performance !== 'undefined' && performance.now) 
                ? performance.now().toString(36) 
                : Date.now().toString(36);
            
            // Use crypto.getRandomValues() if available for better randomness
            let randomPart;
            if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
                const array = new Uint8Array(8);
                crypto.getRandomValues(array);
                randomPart = Array.from(array, byte => byte.toString(36)).join('');
            } else {
                // Last resort: enhanced Math.random()
                randomPart = Math.random().toString(36).substring(2) + 
                            Math.random().toString(36).substring(2);
            }
            
            id = timestamp + '-' + randomPart;
        } while (this.todos.some(todo => todo.id === id)); // Ensure uniqueness
        
        return id;
    }

    /**
     * Add a new todo
     * @param {string} text - The todo text
     * @returns {Object} The created todo object
     */
    addTodo(text) {
        if (!text || !text.trim()) {
            throw new Error('Todo text cannot be empty');
        }

        const todo = {
            id: this.generateId(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.searchIndex.addItems([todo]); // Update search index
        this.saveTodos();
        
        // Auto-archive if needed for performance
        this.autoArchiveIfNeeded();
        
        return todo;
    }

    /**
     * Delete a todo by ID
     * @param {string} id - Todo ID to delete
     * @returns {boolean} True if todo was deleted, false if not found
     */
    deleteTodo(id) {
        const initialLength = this.todos.length;
        this.todos = this.todos.filter(todo => todo.id !== id);
        const wasDeleted = this.todos.length < initialLength;
        
        if (wasDeleted) {
            this.searchIndex.removeItem(id); // Update search index
            this.saveTodos();
        }
        
        return wasDeleted;
    }

    /**
     * Toggle todo completion status
     * @param {string} id - Todo ID to toggle
     * @returns {Object|null} Updated todo object or null if not found
     */
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            return todo;
        }
        return null;
    }

    /**
     * Update todo text
     * @param {string} id - Todo ID to update
     * @param {string} newText - New text for the todo
     * @returns {Object|null} Updated todo object or null if not found
     */
    updateTodo(id, newText) {
        if (!newText || !newText.trim()) {
            throw new Error('Todo text cannot be empty');
        }

        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.text = newText.trim();
            this.searchIndex.updateItem(todo); // Update search index
            this.saveTodos();
            return todo;
        }
        return null;
    }

    /**
     * Get todo by ID
     * @param {string} id - Todo ID
     * @returns {Object|null} Todo object or null if not found
     */
    getTodo(id) {
        return this.todos.find(t => t.id === id) || null;
    }

    /**
     * Get all todos
     * @returns {Array} Array of all todos
     */
    getAllTodos() {
        return [...this.todos]; // Return a copy to prevent external mutation
    }

    /**
     * Filter todos by search term with enhanced performance using search index
     * @param {string} searchTerm - Term to search for in todo text
     * @returns {Array} Array of filtered todos
     */
    filterTodos(searchTerm) {
        if (!searchTerm || !searchTerm.trim()) {
            return this.getAllTodos();
        }
        
        // Use search index for better performance with large lists
        return this.searchIndex.search(searchTerm).filter(todo => 
            this.todos.some(t => t.id === todo.id) // Only return active todos, not archived
        );
    }

    /**
     * Get count of todos
     * @returns {Object} Object with total, completed, pending, and archived counts
     */
    getStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;
        const archived = this.archivedTodos.length;
        
        return { total, completed, pending, archived };
    }

    /**
     * Archive completed todos to improve performance with large lists
     * @param {number} maxCompleted - Maximum completed todos to keep (default: 10)
     * @returns {Object} Result with archived count and remaining stats
     */
    archiveCompletedTodos(maxCompleted = 10) {
        if (!this.archiveEnabled) {
            return { archived: 0, stats: this.getStats() };
        }

        const completedTodos = this.todos.filter(t => t.completed);
        const todoToArchive = completedTodos.slice(maxCompleted);
        
        if (todoToArchive.length === 0) {
            return { archived: 0, stats: this.getStats() };
        }

        // Move completed todos to archive
        todoToArchive.forEach(todo => {
            todo.archivedAt = new Date().toISOString();
            this.archivedTodos.unshift(todo);
        });

        // Remove archived todos from active list
        this.todos = this.todos.filter(todo => 
            !todoToArchive.some(archived => archived.id === todo.id)
        );

        this.saveTodos();
        this.saveArchivedTodos();

        return { archived: todoToArchive.length, stats: this.getStats() };
    }

    /**
     * Unarchive a todo from the archive
     * @param {string} id - Todo ID to unarchive
     * @returns {Object|null} Unarchived todo object or null if not found
     */
    unarchiveTodo(id) {
        const todoIndex = this.archivedTodos.findIndex(t => t.id === id);
        if (todoIndex === -1) {
            return null;
        }

        const todo = this.archivedTodos.splice(todoIndex, 1)[0];
        delete todo.archivedAt; // Remove archive timestamp
        
        this.todos.unshift(todo);
        this.saveTodos();
        this.saveArchivedTodos();

        return todo;
    }

    /**
     * Get archived todos with optional filtering
     * @param {string} searchTerm - Optional search term for filtering archived todos
     * @returns {Array} Array of archived todos
     */
    getArchivedTodos(searchTerm = '') {
        if (!searchTerm || !searchTerm.trim()) {
            return [...this.archivedTodos];
        }

        const normalizedTerm = searchTerm.toLowerCase().trim();
        return this.archivedTodos.filter(todo =>
            todo.text.toLowerCase().includes(normalizedTerm)
        );
    }

    /**
     * Permanently delete an archived todo
     * @param {string} id - Archived todo ID to delete
     * @returns {boolean} True if todo was deleted, false if not found
     */
    deleteArchivedTodo(id) {
        const initialLength = this.archivedTodos.length;
        this.archivedTodos = this.archivedTodos.filter(todo => todo.id !== id);
        const wasDeleted = this.archivedTodos.length < initialLength;
        
        if (wasDeleted) {
            this.saveArchivedTodos();
        }
        
        return wasDeleted;
    }

    /**
     * Auto-archive completed todos when list gets large (performance optimization)
     * @returns {Object|null} Archive result or null if no action taken
     */
    autoArchiveIfNeeded() {
        if (!this.archiveEnabled) {
            return null;
        }

        const stats = this.getStats();
        const shouldArchive = stats.total > 100 && stats.completed > 20;
        
        if (shouldArchive) {
            return this.archiveCompletedTodos(10); // Keep only 10 most recent completed todos
        }
        
        return null;
    }
}