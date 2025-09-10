/**
 * TodoModel - Handles data management and persistence for todos
 */
class TodoModel {
    constructor(storageManager = window.storageManager) {
        this.storage = storageManager;
        this.todos = this.loadTodos();
        this.archivedTodos = this.loadArchivedTodos();
        
        // Performance optimizations for large lists
        this.maxActiveTodos = 500; // Threshold for auto-archiving
        this.searchCache = new Map(); // Cache search results
        this.searchCacheTimeout = 5000; // Cache timeout in ms
    }

    /**
     * Load todos from storage with fallback support
     * @returns {Array} Array of todo objects
     */
    loadTodos() {
        try {
            const saved = this.storage.getItem('todos');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Failed to load todos from storage:', e);
            return [];
        }
    }

    /**
     * Load archived todos from storage
     * @returns {Array} Array of archived todo objects
     */
    loadArchivedTodos() {
        try {
            const saved = this.storage.getItem('archived-todos');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Failed to load archived todos from storage:', e);
            return [];
        }
    }

    /**
     * Save todos to storage with fallback support
     */
    saveTodos() {
        try {
            const success = this.storage.setItem('todos', JSON.stringify(this.todos));
            if (!success && this.storage.getStorageType() === 'memory') {
                // Show a warning only once when localStorage first fails
                if (!this._memoryWarningShown) {
                    console.warn('Todos are being stored in memory only and will not persist between sessions.');
                    this._memoryWarningShown = true;
                }
            }
            return success;
        } catch (error) {
            console.error('Failed to save todos to storage:', error);
            return false;
        }
    }

    /**
     * Archive a todo by moving it from active todos to archived todos
     * @param {string} id - Todo ID to archive
     * @returns {boolean} True if todo was archived, false if not found
     */
    archiveTodo(id) {
        const todoIndex = this.todos.findIndex(t => t.id === id);
        if (todoIndex === -1) return false;
        
        const todo = this.todos[todoIndex];
        todo.archivedAt = new Date().toISOString();
        
        // Move to archived todos
        this.archivedTodos.unshift(todo);
        this.todos.splice(todoIndex, 1);
        
        this.saveTodos();
        this.saveArchivedTodos();
        this.clearSearchCache();
        
        return true;
    }

    /**
     * Restore a todo from archive back to active todos
     * @param {string} id - Todo ID to restore
     * @returns {boolean} True if todo was restored, false if not found
     */
    restoreTodo(id) {
        const todoIndex = this.archivedTodos.findIndex(t => t.id === id);
        if (todoIndex === -1) return false;
        
        const todo = this.archivedTodos[todoIndex];
        delete todo.archivedAt;
        
        // Move back to active todos
        this.todos.unshift(todo);
        this.archivedTodos.splice(todoIndex, 1);
        
        this.saveTodos();
        this.saveArchivedTodos();
        this.clearSearchCache();
        
        return true;
    }

    /**
     * Auto-archive completed todos when active list becomes too large
     * This improves performance for large todo lists
     * @returns {number} Number of todos archived
     */
    autoArchiveCompleted() {
        if (this.todos.length <= this.maxActiveTodos) return 0;
        
        const completedTodos = this.todos.filter(t => t.completed);
        const archivedCount = completedTodos.length;
        
        if (archivedCount === 0) return 0;
        
        // Move completed todos to archive
        completedTodos.forEach(todo => {
            todo.archivedAt = new Date().toISOString();
            this.archivedTodos.unshift(todo);
        });
        
        // Remove completed todos from active list
        this.todos = this.todos.filter(t => !t.completed);
        
        this.saveTodos();
        this.saveArchivedTodos();
        this.clearSearchCache();
        
        console.log(`Auto-archived ${archivedCount} completed todos for performance`);
        return archivedCount;
    }

    /**
     * Get all archived todos
     * @returns {Array} Array of archived todos
     */
    getArchivedTodos() {
        return [...this.archivedTodos];
    }

    /**
     * Clear search cache (called when todos are modified)
     */
    clearSearchCache() {
        this.searchCache.clear();
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
        this.saveTodos();
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
     * Filter todos by search term with enhanced matching
     * @param {string} searchTerm - Term to search for in todo text
     * @returns {Array} Array of filtered todos
     */
    filterTodos(searchTerm) {
        if (!searchTerm || !searchTerm.trim()) {
            return this.getAllTodos();
        }
        
        // Normalize the search term: trim and collapse multiple spaces
        const normalizedTerm = searchTerm.toLowerCase().trim().replace(/\s+/g, ' ');
        
        return this.todos.filter(todo => {
            const todoText = todo.text.toLowerCase();
            
            // If the search term contains multiple words, check if all words are present
            const searchWords = normalizedTerm.split(' ');
            if (searchWords.length > 1) {
                // All words must be present in the todo text
                return searchWords.every(word => todoText.includes(word));
            }
            
            // Single word or phrase search - use original substring matching
            return todoText.includes(normalizedTerm);
        });
    }

    /**
     * Get count of todos
     * @returns {Object} Object with total, completed, and pending counts
     */
    getStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;
        
        return { total, completed, pending };
    }
}