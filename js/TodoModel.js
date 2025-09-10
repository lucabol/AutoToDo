/**
 * TodoModel - Handles data management and persistence for todos
 */
class TodoModel {
    constructor(storage = null) {
        // Use provided storage or default to global storageManager
        this.storage = storage || (typeof storageManager !== 'undefined' ? storageManager : window.storageManager);
        if (!this.storage) {
            throw new Error('StorageManager not available. Please ensure StorageManager.js is loaded.');
        }
        this.todos = this.loadTodos();
        
        // Initialize high-performance search optimizer
        this.searchOptimizer = new SearchOptimizer({
            cacheSize: 100,
            indexThreshold: 50,
            debounceDelay: 150,
            fuzzySearch: true,
            debug: false
        });
        
        // Apply Safari-specific optimizations
        if (PerformanceUtils.isSafari()) {
            this.searchOptimizer.applySafariOptimizations();
        }
        
        // Initialize search data
        this.updateSearchData();
    }

    /**
     * Load todos from storage
     * @returns {Array} Array of todo objects
     */
    loadTodos() {
        try {
            // Handle Node.js environment
            if (typeof this.storage === 'undefined' || typeof localStorage === 'undefined') {
                return [];
            }
            
            const saved = this.storage.getItem('todos');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('Failed to load todos from storage:', error.message);
            return [];
        }
    }

    /**
     * Save todos to storage and update search index
     * @returns {boolean} True if successfully saved
     */
    saveTodos() {
        try {
            // Handle Node.js environment
            if (typeof this.storage === 'undefined' || typeof localStorage === 'undefined') {
                return false;
            }
            
            const success = this.storage.setItem('todos', JSON.stringify(this.todos));
            if (!success && this.storage.getStorageType() === 'memory') {
                // Show a warning only once when localStorage first fails
                if (!this._memoryWarningShown) {
                    console.warn('Todos are being stored in memory only and will not persist between sessions.');
                    this._memoryWarningShown = true;
                }
            }
            
            // Update search index after saving
            this.updateSearchData();
            
            return success;
        } catch (error) {
            console.error('Failed to save todos to storage:', error);
            return false;
        }
    }
    
    /**
     * Update search optimizer with current data
     * @private
     */
    updateSearchData() {
        if (this.searchOptimizer) {
            this.searchOptimizer.setData(this.todos);
        }
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
     * Filter todos by search term with high-performance optimized search
     * @param {string} searchTerm - Term to search for in todo text
     * @returns {Array} Array of filtered todos
     */
    filterTodos(searchTerm) {
        if (!searchTerm || !searchTerm.trim()) {
            return this.getAllTodos();
        }
        
        // Use the high-performance search optimizer for large datasets
        if (this.searchOptimizer && this.todos.length >= 50) {
            return this.searchOptimizer.search(searchTerm);
        }
        
        // Fallback to original search for smaller datasets or if optimizer not available
        return this.fallbackFilterTodos(searchTerm);
    }
    
    /**
     * Fallback search implementation (original method)
     * @param {string} searchTerm - Term to search for in todo text
     * @returns {Array} Array of filtered todos
     * @private
     */
    fallbackFilterTodos(searchTerm) {
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
     * Reorder todos by moving a todo from one position to another
     * @param {string} id - Todo ID to move
     * @param {number} newIndex - New position index (0-based)
     * @returns {boolean} True if reorder was successful, false otherwise
     */
    reorderTodo(id, newIndex) {
        const todoIndex = this.todos.findIndex(t => t.id === id);
        if (todoIndex === -1 || newIndex < 0 || newIndex >= this.todos.length) {
            return false;
        }

        // Remove the todo from its current position
        const [todo] = this.todos.splice(todoIndex, 1);
        
        // Insert it at the new position
        this.todos.splice(newIndex, 0, todo);
        
        this.saveTodos();
        return true;
    }

    /**
     * Get count of todos
     * @returns {Object} Object with total, completed, and pending counts
     */
    getStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;
        
        const stats = { 
            total, 
            completed, 
            pending,
            storage: this.storage.getStorageInfo()
        };
        
        // Add search performance stats if available
        if (this.searchOptimizer) {
            stats.search = this.searchOptimizer.getStats();
        }
        
        return stats;
    }

    /**
     * Get storage information
     * @returns {Object} Storage status and type information
     */
    getStorageInfo() {
        return this.storageManager.getStorageInfo();
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoModel;
}