/**
 * TodoModel - Handles data management and persistence for todos
 * Enhanced with performance optimizations for large todo lists
 */
class TodoModel {
    constructor(storageManager = window.storageManager) {
        this.storage = storageManager;
        this.todos = this.loadTodos();
        
        // Performance optimization components
        this.archiveManager = new ArchiveManager(storageManager);
        this.searchIndex = new SearchIndexManager();
        this.memoryManager = new MemoryManager({
            pageSize: 100,
            maxMemoryPages: 5,
            cacheThreshold: 200 // Start optimizations at 200+ todos
        });
        
        // Initialize performance systems
        this.initializePerformanceOptimizations();
    }

    /**
     * Initialize performance optimization systems
     */
    initializePerformanceOptimizations() {
        // Build search index
        this.rebuildSearchIndex();
        
        // Initialize memory management
        this.memoryManager.initialize(this.todos);
        
        // Auto-archive old completed todos if needed
        this.performAutoArchiving();
        
        console.log(`TodoModel initialized with ${this.todos.length} todos`);
        console.log('Performance optimizations enabled:', {
            searchIndex: this.searchIndex.getIndexStats(),
            memoryManagement: this.memoryManager.getMemoryStats(),
            archiveStats: this.archiveManager.getArchiveStats()
        });
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
     * Save todos to storage with fallback support and performance optimizations
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
            
            // Update search index and memory management after save
            this.updatePerformanceIndexes();
            
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
     * Add a new todo with performance optimizations
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
        
        // Update search index with new todo
        this.searchIndex.addToIndex(todo);
        
        return todo;
    }

    /**
     * Delete a todo by ID with performance optimizations
     * @param {string} id - Todo ID to delete
     * @returns {boolean} True if todo was deleted, false if not found
     */
    deleteTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) {
            return false;
        }
        
        const initialLength = this.todos.length;
        this.todos = this.todos.filter(todo => todo.id !== id);
        const wasDeleted = this.todos.length < initialLength;
        
        if (wasDeleted) {
            this.saveTodos();
            // Remove from search index
            this.searchIndex.removeFromIndex(id);
        }
        
        return wasDeleted;
    }

    /**
     * Toggle todo completion status with performance optimizations
     * @param {string} id - Todo ID to toggle
     * @returns {Object|null} Updated todo object or null if not found
     */
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            const oldTodo = { ...todo };
            todo.completed = !todo.completed;
            
            // Add completion timestamp
            if (todo.completed) {
                todo.completedAt = new Date().toISOString();
            } else {
                delete todo.completedAt;
            }
            
            this.saveTodos();
            
            // Update search index
            this.searchIndex.updateIndex(todo, oldTodo);
            
            // Check if we should auto-archive after completing todos
            if (todo.completed) {
                this.scheduleAutoArchiving();
            }
            
            return todo;
        }
        return null;
    }

    /**
     * Update todo text with performance optimizations
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
            const oldTodo = { ...todo };
            todo.text = newText.trim();
            this.saveTodos();
            
            // Update search index
            this.searchIndex.updateIndex(todo, oldTodo);
            
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
        
        // Use high-performance search index for large lists
        if (this.todos.length > 200) {
            return this.searchIndex.search(searchTerm);
        }
        
        // Fallback to traditional search for smaller lists
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
     * Get paginated todos with search filtering
     * @param {string} searchTerm - Search filter
     * @param {number} page - Page number (0-based)
     * @returns {Object} Paginated results
     */
    getPaginatedTodos(searchTerm = '', page = 0) {
        const allTodos = searchTerm ? this.filterTodos(searchTerm) : this.getAllTodos();
        return this.memoryManager.getPaginatedView(allTodos, searchTerm, page);
    }

    /**
     * Perform auto-archiving of old completed todos
     */
    performAutoArchiving() {
        if (this.todos.length < 200) {
            return; // Don't archive small lists
        }

        const result = this.archiveManager.archiveCompletedTodos(this.todos);
        if (result.archivedCount > 0) {
            this.todos = result.todos;
            this.saveTodos();
            console.log(`Auto-archived ${result.archivedCount} completed todos`);
        }
    }

    /**
     * Schedule auto-archiving (debounced to avoid excessive calls)
     */
    scheduleAutoArchiving() {
        if (!this._scheduleArchivingDebounced) {
            this._scheduleArchivingDebounced = PerformanceUtils.debounce(
                this.performAutoArchiving.bind(this), 
                5000 // 5 seconds
            );
        }
        this._scheduleArchivingDebounced();
    }

    /**
     * Rebuild search index
     */
    rebuildSearchIndex() {
        this.searchIndex.buildIndex(this.todos);
    }

    /**
     * Update performance indexes after changes
     */
    updatePerformanceIndexes() {
        // Rebuild search index if needed
        if (this.searchIndex.shouldRebuildIndex(this.todos)) {
            this.rebuildSearchIndex();
        }
        
        // Update memory management
        this.memoryManager.initialize(this.todos);
        
        // Optimize memory usage
        this.memoryManager.optimize();
    }

    /**
     * Search in both active and archived todos
     * @param {string} searchTerm - Search term
     * @returns {Object} Search results from both active and archived todos
     */
    searchAllTodos(searchTerm) {
        const activeTodos = this.filterTodos(searchTerm);
        const archivedTodos = this.archiveManager.searchArchive(searchTerm);
        
        return {
            active: activeTodos,
            archived: archivedTodos,
            totalResults: activeTodos.length + archivedTodos.length
        };
    }

    /**
     * Get comprehensive performance statistics
     * @returns {Object} Performance statistics
     */
    getPerformanceStats() {
        return {
            todos: this.getStats(),
            search: this.searchIndex.getIndexStats(),
            memory: this.memoryManager.getMemoryStats(),
            archive: this.archiveManager.getArchiveStats(),
            recommendations: this.getPerformanceRecommendations()
        };
    }

    /**
     * Get performance recommendations based on current state
     * @returns {Array} Array of performance recommendations
     */
    getPerformanceRecommendations() {
        const recommendations = [];
        const stats = this.getStats();
        const memStats = this.memoryManager.getMemoryStats();
        
        if (stats.total > 500) {
            recommendations.push({
                type: 'archive',
                message: 'Consider archiving old completed todos to improve performance',
                action: 'performAutoArchiving'
            });
        }
        
        if (stats.completed > 100) {
            recommendations.push({
                type: 'cleanup',
                message: 'You have many completed todos. Archive them to improve responsiveness',
                action: 'performAutoArchiving'
            });
        }
        
        if (memStats.memoryUsage > 1000000) { // 1MB
            recommendations.push({
                type: 'memory',
                message: 'High memory usage detected. Consider enabling pagination',
                action: 'optimize'
            });
        }
        
        return recommendations;
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