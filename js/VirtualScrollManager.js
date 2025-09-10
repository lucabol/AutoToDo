/**
 * VirtualScrollManager - High-performance virtual scrolling for large lists
 * Optimized for Safari 14+ with WebKit-specific performance improvements
 */
class VirtualScrollManager {
    constructor(options = {}) {
        this.container = options.container;
        this.itemHeight = options.itemHeight || 60; // Estimated item height
        this.bufferSize = options.bufferSize || 5; // Extra items to render for smooth scrolling
        this.viewport = options.viewport || window;
        this.renderCallback = options.renderCallback || (() => {});
        
        // Safari-specific optimizations
        this.isSafari = this.detectSafari();
        this.safariOptimizations = options.safariOptimizations !== false && this.isSafari;
        
        // State
        this.items = [];
        this.visibleRange = { start: 0, end: 0 };
        this.scrollTop = 0;
        this.containerHeight = 0;
        this.totalHeight = 0;
        
        // Performance optimization: adaptive scroll throttling
        const throttleDelay = this.isSafari ? 8 : 16; // Higher frequency for Safari
        this.handleScroll = this.throttle(this._handleScroll.bind(this), throttleDelay);
        
        // DOM elements
        this.scrollContainer = null;
        this.itemContainer = null;
        this.topSpacer = null;
        this.bottomSpacer = null;
        
        // Safari memory management
        this.renderCount = 0;
        this.memoryCleanupInterval = 100; // Clean up every 100 renders
        
        this.init();
    }
    
    /**
     * Detect Safari browser for optimizations
     */
    detectSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }
    
    /**
     * Initialize the virtual scroll container
     */
    init() {
        if (!this.container) return;
        
        this.setupDOM();
        this.bindEvents();
        this.updateDimensions();
    }
    
    /**
     * Set up the DOM structure for virtual scrolling
     */
    setupDOM() {
        // Create scroll container
        this.scrollContainer = document.createElement('div');
        this.scrollContainer.className = 'virtual-scroll-container';
        
        let containerStyles = `
            height: 300px;
            overflow-y: auto;
            position: relative;
            contain: layout style paint;
        `;
        
        // Safari-specific optimizations
        if (this.safariOptimizations) {
            containerStyles += `
                -webkit-overflow-scrolling: touch;
                -webkit-transform: translateZ(0);
                -webkit-backface-visibility: hidden;
                -webkit-perspective: 1000;
                transform: translateZ(0);
                will-change: scroll-position;
            `;
        }
        
        this.scrollContainer.style.cssText = containerStyles;
        
        // Create item container
        this.itemContainer = document.createElement('div');
        this.itemContainer.className = 'virtual-scroll-items';
        
        let itemStyles = `
            position: relative;
            min-height: 0;
        `;
        
        if (this.safariOptimizations) {
            itemStyles += `
                -webkit-transform: translateZ(0);
                transform: translateZ(0);
            `;
        }
        
        this.itemContainer.style.cssText = itemStyles;
        
        // Create spacers for maintaining scroll height
        this.topSpacer = document.createElement('div');
        this.topSpacer.className = 'virtual-scroll-spacer-top';
        
        this.bottomSpacer = document.createElement('div');
        this.bottomSpacer.className = 'virtual-scroll-spacer-bottom';
        
        // Assemble DOM
        this.itemContainer.appendChild(this.topSpacer);
        this.itemContainer.appendChild(this.bottomSpacer);
        this.scrollContainer.appendChild(this.itemContainer);
        
        // Replace original container
        this.container.appendChild(this.scrollContainer);
    }
    
    /**
     * Bind scroll events
     */
    bindEvents() {
        if (this.scrollContainer) {
            this.scrollContainer.addEventListener('scroll', this.handleScroll, { passive: true });
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateDimensions();
            this.render();
        }, { passive: true });
    }
    
    /**
     * Update container dimensions
     */
    updateDimensions() {
        if (!this.scrollContainer) return;
        
        const rect = this.scrollContainer.getBoundingClientRect();
        this.containerHeight = rect.height;
        this.totalHeight = this.items.length * this.itemHeight;
    }
    
    /**
     * Set the list of items to be virtualized
     * @param {Array} items - Array of items to display
     */
    setItems(items) {
        this.items = items || [];
        this.totalHeight = this.items.length * this.itemHeight;
        this.updateVisibleRange();
        this.render();
    }
    
    /**
     * Handle scroll events (throttled)
     * @private
     */
    _handleScroll() {
        if (!this.scrollContainer) return;
        
        this.scrollTop = this.scrollContainer.scrollTop;
        this.updateVisibleRange();
        this.render();
    }
    
    /**
     * Calculate which items should be visible based on scroll position
     */
    updateVisibleRange() {
        if (this.containerHeight === 0 || this.itemHeight === 0) return;
        
        const visibleStart = Math.floor(this.scrollTop / this.itemHeight);
        const visibleEnd = Math.min(
            this.items.length,
            Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight)
        );
        
        // Add buffer for smooth scrolling
        const bufferedStart = Math.max(0, visibleStart - this.bufferSize);
        const bufferedEnd = Math.min(this.items.length, visibleEnd + this.bufferSize);
        
        this.visibleRange = {
            start: bufferedStart,
            end: bufferedEnd
        };
    }
    
    /**
     * Render visible items and update spacers
     */
    render() {
        if (!this.itemContainer || !this.topSpacer || !this.bottomSpacer) return;
        
        const { start, end } = this.visibleRange;
        const visibleItems = this.items.slice(start, end);
        
        // Calculate spacer heights
        const topHeight = start * this.itemHeight;
        const bottomHeight = (this.items.length - end) * this.itemHeight;
        
        // Update spacers
        this.topSpacer.style.height = `${topHeight}px`;
        this.bottomSpacer.style.height = `${bottomHeight}px`;
        
        // Clear existing items (except spacers)
        const itemElements = this.itemContainer.querySelectorAll('.virtual-scroll-item');
        itemElements.forEach(el => el.remove());
        
        // Render visible items
        const fragment = document.createDocumentFragment();
        visibleItems.forEach((item, index) => {
            const actualIndex = start + index;
            const element = this.renderCallback(item, actualIndex);
            
            if (element) {
                element.classList.add('virtual-scroll-item');
                element.style.cssText = `
                    position: absolute;
                    top: ${actualIndex * this.itemHeight - topHeight}px;
                    left: 0;
                    right: 0;
                    height: ${this.itemHeight}px;
                `;
                fragment.appendChild(element);
            }
        });
        
        // Insert items after top spacer
        this.topSpacer.parentNode.insertBefore(fragment, this.bottomSpacer);
    }
    
    /**
     * Scroll to a specific item index
     * @param {number} index - Item index to scroll to
     */
    scrollToIndex(index) {
        if (!this.scrollContainer || index < 0 || index >= this.items.length) return;
        
        const targetScrollTop = index * this.itemHeight;
        this.scrollContainer.scrollTop = targetScrollTop;
    }
    
    /**
     * Get the current scroll position as item index
     * @returns {number} Current top visible item index
     */
    getCurrentIndex() {
        return Math.floor(this.scrollTop / this.itemHeight);
    }
    
    /**
     * Update item height and recalculate layout
     * @param {number} height - New item height in pixels
     */
    setItemHeight(height) {
        this.itemHeight = height;
        this.totalHeight = this.items.length * this.itemHeight;
        this.updateVisibleRange();
        this.render();
    }
    
    /**
     * Destroy the virtual scroll manager and clean up
     */
    destroy() {
        if (this.scrollContainer) {
            this.scrollContainer.removeEventListener('scroll', this.handleScroll);
            this.scrollContainer.remove();
        }
        
        window.removeEventListener('resize', this.updateDimensions);
        
        // Clear references
        this.container = null;
        this.scrollContainer = null;
        this.itemContainer = null;
        this.topSpacer = null;
        this.bottomSpacer = null;
        this.items = [];
    }
    
    /**
     * Throttle function to limit function calls
     * @param {Function} func - Function to throttle
     * @param {number} delay - Throttle delay in milliseconds
     * @returns {Function} Throttled function
     * @private
     */
    throttle(func, delay) {
        let timeoutId = null;
        let lastExecTime = 0;
        
        return function (...args) {
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
}