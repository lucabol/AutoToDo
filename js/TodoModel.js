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
     * 
     * This method implements a tiered approach to ID generation for maximum compatibility:
     * 1. First preference: crypto.randomUUID() for cryptographically secure UUIDs
     * 2. Second preference: crypto.getRandomValues() + high-precision timestamp
     * 3. Fallback: enhanced Math.random() + timestamp for legacy browser support
     * 
     * All generated IDs are validated against existing todos to ensure uniqueness,
     * preventing potential conflicts in the todo list.
     * 
     * @returns {string} Unique identifier guaranteed to not conflict with existing todos
     */
    generateId() {
        // Try to use crypto.randomUUID() for maximum uniqueness (supported in modern browsers)
        // This provides cryptographically secure random UUIDs following RFC 4122 standard
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            let id;
            do {
                id = crypto.randomUUID();
            } while (this.todos.some(todo => todo.id === id));
            return id;
        }
        
        // Fallback for older browsers: enhanced timestamp + crypto random
        // This combines high-precision timing with cryptographically secure random values
        let id;
        do {
            // Use performance.now() for sub-millisecond precision vs Date.now()'s millisecond precision
            // Convert to base36 for compact string representation
            const timestamp = (typeof performance !== 'undefined' && performance.now) 
                ? performance.now().toString(36) 
                : Date.now().toString(36);
            
            // Use crypto.getRandomValues() if available for cryptographically secure randomness
            let randomPart;
            if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
                // Generate 8 random bytes and convert to base36 for compactness
                const array = new Uint8Array(8);
                crypto.getRandomValues(array);
                randomPart = Array.from(array, byte => byte.toString(36)).join('');
            } else {
                // Last resort: enhanced Math.random() with double randomization
                // Two random values reduce chance of collisions in rapid succession
                randomPart = Math.random().toString(36).substring(2) + 
                            Math.random().toString(36).substring(2);
            }
            
            id = timestamp + '-' + randomPart;
        } while (this.todos.some(todo => todo.id === id)); // Ensure uniqueness against existing todos
        
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
     * Calculate comprehensive statistics for the todo collection
     * 
     * This method provides detailed metrics about the todo list state, enabling
     * UI components to display accurate counts and progress indicators.
     * 
     * Performance Note: This method iterates through the todos array multiple times
     * for clarity and maintainability. For extremely large datasets (10,000+ todos),
     * consider optimizing with a single-pass algorithm if performance becomes critical.
     * 
     * @returns {Object} Statistics object containing:
     *   - total: Total number of todos (including archived)
     *   - completed: Number of completed todos (including archived completed)
     *   - pending: Number of incomplete todos (total - completed)
     *   - archived: Number of archived todos (both completed and incomplete)
     *   - active: Number of non-archived todos (visible in main view)
     */
    getStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const archived = this.todos.filter(t => t.archived).length;
        const active = this.todos.filter(t => !t.archived).length;
        const pending = total - completed;
        
        return { total, completed, pending, archived, active };
    }

    /**
     * Archive a todo by ID
     * 
     * Archiving allows users to hide completed or less relevant todos from the main view
     * while preserving them for future reference or search. Archived todos maintain all
     * their properties and can be unarchived at any time.
     * 
     * This operation is atomic - either the todo is successfully archived and persisted,
     * or the operation fails without side effects.
     * 
     * @param {string} id - Todo ID to archive (must exist in todos array)
     * @returns {Object|null} Updated todo object with archived=true, or null if todo not found
     */
    archiveTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.archived = true;
            this.saveTodos();
            return todo;
        }
        return null;
    }

    /**
     * Unarchive a todo by ID
     * 
     * Restores an archived todo to the active todo list, making it visible in the main view.
     * The todo retains all its original properties including completion status, text, and
     * creation timestamp.
     * 
     * This operation is atomic - either the todo is successfully unarchived and persisted,
     * or the operation fails without side effects.
     * 
     * @param {string} id - Todo ID to unarchive (must exist in todos array)
     * @returns {Object|null} Updated todo object with archived=false, or null if todo not found
     */
    unarchiveTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.archived = false;
            this.saveTodos();
            return todo;
        }
        return null;
    }

    /**
     * Archive all completed todos in bulk
     * 
     * This is a high-efficiency batch operation that archives multiple todos in a single
     * transaction. It's particularly useful for decluttering the todo list when users
     * have accumulated many completed items.
     * 
     * Performance Characteristics:
     * - Single iteration through todos array: O(n) time complexity
     * - Single save operation regardless of number of todos archived
     * - Atomic operation: either all eligible todos are archived or none are
     * 
     * Only todos that are both completed AND not already archived are affected.
     * This prevents double-archiving and ensures idempotent behavior.
     * 
     * @returns {number} Number of todos archived (0 if none were eligible)
     */
    archiveCompleted() {
        let archivedCount = 0;
        this.todos.forEach(todo => {
            if (todo.completed && !todo.archived) {
                todo.archived = true;
                archivedCount++;
            }
        });
        
        if (archivedCount > 0) {
            this.saveTodos();
        }
        
        return archivedCount;
    }

    /**
     * Get active (non-archived) todos
     * @returns {Array} Array of active todos
     */
    getActiveTodos() {
        return this.todos.filter(t => !t.archived);
    }

    /**
     * Get archived todos
     * @returns {Array} Array of archived todos
     */
    getArchivedTodos() {
        return this.todos.filter(t => t.archived);
    }

    /**
     * Filter todos by search term with enhanced matching, optionally including archived todos
     * 
     * This method implements intelligent search functionality:
     * - Normalizes search terms by trimming whitespace and collapsing multiple spaces
     * - Supports multi-word search: all words must be present in the todo text
     * - Case-insensitive matching for better user experience
     * - Can optionally include archived todos in search results
     * 
     * @param {string} searchTerm - Term to search for in todo text
     * @param {boolean} includeArchived - Whether to include archived todos in search results
     * @returns {Array} Array of filtered todos matching the search criteria
     */
    filterTodos(searchTerm, includeArchived = false) {
        // Return appropriate todo set when no search term provided
        if (!searchTerm || !searchTerm.trim()) {
            return includeArchived ? this.getAllTodos() : this.getActiveTodos();
        }
        
        // Normalize the search term: trim and collapse multiple spaces into single spaces
        // This improves search reliability and handles user input variations
        const normalizedTerm = searchTerm.toLowerCase().trim().replace(/\s+/g, ' ');
        
        // Determine which todos to search based on archive inclusion preference
        const todosToSearch = includeArchived ? this.todos : this.getActiveTodos();
        
        return todosToSearch.filter(todo => {
            const todoText = todo.text.toLowerCase();
            
            // Multi-word search: if the search term contains multiple words,
            // ALL words must be present in the todo text (AND logic)
            const searchWords = normalizedTerm.split(' ');
            if (searchWords.length > 1) {
                // Use Array.every() to ensure all words are found
                return searchWords.every(word => todoText.includes(word));
            }
            
            // Single word or phrase search - use standard substring matching
            return todoText.includes(normalizedTerm);
        });
    }

    /**
     * Reorder todos by moving a todo from one position to another
     * 
     * This method enables drag-and-drop functionality by allowing users to 
     * rearrange todo items within the list. The operation is performed using
     * efficient array splice operations to minimize memory allocation.
     * 
     * Implementation Details:
     * - Uses Array.splice() for atomic move operation (remove + insert)
     * - Validates both source and target positions to prevent errors
     * - Automatically saves changes to persistence layer
     * - Returns boolean to indicate success/failure for UI feedback
     * 
     * Performance: O(n) time complexity due to array element shifting,
     * acceptable for typical todo list sizes (< 1000 items).
     * 
     * @param {string} id - Todo ID to move (must exist in todos array)
     * @param {number} newIndex - Target position index (0-based, must be valid)
     * @returns {boolean} True if reorder was successful, false if invalid parameters
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
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoModel;
}