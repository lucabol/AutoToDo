/**
 * Focused Test for Ctrl+F Search Field Focus Shortcut
 * This test specifically validates the Ctrl+F shortcut functionality
 * to ensure it consistently focuses the search input field.
 */

// Mock elements state for testing
const mockElements = {
    searchInput: { focused: false, selected: false, value: '' },
    todoInput: { focused: false, selected: false, value: '' }
};

const resetMockElements = () => {
    mockElements.searchInput = { focused: false, selected: false, value: '' };
    mockElements.todoInput = { focused: false, selected: false, value: '' };
};

// Mock DOM for testing
global.document = {
    addEventListener: () => {},
    getElementById: (id) => {
        if (id === 'searchInput') {
            return {
                focus: () => { mockElements.searchInput.focused = true; },
                select: () => { mockElements.searchInput.selected = true; },
                value: mockElements.searchInput.value || ''
            };
        }
        if (id === 'todoInput') {
            return {
                focus: () => { mockElements.todoInput.focused = true; },
                select: () => { mockElements.todoInput.selected = true; },
                value: mockElements.todoInput.value || ''
            };
        }
        return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ addEventListener: () => {}, innerHTML: '', style: {} }),
    body: { appendChild: () => {} }
};

global.window = {
    addEventListener: () => {},
    localStorage: { getItem: () => null, setItem: () => {} },
    matchMedia: () => ({ matches: false, addEventListener: () => {} })
};

global.performance = { now: () => Date.now() };
global.console = console;

// Mock classes - simplified versions for testing
class MockTodoModel {
    getAllTodos() { return [{ id: '1', text: 'Test todo', completed: false }]; }
    addTodo() {}
    deleteTodo() { return true; }
}

class MockTodoView {
    showMessage() {}
    showConfirmation() { return true; }
    getEditingId() { return null; }
    isEditing() { return false; }
    cancelEdit() {}
}

// Load actual classes
eval(require('fs').readFileSync('./js/ShortcutsConfig.js', 'utf8'));
eval(require('fs').readFileSync('./js/KeyboardShortcutManager.js', 'utf8'));
eval(require('fs').readFileSync('./js/KeyboardHandlers.js', 'utf8'));

// Test runner
const runTest = (testName, testFn) => {
    try {
        resetMockElements();
        testFn();
        console.log(`✅ PASS: ${testName}`);
        return true;
    } catch (error) {
        console.log(`❌ FAIL: ${testName} - ${error.message}`);
        return false;
    }
};

const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
};

console.log('🧪 Running Ctrl+F Search Focus Shortcut Tests...\n');
console.log('============================================================');

let passedTests = 0;
let totalTests = 0;

// Test 1: Verify Ctrl+F shortcut is configured correctly
totalTests++;
if (runTest('Ctrl+F shortcut should be configured in ShortcutsConfig', () => {
    const handlers = {
        focusSearch: () => { mockElements.searchInput.focused = true; }
    };
    const shortcuts = ShortcutsConfig.getShortcuts(handlers);
    
    const ctrlFShortcut = shortcuts.find(s => 
        s.key === 'f' && 
        s.ctrlKey === true && 
        s.context === 'global'
    );
    
    assert(ctrlFShortcut, 'Ctrl+F shortcut not found in configuration');
    assert(ctrlFShortcut.preventDefault === true, 'Ctrl+F shortcut should preventDefault');
    assert(ctrlFShortcut.description.includes('Focus search input'), 'Description should mention search focus');
    assert(typeof ctrlFShortcut.action === 'function', 'Action should be a function');
})) passedTests++;

// Test 2: Verify focusSearch handler implementation
totalTests++;
if (runTest('focusSearch handler should focus and select search input', () => {
    const mockController = {
        model: new MockTodoModel(),
        view: new MockTodoView()
    };
    
    const keyboardHandlers = new KeyboardHandlers(mockController);
    const handlers = keyboardHandlers.getAllHandlers();
    
    assert(typeof handlers.focusSearch === 'function', 'focusSearch handler should exist');
    
    // Call the handler
    handlers.focusSearch();
    
    assert(mockElements.searchInput.focused, 'Search input should be focused');
    assert(mockElements.searchInput.selected, 'Search input text should be selected');
})) passedTests++;

// Test 3: Verify KeyboardShortcutManager can register and handle Ctrl+F
totalTests++;
if (runTest('KeyboardShortcutManager should handle Ctrl+F event correctly', () => {
    const manager = new KeyboardShortcutManager({ debug: false });
    
    let actionCalled = false;
    const testAction = () => { actionCalled = true; };
    
    // Register the Ctrl+F shortcut
    manager.registerShortcut({
        key: 'f',
        ctrlKey: true,
        context: 'global',
        action: testAction,
        preventDefault: true,
        description: 'Test Ctrl+F'
    });
    
    // Create mock keyboard event
    const mockEvent = {
        key: 'f',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        preventDefault: () => { mockEvent.defaultPrevented = true; }
    };
    
    // Handle the event
    const result = manager.handleKeyboard(mockEvent);
    
    assert(result === true, 'handleKeyboard should return true for handled shortcut');
    assert(actionCalled, 'Shortcut action should be called');
    assert(mockEvent.defaultPrevented, 'preventDefault should be called');
})) passedTests++;

// Test 4: Verify shortcut works in different contexts
totalTests++;
if (runTest('Ctrl+F should work in global context regardless of focus state', () => {
    const manager = new KeyboardShortcutManager({ debug: false });
    
    let focusCount = 0;
    const focusAction = () => { focusCount++; };
    
    manager.registerShortcut({
        key: 'f',
        ctrlKey: true,
        context: 'global',
        action: focusAction,
        preventDefault: true
    });
    
    const mockEvent = {
        key: 'f',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        preventDefault: () => {}
    };
    
    // Test multiple calls
    manager.handleKeyboard(mockEvent);
    manager.handleKeyboard(mockEvent);
    
    assert(focusCount === 2, 'Shortcut should work multiple times');
})) passedTests++;

// Test 5: Verify conflict prevention with other 'f' key combinations
totalTests++;
if (runTest('Regular "f" key without Ctrl should not trigger search focus', () => {
    const manager = new KeyboardShortcutManager({ debug: false });
    
    let actionCalled = false;
    manager.registerShortcut({
        key: 'f',
        ctrlKey: true,
        context: 'global',
        action: () => { actionCalled = true; },
        preventDefault: true
    });
    
    const mockEventRegularF = {
        key: 'f',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        preventDefault: () => {}
    };
    
    const result = manager.handleKeyboard(mockEventRegularF);
    
    assert(result === false, 'Regular "f" should not be handled');
    assert(!actionCalled, 'Action should not be called for regular "f"');
})) passedTests++;

// Test 6: Verify alternative "/" shortcut for search focus
totalTests++;
if (runTest('Slash (/) shortcut should also focus search input', () => {
    const handlers = {
        focusSearch: () => { mockElements.searchInput.focused = true; }
    };
    const shortcuts = ShortcutsConfig.getShortcuts(handlers);
    
    const slashShortcut = shortcuts.find(s => 
        s.key === '/' && 
        !s.ctrlKey && 
        s.context === 'global'
    );
    
    assert(slashShortcut, 'Slash shortcut should be configured');
    assert(slashShortcut.preventDefault === true, 'Slash shortcut should preventDefault');
    
    // Test the action
    slashShortcut.action();
    assert(mockElements.searchInput.focused, 'Slash should focus search input');
})) passedTests++;

// Test 7: Verify error handling for missing search input element
totalTests++;
if (runTest('focusSearch should handle missing search input gracefully', () => {
    // Override document.getElementById to return null for searchInput
    const originalGetElementById = document.getElementById;
    document.getElementById = (id) => {
        if (id === 'searchInput') return null;
        return originalGetElementById.call(document, id);
    };
    
    const mockController = { 
        model: new MockTodoModel(), 
        view: new MockTodoView() 
    };
    const keyboardHandlers = new KeyboardHandlers(mockController);
    const handlers = keyboardHandlers.getAllHandlers();
    
    // This should not throw an error
    handlers.focusSearch();
    
    // Restore original function
    document.getElementById = originalGetElementById;
    
    assert(true, 'Should not throw error when search input is missing');
})) passedTests++;

// Test 8: Verify integration between all components
totalTests++;
if (runTest('Full integration test: ShortcutsConfig -> KeyboardHandlers -> DOM', () => {
    // Create mock controller
    const mockController = { 
        model: new MockTodoModel(), 
        view: new MockTodoView(),
        keyboardManager: new KeyboardShortcutManager({ debug: false })
    };
    
    const keyboardHandlers = new KeyboardHandlers(mockController);
    const handlers = keyboardHandlers.getAllHandlers();
    const shortcuts = ShortcutsConfig.getShortcuts(handlers);
    
    // Register all shortcuts
    shortcuts.forEach(shortcut => {
        mockController.keyboardManager.registerShortcut(shortcut);
    });
    
    // Test Ctrl+F
    const ctrlFEvent = {
        key: 'f',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        preventDefault: () => { ctrlFEvent.defaultPrevented = true; }
    };
    
    const result = mockController.keyboardManager.handleKeyboard(ctrlFEvent);
    
    assert(result === true, 'Ctrl+F should be handled successfully');
    assert(mockElements.searchInput.focused, 'Search input should be focused');
    assert(mockElements.searchInput.selected, 'Search input should be selected');
    assert(ctrlFEvent.defaultPrevented, 'Default behavior should be prevented');
})) passedTests++;

console.log('============================================================');
console.log(`\n📊 Test Results: ${passedTests} passed, ${totalTests - passedTests} failed`);

if (passedTests === totalTests) {
    console.log('🎉 All Ctrl+F shortcut tests passed!');
    console.log('\n✅ CONCLUSION: Ctrl+F shortcut functionality is working correctly');
    console.log('   - Shortcut is properly configured');
    console.log('   - Handler focuses and selects search input');  
    console.log('   - KeyboardShortcutManager processes events correctly');
    console.log('   - preventDefault blocks browser default behavior');
    console.log('   - Error handling works for missing elements');
    console.log('   - Full integration works as expected');
} else {
    console.log('❌ Some tests failed. There may be issues with the Ctrl+F shortcut.');
    process.exit(1);
}