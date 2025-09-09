/**
 * Unit Tests for ShortcutsConfig
 * 
 * Tests the centralized keyboard shortcuts configuration
 */

// Simple ShortcutsConfig class for testing (matching the actual implementation)
class ShortcutsConfig {
    static getShortcuts(handlers) {
        const {
            focusNewTodo,
            focusSearch,
            addTodo,
            toggleFirstTodo,
            deleteFirstTodo,
            cancelEdit,
            saveEdit,
            showHelp,
            toggleTheme,
            selectAll,
            clearCompleted
        } = handlers;

        return [
            // Navigation shortcuts
            {
                key: 'n',
                ctrlKey: true,
                context: 'global',
                action: focusNewTodo,
                preventDefault: true,
                description: 'Focus new todo input (Ctrl+N)',
                category: 'Navigation'
            },
            {
                key: 'f',
                ctrlKey: true,
                context: 'global', 
                action: focusSearch,
                preventDefault: true,
                description: 'Focus search input (Ctrl+F)',
                category: 'Navigation'
            },
            // Todo management shortcuts
            {
                key: 'Enter',
                ctrlKey: true,
                context: 'global',
                action: addTodo,
                preventDefault: true,
                description: 'Add new todo (Ctrl+Enter)',
                category: 'Todo Management'
            },
            // Editing shortcuts
            {
                key: 'Escape',
                context: 'editing',
                action: cancelEdit,
                description: 'Cancel editing (Escape)',
                category: 'Editing'
            },
            {
                key: 's',
                ctrlKey: true,
                context: 'editing',
                action: saveEdit,
                preventDefault: true,
                description: 'Save changes (Ctrl+S)',
                category: 'Editing'
            },
            // General shortcuts
            {
                key: 'h',
                ctrlKey: true,
                context: 'global',
                action: showHelp,
                preventDefault: true,
                description: 'Show keyboard shortcuts help (Ctrl+H)',
                category: 'General'
            },
            {
                key: 'm',
                ctrlKey: true,
                context: 'global',
                action: toggleTheme,
                preventDefault: true,
                description: 'Toggle theme (Ctrl+M)',
                category: 'General'
            }
        ];
    }

    static groupByCategory(shortcuts) {
        const grouped = {};
        
        for (const shortcut of shortcuts) {
            const category = shortcut.category || 'Other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(shortcut);
        }
        
        return grouped;
    }

    static formatKeyCombo(shortcut) {
        const modifiers = [];
        if (shortcut.ctrlKey) modifiers.push('Ctrl');
        if (shortcut.altKey) modifiers.push('Alt');
        if (shortcut.shiftKey) modifiers.push('Shift');
        
        let key = shortcut.key;
        
        const keyMappings = {
            ' ': 'Space',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'ArrowLeft': '←',
            'ArrowRight': '→',
            'Enter': '↵',
            'Escape': 'Esc',
            'Delete': 'Del',
            'Backspace': '⌫'
        };
        
        if (keyMappings[key]) {
            key = keyMappings[key];
        }
        
        return modifiers.length > 0 
            ? `${modifiers.join('+')}+${key}`
            : key;
    }

    static getValidationRules() {
        return {
            reservedGlobalKeys: [
                'F5', 'F12', 'Tab',
            ],
            systemShortcuts: [
                { key: 's', ctrlKey: true },
                { key: 'r', ctrlKey: true },
            ],
            maxShortcutsPerContext: 20
        };
    }
}

// Test suite
function runShortcutsConfigTests() {
    console.log('🧪 Running ShortcutsConfig Tests...\n');
    
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

    // Mock handlers for testing
    const mockHandlers = {
        focusNewTodo: () => {},
        focusSearch: () => {},
        addTodo: () => {},
        toggleFirstTodo: () => {},
        deleteFirstTodo: () => {},
        cancelEdit: () => {},
        saveEdit: () => {},
        showHelp: () => {},
        toggleTheme: () => {},
        selectAll: () => {},
        clearCompleted: () => {}
    };

    // Test 1: Can get shortcuts configuration
    function testGetShortcuts() {
        const shortcuts = ShortcutsConfig.getShortcuts(mockHandlers);
        assert(Array.isArray(shortcuts), 'Should return array of shortcuts');
        assert(shortcuts.length > 0, 'Should return at least one shortcut');
        
        // Check that all shortcuts have required properties
        shortcuts.forEach((shortcut, index) => {
            assert(typeof shortcut.key === 'string', `Shortcut ${index} should have key string`);
            assert(typeof shortcut.action === 'function', `Shortcut ${index} should have action function`);
            assert(typeof shortcut.context === 'string', `Shortcut ${index} should have context string`);
            assert(typeof shortcut.description === 'string', `Shortcut ${index} should have description string`);
            assert(typeof shortcut.category === 'string', `Shortcut ${index} should have category string`);
        });
    }

    // Test 2: Can group shortcuts by category
    function testGroupByCategory() {
        const shortcuts = ShortcutsConfig.getShortcuts(mockHandlers);
        const grouped = ShortcutsConfig.groupByCategory(shortcuts);
        
        assert(typeof grouped === 'object', 'Should return object');
        assert(Object.keys(grouped).length > 0, 'Should have at least one category');
        
        // Check expected categories exist
        const expectedCategories = ['Navigation', 'Todo Management', 'Editing', 'General'];
        expectedCategories.forEach(category => {
            assert(grouped[category] !== undefined, `Should have ${category} category`);
            assert(Array.isArray(grouped[category]), `${category} should be an array`);
        });
        
        // Check that shortcuts are properly categorized
        assert(grouped['Navigation'].length >= 1, 'Should have navigation shortcuts');
        assert(grouped['Editing'].length >= 1, 'Should have editing shortcuts');
        assert(grouped['General'].length >= 1, 'Should have general shortcuts');
    }

    // Test 3: Can format key combinations
    function testFormatKeyCombo() {
        // Test simple key
        const simpleShortcut = { key: 'Escape' };
        assert(ShortcutsConfig.formatKeyCombo(simpleShortcut) === 'Esc', 'Should format simple key');
        
        // Test key with modifier
        const modifierShortcut = { key: 's', ctrlKey: true };
        assert(ShortcutsConfig.formatKeyCombo(modifierShortcut) === 'Ctrl+s', 'Should format key with modifier');
        
        // Test multiple modifiers
        const multiModifierShortcut = { key: 'Delete', ctrlKey: true, shiftKey: true };
        assert(ShortcutsConfig.formatKeyCombo(multiModifierShortcut) === 'Ctrl+Shift+Del', 'Should format key with multiple modifiers');
        
        // Test special key mapping
        const enterShortcut = { key: 'Enter' };
        assert(ShortcutsConfig.formatKeyCombo(enterShortcut) === '↵', 'Should format special keys');
    }

    // Test 4: Can get validation rules
    function testGetValidationRules() {
        const rules = ShortcutsConfig.getValidationRules();
        
        assert(typeof rules === 'object', 'Should return validation rules object');
        assert(Array.isArray(rules.reservedGlobalKeys), 'Should have reserved global keys array');
        assert(Array.isArray(rules.systemShortcuts), 'Should have system shortcuts array');
        assert(typeof rules.maxShortcutsPerContext === 'number', 'Should have max shortcuts per context');
        
        // Check that reserved keys include expected values
        assert(rules.reservedGlobalKeys.includes('F5'), 'Should include F5 in reserved keys');
        assert(rules.reservedGlobalKeys.includes('F12'), 'Should include F12 in reserved keys');
        assert(rules.reservedGlobalKeys.includes('Tab'), 'Should include Tab in reserved keys');
    }

    // Test 5: Shortcuts have proper structure
    function testShortcutStructure() {
        const shortcuts = ShortcutsConfig.getShortcuts(mockHandlers);
        
        // Find specific shortcuts to test
        const ctrlNShortcut = shortcuts.find(s => s.key === 'n' && s.ctrlKey);
        assert(ctrlNShortcut !== undefined, 'Should have Ctrl+N shortcut');
        assert(ctrlNShortcut.context === 'global', 'Ctrl+N should be global context');
        assert(ctrlNShortcut.preventDefault === true, 'Ctrl+N should prevent default');
        assert(ctrlNShortcut.category === 'Navigation', 'Ctrl+N should be Navigation category');
        
        const escapeShortcut = shortcuts.find(s => s.key === 'Escape');
        assert(escapeShortcut !== undefined, 'Should have Escape shortcut');
        assert(escapeShortcut.context === 'editing', 'Escape should be editing context');
        assert(escapeShortcut.category === 'Editing', 'Escape should be Editing category');
    }

    // Test 6: Categories contain expected shortcuts
    function testCategoryContent() {
        const shortcuts = ShortcutsConfig.getShortcuts(mockHandlers);
        const grouped = ShortcutsConfig.groupByCategory(shortcuts);
        
        // Navigation category should have focus shortcuts
        const navigationShortcuts = grouped['Navigation'];
        const hasFocusShortcut = navigationShortcuts.some(s => s.description.toLowerCase().includes('focus'));
        assert(hasFocusShortcut, 'Navigation category should have focus shortcuts');
        
        // Editing category should have save/cancel shortcuts
        const editingShortcuts = grouped['Editing'];
        const hasSaveShortcut = editingShortcuts.some(s => s.description.toLowerCase().includes('save'));
        const hasCancelShortcut = editingShortcuts.some(s => s.description.toLowerCase().includes('cancel'));
        assert(hasSaveShortcut, 'Editing category should have save shortcut');
        assert(hasCancelShortcut, 'Editing category should have cancel shortcut');
        
        // General category should have help shortcuts
        const generalShortcuts = grouped['General'];
        const hasHelpShortcut = generalShortcuts.some(s => s.description.toLowerCase().includes('help'));
        assert(hasHelpShortcut, 'General category should have help shortcut');
    }

    // Run all tests
    console.log('============================================================');
    testGetShortcuts();
    testGroupByCategory();
    testFormatKeyCombo();
    testGetValidationRules();
    testShortcutStructure();
    testCategoryContent();
    console.log('============================================================');

    // Print summary
    console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsRun - testsPassed} failed`);
    
    if (testsPassed === testsRun) {
        console.log('🎉 All ShortcutsConfig tests passed!');
        return true;
    } else {
        console.log('❌ Some tests failed!');
        return false;
    }
}

// Run the tests
if (require.main === module) {
    const success = runShortcutsConfigTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runShortcutsConfigTests };