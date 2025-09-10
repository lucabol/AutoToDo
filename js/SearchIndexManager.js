/**
 * SearchIndexManager - High-performance search indexing for large todo lists
 * Provides fast full-text search capabilities with word-based indexing
 */
class SearchIndexManager {
    constructor() {
        this.wordIndex = new Map(); // word -> Set of todo IDs
        this.todoCache = new Map(); // todo ID -> todo object
        this.lastIndexUpdate = 0;
        this.indexInvalidated = false;
        
        // Performance monitoring
        this.searchStats = {
            totalSearches: 0,
            averageSearchTime: 0,
            cacheHits: 0,
            indexRebuilds: 0
        };
    }

    /**
     * Build or rebuild the search index
     * @param {Array} todos - Array of todo objects
     */
    buildIndex(todos) {
        const startTime = performance.now();
        
        this.clearIndex();
        
        todos.forEach(todo => {
            this.addToIndex(todo);
        });
        
        this.lastIndexUpdate = Date.now();
        this.indexInvalidated = false;
        this.searchStats.indexRebuilds++;
        
        const buildTime = performance.now() - startTime;
        console.log(`Search index built for ${todos.length} todos in ${buildTime.toFixed(2)}ms`);
    }

    /**
     * Add a single todo to the search index
     * @param {Object} todo - Todo object to index
     */
    addToIndex(todo) {
        if (!todo || !todo.id || !todo.text) {
            return;
        }

        // Cache the todo object
        this.todoCache.set(todo.id, todo);

        // Extract and index words
        const words = this.extractWords(todo.text);
        words.forEach(word => {
            if (!this.wordIndex.has(word)) {
                this.wordIndex.set(word, new Set());
            }
            this.wordIndex.get(word).add(todo.id);
        });
    }

    /**
     * Remove a todo from the search index
     * @param {string} todoId - ID of todo to remove
     */
    removeFromIndex(todoId) {
        const todo = this.todoCache.get(todoId);
        if (!todo) {
            return;
        }

        // Remove from word index
        const words = this.extractWords(todo.text);
        words.forEach(word => {
            const todoSet = this.wordIndex.get(word);
            if (todoSet) {
                todoSet.delete(todoId);
                if (todoSet.size === 0) {
                    this.wordIndex.delete(word);
                }
            }
        });

        // Remove from cache
        this.todoCache.delete(todoId);
    }

    /**
     * Update a todo in the search index
     * @param {Object} updatedTodo - Updated todo object
     * @param {Object} oldTodo - Previous version of the todo (optional)
     */
    updateIndex(updatedTodo, oldTodo = null) {
        if (oldTodo && oldTodo.id === updatedTodo.id) {
            // If we have the old version, remove it first
            this.removeFromIndex(oldTodo.id);
        }
        this.addToIndex(updatedTodo);
    }

    /**
     * Extract searchable words from text
     * @param {string} text - Text to extract words from
     * @returns {Array} Array of normalized words
     */
    extractWords(text) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        // Convert to lowercase, remove punctuation, split into words
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1) // Filter out single characters
            .filter(word => !this.isStopWord(word)); // Filter out stop words
    }

    /**
     * Check if a word is a stop word (common words like 'the', 'and', etc.)
     * @param {string} word - Word to check
     * @returns {boolean} True if it's a stop word
     */
    isStopWord(word) {
        const stopWords = new Set([
            'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
            'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
            'can', 'may', 'might', 'must', 'shall', 'ought', 'need', 'dare', 'used'
        ]);
        return stopWords.has(word);
    }

    /**
     * Perform high-performance search
     * @param {string} searchTerm - Search term
     * @param {Object} options - Search options
     * @returns {Array} Array of matching todo objects
     */
    search(searchTerm, options = {}) {
        const startTime = performance.now();
        this.searchStats.totalSearches++;

        if (!searchTerm || !searchTerm.trim()) {
            return [];
        }

        const normalizedTerm = searchTerm.toLowerCase().trim();
        const searchWords = this.extractWords(normalizedTerm);
        
        if (searchWords.length === 0) {
            return [];
        }

        let matchingTodoIds;

        if (searchWords.length === 1) {
            // Single word search - direct index lookup
            const word = searchWords[0];
            matchingTodoIds = this.findTodosWithWord(word);
        } else {
            // Multi-word search - find intersection
            matchingTodoIds = this.findTodosWithAllWords(searchWords);
        }

        // Convert IDs to todo objects
        const results = Array.from(matchingTodoIds)
            .map(id => this.todoCache.get(id))
            .filter(todo => todo) // Filter out any undefined todos
            .filter(todo => {
                // Secondary filter for exact phrase matching if needed
                if (options.exactPhrase) {
                    return todo.text.toLowerCase().includes(normalizedTerm);
                }
                return true;
            });

        // Apply additional filters
        if (options.completedOnly !== undefined) {
            results = results.filter(todo => todo.completed === options.completedOnly);
        }

        // Sort results by relevance (more word matches = higher relevance)
        if (searchWords.length > 1) {
            results.sort((a, b) => {
                const aWords = this.extractWords(a.text);
                const bWords = this.extractWords(b.text);
                const aMatches = aWords.filter(word => searchWords.includes(word)).length;
                const bMatches = bWords.filter(word => searchWords.includes(word)).length;
                return bMatches - aMatches;
            });
        }

        // Update search statistics
        const searchTime = performance.now() - startTime;
        this.updateSearchStats(searchTime);

        return results;
    }

    /**
     * Find todos containing a specific word
     * @param {string} word - Word to search for
     * @returns {Set} Set of todo IDs
     */
    findTodosWithWord(word) {
        // Direct lookup for exact match
        const exactMatch = this.wordIndex.get(word);
        if (exactMatch) {
            this.searchStats.cacheHits++;
            return new Set(exactMatch);
        }

        // Fuzzy matching for partial words (prefix matching)
        const results = new Set();
        for (const [indexedWord, todoIds] of this.wordIndex) {
            if (indexedWord.startsWith(word) || indexedWord.includes(word)) {
                todoIds.forEach(id => results.add(id));
            }
        }

        return results;
    }

    /**
     * Find todos containing all specified words
     * @param {Array} words - Array of words that must all be present
     * @returns {Set} Set of todo IDs
     */
    findTodosWithAllWords(words) {
        if (words.length === 0) {
            return new Set();
        }

        // Start with todos containing the first word
        let results = this.findTodosWithWord(words[0]);

        // Intersect with todos containing each subsequent word
        for (let i = 1; i < words.length; i++) {
            const wordResults = this.findTodosWithWord(words[i]);
            results = new Set([...results].filter(id => wordResults.has(id)));
            
            // Early exit if no matches
            if (results.size === 0) {
                break;
            }
        }

        return results;
    }

    /**
     * Update search performance statistics
     * @param {number} searchTime - Time taken for the search in milliseconds
     */
    updateSearchStats(searchTime) {
        const { totalSearches, averageSearchTime } = this.searchStats;
        this.searchStats.averageSearchTime = 
            (averageSearchTime * (totalSearches - 1) + searchTime) / totalSearches;
    }

    /**
     * Clear the entire search index
     */
    clearIndex() {
        this.wordIndex.clear();
        this.todoCache.clear();
        this.indexInvalidated = true;
    }

    /**
     * Get search index statistics
     * @returns {Object} Index statistics
     */
    getIndexStats() {
        return {
            totalTodos: this.todoCache.size,
            totalWords: this.wordIndex.size,
            indexSize: this.calculateIndexSize(),
            lastUpdate: this.lastIndexUpdate,
            searchStats: { ...this.searchStats }
        };
    }

    /**
     * Calculate approximate memory usage of the index
     * @returns {number} Approximate size in bytes
     */
    calculateIndexSize() {
        let size = 0;
        
        // Estimate word index size
        for (const [word, todoIds] of this.wordIndex) {
            size += word.length * 2; // Approximate string size in bytes
            size += todoIds.size * 36; // Approximate UUID size
        }
        
        // Estimate todo cache size
        for (const [id, todo] of this.todoCache) {
            size += id.length * 2;
            size += JSON.stringify(todo).length * 2;
        }
        
        return size;
    }

    /**
     * Check if the index needs rebuilding
     * @param {Array} currentTodos - Current todos array
     * @returns {boolean} True if index should be rebuilt
     */
    shouldRebuildIndex(currentTodos = []) {
        return (
            this.indexInvalidated ||
            this.todoCache.size !== currentTodos.length ||
            Date.now() - this.lastIndexUpdate > 300000 // 5 minutes
        );
    }
}