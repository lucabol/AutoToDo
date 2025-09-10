/**
 * Tests for ShortcutModules - Modular shortcut functionality
 */

console.log('🧪 Running ShortcutModules Tests...');

// Mock DOM environment for testing
global.document = {
    querySelector: (selector) => {
        if (selector === '#testInput') {
            return {
                id: 'testInput',
                focus: () => { /* mock focus */ },
                select: () => { /* mock select */ }
            };
        }
        return null;
    },
    activeElement: { id: 'testInput' }
};

global.performance = {
    now: () => Date.now()
};

// Load the modules in Node.js environment
const fs = require('fs');
const path = require('path');

// Read and evaluate the ShortcutModules.js file
const shortcutModulesPath = path.join(__dirname, 'js', 'ShortcutModules.js');
const shortcutModulesCode = fs.readFileSync(shortcutModulesPath, 'utf8');

// Create a proper module environment
const moduleExports = {};
global.window = global; // Make window available for browser-style exports

eval(shortcutModulesCode);

// Extract the classes from the global scope
const {
    ShortcutModule,
    NavigationShortcutModule,
    ActionShortcutModule,
    ContextAwareShortcutModule,
    ShortcutModuleManager
} = global;

let testsPassed = 0;
let testsFailed = 0;

function test(description, testFn) {
    try {
        testFn();
        console.log(`✅ PASS: ${description}`);
        testsPassed++;
    } catch (error) {
        console.error(`❌ FAIL: ${description} - ${error.message}`);
        testsFailed++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

console.log('\n============================================================');

// Test ShortcutModule base class
test('Should create ShortcutModule instance', () => {
    const module = new ShortcutModule('test');
    assert(module instanceof ShortcutModule, 'Should be instance of ShortcutModule');
    assertEqual(module.name, 'test', 'Should have correct name');
    assert(module.enabled, 'Should be enabled by default');
});

test('Should register shortcuts in module', () => {
    const module = new ShortcutModule('test');
    const config = {
        key: 'a',
        context: 'global',
        action: () => {}
    };
    
    const enhanced = module.registerShortcut(config);
    assert(enhanced.module === 'test', 'Should add module name');
    assert(enhanced.moduleEnabled === true, 'Should add module enabled flag');
    assertEqual(module.shortcuts.size, 1, 'Should have one shortcut');
});

test('Should enable/disable module', () => {
    const module = new ShortcutModule('test');
    module.registerShortcut({ key: 'a', context: 'global', action: () => {} });
    
    module.setEnabled(false);
    assert(!module.enabled, 'Module should be disabled');
    
    const shortcuts = module.getAllShortcuts();
    assert(!shortcuts[0].moduleEnabled, 'Shortcuts should be disabled');
});

// Test NavigationShortcutModule
test('Should create NavigationShortcutModule instance', () => {
    const module = new NavigationShortcutModule();
    assert(module instanceof NavigationShortcutModule, 'Should be instance of NavigationShortcutModule');
    assert(module instanceof ShortcutModule, 'Should inherit from ShortcutModule');
    assertEqual(module.name, 'navigation', 'Should have navigation name');
});

test('Should register focus targets', () => {
    const module = new NavigationShortcutModule();
    module.registerFocusTarget('testInput', '#testInput', { selectText: true });
    
    assert(module.focusTargets.has('testInput'), 'Should have registered target');
    const target = module.focusTargets.get('testInput');
    assertEqual(target.selector, '#testInput', 'Should have correct selector');
    assert(target.options.selectText, 'Should have correct options');
});

test('Should create focus action', () => {
    const module = new NavigationShortcutModule();
    module.registerFocusTarget('testInput', '#testInput');
    
    const action = module.createFocusAction('testInput');
    assert(typeof action === 'function', 'Should return a function');
    
    const result = action();
    assert(result === true, 'Should return true on successful focus');
});

test('Should track navigation history', () => {
    const module = new NavigationShortcutModule();
    module.registerFocusTarget('testInput', '#testInput');
    
    const action = module.createFocusAction('testInput');
    action();
    
    assert(module.navigationHistory.length > 0, 'Should have navigation history');
    const stats = module.getNavigationStats();
    assert(stats.totalNavigations > 0, 'Should have navigation stats');
});

// Test ActionShortcutModule
test('Should create ActionShortcutModule instance', () => {
    const module = new ActionShortcutModule();
    assert(module instanceof ActionShortcutModule, 'Should be instance of ActionShortcutModule');
    assertEqual(module.name, 'action', 'Should have action name');
    assert(module.enableUndo, 'Should have undo enabled by default');
});

test('Should create undoable actions', () => {
    const module = new ActionShortcutModule();
    let actionExecuted = false;
    let undoExecuted = false;
    
    const action = module.createUndoableAction(
        () => { actionExecuted = true; return 'result'; },
        () => { undoExecuted = true; },
        'Test Action'
    );
    
    assert(typeof action === 'function', 'Should return a function');
    
    const result = action();
    assert(actionExecuted, 'Should execute action');
    assertEqual(result, 'result', 'Should return action result');
    assert(module.undoStack.length > 0, 'Should add to undo stack');
});

test('Should execute undo', () => {
    const module = new ActionShortcutModule();
    let undoExecuted = false;
    
    const action = module.createUndoableAction(
        () => 'result',
        () => { undoExecuted = true; },
        'Test Action'
    );
    
    action();
    const undoResult = module.undo();
    
    assert(undoResult === true, 'Should return true on successful undo');
    assert(undoExecuted, 'Should execute undo function');
    assertEqual(module.undoStack.length, 0, 'Should remove from undo stack');
});

test('Should track action statistics', () => {
    const module = new ActionShortcutModule();
    
    const action = module.createUndoableAction(
        () => 'success',
        () => {},
        'Test Action'
    );
    
    action();
    
    const stats = module.getActionStats();
    assertEqual(stats.totalActions, 1, 'Should have one action');
    assertEqual(stats.successfulActions, 1, 'Should have one successful action');
    assertEqual(stats.failedActions, 0, 'Should have no failed actions');
    assertEqual(stats.successRate, 100, 'Should have 100% success rate');
});

// Test ContextAwareShortcutModule
test('Should create ContextAwareShortcutModule instance', () => {
    const module = new ContextAwareShortcutModule();
    assert(module instanceof ContextAwareShortcutModule, 'Should be instance of ContextAwareShortcutModule');
    assertEqual(module.name, 'context-aware', 'Should have context-aware name');
    assert(module.adaptiveMode, 'Should have adaptive mode enabled');
    assert(module.learningEnabled, 'Should have learning enabled');
});

test('Should create context-aware actions', () => {
    const module = new ContextAwareShortcutModule();
    let editingCalled = false;
    let globalCalled = false;
    
    const action = module.createContextAwareAction({
        editing: () => { editingCalled = true; return 'editing'; },
        global: () => { globalCalled = true; return 'global'; }
    });
    
    assert(typeof action === 'function', 'Should return a function');
    
    // Test editing context
    const result1 = action({}, ['editing']);
    assert(editingCalled, 'Should call editing action');
    assertEqual(result1, 'editing', 'Should return editing result');
    
    // Test global context
    const result2 = action({}, []);
    assert(globalCalled, 'Should call global action');
    assertEqual(result2, 'global', 'Should return global result');
});

test('Should track context usage', () => {
    const module = new ContextAwareShortcutModule();
    
    const action = module.createContextAwareAction({
        editing: () => 'editing',
        global: () => 'global'
    });
    
    action({}, ['editing']);
    action({}, ['global']);
    action({}, ['editing', 'modal']);
    
    const stats = module.getContextStats();
    assertEqual(stats.totalEntries, 3, 'Should track all entries');
    assert(stats.contextUsage.length > 0, 'Should have context usage data');
});

// Test ShortcutModuleManager
test('Should create ShortcutModuleManager instance', () => {
    const manager = new ShortcutModuleManager();
    assert(manager instanceof ShortcutModuleManager, 'Should be instance of ShortcutModuleManager');
    assert(manager.modules instanceof Map, 'Should have modules map');
    assert(manager.plugins instanceof Map, 'Should have plugins map');
});

test('Should register modules', () => {
    const manager = new ShortcutModuleManager();
    const module = new NavigationShortcutModule();
    
    manager.registerModule(module);
    assert(manager.modules.has('navigation'), 'Should have registered module');
    assertEqual(manager.getModule('navigation'), module, 'Should return correct module');
});

test('Should register plugins', () => {
    const manager = new ShortcutModuleManager();
    const plugin = (config) => ({ ...config, enhanced: true });
    
    manager.registerPlugin('testPlugin', plugin);
    assert(manager.plugins.has('testPlugin'), 'Should have registered plugin');
});

test('Should apply plugins to shortcuts', () => {
    const manager = new ShortcutModuleManager();
    const plugin = (config) => ({ ...config, enhanced: true });
    
    manager.registerPlugin('testPlugin', plugin);
    
    const config = { key: 'a', action: () => {} };
    const enhanced = manager.applyPlugins(config);
    
    assert(enhanced.enhanced === true, 'Should apply plugin enhancement');
});

test('Should get all shortcuts from modules', () => {
    const manager = new ShortcutModuleManager();
    const module1 = new NavigationShortcutModule();
    const module2 = new ActionShortcutModule();
    
    module1.registerShortcut({ key: 'a', context: 'global', action: () => {} });
    module2.registerShortcut({ key: 'b', context: 'global', action: () => {} });
    
    manager.registerModule(module1);
    manager.registerModule(module2);
    
    const shortcuts = manager.getAllShortcuts();
    assertEqual(shortcuts.length, 2, 'Should return shortcuts from all modules');
});

test('Should handle disabled modules', () => {
    const manager = new ShortcutModuleManager();
    const module = new NavigationShortcutModule();
    
    module.registerShortcut({ key: 'a', context: 'global', action: () => {} });
    module.setEnabled(false);
    
    manager.registerModule(module);
    
    const shortcuts = manager.getAllShortcuts();
    assertEqual(shortcuts.length, 0, 'Should not return shortcuts from disabled modules');
});

test('Should get module statistics', () => {
    const manager = new ShortcutModuleManager();
    const navModule = new NavigationShortcutModule();
    const actionModule = new ActionShortcutModule();
    
    navModule.registerFocusTarget('test', '#test');
    navModule.createFocusAction('test')();
    
    const undoableAction = actionModule.createUndoableAction(() => {}, () => {}, 'test');
    undoableAction();
    
    manager.registerModule(navModule);
    manager.registerModule(actionModule);
    
    const stats = manager.getAllModuleStats();
    assert(stats.navigation, 'Should have navigation stats');
    assert(stats.action, 'Should have action stats');
    assert(stats.navigation.totalNavigations >= 0, 'Should have navigation data');
    assert(stats.action.totalActions >= 0, 'Should have action data');
});

console.log('============================================================');
console.log(`📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);

if (testsFailed === 0) {
    console.log('🎉 All ShortcutModules tests passed!');
} else {
    console.log(`❌ ${testsFailed} tests failed`);
    process.exit(1);
}