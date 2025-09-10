/**
 * Unit Tests for AutoToDo Keyboard Shortcuts Functionality
 * 
 * This file contains tests for keyboard shortcut handling
 * to ensure behavior remains consistent after refactoring.
 */

// Mock DOM elements for testing
class MockElement {
    constructor() {
        this.style = { display: 'none' };
        this.innerHTML = '';
        this.value = '';
        this.eventListeners = {};
        this.classList = {
            add: () => {},
            remove: () => {},
            contains: () => false
        };
    }
    
    addEventListener(event, callback) {
        this.eventListeners[event] = callback;
    }
    
    trigger(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event](data || { target: this });
        }
    }

    querySelector(selector) {
        return new MockElement();
    }

    focus() {}
}

// Mock DOM
const mockDOM = {
    elements: {},
    getElementById: function(id) {
        if (!this.elements[id]) {
            this.elements[id] = new MockElement();
        }
        return this.elements[id];
    },
    createElement: function(tag) {
        return new MockElement();
    },
    addEventListener: function() {},
    querySelector: function() { return new MockElement(); },
    body: new MockElement()
};

// Mock global objects
global.document = mockDOM;
global.window = {
    matchMedia: () => ({
        matches: false,
        addEventListener: () => {}
    })
};
global.localStorage = {
    data: {},
    getItem: function(key) { return this.data[key] || null; },
    setItem: function(key, value) { this.data[key] = value; },
    clear: function() { this.data = {}; }
};
global.crypto = {
    randomUUID: () => 'mock-uuid-' + Date.now()
};

// Simple keyboard shortcut handler for testing (extracted from TodoController)
class KeyboardShortcutHandler {
    constructor() {
        this.isEditing = false;
        this.editingId = null;
        this.cancelEditCalled = false;
        this.saveEditCalled = false;
    }

    setEditing(editing, id = null) {
        this.isEditing = editing;
        this.editingId = id;
    }

    handleKeyboardShortcuts(e) {
        // Escape key to cancel editing
        if (e.key === 'Escape' && this.isEditing) {
            this.handleCancelEdit();
        }
        
        // Ctrl+S to save when editing
        if (e.key === 's' && e.ctrlKey && this.isEditing) {
            e.preventDefault(); // Prevent browser's default save dialog
            this.handleSaveEdit();
        }
    }

    handleCancelEdit() {
        this.cancelEditCalled = true;
        this.isEditing = false;
        this.editingId = null;
    }

    handleSaveEdit() {
        this.saveEditCalled = true;
    }

    reset() {
        this.cancelEditCalled = false;
        this.saveEditCalled = false;
    }
}

// Test suite
function runKeyboardShortcutTests() {
    console.log('🧪 Running Keyboard Shortcut Tests...\n');
    
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

    // Setup test environment
    function createTestHandler() {
        return new KeyboardShortcutHandler();
    }

    // Test 1: Escape key cancels editing
    function testEscapeKeysCancelEditing() {
        const handler = createTestHandler();
        handler.setEditing(true, 'test-id');
        
        const escapeEvent = {
            key: 'Escape',
            preventDefault: () => {}
        };
        
        handler.handleKeyboardShortcuts(escapeEvent);
        
        assert(handler.cancelEditCalled, 'Escape key should trigger cancel edit');
        assert(!handler.isEditing, 'Escape key should set editing to false');
    }

    // Test 2: Escape key does nothing when not editing
    function testEscapeKeyWhenNotEditing() {
        const handler = createTestHandler();
        handler.setEditing(false);
        
        const escapeEvent = {
            key: 'Escape',
            preventDefault: () => {}
        };
        
        handler.handleKeyboardShortcuts(escapeEvent);
        
        assert(!handler.cancelEditCalled, 'Escape key should not trigger cancel when not editing');
    }

    // Test 3: Ctrl+S saves when editing
    function testCtrlSSavesWhenEditing() {
        const handler = createTestHandler();
        handler.setEditing(true, 'test-id');
        
        let preventDefaultCalled = false;
        const ctrlSEvent = {
            key: 's',
            ctrlKey: true,
            preventDefault: () => { preventDefaultCalled = true; }
        };
        
        handler.handleKeyboardShortcuts(ctrlSEvent);
        
        assert(preventDefaultCalled, 'Ctrl+S should prevent default browser behavior');
        assert(handler.saveEditCalled, 'Ctrl+S should trigger save edit when editing');
    }

    // Test 4: Ctrl+S does nothing when not editing
    function testCtrlSWhenNotEditing() {
        const handler = createTestHandler();
        handler.setEditing(false);
        
        let preventDefaultCalled = false;
        const ctrlSEvent = {
            key: 's',
            ctrlKey: true,
            preventDefault: () => { preventDefaultCalled = true; }
        };
        
        handler.handleKeyboardShortcuts(ctrlSEvent);
        
        // Should not prevent default when not editing
        assert(!preventDefaultCalled, 'Ctrl+S should not prevent default when not editing');
        assert(!handler.saveEditCalled, 'Ctrl+S should not trigger save when not editing');
    }

    // Test 5: Regular 's' key without Ctrl does nothing
    function testRegularSKey() {
        const handler = createTestHandler();
        handler.setEditing(true, 'test-id');
        
        let preventDefaultCalled = false;
        const sEvent = {
            key: 's',
            ctrlKey: false,
            preventDefault: () => { preventDefaultCalled = true; }
        };
        
        handler.handleKeyboardShortcuts(sEvent);
        
        assert(!preventDefaultCalled, 'Regular s key should not prevent default');
        assert(!handler.saveEditCalled, 'Regular s key should not trigger save');
        assert(handler.isEditing, 'Regular s key should not cancel editing');
    }

    // Test 6: Other keys don't interfere
    function testOtherKeysDoNothing() {
        const handler = createTestHandler();
        handler.setEditing(true, 'test-id');
        
        const randomEvent = {
            key: 'Enter',
            ctrlKey: false,
            preventDefault: () => {}
        };
        
        handler.handleKeyboardShortcuts(randomEvent);
        
        assert(handler.isEditing, 'Random keys should not affect editing state');
        assert(!handler.cancelEditCalled, 'Random keys should not trigger cancel');
        assert(!handler.saveEditCalled, 'Random keys should not trigger save');
    }

    // Run all tests
    console.log('============================================================');
    testEscapeKeysCancelEditing();
    testEscapeKeyWhenNotEditing();
    testCtrlSSavesWhenEditing();
    testCtrlSWhenNotEditing();
    testRegularSKey();
    testOtherKeysDoNothing();
    console.log('============================================================');

    // Print summary
    console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsRun - testsPassed} failed`);
    
    if (testsPassed === testsRun) {
        console.log('🎉 All keyboard shortcut tests passed!');
        return true;
    } else {
        console.log('❌ Some tests failed!');
        return false;
    }
}

// Run the tests
if (require.main === module) {
    const success = runKeyboardShortcutTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runKeyboardShortcutTests };