/**
 * ShortcutCache - Handles caching logic for keyboard shortcuts
 * 
 * Extracted from KeyboardShortcutManager to improve performance
 * and separate caching concerns from the main class.
 */
class ShortcutCache {
    constructor(options = {}) {
        this.enabled = options.enableCaching !== false; // true by default
        this._shortcutKeyCache = new Map();
        this._modifierStringCache = new Map();
    }

    /**
     * Generate a unique key for the shortcut with optional caching
     * @param {string} key - The key
     * @param {boolean} ctrlKey - Whether Ctrl key is required
     * @param {boolean} altKey - Whether Alt key is required  
     * @param {boolean} shiftKey - Whether Shift key is required
     * @param {string} context - The context
     * @returns {string} Unique shortcut key identifier
     */
    generateShortcutKey(key, ctrlKey, altKey, shiftKey, context) {
        if (this.enabled) {
            const cacheKey = `${key}-${ctrlKey}-${altKey}-${shiftKey}-${context}`;
            
            if (this._shortcutKeyCache.has(cacheKey)) {
                return this._shortcutKeyCache.get(cacheKey);
            }
            
            const shortcutKey = this._computeShortcutKey(key, ctrlKey, altKey, shiftKey, context);
            this._shortcutKeyCache.set(cacheKey, shortcutKey);
            return shortcutKey;
        }
        
        return this._computeShortcutKey(key, ctrlKey, altKey, shiftKey, context);
    }

    /**
     * Create a modifier string for shortcut key generation with optional caching
     * @param {boolean} ctrlKey - Whether Ctrl key is required
     * @param {boolean} altKey - Whether Alt key is required
     * @param {boolean} shiftKey - Whether Shift key is required
     * @returns {string} Modifier string with trailing '+' if modifiers exist
     */
    createModifierString(ctrlKey, altKey, shiftKey) {
        if (this.enabled) {
            const cacheKey = `${ctrlKey}-${altKey}-${shiftKey}`;
            
            if (this._modifierStringCache.has(cacheKey)) {
                return this._modifierStringCache.get(cacheKey);
            }
            
            const modifierString = this._computeModifierString(ctrlKey, altKey, shiftKey);
            this._modifierStringCache.set(cacheKey, modifierString);
            return modifierString;
        }
        
        return this._computeModifierString(ctrlKey, altKey, shiftKey);
    }

    /**
     * Compute the shortcut key without caching
     * @param {string} key - The key
     * @param {boolean} ctrlKey - Whether Ctrl key is required
     * @param {boolean} altKey - Whether Alt key is required
     * @param {boolean} shiftKey - Whether Shift key is required
     * @param {string} context - The context
     * @returns {string} Unique shortcut key identifier
     * @private
     */
    _computeShortcutKey(key, ctrlKey, altKey, shiftKey, context) {
        const modifierStr = this.createModifierString(ctrlKey, altKey, shiftKey);
        return `${context}:${modifierStr}${key.toLowerCase()}`;
    }

    /**
     * Compute modifier string without caching
     * @param {boolean} ctrlKey - Whether Ctrl key is required
     * @param {boolean} altKey - Whether Alt key is required
     * @param {boolean} shiftKey - Whether Shift key is required
     * @returns {string} Modifier string with trailing '+' if modifiers exist
     * @private
     */
    _computeModifierString(ctrlKey, altKey, shiftKey) {
        const modifiers = [];
        if (ctrlKey) modifiers.push('ctrl');
        if (altKey) modifiers.push('alt');
        if (shiftKey) modifiers.push('shift');
        
        // Return only the modifier portion for key generation - context and key
        // are handled separately in generateShortcutKey() for proper separation of concerns
        return modifiers.length > 0 ? modifiers.join('+') + '+' : '';
    }

    /**
     * Clear all caches
     */
    clearCaches() {
        if (this.enabled) {
            this._shortcutKeyCache.clear();
            this._modifierStringCache.clear();
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            enabled: this.enabled,
            shortcutKeyCacheSize: this._shortcutKeyCache.size,
            modifierStringCacheSize: this._modifierStringCache.size
        };
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShortcutCache;
} else {
    window.ShortcutCache = ShortcutCache;
}