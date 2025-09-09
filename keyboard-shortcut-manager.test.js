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
        const modifiers = [];
        if (ctrlKey) modifiers.push('ctrl');
        if (altKey) modifiers.push('alt');
        if (shiftKey) modifiers.push('shift');
        
        const modifierStr = modifiers.length > 0 ? modifiers.join('+') + '+' : '';
        return `${context}:${modifierStr}${key.toLowerCase()}`;
    }

    handleKeyboard(event) {
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
                if (shortcut.preventDefault) {
                    event.preventDefault();
                }
                
                try {
                    shortcut.action(event);
                    return true;
                } catch (error) {
                    console.error('Error executing keyboard shortcut:', error);
                }
                break;
            }
        }
        
        return false;
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
                const modifiers = [];
                if (shortcut.ctrlKey) modifiers.push('Ctrl');
                if (shortcut.altKey) modifiers.push('Alt');
                if (shortcut.shiftKey) modifiers.push('Shift');
                
                const keyCombo = modifiers.length > 0 
                    ? `${modifiers.join('+')}+${shortcut.key}`
                    : shortcut.key;
                
                descriptions.push({
                    keys: keyCombo,
                    description: shortcut.description,
                    context: shortcut.context
                });
            }
        }
        
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