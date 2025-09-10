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
     * Save todos to storage
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
            return success;
        } catch (error) {
            console.error('Failed to save todos to storage:', error);
            return false;
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
            archived: false,
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
     * Archive a completed todo by ID
     * @param {string} id - Todo ID to archive
     * @returns {Object|null} Archived todo object or null if not found
     */
    archiveTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && todo.completed) {
            todo.archived = true;
            this.saveTodos();
            return todo;
        }
        return null;
    }

    /**
     * Unarchive a todo by ID
     * @param {string} id - Todo ID to unarchive
     * @returns {Object|null} Unarchived todo object or null if not found
     */
    unarchiveTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && todo.archived) {
            todo.archived = false;
            this.saveTodos();
            return todo;
        }
        return null;
    }

    /**
     * Archive all completed todos for better performance
     * @returns {number} Number of todos archived
     */
    archiveCompletedTodos() {
        let archived = 0;
        
        // Iterate through all todos to find completed, non-archived ones
        // This is a bulk operation that processes multiple todos at once
        this.todos.forEach(todo => {
            // Only archive todos that are both completed AND not already archived
            // Prevents double-archiving and ensures we only process relevant todos
            if (todo.completed && !todo.archived) {
                todo.archived = true;
                archived++; // Track how many todos we're archiving for user feedback
            }
        });
        
        // Only save to localStorage if we actually archived something
        // This avoids unnecessary write operations when there's nothing to archive
        if (archived > 0) {
            this.saveTodos();
        }
        
        // Return count for user feedback (e.g., "Archived 3 completed todos")
        return archived;
    }

    /**
     * Get todos filtered by completion and archive status
     * @param {boolean} includeArchived - Whether to include archived todos
     * @returns {Array} Array of filtered todos
     */
    getTodosFiltered(includeArchived = false) {
        if (includeArchived) {
            return [...this.todos];
        }
        return this.todos.filter(todo => !todo.archived);
    }

    /**
     * Filter todos by search term with enhanced matching and archive filtering
     * @param {string} searchTerm - Term to search for in todo text
     * @param {boolean} includeArchived - Whether to include archived todos in results
     * @returns {Array} Array of filtered todos
     */
    filterTodos(searchTerm, includeArchived = false) {
        // First, determine which todos to search based on archive preference
        // This allows users to search within active todos or include archived ones
        let todosToSearch = includeArchived ? this.todos : this.todos.filter(todo => !todo.archived);
        
        // Early return for empty search - show all todos in the current view
        if (!searchTerm || !searchTerm.trim()) {
            return [...todosToSearch];
        }
        
        // Normalize the search term: trim whitespace and collapse multiple spaces
        // This ensures consistent search behavior regardless of input formatting
        const normalizedTerm = searchTerm.toLowerCase().trim().replace(/\s+/g, ' ');
        
        return todosToSearch.filter(todo => {
            const todoText = todo.text.toLowerCase();
            
            // Multi-word search logic: supports searching for multiple terms
            // Example: "buy milk" will match todos containing both "buy" and "milk"
            const searchWords = normalizedTerm.split(' ');
            if (searchWords.length > 1) {
                // All words must be present in the todo text (order doesn't matter)
                // This allows flexible matching: "buy milk" matches "I need to buy some milk"
                return searchWords.every(word => todoText.includes(word));
            }
            
            // Single word search - simple substring match for performance
            // Case-insensitive matching for user convenience
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
    getAllTodos() {
        return this.getTodosFiltered(false); // Show only active todos by default for performance
    }

    /**
     * Get count of todos with archive information
     * @param {boolean} includeArchived - Whether to include archived todos in count
     * @returns {Object} Object with total, completed, pending, and archived counts
     */
    getStats(includeArchived = false) {
        const activeTodos = includeArchived ? this.todos : this.todos.filter(todo => !todo.archived);
        const total = activeTodos.length;
        const completed = activeTodos.filter(t => t.completed).length;
        const pending = total - completed;
        const archived = this.todos.filter(t => t.archived).length;
        
        return { 
            total, 
            completed, 
            pending,
            storage: this.storageManager.getStorageInfo()
        };
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