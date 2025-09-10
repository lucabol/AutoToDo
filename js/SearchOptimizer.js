/**
 * SearchOptimizer - High-performance search engine for large todo datasets
 * Optimized specifically for Safari 14+ and datasets with 500+ items
 */
class SearchOptimizer {
    constructor(options = {}) {
        this.options = {
            cacheSize: options.cacheSize || 100,
            indexThreshold: options.indexThreshold || 50,
            debounceDelay: options.debounceDelay || 150, // Faster than default for better UX
            useWorker: options.useWorker || false, // Web worker for heavy operations
            fuzzySearch: options.fuzzySearch || true,
            ...options
        };
        
        // Search cache for frequent queries
        this.searchCache = new Map();
        this.searchIndex = new Map();
        this.lastIndexTime = 0;
        this.data = [];
        
        // Performance monitoring
        this.performanceMonitor = PerformanceUtils.createMonitor('Search Performance');
        
        // Initialize for Safari optimizations
        this.isSafari = PerformanceUtils.isSafari();
        this.safariOptimizations = this.isSafari;
    }
    
    /**
     * Set the data to be searched
     * @param {Array} data - Array of todo objects
     */
    setData(data) {
        this.data = data || [];
        
        // Build search index if data is large enough
        if (this.data.length >= this.options.indexThreshold) {
            this.buildSearchIndex();
        } else {
            this.searchIndex.clear();
        }
        
        // Clear cache when data changes
        this.clearCache();
    }
    
    /**
     * Build search index for faster lookups
     * @private
     */
    buildSearchIndex() {
        this.performanceMonitor.start();
        
        try {
            this.searchIndex.clear();
            
            // Create word-based index
            this.data.forEach((item, index) => {
                const words = this.extractWords(item.text);
                
                words.forEach(word => {
                    if (!this.searchIndex.has(word)) {
                        this.searchIndex.set(word, new Set());
                    }
                    this.searchIndex.get(word).add(index);
                });
            });
            
            this.lastIndexTime = Date.now();
            
            if (this.options.debug) {
                console.log(`Search index built: ${this.searchIndex.size} unique words`);
            }
        } finally {
            this.performanceMonitor.end();
        }
    }
    
    /**
     * Extract searchable words from text
     * @param {string} text - Text to extract words from
     * @returns {Array} Array of normalized words
     * @private
     */
    extractWords(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
            .split(/\s+/)
            .filter(word => word.length > 0)
            .map(word => word.trim());
    }
    
    /**
     * Perform optimized search
     * @param {string} query - Search query
     * @returns {Array} Array of matching items
     */
    search(query) {
        if (!query || !query.trim()) {
            return this.data.slice(); // Return copy of all data
        }
        
        const normalizedQuery = query.toLowerCase().trim();
        
        // Check cache first
        if (this.searchCache.has(normalizedQuery)) {
            const cached = this.searchCache.get(normalizedQuery);
            if (this.options.debug) {
                console.log('Cache hit for query:', normalizedQuery);
            }
            return cached;
        }
        
        this.performanceMonitor.start();
        
        let results;
        try {
            if (this.searchIndex.size > 0 && this.data.length >= this.options.indexThreshold) {
                results = this.indexedSearch(normalizedQuery);
            } else {
                results = this.linearSearch(normalizedQuery);
            }
            
            // Cache the results
            this.cacheResults(normalizedQuery, results);
            
            return results;
        } finally {
            this.performanceMonitor.end();
        }
    }
    
    /**
     * Perform indexed search using pre-built word index
     * @param {string} query - Normalized search query
     * @returns {Array} Array of matching items
     * @private
     */
    indexedSearch(query) {
        const queryWords = this.extractWords(query);
        
        if (queryWords.length === 0) {
            return this.data.slice();
        }
        
        // Find items that contain all query words
        let candidateIndices = null;
        
        queryWords.forEach(word => {
            const wordIndices = this.searchIndex.get(word) || new Set();
            
            if (candidateIndices === null) {
                candidateIndices = new Set(wordIndices);
            } else {
                // Intersection - keep only items that have all words
                candidateIndices = new Set([...candidateIndices].filter(index => wordIndices.has(index)));
            }
        });
        
        if (!candidateIndices || candidateIndices.size === 0) {
            return [];
        }
        
        // Convert indices back to items and apply fuzzy matching if enabled
        const results = Array.from(candidateIndices)
            .map(index => this.data[index])
            .filter(item => {
                if (!this.options.fuzzySearch) {
                    return true;
                }
                return this.fuzzyMatch(item.text.toLowerCase(), query);
            });
        
        return this.rankResults(results, query);
    }
    
    /**
     * Perform linear search for smaller datasets
     * @param {string} query - Normalized search query
     * @returns {Array} Array of matching items
     * @private
     */
    linearSearch(query) {
        const queryWords = query.split(/\s+/);
        
        const results = this.data.filter(item => {
            const itemText = item.text.toLowerCase();
            
            if (queryWords.length === 1) {
                return this.options.fuzzySearch ? 
                    this.fuzzyMatch(itemText, query) : 
                    itemText.includes(query);
            }
            
            // Multi-word search - all words must be present
            return queryWords.every(word => itemText.includes(word));
        });
        
        return this.rankResults(results, query);
    }
    
    /**
     * Simple fuzzy string matching
     * @param {string} text - Text to search in
     * @param {string} query - Query to search for
     * @returns {boolean} True if fuzzy match found
     * @private
     */
    fuzzyMatch(text, query) {
        // For performance, only do fuzzy matching on shorter queries
        if (query.length > 20) {
            return text.includes(query);
        }
        
        // Simple fuzzy matching - allow 1 character difference per 4 characters
        const allowedDifferences = Math.max(1, Math.floor(query.length / 4));
        
        let differences = 0;
        let textIndex = 0;
        
        for (let queryIndex = 0; queryIndex < query.length; queryIndex++) {
            const queryChar = query[queryIndex];
            let found = false;
            
            // Look ahead in text for matching character
            for (let lookahead = 0; lookahead < 3 && textIndex + lookahead < text.length; lookahead++) {
                if (text[textIndex + lookahead] === queryChar) {
                    textIndex += lookahead + 1;
                    differences += lookahead;
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                differences++;
                if (differences > allowedDifferences) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Rank search results by relevance
     * @param {Array} results - Search results to rank
     * @param {string} query - Original query
     * @returns {Array} Ranked results
     * @private
     */
    rankResults(results, query) {
        if (results.length <= 1) {
            return results;
        }
        
        // Score results based on:
        // 1. Exact matches get highest score
        // 2. Matches at beginning of text get higher score
        // 3. Shorter matches get higher score
        return results.map(item => ({
            ...item,
            _searchScore: this.calculateScore(item.text.toLowerCase(), query)
        }))
        .sort((a, b) => b._searchScore - a._searchScore)
        .map(item => {
            delete item._searchScore; // Clean up temporary property
            return item;
        });
    }
    
    /**
     * Calculate search relevance score
     * @param {string} text - Item text
     * @param {string} query - Search query
     * @returns {number} Relevance score
     * @private
     */
    calculateScore(text, query) {
        let score = 0;
        
        // Exact match bonus
        if (text === query) {
            score += 1000;
        }
        
        // Starts with query bonus
        if (text.startsWith(query)) {
            score += 500;
        }
        
        // Word boundary match bonus
        if (text.includes(' ' + query) || text.includes(query + ' ')) {
            score += 200;
        }
        
        // Length penalty (shorter is better)
        score -= text.length * 0.1;
        
        // Query coverage (how much of the query is matched)
        const coverage = query.length / text.length;
        score += coverage * 100;
        
        return score;
    }
    
    /**
     * Cache search results
     * @param {string} query - Search query
     * @param {Array} results - Search results
     * @private
     */
    cacheResults(query, results) {
        // Implement LRU cache
        if (this.searchCache.size >= this.options.cacheSize) {
            const firstKey = this.searchCache.keys().next().value;
            this.searchCache.delete(firstKey);
        }
        
        this.searchCache.set(query, results.slice()); // Store copy
    }
    
    /**
     * Clear search cache
     */
    clearCache() {
        this.searchCache.clear();
    }
    
    /**
     * Get search statistics
     * @returns {Object} Performance and usage statistics
     */
    getStats() {
        return {
            dataSize: this.data.length,
            indexSize: this.searchIndex.size,
            cacheSize: this.searchCache.size,
            lastIndexTime: this.lastIndexTime,
            performance: this.performanceMonitor.getStats(),
            safariOptimizations: this.safariOptimizations
        };
    }
    
    /**
     * Optimize for Safari performance
     */
    applySafariOptimizations() {
        if (!this.isSafari) return;
        
        // Reduce cache size for Safari memory management
        this.options.cacheSize = Math.min(this.options.cacheSize, 50);
        
        // Use shorter debounce for better responsiveness
        this.options.debounceDelay = Math.min(this.options.debounceDelay, 100);
        
        // Disable fuzzy search for very large datasets in Safari
        if (this.data.length > 1000) {
            this.options.fuzzySearch = false;
        }
        
        this.safariOptimizations = true;
        
        if (this.options.debug) {
            console.log('Safari optimizations applied');
        }
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchOptimizer;
}