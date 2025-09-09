/**
 * Unit Tests for KeyboardShortcutManager
 * 
 * Tests the modular keyboard shortcut handling system
 */

// Simple KeyboardShortcutManager class for testing
class KeyboardShortcutManager {
    constructor() {
        this.shortcuts = new Map();
        this.contexts = new Map();
    }

    registerShortcut(config) {
        const {
            key,
            ctrlKey = false,
            altKey = false,
            shiftKey = false,
            context = 'global',
            action,
            preventDefault = false,
            description = ''
        } = config;

        if (!key || typeof action !== 'function') {
            throw new Error('Shortcut must have a key and action function');
        }

        const shortcutKey = this.generateShortcutKey(key, ctrlKey, altKey, shiftKey, context);
        
        this.shortcuts.set(shortcutKey, {
            key,
            ctrlKey,
            altKey,
            shiftKey,
            context,
            action,
            preventDefault,
            description
        });
    }

    registerContext(contextName, conditionChecker) {
        if (typeof conditionChecker !== 'function') {
            throw new Error('Context condition checker must be a function');
        }
        this.contexts.set(contextName, conditionChecker);
    }

    generateShortcutKey(key, ctrlKey, altKey, shiftKey, context) {
        const modifierStr = this.createModifierString(ctrlKey, altKey, shiftKey);
        return `${context}:${modifierStr}${key.toLowerCase()}`;
    }

    createModifierString(ctrlKey, altKey, shiftKey) {
        const modifiers = [];
        if (ctrlKey) modifiers.push('ctrl');
        if (altKey) modifiers.push('alt');
        if (shiftKey) modifiers.push('shift');
        
        return modifiers.length > 0 ? modifiers.join('+') + '+' : '';
    }

    handleKeyboard(event) {
        const matchingShortcut = this.findMatchingShortcut(event);
        
        if (matchingShortcut) {
            return this.executeShortcut(matchingShortcut, event);
        }
        
        return false;
    }

    findMatchingShortcut(event) {
        const activeContexts = this.getActiveContexts();
        const contextOrder = [...activeContexts, 'global'];
        
        for (const context of contextOrder) {
            const shortcutKey = this.generateShortcutKey(
                event.key,
                event.ctrlKey,
                event.altKey,
                event.shiftKey,
                context
            );

            const shortcut = this.shortcuts.get(shortcutKey);
            if (shortcut) {
                return shortcut;
            }
        }
        
        return null;
    }

    executeShortcut(shortcut, event) {
        if (shortcut.preventDefault) {
            event.preventDefault();
        }
        
        try {
            shortcut.action(event);
            return true;
        } catch (error) {
            this.handleShortcutError(error);
            return false;
        }
    }

    handleShortcutError(error) {
        console.error('Error executing keyboard shortcut:', error);
    }

    getActiveContexts() {
        const active = [];
        for (const [contextName, checker] of this.contexts.entries()) {
            try {
                if (checker()) {
                    active.push(contextName);
                }
            } catch (error) {
                console.error(`Error checking context ${contextName}:`, error);
            }
        }
        return active;
    }

    getAllShortcuts() {
        return Array.from(this.shortcuts.values());
    }

    getShortcutsForContext(contextName) {
        return Array.from(this.shortcuts.values()).filter(
            shortcut => shortcut.context === contextName
        );
    }

    removeShortcut(key, context = 'global', ctrlKey = false, altKey = false, shiftKey = false) {
        const shortcutKey = this.generateShortcutKey(key, ctrlKey, altKey, shiftKey, context);
        return this.shortcuts.delete(shortcutKey);
    }

    getShortcutDescriptions() {
        const descriptions = [];
        
        for (const shortcut of this.shortcuts.values()) {
            if (shortcut.description) {
                const formattedDescription = this.formatShortcutDescription(shortcut);
                descriptions.push(formattedDescription);
            }
        }
        
        return this.sortShortcutDescriptions(descriptions);
    }

    formatShortcutDescription(shortcut) {
        const keyCombo = this.createKeyComboString(shortcut);
        
        return {
            keys: keyCombo,
            description: shortcut.description,
            context: shortcut.context
        };
    }

    createKeyComboString(shortcut) {
        const modifiers = this.getModifierStrings(shortcut);
        
        return modifiers.length > 0 
            ? `${modifiers.join('+')}+${shortcut.key}`
            : shortcut.key;
    }

    getModifierStrings(shortcut) {
        const modifiers = [];
        if (shortcut.ctrlKey) modifiers.push('Ctrl');
        if (shortcut.altKey) modifiers.push('Alt');
        if (shortcut.shiftKey) modifiers.push('Shift');
        return modifiers;
    }

    sortShortcutDescriptions(descriptions) {
        return descriptions.sort((a, b) => {
            if (a.context !== b.context) {
                return a.context.localeCompare(b.context);
            }
            return a.keys.localeCompare(b.keys);
        });
    }
}

// Test suite
function runKeyboardShortcutManagerTests() {
    console.log('🧪 Running KeyboardShortcutManager Tests...\n');
    
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

    // Test 1: Can create KeyboardShortcutManager instance
    function testManagerCreation() {
        const manager = new KeyboardShortcutManager();
        assert(manager instanceof KeyboardShortcutManager, 'Should create KeyboardShortcutManager instance');
        assert(typeof manager.registerShortcut === 'function', 'Should have registerShortcut method');
        assert(typeof manager.handleKeyboard === 'function', 'Should have handleKeyboard method');
    }

    // Test 2: Can register simple shortcut
    function testRegisterShortcut() {
        const manager = new KeyboardShortcutManager();
        let actionCalled = false;
        
        manager.registerShortcut({
            key: 'Escape',
            action: () => { actionCalled = true; }
        });
        
        const shortcuts = manager.getAllShortcuts();
        assert(shortcuts.length === 1, 'Should have one registered shortcut');
        assert(shortcuts[0].key === 'Escape', 'Should register Escape key');
        assert(typeof shortcuts[0].action === 'function', 'Should have action function');
    }

    // Test 3: Can register shortcut with modifiers
    function testRegisterShortcutWithModifiers() {
        const manager = new KeyboardShortcutManager();
        
        manager.registerShortcut({
            key: 's',
            ctrlKey: true,
            action: () => {},
            description: 'Save file'
        });
        
        const shortcuts = manager.getAllShortcuts();
        assert(shortcuts.length === 1, 'Should have one registered shortcut');
        assert(shortcuts[0].ctrlKey === true, 'Should register Ctrl modifier');
        assert(shortcuts[0].description === 'Save file', 'Should store description');
    }

    // Test 4: Can register context and context checker
    function testRegisterContext() {
        const manager = new KeyboardShortcutManager();
        let isActive = false;
        
        manager.registerContext('editing', () => isActive);
        
        // Initially not active
        assert(manager.getActiveContexts().length === 0, 'Should have no active contexts initially');
        
        // Activate context
        isActive = true;
        assert(manager.getActiveContexts().includes('editing'), 'Should detect active editing context');
    }

    // Test 5: Keyboard event handling with simple key
    function testKeyboardHandling() {
        const manager = new KeyboardShortcutManager();
        let actionCalled = false;
        
        manager.registerShortcut({
            key: 'Escape',
            action: () => { actionCalled = true; }
        });
        
        const mockEvent = {
            key: 'Escape',
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            preventDefault: () => {}
        };
        
        const handled = manager.handleKeyboard(mockEvent);
        assert(handled === true, 'Should return true when shortcut is handled');
        assert(actionCalled === true, 'Should execute action when shortcut matches');
    }

    // Test 6: Keyboard event handling with modifiers
    function testKeyboardHandlingWithModifiers() {
        const manager = new KeyboardShortcutManager();
        let actionCalled = false;
        let preventDefaultCalled = false;
        
        manager.registerShortcut({
            key: 's',
            ctrlKey: true,
            action: () => { actionCalled = true; },
            preventDefault: true
        });
        
        const mockEvent = {
            key: 's',
            ctrlKey: true,
            altKey: false,
            shiftKey: false,
            preventDefault: () => { preventDefaultCalled = true; }
        };
        
        const handled = manager.handleKeyboard(mockEvent);
        assert(handled === true, 'Should handle Ctrl+S shortcut');
        assert(actionCalled === true, 'Should execute action');
        assert(preventDefaultCalled === true, 'Should prevent default when configured');
    }

    // Test 7: Context-specific shortcuts
    function testContextSpecificShortcuts() {
        const manager = new KeyboardShortcutManager();
        let globalActionCalled = false;
        let editingActionCalled = false;
        let isEditing = false;
        
        manager.registerContext('editing', () => isEditing);
        
        manager.registerShortcut({
            key: 'Escape',
            context: 'global',
            action: () => { globalActionCalled = true; }
        });
        
        manager.registerShortcut({
            key: 'Escape',
            context: 'editing',
            action: () => { editingActionCalled = true; }
        });
        
        const mockEvent = {
            key: 'Escape',
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            preventDefault: () => {}
        };
        
        // Test when not editing (should use global)
        isEditing = false;
        globalActionCalled = false;
        editingActionCalled = false;
        manager.handleKeyboard(mockEvent);
        assert(globalActionCalled === true, 'Should use global context when not editing');
        assert(editingActionCalled === false, 'Should not use editing context when not editing');
        
        // Test when editing (should use editing context)
        isEditing = true;
        globalActionCalled = false;
        editingActionCalled = false;
        manager.handleKeyboard(mockEvent);
        assert(editingActionCalled === true, 'Should use editing context when editing');
        assert(globalActionCalled === false, 'Should not use global context when editing context matches');
    }

    // Test 8: No shortcut matches
    function testNoShortcutMatches() {
        const manager = new KeyboardShortcutManager();
        
        const mockEvent = {
            key: 'x',
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            preventDefault: () => {}
        };
        
        const handled = manager.handleKeyboard(mockEvent);
        assert(handled === false, 'Should return false when no shortcut matches');
    }

    // Test 9: Remove shortcut
    function testRemoveShortcut() {
        const manager = new KeyboardShortcutManager();
        
        manager.registerShortcut({
            key: 'Escape',
            action: () => {}
        });
        
        assert(manager.getAllShortcuts().length === 1, 'Should have one shortcut before removal');
        
        const removed = manager.removeShortcut('Escape');
        assert(removed === true, 'Should return true when shortcut is removed');
        assert(manager.getAllShortcuts().length === 0, 'Should have no shortcuts after removal');
    }

    // Test 10: Get shortcut descriptions
    function testGetShortcutDescriptions() {
        const manager = new KeyboardShortcutManager();
        
        manager.registerShortcut({
            key: 'Escape',
            action: () => {},
            description: 'Cancel editing'
        });
        
        manager.registerShortcut({
            key: 's',
            ctrlKey: true,
            action: () => {},
            description: 'Save changes'
        });
        
        const descriptions = manager.getShortcutDescriptions();
        assert(descriptions.length === 2, 'Should return two descriptions');
        
        // Find the descriptions by context since they're sorted
        const escapeDesc = descriptions.find(d => d.keys === 'Escape');
        const ctrlSDesc = descriptions.find(d => d.keys === 'Ctrl+s');
        
        assert(escapeDesc !== undefined, 'Should format simple key');
        assert(ctrlSDesc !== undefined, 'Should format key with modifier');
        assert(escapeDesc.description === 'Cancel editing', 'Should include description');
    }

    // Test 11: Error handling for invalid shortcut registration
    function testInvalidShortcutRegistration() {
        const manager = new KeyboardShortcutManager();
        let errorThrown = false;
        
        try {
            manager.registerShortcut({
                key: 'Escape'
                // Missing action
            });
        } catch (error) {
            errorThrown = true;
        }
        
        assert(errorThrown === true, 'Should throw error for shortcut without action');
    }

    // Test 12: Get shortcuts for specific context
    function testGetShortcutsForContext() {
        const manager = new KeyboardShortcutManager();
        
        manager.registerShortcut({
            key: 'Escape',
            context: 'editing',
            action: () => {}
        });
        
        manager.registerShortcut({
            key: 'Enter',
            context: 'global',
            action: () => {}
        });
        
        const editingShortcuts = manager.getShortcutsForContext('editing');
        const globalShortcuts = manager.getShortcutsForContext('global');
        
        assert(editingShortcuts.length === 1, 'Should return one editing shortcut');
        assert(globalShortcuts.length === 1, 'Should return one global shortcut');
        assert(editingShortcuts[0].key === 'Escape', 'Should return correct editing shortcut');
        assert(globalShortcuts[0].key === 'Enter', 'Should return correct global shortcut');
    }

    // Test 13: createModifierString helper method
    function testCreateModifierString() {
        const manager = new KeyboardShortcutManager();
        
        // Test no modifiers
        const noMods = manager.createModifierString(false, false, false);
        assert(noMods === '', 'Should return empty string for no modifiers');
        
        // Test single modifier
        const ctrlOnly = manager.createModifierString(true, false, false);
        assert(ctrlOnly === 'ctrl+', 'Should return ctrl+ for ctrl only');
        
        // Test multiple modifiers
        const ctrlAlt = manager.createModifierString(true, true, false);
        assert(ctrlAlt === 'ctrl+alt+', 'Should return ctrl+alt+ for ctrl and alt');
        
        // Test all modifiers
        const allMods = manager.createModifierString(true, true, true);
        assert(allMods === 'ctrl+alt+shift+', 'Should return all modifiers in order');
    }

    // Test 14: findMatchingShortcut helper method
    function testFindMatchingShortcut() {
        const manager = new KeyboardShortcutManager();
        let actionCalled = false;
        
        manager.registerShortcut({
            key: 'Escape',
            context: 'editing',
            action: () => { actionCalled = true; }
        });
        
        // Mock editing context
        manager.registerContext('editing', () => true);
        
        const mockEvent = {
            key: 'Escape',
            ctrlKey: false,
            altKey: false,
            shiftKey: false
        };
        
        const shortcut = manager.findMatchingShortcut(mockEvent);
        assert(shortcut !== null, 'Should find matching shortcut');
        assert(shortcut.key === 'Escape', 'Should return the correct shortcut');
        assert(shortcut.context === 'editing', 'Should return shortcut with correct context');
        
        // Test no match
        const noMatchEvent = {
            key: 'x',
            ctrlKey: false,
            altKey: false,
            shiftKey: false
        };
        
        const noMatch = manager.findMatchingShortcut(noMatchEvent);
        assert(noMatch === null, 'Should return null when no shortcut matches');
    }

    // Test 15: executeShortcut helper method
    function testExecuteShortcut() {
        const manager = new KeyboardShortcutManager();
        let actionCalled = false;
        let preventDefaultCalled = false;
        
        const mockEvent = {
            preventDefault: () => { preventDefaultCalled = true; }
        };
        
        const shortcut = {
            action: () => { actionCalled = true; },
            preventDefault: true
        };
        
        const result = manager.executeShortcut(shortcut, mockEvent);
        assert(result === true, 'Should return true when shortcut executes successfully');
        assert(actionCalled === true, 'Should execute the action');
        assert(preventDefaultCalled === true, 'Should call preventDefault when configured');
    }

    // Test 16: executeShortcut error handling
    function testExecuteShortcutError() {
        const manager = new KeyboardShortcutManager();
        let errorLogged = false;
        
        // Mock console.error to check if error was logged
        const originalConsoleError = console.error;
        console.error = () => { errorLogged = true; };
        
        const mockEvent = {
            preventDefault: () => {}
        };
        
        const shortcut = {
            action: () => { throw new Error('Test error'); },
            preventDefault: false
        };
        
        const result = manager.executeShortcut(shortcut, mockEvent);
        assert(result === false, 'Should return false when shortcut execution fails');
        assert(errorLogged === true, 'Should log error when execution fails');
        
        // Restore console.error
        console.error = originalConsoleError;
    }

    // Test 17: formatShortcutDescription helper method
    function testFormatShortcutDescription() {
        const manager = new KeyboardShortcutManager();
        
        const shortcut = {
            key: 's',
            ctrlKey: true,
            altKey: false,
            shiftKey: false,
            context: 'editing',
            description: 'Save changes'
        };
        
        const formatted = manager.formatShortcutDescription(shortcut);
        assert(formatted.keys === 'Ctrl+s', 'Should format key combination correctly');
        assert(formatted.description === 'Save changes', 'Should preserve description');
        assert(formatted.context === 'editing', 'Should preserve context');
    }

    // Test 18: createKeyComboString helper method
    function testCreateKeyComboString() {
        const manager = new KeyboardShortcutManager();
        
        // Test simple key
        const simpleShortcut = {
            key: 'Escape',
            ctrlKey: false,
            altKey: false,
            shiftKey: false
        };
        
        const simpleCombo = manager.createKeyComboString(simpleShortcut);
        assert(simpleCombo === 'Escape', 'Should return simple key for no modifiers');
        
        // Test key with modifiers
        const modifiedShortcut = {
            key: 's',
            ctrlKey: true,
            altKey: true,
            shiftKey: false
        };
        
        const modifiedCombo = manager.createKeyComboString(modifiedShortcut);
        assert(modifiedCombo === 'Ctrl+Alt+s', 'Should format key with modifiers');
    }

    // Test 19: getModifierStrings helper method
    function testGetModifierStrings() {
        const manager = new KeyboardShortcutManager();
        
        // Test no modifiers
        const noMods = manager.getModifierStrings({
            ctrlKey: false,
            altKey: false,
            shiftKey: false
        });
        assert(noMods.length === 0, 'Should return empty array for no modifiers');
        
        // Test all modifiers
        const allMods = manager.getModifierStrings({
            ctrlKey: true,
            altKey: true,
            shiftKey: true
        });
        assert(allMods.length === 3, 'Should return three modifiers');
        assert(allMods.includes('Ctrl'), 'Should include Ctrl');
        assert(allMods.includes('Alt'), 'Should include Alt');
        assert(allMods.includes('Shift'), 'Should include Shift');
    }

    // Test 20: sortShortcutDescriptions helper method
    function testSortShortcutDescriptions() {
        const manager = new KeyboardShortcutManager();
        
        const descriptions = [
            { keys: 'z', context: 'global', description: 'Test Z' },
            { keys: 'a', context: 'editing', description: 'Test A' },
            { keys: 'b', context: 'editing', description: 'Test B' },
            { keys: 'y', context: 'global', description: 'Test Y' }
        ];
        
        const sorted = manager.sortShortcutDescriptions(descriptions);
        
        // Should sort by context first (editing before global), then by keys
        assert(sorted[0].context === 'editing' && sorted[0].keys === 'a', 'Should sort editing context first, then by keys');
        assert(sorted[1].context === 'editing' && sorted[1].keys === 'b', 'Should maintain key order within context');
        assert(sorted[2].context === 'global' && sorted[2].keys === 'y', 'Should sort global context after editing');
        assert(sorted[3].context === 'global' && sorted[3].keys === 'z', 'Should maintain key order in global context');
    }

    // Run all tests
    console.log('============================================================');
    testManagerCreation();
    testRegisterShortcut();
    testRegisterShortcutWithModifiers();
    testRegisterContext();
    testKeyboardHandling();
    testKeyboardHandlingWithModifiers();
    testContextSpecificShortcuts();
    testNoShortcutMatches();
    testRemoveShortcut();
    testGetShortcutDescriptions();
    testInvalidShortcutRegistration();
    testGetShortcutsForContext();
    testCreateModifierString();
    testFindMatchingShortcut();
    testExecuteShortcut();
    testExecuteShortcutError();
    testFormatShortcutDescription();
    testCreateKeyComboString();
    testGetModifierStrings();
    testSortShortcutDescriptions();
    console.log('============================================================');

    // Print summary
    console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsRun - testsPassed} failed`);
    
    if (testsPassed === testsRun) {
        console.log('🎉 All KeyboardShortcutManager tests passed!');
        return true;
    } else {
        console.log('❌ Some tests failed!');
        return false;
    }
}

// Run the tests
if (require.main === module) {
    const success = runKeyboardShortcutManagerTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runKeyboardShortcutManagerTests };