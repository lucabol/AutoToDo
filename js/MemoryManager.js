/**
 * MemoryManager - Efficient memory management for large todo lists
 * Implements lazy loading, pagination, and memory optimization strategies
 */
class MemoryManager {
    constructor(options = {}) {
        this.pageSize = options.pageSize || 100; // Number of todos per page
        this.maxMemoryPages = options.maxMemoryPages || 5; // Max pages to keep in memory
        this.cacheThreshold = options.cacheThreshold || 500; // Enable pagination above this count
        
        // Memory cache for todo pages
        this.pageCache = new Map(); // pageIndex -> Array of todos
        this.loadedPages = new Set(); // Track which pages are loaded
        this.lastAccessTime = new Map(); // pageIndex -> timestamp
        
        // Memory usage tracking
        this.memoryStats = {
            totalTodos: 0,
            cachedTodos: 0,
            totalPages: 0,
            cachedPages: 0,
            memoryUsage: 0
        };
        
        // Safari-specific optimizations
        this.isSafari = this.detectSafari();
        this.safariOptimizations = this.isSafari;
    }

    /**
     * Detect Safari browser for specific optimizations
     * @returns {boolean} True if Safari is detected
     */
    detectSafari() {
        if (typeof navigator === 'undefined') return false;
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }

    /**
     * Initialize memory management for a todo list
     * @param {Array} todos - Full array of todos
     * @returns {Object} Pagination info and initial page
     */
    initialize(todos = []) {
        this.clearCache();
        this.memoryStats.totalTodos = todos.length;
        
        if (todos.length <= this.cacheThreshold) {
            // Small list - no pagination needed
            this.memoryStats.totalPages = 1;
            this.pageCache.set(0, todos);
            this.loadedPages.add(0);
            this.updateAccessTime(0);
            
            return {
                usePagination: false,
                totalPages: 1,
                currentPage: 0,
                todos: todos,
                totalCount: todos.length
            };
        }

        // Large list - use pagination
        this.memoryStats.totalPages = Math.ceil(todos.length / this.pageSize);
        this.partitionTodos(todos);

        // Load first page
        const firstPage = this.getPage(0);
        
        return {
            usePagination: true,
            totalPages: this.memoryStats.totalPages,
            currentPage: 0,
            todos: firstPage,
            totalCount: todos.length
        };
    }

    /**
     * Partition todos into pages for efficient memory management
     * @param {Array} todos - Array of todos to partition
     */
    partitionTodos(todos) {
        // Store original todo array in chunks for lazy loading
        for (let i = 0; i < this.memoryStats.totalPages; i++) {
            const startIndex = i * this.pageSize;
            const endIndex = Math.min(startIndex + this.pageSize, todos.length);
            const page = todos.slice(startIndex, endIndex);
            
            // Only cache the first few pages initially
            if (i < 2) {
                this.pageCache.set(i, page);
                this.loadedPages.add(i);
                this.updateAccessTime(i);
            }
        }
        
        this.updateMemoryStats();
    }

    /**
     * Get a specific page of todos
     * @param {number} pageIndex - Page index to retrieve
     * @returns {Array} Array of todos for the page
     */
    getPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.memoryStats.totalPages) {
            return [];
        }

        // Check if page is already cached
        if (this.pageCache.has(pageIndex)) {
            this.updateAccessTime(pageIndex);
            this.memoryStats.cachedPages = this.pageCache.size;
            return [...this.pageCache.get(pageIndex)]; // Return copy
        }

        // Page not cached - this would normally load from storage
        // For now, return empty array (in real implementation, would load from storage)
        console.warn(`Page ${pageIndex} not in cache - would load from storage`);
        return [];
    }

    /**
     * Preload adjacent pages for smooth scrolling
     * @param {number} currentPageIndex - Current page being viewed
     */
    preloadAdjacentPages(currentPageIndex) {
        const pagesToPreload = [
            currentPageIndex - 1,
            currentPageIndex + 1
        ].filter(index => 
            index >= 0 && 
            index < this.memoryStats.totalPages && 
            !this.pageCache.has(index)
        );

        pagesToPreload.forEach(pageIndex => {
            // In a real implementation, this would load from storage
            // For now, we'll simulate loading
            this.simulatePageLoad(pageIndex);
        });
    }

    /**
     * Simulate loading a page from storage (for demonstration)
     * @param {number} pageIndex - Page to load
     */
    simulatePageLoad(pageIndex) {
        // This would normally load from storage
        // For demonstration, we'll create empty todos
        const page = [];
        this.pageCache.set(pageIndex, page);
        this.loadedPages.add(pageIndex);
        this.updateAccessTime(pageIndex);
        
        // Clean up old pages if memory limit exceeded
        this.enforceMemoryLimit();
    }

    /**
     * Update access time for a page (for LRU cache management)
     * @param {number} pageIndex - Page index
     */
    updateAccessTime(pageIndex) {
        this.lastAccessTime.set(pageIndex, Date.now());
    }

    /**
     * Enforce memory limits by removing least recently used pages
     */
    enforceMemoryLimit() {
        if (this.pageCache.size <= this.maxMemoryPages) {
            return;
        }

        // Find least recently used pages
        const pagesByAccess = Array.from(this.lastAccessTime.entries())
            .sort((a, b) => a[1] - b[1]) // Sort by access time (oldest first)
            .map(([pageIndex]) => pageIndex);

        // Remove oldest pages until under limit
        const pagesToRemove = pagesByAccess.slice(0, this.pageCache.size - this.maxMemoryPages);
        
        pagesToRemove.forEach(pageIndex => {
            this.pageCache.delete(pageIndex);
            this.loadedPages.delete(pageIndex);
            this.lastAccessTime.delete(pageIndex);
        });

        this.updateMemoryStats();
        
        if (this.safariOptimizations) {
            // Force garbage collection on Safari (if possible)
            this.forceSafariGarbageCollection();
        }
    }

    /**
     * Apply Safari-specific memory optimizations
     */
    forceSafariGarbageCollection() {
        // Safari-specific memory management hints
        if (typeof window !== 'undefined' && window.gc) {
            // Some Safari versions expose gc() in development
            try {
                window.gc();
            } catch (e) {
                // Ignore if not available
            }
        }
        
        // Clear references to help garbage collector
        if (this.pageCache.size > this.maxMemoryPages) {
            const keysToDelete = Array.from(this.pageCache.keys())
                .slice(this.maxMemoryPages);
            
            keysToDelete.forEach(key => {
                if (this.pageCache.has(key)) {
                    this.pageCache.get(key).length = 0; // Clear array
                    this.pageCache.delete(key);
                }
            });
        }
    }

    /**
     * Get paginated view of todos with search filtering
     * @param {Array} allTodos - All todos (for search)
     * @param {string} searchTerm - Search filter
     * @param {number} pageIndex - Page to display
     * @returns {Object} Paginated and filtered results
     */
    getPaginatedView(allTodos, searchTerm = '', pageIndex = 0) {
        let filteredTodos = allTodos;
        
        // Apply search filter
        if (searchTerm && searchTerm.trim()) {
            const normalizedTerm = searchTerm.toLowerCase().trim();
            filteredTodos = allTodos.filter(todo =>
                todo.text.toLowerCase().includes(normalizedTerm)
            );
        }

        // If filtered results are small, return all without pagination
        if (filteredTodos.length <= this.cacheThreshold) {
            return {
                todos: filteredTodos,
                currentPage: 0,
                totalPages: 1,
                totalCount: filteredTodos.length,
                hasNextPage: false,
                hasPrevPage: false
            };
        }

        // Paginate filtered results
        const totalPages = Math.ceil(filteredTodos.length / this.pageSize);
        const startIndex = pageIndex * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, filteredTodos.length);
        const pageData = filteredTodos.slice(startIndex, endIndex);

        return {
            todos: pageData,
            currentPage: pageIndex,
            totalPages: totalPages,
            totalCount: filteredTodos.length,
            hasNextPage: pageIndex < totalPages - 1,
            hasPrevPage: pageIndex > 0
        };
    }

    /**
     * Update memory usage statistics
     */
    updateMemoryStats() {
        this.memoryStats.cachedPages = this.pageCache.size;
        this.memoryStats.cachedTodos = Array.from(this.pageCache.values())
            .reduce((total, page) => total + page.length, 0);
        
        // Estimate memory usage
        let memoryUsage = 0;
        for (const page of this.pageCache.values()) {
            memoryUsage += JSON.stringify(page).length * 2; // Rough estimate
        }
        this.memoryStats.memoryUsage = memoryUsage;
    }

    /**
     * Clear all cached pages
     */
    clearCache() {
        this.pageCache.clear();
        this.loadedPages.clear();
        this.lastAccessTime.clear();
        this.memoryStats = {
            totalTodos: 0,
            cachedTodos: 0,
            totalPages: 0,
            cachedPages: 0,
            memoryUsage: 0
        };
    }

    /**
     * Get memory management statistics
     * @returns {Object} Memory statistics
     */
    getMemoryStats() {
        this.updateMemoryStats();
        return {
            ...this.memoryStats,
            cacheHitRatio: this.loadedPages.size / Math.max(this.memoryStats.totalPages, 1),
            averagePageSize: this.memoryStats.cachedTodos / Math.max(this.memoryStats.cachedPages, 1),
            memoryEfficiency: this.memoryStats.cachedPages / this.maxMemoryPages,
            safariOptimizations: this.safariOptimizations
        };
    }

    /**
     * Check if pagination is beneficial for current todo count
     * @param {number} todoCount - Number of todos
     * @returns {boolean} True if pagination should be used
     */
    shouldUsePagination(todoCount) {
        return todoCount > this.cacheThreshold;
    }

    /**
     * Optimize memory usage based on current conditions
     */
    optimize() {
        this.enforceMemoryLimit();
        
        if (this.safariOptimizations) {
            this.forceSafariGarbageCollection();
        }
        
        // Remove unused access times
        const cachedPageIndexes = new Set(this.pageCache.keys());
        for (const [pageIndex] of this.lastAccessTime) {
            if (!cachedPageIndexes.has(pageIndex)) {
                this.lastAccessTime.delete(pageIndex);
            }
        }
        
        this.updateMemoryStats();
    }
}