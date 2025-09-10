/**
 * ArchiveManager - Handles archiving of completed todos for better performance
 * Automatically archives old completed todos to improve app responsiveness
 */
class ArchiveManager {
    constructor(storageManager = window.storageManager) {
        this.storage = storageManager;
        this.archiveThreshold = 100; // Archive when more than 100 completed todos
        this.autoArchiveAge = 30; // Auto-archive completed todos older than 30 days
    }

    /**
     * Archive completed todos based on age and count thresholds
     * @param {Array} todos - Current todos array
     * @returns {Object} Result with updated todos and archived count
     */
    archiveCompletedTodos(todos) {
        if (!Array.isArray(todos)) {
            return { todos, archivedCount: 0 };
        }

        const now = new Date();
        const cutoffDate = new Date(now.getTime() - (this.autoArchiveAge * 24 * 60 * 60 * 1000));
        
        const completed = todos.filter(todo => todo.completed);
        const activeOrRecentCompleted = [];
        const toArchive = [];

        // Separate todos into active/recent and old completed
        todos.forEach(todo => {
            if (!todo.completed) {
                // Keep all active todos
                activeOrRecentCompleted.push(todo);
            } else {
                const completedDate = new Date(todo.completedAt || todo.createdAt);
                if (completedDate > cutoffDate && completed.length <= this.archiveThreshold) {
                    // Keep recent completed todos if under threshold
                    activeOrRecentCompleted.push(todo);
                } else {
                    // Archive old or excess completed todos
                    toArchive.push(todo);
                }
            }
        });

        // Archive the todos
        if (toArchive.length > 0) {
            this.addToArchive(toArchive);
        }

        return {
            todos: activeOrRecentCompleted,
            archivedCount: toArchive.length
        };
    }

    /**
     * Add todos to the archive
     * @param {Array} todos - Todos to archive
     */
    addToArchive(todos) {
        try {
            const existingArchive = this.getArchive();
            const updatedArchive = [...existingArchive, ...todos];
            
            // Sort by completion date (newest first)
            updatedArchive.sort((a, b) => {
                const aDate = new Date(a.completedAt || a.createdAt);
                const bDate = new Date(b.completedAt || b.createdAt);
                return bDate - aDate;
            });

            this.storage.setItem('archivedTodos', JSON.stringify(updatedArchive));
            console.log(`Archived ${todos.length} completed todos`);
        } catch (error) {
            console.error('Failed to archive todos:', error);
        }
    }

    /**
     * Get archived todos
     * @returns {Array} Archived todos
     */
    getArchive() {
        try {
            const archived = this.storage.getItem('archivedTodos');
            return archived ? JSON.parse(archived) : [];
        } catch (error) {
            console.error('Failed to load archived todos:', error);
            return [];
        }
    }

    /**
     * Search archived todos
     * @param {string} searchTerm - Search term
     * @returns {Array} Matching archived todos
     */
    searchArchive(searchTerm) {
        if (!searchTerm || !searchTerm.trim()) {
            return [];
        }

        const archived = this.getArchive();
        const normalizedTerm = searchTerm.toLowerCase().trim();
        
        return archived.filter(todo => 
            todo.text.toLowerCase().includes(normalizedTerm)
        );
    }

    /**
     * Restore a todo from archive
     * @param {string} todoId - ID of todo to restore
     * @returns {Object|null} Restored todo or null if not found
     */
    restoreFromArchive(todoId) {
        try {
            const archived = this.getArchive();
            const todoIndex = archived.findIndex(todo => todo.id === todoId);
            
            if (todoIndex === -1) {
                return null;
            }

            const [restoredTodo] = archived.splice(todoIndex, 1);
            this.storage.setItem('archivedTodos', JSON.stringify(archived));
            
            return restoredTodo;
        } catch (error) {
            console.error('Failed to restore todo from archive:', error);
            return null;
        }
    }

    /**
     * Clear old archived todos to prevent unlimited growth
     * @param {number} maxAge - Maximum age in days (default: 365)
     */
    cleanupOldArchive(maxAge = 365) {
        try {
            const archived = this.getArchive();
            const cutoffDate = new Date(Date.now() - (maxAge * 24 * 60 * 60 * 1000));
            
            const recentArchive = archived.filter(todo => {
                const todoDate = new Date(todo.completedAt || todo.createdAt);
                return todoDate > cutoffDate;
            });

            if (recentArchive.length !== archived.length) {
                this.storage.setItem('archivedTodos', JSON.stringify(recentArchive));
                console.log(`Cleaned up ${archived.length - recentArchive.length} old archived todos`);
            }
        } catch (error) {
            console.error('Failed to cleanup old archive:', error);
        }
    }

    /**
     * Get archive statistics
     * @returns {Object} Archive stats
     */
    getArchiveStats() {
        const archived = this.getArchive();
        return {
            count: archived.length,
            oldestDate: archived.length > 0 ? 
                archived[archived.length - 1].completedAt || archived[archived.length - 1].createdAt : null,
            newestDate: archived.length > 0 ? 
                archived[0].completedAt || archived[0].createdAt : null
        };
    }
}