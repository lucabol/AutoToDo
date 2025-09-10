/**
 * DebugLogger - Handles debugging and logging functionality for keyboard shortcuts
 * 
 * Extracted from KeyboardShortcutManager to improve code organization
 * and separate debugging concerns from the main class.
 */
class DebugLogger {
    constructor(options = {}) {
        this.debug = options.debug || false;
        this.enableLogging = options.enableLogging || false;
    }

    /**
     * Start a debug session for performance tracking and timing measurement.
     * Creates a session object with the current timestamp to measure execution time
     * of keyboard shortcut processing. Only creates the session if debug mode is enabled.
     * 
     * @returns {Object|null} Debug session object containing startTime property if debug 
     *                        mode is enabled, null otherwise. The startTime is captured 
     *                        using performance.now() for high-precision timing.
     */
    startDebugSession() {
        return this.debug ? { startTime: performance.now() } : null;
    }

    /**
     * End a debug session and log performance metrics to the console.
     * Calculates the elapsed time since the debug session started and logs timing
     * information. If a shortcut was executed, logs the specific shortcut and its
     * execution time. If no shortcut matched, logs general keyboard handling completion time.
     * Only performs logging if debug mode is enabled and a valid session object is provided.
     * 
     * @param {Object|null} debugSession - Debug session object returned from startDebugSession().
     *                                     Should contain a startTime property with the session 
     *                                     start timestamp. Pass null if no session was created.
     * @param {Object} [shortcut] - Optional. The executed shortcut configuration object.
     *                              If provided along with event, logs specific shortcut timing.
     *                              Contains properties like context, key, ctrlKey, etc.
     * @param {KeyboardEvent} [event] - Optional. The keyboard event that triggered the shortcut.
     *                                  Used with shortcut parameter to generate the shortcut key
     *                                  for detailed logging. Contains key, ctrlKey, altKey, shiftKey.
     * @param {Function} generateShortcutKeyFn - Function to generate shortcut key for logging
     */
    endDebugSession(debugSession, shortcut = null, event = null, generateShortcutKeyFn = null) {
        if (!debugSession || !this.debug) return;
        
        const endTime = performance.now();
        const duration = endTime - debugSession.startTime;
        
        if (shortcut && event && generateShortcutKeyFn) {
            const shortcutKey = generateShortcutKeyFn(
                event.key, event.ctrlKey, event.altKey, event.shiftKey, shortcut.context
            );
            console.log(`Shortcut ${shortcutKey} executed in ${duration}ms`);
        } else {
            console.log(`Keyboard handling completed in ${duration}ms (no match)`);
        }
    }

    /**
     * Log keyboard event details for debugging
     * @param {KeyboardEvent} event - The keyboard event
     * @param {Array} activeContexts - Currently active contexts
     */
    logKeyboardEvent(event, activeContexts) {
        if (this.debug) {
            console.log('Keyboard event:', {
                key: event.key,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
                activeContexts
            });
        }
    }

    /**
     * Log when no matching shortcut is found (for debugging)
     * @param {KeyboardEvent} event - The keyboard event
     */
    logNoMatchFound(event) {
        if (this.debug) {
            console.debug(`KeyboardShortcutManager: No shortcut matches key combination: ${event.key} (Ctrl: ${event.ctrlKey}, Alt: ${event.altKey}, Shift: ${event.shiftKey})`);
        }
    }

    /**
     * Log successful shortcut execution
     * @param {string} shortcutKey - The shortcut key identifier
     */
    logShortcutExecution(shortcutKey) {
        if (this.enableLogging) {
            console.log(`Shortcut executed: ${shortcutKey}`);
        }
    }

    /**
     * Log shortcut execution error
     * @param {Error} error - The error that occurred
     * @param {Object} shortcut - The shortcut configuration
     * @param {Function} createModifierStringFn - Function to create modifier string
     */
    logShortcutError(error, shortcut, createModifierStringFn) {
        const shortcutInfo = shortcut ? 
            `${shortcut.context}:${createModifierStringFn(shortcut.ctrlKey, shortcut.altKey, shortcut.shiftKey)}${shortcut.key}` :
            'unknown shortcut';
        
        console.error(`KeyboardShortcutManager: Error executing shortcut '${shortcutInfo}':`, error.message || error);
        
        if (this.debug) {
            console.error('Shortcut configuration:', shortcut);
            console.error('Full error object:', error);
        }
    }

    /**
     * Log initialization message
     */
    logInitialization() {
        if (this.debug) {
            console.log('KeyboardShortcutManager initialized with debug mode enabled');
        }
    }

    /**
     * Log key event processing
     * @param {KeyboardEvent} event - The keyboard event
     */
    logKeyEventProcessing(event) {
        if (this.debug) {
            console.log('KeyboardShortcutManager: Processing key event', {
                key: event.key || '',
                ctrlKey: Boolean(event.ctrlKey),
                altKey: Boolean(event.altKey),
                shiftKey: Boolean(event.shiftKey),
                target: event.target?.tagName || 'unknown'
            });
        }
    }

    /**
     * Log invalid event warning
     */
    logInvalidEvent() {
        if (this.debug) {
            console.warn('KeyboardShortcutManager: Invalid event object received');
        }
    }

    /**
     * Log shortcut registration
     * @param {string} shortcutKey - The shortcut key identifier
     * @param {Object} shortcutConfig - The shortcut configuration
     */
    logShortcutRegistration(shortcutKey, shortcutConfig) {
        if (this.debug) {
            console.log(`Registered shortcut: ${shortcutKey}`, shortcutConfig);
        }
    }

    /**
     * Log statistics reset
     */
    logStatisticsReset() {
        if (this.debug) {
            console.log('Usage statistics reset');
        }
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebugLogger;
} else {
    window.DebugLogger = DebugLogger;
}