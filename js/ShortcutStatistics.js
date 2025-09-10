/**
 * ShortcutStatistics - Handles usage statistics and error tracking for keyboard shortcuts
 * 
 * Extracted from KeyboardShortcutManager to improve code organization
 * and separate statistics management from the main class.
 */
class ShortcutStatistics {
    constructor(options = {}) {
        this.eventStats = new Map();
        this.maxErrorsPerShortcut = options.maxErrorsPerShortcut || 10;
    }

    /**
     * Initialize statistics tracking for a new shortcut
     * @param {string} shortcutKey - The shortcut key identifier
     */
    initializeShortcutStatistics(shortcutKey) {
        this.eventStats.set(shortcutKey, {
            triggerCount: 0,
            lastTriggered: null,
            errors: []
        });
    }

    /**
     * Update statistics for a triggered shortcut
     * @param {string} shortcutKey - The shortcut key identifier
     */
    updateShortcutStatistics(shortcutKey) {
        const stats = this.eventStats.get(shortcutKey);
        if (stats) {
            stats.triggerCount++;
            stats.lastTriggered = new Date().toISOString();
        }
    }

    /**
     * Record error in statistics for tracking
     * @param {Error} error - The error that occurred
     * @param {Object} shortcut - The shortcut configuration
     * @param {string} shortcutKey - The shortcut key identifier
     */
    recordShortcutError(error, shortcut, shortcutKey) {
        if (!shortcutKey) return;
        
        const stats = this.eventStats.get(shortcutKey);
        if (stats) {
            const errorInfo = {
                error: error.message,
                timestamp: new Date().toISOString(),
                shortcutKey,
                event: shortcut.key
            };
            
            stats.errors.push(errorInfo);
            // Keep only last N errors per shortcut to prevent memory bloat
            if (stats.errors.length > this.maxErrorsPerShortcut) {
                stats.errors = stats.errors.slice(-this.maxErrorsPerShortcut);
            }
        }
    }

    /**
     * Get usage statistics for all shortcuts
     * @param {Map} shortcuts - All registered shortcuts
     * @returns {Array} Array of shortcuts with usage statistics
     */
    getUsageStatistics(shortcuts) {
        const stats = [];
        
        for (const [shortcutKey, shortcut] of shortcuts.entries()) {
            const eventStats = this.eventStats.get(shortcutKey) || {
                triggerCount: 0,
                lastTriggered: null,
                errors: []
            };

            stats.push({
                shortcutKey,
                description: shortcut.description,
                context: shortcut.context,
                triggerCount: eventStats.triggerCount,
                lastTriggered: eventStats.lastTriggered,
                errorCount: eventStats.errors.length,
                registeredAt: shortcut.registeredAt
            });
        }

        return stats.sort((a, b) => b.triggerCount - a.triggerCount);
    }

    /**
     * Reset all usage statistics
     * @param {Map} shortcuts - All registered shortcuts
     */
    resetStatistics(shortcuts) {
        this.eventStats.clear();
        for (const shortcutKey of shortcuts.keys()) {
            this.initializeShortcutStatistics(shortcutKey);
        }
    }

    /**
     * Clear all statistics
     */
    clearStatistics() {
        this.eventStats.clear();
    }

    /**
     * Get statistics for a specific shortcut
     * @param {string} shortcutKey - The shortcut key identifier
     * @returns {Object|null} Statistics object or null if not found
     */
    getShortcutStatistics(shortcutKey) {
        return this.eventStats.get(shortcutKey) || null;
    }

    /**
     * Get total statistics summary
     * @returns {Object} Summary of all statistics
     */
    getStatisticsSummary() {
        let totalTriggers = 0;
        let totalErrors = 0;
        let mostUsedShortcut = null;
        let maxTriggers = 0;

        for (const [shortcutKey, stats] of this.eventStats.entries()) {
            totalTriggers += stats.triggerCount;
            totalErrors += stats.errors.length;
            
            if (stats.triggerCount > maxTriggers) {
                maxTriggers = stats.triggerCount;
                mostUsedShortcut = shortcutKey;
            }
        }

        return {
            totalShortcuts: this.eventStats.size,
            totalTriggers,
            totalErrors,
            mostUsedShortcut,
            mostUsedTriggerCount: maxTriggers
        };
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShortcutStatistics;
} else {
    window.ShortcutStatistics = ShortcutStatistics;
}