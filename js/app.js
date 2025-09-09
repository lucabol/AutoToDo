/**
 * AutoToDo Application Entry Point
 * Initializes the MVC components and starts the application
 */

// Application instance
let todoApp = null;

/**
 * Initialize the AutoToDo application
 */
function initializeApp() {
    try {
        // Create model, view, and controller instances
        const model = new TodoModel();
        const view = new TodoView();
        const controller = new TodoController(model, view);

        // Store reference for debugging/testing purposes
        todoApp = {
            model,
            view,
            controller
        };

        // Expose globally for backward compatibility and debugging
        window.todoApp = todoApp;

        console.log('AutoToDo application initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize AutoToDo application:', error);
        
        // Show user-friendly error message
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; color: #ff3b30; padding: 40px;">
                    <h2>Application Error</h2>
                    <p>Failed to load the AutoToDo application. Please refresh the page.</p>
                    <p style="font-size: 14px; margin-top: 20px; color: #86868b;">
                        Error: ${error.message}
                    </p>
                </div>
            `;
        }
    }
}

/**
 * Application lifecycle management
 */
const AppLifecycle = {
    /**
     * Handle application startup
     */
    onLoad() {
        initializeApp();
    },

    /**
     * Handle page before unload (cleanup if needed)
     */
    onBeforeUnload() {
        // Could add cleanup logic here if needed
        console.log('AutoToDo application shutting down');
    },

    /**
     * Handle page errors
     * @param {Event} event - Error event
     */
    onError(event) {
        console.error('Application error:', event.error);
        // Could implement error reporting here
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', AppLifecycle.onLoad);
} else {
    // DOM is already loaded
    AppLifecycle.onLoad();
}

// Handle page lifecycle events
window.addEventListener('beforeunload', AppLifecycle.onBeforeUnload);
window.addEventListener('error', AppLifecycle.onError);

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { todoApp, initializeApp, AppLifecycle };
}