/**
 * TouchEventManager - Handles mobile touch optimizations and interactions
 * 
 * PURPOSE: Provides optimized touch event handling for mobile devices to:
 * - Eliminate the 300ms click delay on mobile browsers
 * - Provide faster response times for better user experience
 * - Prevent duplicate event handling between touch and click events
 * - Add visual feedback for touch interactions
 * - Ensure accessibility compliance with proper touch target sizes
 * 
 * FEATURES:
 * - Fast touch response with touchstart/touchend event handling
 * - Touch state management to prevent event conflicts
 * - Visual feedback (scale animations) for touch interactions
 * - Reusable touch event binding for different element types
 * - Automatic fallback to click events when touch is not available
 * 
 * BROWSER COMPATIBILITY:
 * - Optimized for mobile browsers with touch support
 * - Graceful degradation for desktop browsers
 * - Works with Safari, Chrome, Firefox mobile versions
 */
class TouchEventManager {
    constructor(controller) {
        this.controller = controller;
        
        /**
         * Global touch state to prevent duplicate event handling
         * @type {boolean}
         */
        this.touchHandled = false;
        
        /**
         * Touch reset timeout to allow click fallback
         * @type {number}
         */
        this.touchResetDelay = 300;
        
        /**
         * Visual feedback duration for touch interactions
         * @type {number}
         */
        this.feedbackDuration = 150;
        
        /**
         * Map of elements with active touch handlers
         * @type {WeakSet}
         */
        this.boundElements = new WeakSet();
        
        this.init();
    }
    
    /**
     * Initialize touch event management
     * @private
     */
    init() {
        // Detect touch support
        this.touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (this.touchSupported && this.controller.keyboardManager?.options?.debug) {
            console.log('TouchEventManager: Touch support detected, enabling optimizations');
        }
    }
    
    /**
     * Bind touch events to the todo list for item interactions
     * Handles edit, delete, and toggle completion actions
     */
    bindTodoListTouchEvents() {
        if (!this.touchSupported) return;
        
        const todoList = this.controller.view.todoList;
        if (!todoList || this.boundElements.has(todoList)) return;
        
        // Use event delegation for efficient handling of dynamically added todos
        todoList.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e);
        }, { passive: false });
        
        todoList.addEventListener('touchend', (e) => {
            this.handleTodoListTouchEnd(e);
        }, { passive: false });
        
        this.boundElements.add(todoList);
    }
    
    /**
     * Bind touch events to buttons for faster response
     * @param {Element} button - Button element to enhance
     * @param {Function} handler - Function to call on touch
     * @param {Object} options - Configuration options
     */
    bindButtonTouchEvents(button, handler, options = {}) {
        if (!this.touchSupported || !button || this.boundElements.has(button)) return;
        
        const config = {
            preventDefault: true,
            visualFeedback: true,
            resetDelay: this.touchResetDelay,
            ...options
        };
        
        let touchState = {
            handled: false,
            timeout: null
        };
        
        // Touch start - provide immediate visual feedback
        button.addEventListener('touchstart', (e) => {
            if (config.visualFeedback) {
                this.addVisualFeedback(button);
            }
            touchState.handled = false;
        }, { passive: false });
        
        // Touch end - execute the handler
        button.addEventListener('touchend', (e) => {
            if (config.preventDefault) {
                e.preventDefault();
            }
            
            if (config.visualFeedback) {
                this.removeVisualFeedback(button);
            }
            
            if (!touchState.handled) {
                handler(e);
                touchState.handled = true;
                this.touchHandled = true;
                
                // Clear any existing timeout
                if (touchState.timeout) {
                    clearTimeout(touchState.timeout);
                }
                
                // Reset touch state after delay to allow click fallback
                touchState.timeout = setTimeout(() => {
                    touchState.handled = false;
                    this.touchHandled = false;
                }, config.resetDelay);
            }
        }, { passive: false });
        
        this.boundElements.add(button);
    }
    
    /**
     * Bind touch events to form elements
     * @param {Element} form - Form element to enhance
     * @param {Function} handler - Submit handler function
     */
    bindFormTouchEvents(form, handler) {
        if (!this.touchSupported || !form || this.boundElements.has(form)) return;
        
        const submitButtons = form.querySelectorAll('[type="submit"], button:not([type])');
        
        submitButtons.forEach(button => {
            this.bindButtonTouchEvents(button, (e) => {
                e.preventDefault();
                handler(e);
            }, {
                preventDefault: true,
                visualFeedback: true
            });
        });
        
        this.boundElements.add(form);
    }
    
    /**
     * Handle touch start events with visual feedback
     * @param {TouchEvent} e - Touch event
     * @private
     */
    handleTouchStart(e) {
        this.touchHandled = false;
        
        // Add visual feedback for actionable elements
        if (e.target.dataset.action) {
            this.addVisualFeedback(e.target);
        }
    }
    
    /**
     * Handle touch end events for todo list interactions
     * @param {TouchEvent} e - Touch event
     * @private
     */
    handleTodoListTouchEnd(e) {
        // Remove visual feedback
        if (e.target.dataset.action) {
            this.removeVisualFeedback(e.target);
        }
        
        // Only handle if we haven't already processed this touch
        if (this.touchHandled) return;
        
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;
        
        if (!action || !id) return;
        
        // Prevent the subsequent click event
        e.preventDefault();
        this.touchHandled = true;
        
        // Reset touch handled flag after delay to allow click fallback
        setTimeout(() => {
            this.touchHandled = false;
        }, this.touchResetDelay);
        
        // Execute the appropriate action with fast response
        this.executeAction(action, id);
    }
    
    /**
     * Execute todo actions based on touch input
     * @param {string} action - Action to perform (edit, delete, toggle)
     * @param {string} id - Todo item ID
     * @private
     */
    executeAction(action, id) {
        switch (action) {
            case 'edit':
                this.controller.handleEditTodo(id);
                break;
            case 'delete':
                this.controller.handleDeleteTodo(id);
                break;
            case 'toggle':
                this.controller.handleToggleComplete(id);
                break;
            default:
                console.warn(`TouchEventManager: Unknown action: ${action}`);
        }
    }
    
    /**
     * Add visual feedback for touch interactions
     * @param {Element} element - Element to add feedback to
     * @private
     */
    addVisualFeedback(element) {
        if (!element || !element.style) return;
        
        // Apply scale transform for touch feedback
        element.style.transform = 'scale(0.95)';
        element.style.transition = 'transform 0.1s ease-out';
        
        // Add touch feedback class for CSS-based styling
        element.classList.add('touch-active');
    }
    
    /**
     * Remove visual feedback after touch interaction
     * @param {Element} element - Element to remove feedback from
     * @private
     */
    removeVisualFeedback(element) {
        if (!element || !element.style) return;
        
        // Remove transform and transition after a short delay for smooth animation
        setTimeout(() => {
            element.style.transform = '';
            element.style.transition = '';
            element.classList.remove('touch-active');
        }, this.feedbackDuration);
    }
    
    /**
     * Check if touch was handled (used by click handlers to prevent duplicates)
     * @returns {boolean} True if touch event was recently handled
     */
    isTouchHandled() {
        return this.touchHandled;
    }
    
    /**
     * Reset touch state manually if needed
     */
    resetTouchState() {
        this.touchHandled = false;
    }
    
    /**
     * Bind all touch events for the application
     * This method should be called from the main controller to set up all touch optimizations
     */
    bindAllTouchEvents() {
        if (!this.touchSupported) {
            if (this.controller.keyboardManager?.options?.debug) {
                console.log('TouchEventManager: Touch not supported, skipping touch optimizations');
            }
            return;
        }
        
        // Bind todo list touch events
        this.bindTodoListTouchEvents();
        
        // Bind theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            this.bindButtonTouchEvents(themeToggle, () => {
                this.controller.toggleTheme();
            });
        }
        
        // Bind clear search button
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            this.bindButtonTouchEvents(clearSearchBtn, () => {
                this.controller.handleClearSearch();
            });
        }
        
        // Bind add todo form
        const addTodoForm = document.getElementById('addTodoForm');
        if (addTodoForm) {
            this.bindFormTouchEvents(addTodoForm, () => {
                this.controller.handleAddTodo();
            });
        }
        
        if (this.controller.keyboardManager?.options?.debug) {
            console.log('TouchEventManager: All touch events bound successfully');
        }
    }
    
    /**
     * Get touch event manager statistics and debugging information
     * @returns {Object} Debug information about touch handling
     */
    getDebugInfo() {
        return {
            touchSupported: this.touchSupported,
            touchHandled: this.touchHandled,
            boundElementsCount: this.boundElements.size || 'unavailable',
            touchResetDelay: this.touchResetDelay,
            feedbackDuration: this.feedbackDuration
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TouchEventManager;
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
    window.TouchEventManager = TouchEventManager;
}