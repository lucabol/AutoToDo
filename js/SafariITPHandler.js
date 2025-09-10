/**
 * SafariITPHandler - Handles Safari 14+ Intelligent Tracking Prevention data loss issues
 * 
 * Safari 14+ includes Intelligent Tracking Prevention (ITP) which automatically clears
 * localStorage after 7 days of inactivity. This module provides comprehensive protection
 * against data loss by:
 * 
 * - Requesting persistent storage permission using the Storage API
 * - Tracking user activity to reset the 7-day ITP timer
 * - Providing user notifications about data persistence status
 * - Offering backup/restore functionality for user data protection
 * - Detecting when data might be at risk of clearing
 */
class SafariITPHandler {
    constructor() {
        this.isInitialized = false;
        this.persistentStorageGranted = false;
        this.lastActivityKey = 'autotodo_last_activity';
        this.dataBackupKey = 'autotodo_backup_data';
        this.warningShownKey = 'autotodo_itp_warning_shown';
        this.activityTrackingEnabled = true;
        
        // ITP clearing happens after 7 days, we'll warn at 6 days
        this.WARNING_THRESHOLD_DAYS = 6;
        this.ITP_CLEARING_DAYS = 7;
        
        this.init();
    }

    /**
     * Initialize the ITP handler
     * Sets up persistent storage requests and activity tracking
     */
    async init() {
        try {
            console.log('SafariITPHandler: Initializing...');
            
            // Check if we're in Safari and potentially affected by ITP
            this.isSafariWithITP = this.detectSafariITP();
            
            if (this.isSafariWithITP) {
                console.log('SafariITPHandler: Safari with ITP detected, enabling protections');
                
                // Request persistent storage if supported
                await this.requestPersistentStorage();
                
                // Set up activity tracking
                this.setupActivityTracking();
                
                // Check for potential data loss risk
                this.checkDataLossRisk();
                
                // Update last activity timestamp
                this.updateLastActivity();
            } else {
                console.log('SafariITPHandler: Not Safari with ITP, minimal initialization');
            }
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('SafariITPHandler: Initialization failed:', error);
            this.isInitialized = true; // Continue with basic functionality
        }
    }

    /**
     * Detect if we're running in Safari with ITP enabled
     * @returns {boolean} True if Safari 14+ with potential ITP issues
     */
    detectSafariITP() {
        if (typeof navigator === 'undefined') return false;
        
        const userAgent = navigator.userAgent;
        const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
        
        if (!isSafari) return false;
        
        // Extract Safari version - ITP affects Safari 14+
        const versionMatch = userAgent.match(/Version\/(\d+)/);
        if (versionMatch) {
            const version = parseInt(versionMatch[1], 10);
            return version >= 14;
        }
        
        // If we can't determine version, assume modern Safari has ITP
        return true;
    }

    /**
     * Request persistent storage permission to prevent automatic clearing
     * Uses the Storage API if available
     */
    async requestPersistentStorage() {
        try {
            if ('storage' in navigator && 'persist' in navigator.storage) {
                console.log('SafariITPHandler: Requesting persistent storage permission...');
                
                const granted = await navigator.storage.persist();
                this.persistentStorageGranted = granted;
                
                if (granted) {
                    console.log('SafariITPHandler: Persistent storage granted - data protected from ITP clearing');
                    this.showPersistentStorageSuccess();
                } else {
                    console.warn('SafariITPHandler: Persistent storage denied - data may be cleared after 7 days of inactivity');
                    this.showPersistentStorageWarning();
                }
                
                return granted;
            } else {
                console.warn('SafariITPHandler: Storage API not supported - cannot request persistent storage');
                return false;
            }
        } catch (error) {
            console.error('SafariITPHandler: Error requesting persistent storage:', error);
            return false;
        }
    }

    /**
     * Set up activity tracking to reset the ITP 7-day timer
     * Tracks user interactions and updates localStorage to reset the timer
     */
    setupActivityTracking() {
        if (!this.activityTrackingEnabled) return;
        
        console.log('SafariITPHandler: Setting up activity tracking...');
        
        // List of events that should reset the ITP timer
        const activityEvents = [
            'click',
            'keydown',
            'focus',
            'scroll',
            'touchstart',
            'mousedown'
        ];
        
        // Throttle activity updates to avoid excessive localStorage writes
        let lastUpdate = 0;
        const updateThrottle = 60000; // 1 minute
        
        const handleActivity = () => {
            const now = Date.now();
            if (now - lastUpdate > updateThrottle) {
                this.updateLastActivity();
                lastUpdate = now;
            }
        };
        
        // Add event listeners
        activityEvents.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });
        
        // Also track when the app becomes visible again
        if ('visibilitychange' in document) {
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    this.updateLastActivity();
                }
            });
        }
        
        console.log('SafariITPHandler: Activity tracking enabled');
    }

    /**
     * Update the last activity timestamp
     * This resets the Safari ITP 7-day timer by updating localStorage
     */
    updateLastActivity() {
        try {
            const timestamp = Date.now();
            localStorage.setItem(this.lastActivityKey, timestamp.toString());
            
            // Also create a backup in sessionStorage as additional protection
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem(this.lastActivityKey, timestamp.toString());
            }
            
            console.debug('SafariITPHandler: Activity timestamp updated');
        } catch (error) {
            console.warn('SafariITPHandler: Failed to update activity timestamp:', error);
        }
    }

    /**
     * Check if data is at risk of being cleared by ITP
     * Warns user if approaching the 7-day limit
     */
    checkDataLossRisk() {
        try {
            const lastActivity = this.getLastActivity();
            const now = Date.now();
            const daysSinceActivity = (now - lastActivity) / (1000 * 60 * 60 * 24);
            
            console.log(`SafariITPHandler: Days since last activity: ${daysSinceActivity.toFixed(1)}`);
            
            if (daysSinceActivity >= this.WARNING_THRESHOLD_DAYS) {
                this.showDataLossWarning(daysSinceActivity);
            }
            
            // Return risk level
            if (daysSinceActivity >= this.ITP_CLEARING_DAYS) {
                return 'critical'; // Data likely already cleared
            } else if (daysSinceActivity >= this.WARNING_THRESHOLD_DAYS) {
                return 'warning'; // Approaching clearing threshold
            } else {
                return 'safe'; // Data is safe
            }
            
        } catch (error) {
            console.error('SafariITPHandler: Error checking data loss risk:', error);
            return 'unknown';
        }
    }

    /**
     * Get the last activity timestamp
     * @returns {number} Timestamp of last activity
     */
    getLastActivity() {
        try {
            // Try localStorage first
            const stored = localStorage.getItem(this.lastActivityKey);
            if (stored) {
                return parseInt(stored, 10);
            }
            
            // Fallback to sessionStorage
            if (typeof sessionStorage !== 'undefined') {
                const sessionStored = sessionStorage.getItem(this.lastActivityKey);
                if (sessionStored) {
                    return parseInt(sessionStored, 10);
                }
            }
            
            // If no activity recorded, assume current time (new user)
            return Date.now();
            
        } catch (error) {
            console.warn('SafariITPHandler: Error getting last activity:', error);
            return Date.now();
        }
    }

    /**
     * Create a backup of important data
     * @param {Object} data - Data to backup
     */
    createDataBackup(data) {
        try {
            const backup = {
                timestamp: Date.now(),
                data: data,
                version: '1.0'
            };
            
            const backupString = JSON.stringify(backup);
            
            // Store backup in localStorage with different key
            localStorage.setItem(this.dataBackupKey, backupString);
            
            // Also try to store in IndexedDB if available for additional protection
            this.storeBackupInIndexedDB(backup);
            
            console.log('SafariITPHandler: Data backup created');
            return true;
            
        } catch (error) {
            console.error('SafariITPHandler: Failed to create data backup:', error);
            return false;
        }
    }

    /**
     * Restore data from backup if main data is lost
     * @returns {Object|null} Restored data or null if no backup available
     */
    restoreFromBackup() {
        try {
            // Try localStorage backup first
            const backupString = localStorage.getItem(this.dataBackupKey);
            if (backupString) {
                const backup = JSON.parse(backupString);
                console.log('SafariITPHandler: Data restored from localStorage backup');
                return backup.data;
            }
            
            // Could also try IndexedDB backup here
            console.warn('SafariITPHandler: No backup data found');
            return null;
            
        } catch (error) {
            console.error('SafariITPHandler: Failed to restore from backup:', error);
            return null;
        }
    }

    /**
     * Store backup in IndexedDB for additional protection
     * @param {Object} backup - Backup data to store
     */
    async storeBackupInIndexedDB(backup) {
        try {
            if (!('indexedDB' in window)) {
                console.warn('SafariITPHandler: IndexedDB not available for backup');
                return;
            }
            
            // This is a simplified IndexedDB backup - could be enhanced
            const request = indexedDB.open('AutoTodoBackup', 1);
            
            request.onerror = () => {
                console.warn('SafariITPHandler: IndexedDB backup failed');
            };
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['backups'], 'readwrite');
                const store = transaction.objectStore('backups');
                store.put(backup, 'latest');
                console.log('SafariITPHandler: Data backup stored in IndexedDB');
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('backups')) {
                    db.createObjectStore('backups');
                }
            };
            
        } catch (error) {
            console.warn('SafariITPHandler: IndexedDB backup error:', error);
        }
    }

    /**
     * Show success message when persistent storage is granted
     */
    showPersistentStorageSuccess() {
        // Could show a subtle notification to user
        console.log('SafariITPHandler: Your todos are now protected from automatic clearing!');
    }

    /**
     * Show warning when persistent storage is denied
     */
    showPersistentStorageWarning() {
        // Don't show warning immediately to avoid disrupting user experience
        // Store flag to show warning later if data loss risk is detected
        console.warn('SafariITPHandler: Data may be cleared after 7 days of inactivity');
    }

    /**
     * Show data loss warning to user
     * @param {number} daysSinceActivity - Days since last activity
     */
    showDataLossWarning(daysSinceActivity) {
        // Check if warning was already shown recently to avoid spam
        const warningShown = localStorage.getItem(this.warningShownKey);
        const now = Date.now();
        
        if (warningShown && (now - parseInt(warningShown, 10)) < 24 * 60 * 60 * 1000) {
            return; // Don't show warning more than once per day
        }
        
        console.warn(`SafariITPHandler: Data loss risk - ${daysSinceActivity.toFixed(1)} days since last activity`);
        
        // Mark warning as shown
        localStorage.setItem(this.warningShownKey, now.toString());
        
        // In a real implementation, this could show a user-friendly notification
        // For now, we'll log detailed information
        this.logDataLossGuidance();
    }

    /**
     * Log guidance for users about data loss prevention
     */
    logDataLossGuidance() {
        console.log(`
SafariITPHandler: Data Loss Prevention Tips:
1. Use the app regularly to reset the 7-day timer
2. Add AutoToDo to your Home Screen (iOS) for better persistence
3. Consider backing up your todos periodically
4. Use regular (non-private) browsing mode
5. Check Safari Settings → Privacy → Prevent Cross-Site Tracking
        `);
    }

    /**
     * Get comprehensive status information about ITP protection
     * @returns {Object} Status information
     */
    getITPStatus() {
        const lastActivity = this.getLastActivity();
        const now = Date.now();
        const daysSinceActivity = (now - lastActivity) / (1000 * 60 * 60 * 24);
        const riskLevel = this.checkDataLossRisk();
        
        return {
            isInitialized: this.isInitialized,
            isSafariWithITP: this.isSafariWithITP,
            persistentStorageGranted: this.persistentStorageGranted,
            lastActivity: lastActivity,
            daysSinceActivity: daysSinceActivity,
            riskLevel: riskLevel,
            daysUntilClearing: Math.max(0, this.ITP_CLEARING_DAYS - daysSinceActivity),
            activityTrackingEnabled: this.activityTrackingEnabled
        };
    }

    /**
     * Manually trigger data backup
     * @param {Object} data - Data to backup
     * @returns {boolean} Success status
     */
    backup(data) {
        return this.createDataBackup(data);
    }

    /**
     * Manually trigger data restore
     * @returns {Object|null} Restored data
     */
    restore() {
        return this.restoreFromBackup();
    }

    /**
     * Reset the ITP timer by updating activity
     */
    resetTimer() {
        this.updateLastActivity();
    }

    /**
     * Disable activity tracking (for testing or user preference)
     */
    disableActivityTracking() {
        this.activityTrackingEnabled = false;
        console.log('SafariITPHandler: Activity tracking disabled');
    }

    /**
     * Enable activity tracking
     */
    enableActivityTracking() {
        this.activityTrackingEnabled = true;
        this.setupActivityTracking();
        console.log('SafariITPHandler: Activity tracking enabled');
    }
}

// Export for use by StorageManager
if (typeof window !== 'undefined') {
    window.SafariITPHandler = SafariITPHandler;
}

// Export for Node.js/testing environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SafariITPHandler };
}