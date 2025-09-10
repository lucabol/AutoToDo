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
     * Detect Safari version and check if it's 14.0-14.2 with CSS custom property quirks
     * @returns {Object} Safari version info and compatibility flags
     */
    static getSafariVersionInfo() {
        const userAgent = navigator.userAgent;
        const isSafari = this.isSafari();
        
        if (!isSafari) {
            return { isSafari: false, version: null, needsThemeWorkaround: false };
        }
        
        // Extract Safari version from user agent
        const versionMatch = userAgent.match(/Version\/([0-9]+\.[0-9]+)/);
        const version = versionMatch ? parseFloat(versionMatch[1]) : null;
        
        // Safari 14.0-14.2 had CSS custom property refresh issues
        const needsThemeWorkaround = version && version >= 14.0 && version <= 14.2;
        
        return {
            isSafari: true,
            version,
            needsThemeWorkaround,
            versionString: versionMatch ? versionMatch[1] : 'unknown'
        };
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
}