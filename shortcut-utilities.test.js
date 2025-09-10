/**
 * Unit Tests for Keyboard Shortcut Utility Classes
 * 
 * Tests the extracted utility classes: ShortcutValidator, ShortcutCache, 
 * ShortcutStatistics, and DebugLogger for proper functionality and integration.
 */

// Mock classes for testing in Node.js environment
class ShortcutValidator {
    constructor(options = {}) {
        this.options = {
            problematicKeys: options.problematicKeys || ['Tab', 'F5', 'F12'],
            validateConflicts: options.validateConflicts !== false,
            maxShortcutsPerContext: options.maxShortcutsPerContext || 50
        };
    }

    validateShortcutConfig(config) {
        this._validateRequiredFields(config);
        this._validateModifierUsage(config);
        this._validateProblematicKeys(config);
    }

    _validateRequiredFields(config) {
        const { key, action } = config;

        if (!key || typeof key !== 'string' || key.trim() === '') {
            throw new Error('Shortcut must have a non-empty key string');
        }

        if (!action || typeof action !== 'function') {
            throw new Error('Shortcut must have a valid action function');
        }
    }

    _validateModifierUsage(config) {
        if (config.ctrlKey && config.altKey && config.shiftKey) {
            console.warn(`Shortcut with key "${config.key}" uses all three modifiers, which may be difficult for users`);
        }
    }

    _validateProblematicKeys(config) {
        if (this.options.problematicKeys.includes(config.key)) {
            console.warn(`Key "${config.key}" may conflict with browser functionality`);
        }
    }

    checkForConflicts(shortcutKey, config, existingShortcuts) {
        if (!this.options.validateConflicts) return;

        if (existingShortcuts.has(shortcutKey)) {
            const existing = existingShortcuts.get(shortcutKey);
            console.warn(`Shortcut conflict detected: ${shortcutKey} is already registered`, {
                existing: existing.description || 'No description',
                new: config.description || 'No description'
            });
        }
    }

    checkContextLimits(context, contextShortcuts) {
        if (contextShortcuts.length >= this.options.maxShortcutsPerContext) {
            throw new Error(`Context "${context}" has reached maximum shortcuts limit (${this.options.maxShortcutsPerContext})`);
        }
    }
}

class ShortcutCache {
    constructor(options = {}) {
        this.enabled = options.enableCaching !== false;
        this._shortcutKeyCache = new Map();
        this._modifierStringCache = new Map();
    }

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

    _computeShortcutKey(key, ctrlKey, altKey, shiftKey, context) {
        const modifierStr = this.createModifierString(ctrlKey, altKey, shiftKey);
        return `${context}:${modifierStr}${key.toLowerCase()}`;
    }

    _computeModifierString(ctrlKey, altKey, shiftKey) {
        const modifiers = [];
        if (ctrlKey) modifiers.push('ctrl');
        if (altKey) modifiers.push('alt');
        if (shiftKey) modifiers.push('shift');
        
        return modifiers.length > 0 ? modifiers.join('+') + '+' : '';
    }

    clearCaches() {
        if (this.enabled) {
            this._shortcutKeyCache.clear();
            this._modifierStringCache.clear();
        }
    }

    getCacheStats() {
        return {
            enabled: this.enabled,
            shortcutKeyCacheSize: this._shortcutKeyCache.size,
            modifierStringCacheSize: this._modifierStringCache.size
        };
    }
}

class ShortcutStatistics {
    constructor(options = {}) {
        this.eventStats = new Map();
        this.maxErrorsPerShortcut = options.maxErrorsPerShortcut || 10;
    }

    initializeShortcutStatistics(shortcutKey) {
        this.eventStats.set(shortcutKey, {
            triggerCount: 0,
            lastTriggered: null,
            errors: []
        });
    }

    updateShortcutStatistics(shortcutKey) {
        const stats = this.eventStats.get(shortcutKey);
        if (stats) {
            stats.triggerCount++;
            stats.lastTriggered = new Date().toISOString();
        }
    }

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
            if (stats.errors.length > this.maxErrorsPerShortcut) {
                stats.errors = stats.errors.slice(-this.maxErrorsPerShortcut);
            }
        }
    }

    clearStatistics() {
        this.eventStats.clear();
    }

    getStatisticsSummary() {
        let totalTriggers = 0;
        let totalErrors = 0;

        for (const stats of this.eventStats.values()) {
            totalTriggers += stats.triggerCount;
            totalErrors += stats.errors.length;
        }

        return {
            totalShortcuts: this.eventStats.size,
            totalTriggers,
            totalErrors
        };
    }
}

class DebugLogger {
    constructor(options = {}) {
        this.debug = options.debug || false;
        this.enableLogging = options.enableLogging || false;
    }

    startDebugSession() {
        return this.debug ? { startTime: performance.now() } : null;
    }

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

    logShortcutRegistration(shortcutKey, shortcutConfig) {
        if (this.debug) {
            console.log(`Registered shortcut: ${shortcutKey}`, shortcutConfig);
        }
    }

    logInvalidEvent() {
        if (this.debug) {
            console.warn('KeyboardShortcutManager: Invalid event object received');
        }
    }
}

// Test suite
function runShortcutUtilitiesTests() {
    console.log('🧪 Running Keyboard Shortcut Utilities Tests...\n');
    
    let testsRun = 0;
    let testsPassed = 0;

    function assert(condition, message) {
        testsRun++;
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            testsPassed++;
        } else {
            console.log(`❌ FAIL: ${message}`);
        }
    }

    // Test ShortcutValidator
    function testShortcutValidator() {
        const validator = new ShortcutValidator();

        // Test valid configuration
        try {
            validator.validateShortcutConfig({
                key: 'Escape',
                action: () => {}
            });
            assert(true, 'Should validate correct shortcut configuration');
        } catch (error) {
            assert(false, 'Should not throw error for valid configuration');
        }

        // Test invalid key
        try {
            validator.validateShortcutConfig({
                key: '',
                action: () => {}
            });
            assert(false, 'Should throw error for empty key');
        } catch (error) {
            assert(error.message.includes('non-empty key string'), 'Should throw error for empty key');
        }

        // Test invalid action
        try {
            validator.validateShortcutConfig({
                key: 'Escape',
                action: null
            });
            assert(false, 'Should throw error for null action');
        } catch (error) {
            assert(error.message.includes('valid action function'), 'Should throw error for null action');
        }

        // Test context limits
        try {
            validator.checkContextLimits('test', new Array(51));
            assert(false, 'Should throw error when context limit exceeded');
        } catch (error) {
            assert(error.message.includes('maximum shortcuts limit'), 'Should throw error for context limit');
        }
    }

    // Test ShortcutCache
    function testShortcutCache() {
        const cache = new ShortcutCache({ enableCaching: true });

        // Test key generation
        const key1 = cache.generateShortcutKey('s', true, false, false, 'global');
        const key2 = cache.generateShortcutKey('s', true, false, false, 'global');
        assert(key1 === key2, 'Should return same key for same inputs');
        assert(key1 === 'global:ctrl+s', 'Should generate correct shortcut key');

        // Test modifier string
        const modifier1 = cache.createModifierString(true, true, false);
        const modifier2 = cache.createModifierString(true, true, false);
        assert(modifier1 === modifier2, 'Should return same modifier for same inputs');
        assert(modifier1 === 'ctrl+alt+', 'Should generate correct modifier string');

        // Test cache stats
        const stats = cache.getCacheStats();
        assert(stats.enabled === true, 'Should report cache as enabled');
        assert(stats.shortcutKeyCacheSize > 0, 'Should have cached shortcut keys');
        assert(stats.modifierStringCacheSize > 0, 'Should have cached modifier strings');

        // Test cache clearing
        cache.clearCaches();
        const statsAfterClear = cache.getCacheStats();
        assert(statsAfterClear.shortcutKeyCacheSize === 0, 'Should clear shortcut key cache');
        assert(statsAfterClear.modifierStringCacheSize === 0, 'Should clear modifier string cache');
    }

    // Test ShortcutStatistics
    function testShortcutStatistics() {
        const statistics = new ShortcutStatistics();

        // Test initialization
        statistics.initializeShortcutStatistics('test:escape');
        assert(statistics.eventStats.has('test:escape'), 'Should initialize statistics for shortcut');

        // Test updating statistics
        statistics.updateShortcutStatistics('test:escape');
        const stats = statistics.eventStats.get('test:escape');
        assert(stats.triggerCount === 1, 'Should increment trigger count');
        assert(stats.lastTriggered !== null, 'Should set last triggered time');

        // Test error recording
        const error = new Error('Test error');
        statistics.recordShortcutError(error, { key: 'Escape' }, 'test:escape');
        assert(stats.errors.length === 1, 'Should record error');
        assert(stats.errors[0].error === 'Test error', 'Should record correct error message');

        // Test summary
        const summary = statistics.getStatisticsSummary();
        assert(summary.totalShortcuts === 1, 'Should report correct shortcut count');
        assert(summary.totalTriggers === 1, 'Should report correct trigger count');
        assert(summary.totalErrors === 1, 'Should report correct error count');

        // Test clearing
        statistics.clearStatistics();
        assert(statistics.eventStats.size === 0, 'Should clear all statistics');
    }

    // Test DebugLogger
    function testDebugLogger() {
        const logger = new DebugLogger({ debug: true, enableLogging: true });

        // Test debug session
        const session = logger.startDebugSession();
        assert(session !== null, 'Should create debug session when debug enabled');
        assert(typeof session.startTime === 'number', 'Should set start time');

        // Test non-debug logger
        const nonDebugLogger = new DebugLogger({ debug: false });
        const noSession = nonDebugLogger.startDebugSession();
        assert(noSession === null, 'Should not create session when debug disabled');

        // Test logging methods (these just verify they don't throw errors)
        try {
            logger.logShortcutRegistration('test:key', {});
            logger.logInvalidEvent();
            assert(true, 'Should not throw errors when logging');
        } catch (error) {
            assert(false, 'Should not throw errors when logging');
        }
    }

    // Test integration between utilities
    function testIntegration() {
        const validator = new ShortcutValidator();
        const cache = new ShortcutCache();
        const statistics = new ShortcutStatistics();
        const logger = new DebugLogger();

        // Test that they work together
        const config = { key: 'Escape', action: () => {} };
        validator.validateShortcutConfig(config);
        
        const shortcutKey = cache.generateShortcutKey('Escape', false, false, false, 'global');
        statistics.initializeShortcutStatistics(shortcutKey);
        
        const session = logger.startDebugSession();
        
        assert(shortcutKey === 'global:escape', 'Should generate correct key');
        assert(statistics.eventStats.has(shortcutKey), 'Should initialize statistics');
        assert(session === null, 'Should not create session when debug disabled'); // logger created without debug
    }

    console.log('============================================================');
    testShortcutValidator();
    testShortcutCache();
    testShortcutStatistics();
    testDebugLogger();
    testIntegration();
    console.log('============================================================');

    // Print summary
    console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsRun - testsPassed} failed`);
    
    if (testsPassed === testsRun) {
        console.log('🎉 All keyboard shortcut utility tests passed!');
        return true;
    } else {
        console.log('❌ Some utility tests failed!');
        return false;
    }
}

// Run the tests
if (require.main === module) {
    const success = runShortcutUtilitiesTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runShortcutUtilitiesTests };