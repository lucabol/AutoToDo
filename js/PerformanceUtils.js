/**
 * PerformanceUtils - Utilities for performance optimization and monitoring
 */
class PerformanceUtils {
    /**
     * Debounce a function to limit how often it can be called
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, delay) {
        let timeoutId = null;
        
        return function debounced(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    /**
     * Throttle a function to limit its execution frequency
     * @param {Function} func - Function to throttle
     * @param {number} delay - Minimum delay between executions
     * @returns {Function} Throttled function
     */
    static throttle(func, delay) {
        let timeoutId = null;
        let lastExecTime = 0;
        
        return function throttled(...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }
    
    /**
     * Measure and log performance of a function
     * @param {string} label - Label for the measurement
     * @param {Function} func - Function to measure
     * @returns {*} Result of the function
     */
    static measure(label, func) {
        const startTime = performance.now();
        const result = func();
        const endTime = performance.now();
        
        console.log(`Performance: ${label} took ${(endTime - startTime).toFixed(2)}ms`);
        return result;
    }
    
    /**
     * Create a performance monitor for tracking operations
     * @param {string} name - Name of the monitor
     * @returns {Object} Performance monitor object
     */
    static createMonitor(name) {
        let measurements = [];
        
        return {
            start() {
                this._startTime = performance.now();
            },
            
            end() {
                if (this._startTime) {
                    const duration = performance.now() - this._startTime;
                    measurements.push(duration);
                    console.log(`${name}: ${duration.toFixed(2)}ms`);
                    this._startTime = null;
                }
            },
            
            getStats() {
                if (measurements.length === 0) return null;
                
                const sorted = [...measurements].sort((a, b) => a - b);
                return {
                    count: measurements.length,
                    average: measurements.reduce((a, b) => a + b, 0) / measurements.length,
                    min: sorted[0],
                    max: sorted[sorted.length - 1],
                    median: sorted[Math.floor(sorted.length / 2)]
                };
            },
            
            reset() {
                measurements = [];
            }
        };
    }
    
    /**
     * Optimize DOM operations using requestAnimationFrame
     * @param {Function} callback - Function to execute on next frame
     * @returns {number} Animation frame ID
     */
    static nextFrame(callback) {
        return requestAnimationFrame(callback);
    }
    
    /**
     * Batch DOM operations to minimize reflows
     * @param {Function} callback - Function containing DOM operations
     */
    static batchDOMOperations(callback) {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                const result = callback();
                resolve(result);
            });
        });
    }
    
    /**
     * Detect if the user is on a mobile device
     * @returns {boolean} True if mobile device
     */
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * Detect Safari browser
     * @returns {boolean} True if Safari browser
     */
    static isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }
    
    /**
     * Get performance-optimized scroll handler
     * @param {Function} handler - Scroll handler function
     * @param {Object} options - Options for optimization
     * @returns {Function} Optimized scroll handler
     */
    static optimizeScrollHandler(handler, options = {}) {
        const { 
            throttle: shouldThrottle = true, 
            throttleDelay = 16, 
            passive = true 
        } = options;
        
        let optimizedHandler = handler;
        
        if (shouldThrottle) {
            optimizedHandler = this.throttle(handler, throttleDelay);
        }
        
        return optimizedHandler;
    }
    
    /**
     * Create a performance-aware event listener
     * @param {Element} element - Element to attach listener to
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event listener options
     */
    static addPerformantListener(element, event, handler, options = {}) {
        const defaultOptions = {
            passive: true,
            capture: false
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        // Optimize scroll and touchmove events
        if (event === 'scroll' || event === 'touchmove') {
            const optimizedHandler = this.optimizeScrollHandler(handler);
            element.addEventListener(event, optimizedHandler, finalOptions);
            return optimizedHandler;
        }
        
        element.addEventListener(event, handler, finalOptions);
        return handler;
    }
    
    /**
     * Memory-efficient array chunking for processing large datasets
     * @param {Array} array - Array to chunk
     * @param {number} chunkSize - Size of each chunk
     * @param {Function} processor - Function to process each chunk
     * @param {number} delay - Delay between chunks (ms)
     * @returns {Promise} Promise that resolves when all chunks are processed
     */
    static async processInChunks(array, chunkSize, processor, delay = 0) {
        const results = [];
        
        for (let i = 0; i < array.length; i += chunkSize) {
            const chunk = array.slice(i, i + chunkSize);
            const result = await processor(chunk, i);
            results.push(result);
            
            if (delay > 0 && i + chunkSize < array.length) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        return results;
    }
    
    /**
     * Lazy loading utility for expensive operations
     * @param {Function} factory - Function that creates the expensive object
     * @returns {Function} Lazy loader function
     */
    static lazy(factory) {
        let instance = null;
        let isLoading = false;
        
        return () => {
            if (instance) return instance;
            if (isLoading) return null;
            
            isLoading = true;
            instance = factory();
            isLoading = false;
            
            return instance;
        };
    }
    
    /**
     * Object pool for reusing DOM elements
     * @param {Function} factory - Function that creates new objects
     * @param {Function} reset - Function that resets objects for reuse
     * @returns {Object} Object pool
     */
    static createObjectPool(factory, reset = () => {}) {
        const pool = [];
        
        return {
            acquire() {
                if (pool.length > 0) {
                    return pool.pop();
                }
                return factory();
            },
            
            release(obj) {
                reset(obj);
                pool.push(obj);
            },
            
            clear() {
                pool.length = 0;
            },
            
            size() {
                return pool.length;
            }
        };
    }

    /**
     * Create a search index for fast text filtering
     * Optimized for large datasets
     */
    static createSearchIndex() {
        const index = new Map();
        let items = [];
        
        return {
            /**
             * Add items to the search index
             * @param {Array} newItems - Items to add to index
             * @param {Function} textExtractor - Function to extract searchable text
             */
            addItems(newItems, textExtractor = item => item.text) {
                items = [...items, ...newItems];
                
                newItems.forEach(item => {
                    const text = textExtractor(item).toLowerCase();
                    const words = text.split(/\s+/).filter(word => word.length > 0);
                    
                    words.forEach(word => {
                        if (!index.has(word)) {
                            index.set(word, new Set());
                        }
                        index.get(word).add(item.id);
                    });
                });
            },
            
            /**
             * Search items using the index
             * @param {string} searchTerm - Search query
             * @param {Function} textExtractor - Function to extract searchable text
             * @returns {Array} Matching items
             */
            search(searchTerm, textExtractor = item => item.text) {
                if (!searchTerm || !searchTerm.trim()) {
                    return items;
                }
                
                const normalizedTerm = searchTerm.toLowerCase().trim();
                const words = normalizedTerm.split(/\s+/).filter(word => word.length > 0);
                
                if (words.length === 0) {
                    return items;
                }
                
                // For single word searches, use index
                if (words.length === 1) {
                    const word = words[0];
                    const matchingIds = new Set();
                    
                    // Find all indexed words that contain the search term
                    for (const [indexedWord, ids] of index) {
                        if (indexedWord.includes(word)) {
                            ids.forEach(id => matchingIds.add(id));
                        }
                    }
                    
                    return items.filter(item => matchingIds.has(item.id));
                }
                
                // For multi-word searches, fall back to full text search
                return items.filter(item => {
                    const text = textExtractor(item).toLowerCase();
                    return words.every(word => text.includes(word));
                });
            },
            
            /**
             * Update an item in the index
             * @param {Object} item - Updated item
             * @param {Function} textExtractor - Function to extract searchable text
             */
            updateItem(item, textExtractor = item => item.text) {
                this.removeItem(item.id);
                this.addItems([item], textExtractor);
            },
            
            /**
             * Remove an item from the index
             * @param {string} itemId - ID of item to remove
             */
            removeItem(itemId) {
                items = items.filter(item => item.id !== itemId);
                
                for (const [word, ids] of index) {
                    ids.delete(itemId);
                    if (ids.size === 0) {
                        index.delete(word);
                    }
                }
            },
            
            /**
             * Clear the entire index
             */
            clear() {
                items = [];
                index.clear();
            },
            
            /**
             * Get index statistics
             */
            getStats() {
                return {
                    totalItems: items.length,
                    indexedWords: index.size,
                    memoryUsage: this.estimateMemoryUsage()
                };
            },
            
            /**
             * Estimate memory usage of the index
             */
            estimateMemoryUsage() {
                let totalSize = 0;
                for (const [word, ids] of index) {
                    totalSize += word.length * 2; // Rough character size
                    totalSize += ids.size * 8; // Rough Set size
                }
                return totalSize;
            }
        };
    }

    /**
     * Detect Safari browser
     * @returns {boolean} True if Safari browser
     */
    static isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }

    /**
     * Performance monitoring for Safari-specific optimizations
     */
    static createSafariMonitor() {
        const metrics = {
            renderTimes: [],
            scrollEvents: 0,
            memoryUsage: [],
            lastMemoryCheck: 0
        };
        
        return {
            /**
             * Record a render time
             * @param {number} duration - Render duration in milliseconds
             */
            recordRender(duration) {
                metrics.renderTimes.push({
                    time: performance.now(),
                    duration
                });
                
                // Keep only last 100 render times
                if (metrics.renderTimes.length > 100) {
                    metrics.renderTimes.shift();
                }
            },
            
            /**
             * Record a scroll event
             */
            recordScroll() {
                metrics.scrollEvents++;
            },
            
            /**
             * Check memory usage (Safari WebKit optimization)
             */
            checkMemory() {
                const now = performance.now();
                if (now - metrics.lastMemoryCheck < 5000) return; // Check every 5s max
                
                if (performance.memory) {
                    metrics.memoryUsage.push({
                        time: now,
                        used: performance.memory.usedJSHeapSize,
                        total: performance.memory.totalJSHeapSize
                    });
                    
                    // Keep only last 20 memory measurements
                    if (metrics.memoryUsage.length > 20) {
                        metrics.memoryUsage.shift();
                    }
                }
                
                metrics.lastMemoryCheck = now;
            },
            
            /**
             * Get performance report
             */
            getReport() {
                const avgRenderTime = metrics.renderTimes.length > 0
                    ? metrics.renderTimes.reduce((sum, r) => sum + r.duration, 0) / metrics.renderTimes.length
                    : 0;
                
                const memoryTrend = metrics.memoryUsage.length >= 2
                    ? metrics.memoryUsage[metrics.memoryUsage.length - 1].used - metrics.memoryUsage[0].used
                    : 0;
                
                return {
                    avgRenderTime: Math.round(avgRenderTime * 100) / 100,
                    scrollEvents: metrics.scrollEvents,
                    memoryTrend: Math.round(memoryTrend / 1024 / 1024 * 100) / 100, // MB
                    recommendations: this.generateRecommendations(avgRenderTime, memoryTrend)
                };
            },
            
            /**
             * Generate performance recommendations
             */
            generateRecommendations(avgRenderTime, memoryTrend) {
                const recommendations = [];
                
                if (avgRenderTime > 16) {
                    recommendations.push('Consider reducing render complexity or enabling virtual scrolling');
                }
                
                if (memoryTrend > 10 * 1024 * 1024) { // 10MB growth
                    recommendations.push('Memory usage increasing - consider archiving completed todos');
                }
                
                if (metrics.scrollEvents > 1000) {
                    recommendations.push('High scroll activity detected - ensure scroll throttling is active');
                }
                
                return recommendations;
            }
        };
    }
}