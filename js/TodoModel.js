/**
 * TodoModel - Handles data management and persistence for todos
 */
class TodoModel {
    constructor() {
        this.todos = this.loadTodos();
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
     * Generate unique ID for new todos
     * Uses crypto.randomUUID() when available, falls back to robust custom implementation
     * @returns {string} Unique identifier
     */
    generateId() {
        // Use modern crypto.randomUUID() if available (most modern browsers)
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        
        // Fallback: More robust custom implementation
        // Combines timestamp, high-precision timer, and crypto-random values
        const timestamp = Date.now().toString(36);
        const performance = (typeof window !== 'undefined' && window.performance?.now() || Date.now()).toString(36);
        
        // Generate cryptographically random values if crypto.getRandomValues is available
        let randomPart = '';
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const array = new Uint8Array(8);
            crypto.getRandomValues(array);
            randomPart = Array.from(array, byte => byte.toString(36)).join('');
        } else {
            // Final fallback for very old browsers
            randomPart = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
        }
        
        return timestamp + '-' + performance + '-' + randomPart;
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
     * Filter todos by search term
     * @param {string} searchTerm - Term to search for in todo text
     * @returns {Array} Array of filtered todos
     */
    filterTodos(searchTerm) {
        if (!searchTerm || !searchTerm.trim()) {
            return this.getAllTodos();
        }
        
        const term = searchTerm.toLowerCase().trim();
        return this.todos.filter(todo => 
            todo.text.toLowerCase().includes(term)
        );
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