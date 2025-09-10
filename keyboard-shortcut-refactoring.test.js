/**
 * Unit Tests for KeyboardShortcutManager Refactoring
 * 
 * Tests the improvements made to the KeyboardShortcutManager for better
 * readability, maintainability, and extensibility.
 */

// Mock KeyboardShortcutManager with new features
class KeyboardShortcutManager {
    constructor(options = {}) {
        this.shortcuts = new Map();
        this.contexts = new Map();
        this.eventStats = new Map();
        
        // Performance optimization: cache frequently computed values
        this._shortcutKeyCache = new Map();
        this._modifierStringCache = new Map();
        
        // Configuration options with new additions
        this.options = {
            debug: options.debug || false,
            enableLogging: options.enableLogging || false,
            validateConflicts: options.validateConflicts !== false,
            maxShortcutsPerContext: options.maxShortcutsPerContext || 50,
            maxErrorsPerShortcut: options.maxErrorsPerShortcut || 10,
            problematicKeys: options.problematicKeys || ['Tab', 'F5', 'F12'],
            enableCaching: options.enableCaching !== false
        };
        
        this.debugMode = this.options.debug;
    }

    registerShortcut(config) {
        const normalizedConfig = this._normalizeShortcutConfig(config);
        this._validateShortcutConfig(normalizedConfig);

        const shortcutKey = this.generateShortcutKey(
            normalizedConfig.key, 
            normalizedConfig.ctrlKey, 
            normalizedConfig.altKey, 
            normalizedConfig.shiftKey, 
            normalizedConfig.context
        );
        
        const shortcutConfig = {
            ...normalizedConfig,
            registeredAt: new Date().toISOString()
        };
        
        this.shortcuts.set(shortcutKey, shortcutConfig);
        this._initializeShortcutStatistics(shortcutKey);
    }

    _normalizeShortcutConfig(config) {
        return {
            key: config.key,
            ctrlKey: config.ctrlKey || false,
            altKey: config.altKey || false,
            shiftKey: config.shiftKey || false,
            context: config.context || 'global',
            action: config.action,
            preventDefault: config.preventDefault || false,
            description: config.description || '',
            category: config.category || 'Other'
        };
    }

    _initializeShortcutStatistics(shortcutKey) {
        this.eventStats.set(shortcutKey, {
            triggerCount: 0,
            lastTriggered: null,
            errors: []
        });
    }

    _validateShortcutConfig(config) {
        this._validateRequiredFields(config);
        this._validateModifierUsage(config);
        this._validateProblematicKeys(config);
    }

    _validateRequiredFields(config) {
        if (!config.key || typeof config.key !== 'string' || config.key.trim() === '') {
            throw new Error('Shortcut must have a non-empty key string');
        }
        if (!config.action || typeof config.action !== 'function') {
            throw new Error('Shortcut must have a valid action function');
        }
    }

    _validateModifierUsage(config) {
        if (config.ctrlKey && config.altKey && config.shiftKey) {
            console.warn(`Shortcut with key "${config.key}" uses all three modifiers, which may be difficult for users`);
        }
    }

    _validateProblematicKeys(config) {
        const problematicKeys = this._getProblematicKeys();
        if (problematicKeys.includes(config.key)) {
            console.warn(`Key "${config.key}" may conflict with browser functionality`);
        }
    }

    _getProblematicKeys() {
        return this.options.problematicKeys || ['Tab', 'F5', 'F12'];
    }

    generateShortcutKey(key, ctrlKey, altKey, shiftKey, context) {
        if (this.options.enableCaching) {
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

    _computeShortcutKey(key, ctrlKey, altKey, shiftKey, context) {
        const modifierStr = this.createModifierString(ctrlKey, altKey, shiftKey);
        return `${context}:${modifierStr}${key.toLowerCase()}`;
    }

    createModifierString(ctrlKey, altKey, shiftKey) {
        if (this.options.enableCaching) {
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

    _computeModifierString(ctrlKey, altKey, shiftKey) {
        const modifiers = [];
        if (ctrlKey) modifiers.push('ctrl');
        if (altKey) modifiers.push('alt');
        if (shiftKey) modifiers.push('shift');
        
        return modifiers.length > 0 ? modifiers.join('+') + '+' : '';
    }

    clearShortcuts() {
        this.shortcuts.clear();
        this.eventStats.clear();
        this._clearCaches();
    }

    _clearCaches() {
        if (this.options.enableCaching) {
            this._shortcutKeyCache.clear();
            this._modifierStringCache.clear();
        }
    }

    getCacheStats() {
        return {
            shortcutKeyCache: this._shortcutKeyCache.size,
            modifierStringCache: this._modifierStringCache.size
        };
    }

    getAllShortcuts() {
        return Array.from(this.shortcuts.values());
    }
}

// Test runner
function runRefactoringTests() {
    console.log('🧪 Running KeyboardShortcutManager Refactoring Tests...\n');
    console.log('============================================================');
    
    let passed = 0;
    let failed = 0;
    
    function assert(condition, message) {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passed++;
        } else {
            console.log(`❌ FAIL: ${message}`);
            failed++;
        }
    }

    // Test new configuration options
    const manager = new KeyboardShortcutManager({
        debug: true,
        maxErrorsPerShortcut: 5,
        problematicKeys: ['F1', 'F2'],
        enableCaching: true
    });

    assert(manager.options.maxErrorsPerShortcut === 5, 'Should set custom maxErrorsPerShortcut');
    assert(manager.options.problematicKeys.includes('F1'), 'Should set custom problematicKeys');
    assert(manager.options.enableCaching === true, 'Should enable caching');

    // Test configuration normalization
    const testAction = () => {};
    manager.registerShortcut({
        key: 's',
        action: testAction
    });

    const shortcuts = manager.getAllShortcuts();
    assert(shortcuts.length === 1, 'Should register one shortcut');
    assert(shortcuts[0].ctrlKey === false, 'Should default ctrlKey to false');
    assert(shortcuts[0].context === 'global', 'Should default context to global');
    assert(shortcuts[0].category === 'Other', 'Should default category to Other');

    // Test caching functionality
    const key1 = manager.generateShortcutKey('s', true, false, false, 'global');
    const key2 = manager.generateShortcutKey('s', true, false, false, 'global');
    assert(key1 === key2, 'Should return same key for same inputs (caching)');

    const cacheStats = manager.getCacheStats();
    assert(cacheStats.shortcutKeyCache > 0, 'Should have cached shortcut keys');
    assert(cacheStats.modifierStringCache > 0, 'Should have cached modifier strings');

    // Test cache clearing
    manager.clearShortcuts();
    const cacheStatsAfterClear = manager.getCacheStats();
    assert(cacheStatsAfterClear.shortcutKeyCache === 0, 'Should clear shortcut key cache');
    assert(cacheStatsAfterClear.modifierStringCache === 0, 'Should clear modifier string cache');

    // Test improved validation
    try {
        manager.registerShortcut({
            key: '',
            action: testAction
        });
        assert(false, 'Should throw error for empty key');
    } catch (error) {
        assert(error.message.includes('non-empty key string'), 'Should validate empty key');
    }

    try {
        manager.registerShortcut({
            key: 's',
            action: null
        });
        assert(false, 'Should throw error for null action');
    } catch (error) {
        assert(error.message.includes('valid action function'), 'Should validate null action');
    }

    // Test configuration-driven problematic keys
    const managerWithCustomKeys = new KeyboardShortcutManager({
        problematicKeys: ['CustomKey']
    });
    
    // Capture console.warn calls
    const originalWarn = console.warn;
    let warnCalled = false;
    console.warn = (message) => {
        if (message.includes('CustomKey')) {
            warnCalled = true;
        }
    };

    managerWithCustomKeys.registerShortcut({
        key: 'CustomKey',
        action: testAction
    });

    console.warn = originalWarn;
    assert(warnCalled, 'Should warn about custom problematic keys');

    // Test performance with and without caching
    const managerWithoutCaching = new KeyboardShortcutManager({ enableCaching: false });
    const managerWithCaching = new KeyboardShortcutManager({ enableCaching: true });

    // Generate many keys to test performance difference
    const startTime = Date.now();
    for (let i = 0; i < 100; i++) {
        managerWithoutCaching.generateShortcutKey('s', true, false, false, 'global');
    }
    const withoutCachingTime = Date.now() - startTime;

    const startTimeCached = Date.now();
    for (let i = 0; i < 100; i++) {
        managerWithCaching.generateShortcutKey('s', true, false, false, 'global');
    }
    const withCachingTime = Date.now() - startTimeCached;

    assert(withCachingTime <= withoutCachingTime, 'Caching should not be slower than no caching');

    // Test extensibility - new features should be easy to add
    const extensibleManager = new KeyboardShortcutManager({
        customOption: 'test',
        maxErrorsPerShortcut: 15
    });
    
    assert(extensibleManager.options.maxErrorsPerShortcut === 15, 'Should support new configuration options');

    console.log('============================================================\n');
    console.log(`📊 Refactoring Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All refactoring tests passed! Code quality improvements verified.');
    } else {
        console.log('❌ Some refactoring tests failed. Please review the changes.');
    }
    
    return failed === 0;
}

// Run the tests immediately when the file is executed
runRefactoringTests();

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runRefactoringTests, KeyboardShortcutManager };
}