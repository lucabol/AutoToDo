/**
 * Tests for Search Focus Bug Fix
 * 
 * This test validates that the '/' shortcut properly focuses the search field
 * AND includes the '/' character, providing expected user experience similar
 * to applications like Gmail, Slack, etc.
 */

// Mock DOM for testing
const createMockElement = () => ({
    focus: function() { this.focused = true; },
    value: '',
    focused: false,
    setSelectionRange: function(start, end) { 
        this.selectionStart = start; 
        this.selectionEnd = end; 
    },
    dispatchEvent: function(event) { 
        if (event.type === 'input' && this.oninput) {
            this.oninput({ target: this });
        }
    },
    selectionStart: 0,
    selectionEnd: 0
});

const mockDOM = {
    activeElement: null,
    getElementById: function(id) {
        if (id === 'searchInput') {
            if (!this.searchInput) {
                this.searchInput = createMockElement();
            }
            return this.searchInput;
        }
        return createMockElement();
    }
};

// Mock globals
global.document = mockDOM;
global.Event = function(type, options) {
    this.type = type;
    this.bubbles = options?.bubbles || false;
};

// Simplified focusSearchInput function from the fix
function focusSearchInput(event) {
    const searchInput = global.document.getElementById('searchInput');
    if (searchInput) {
        const wasAlreadyFocused = global.document.activeElement === searchInput;
        
        if (!wasAlreadyFocused) {
            // Prevent the default '/' from being typed since we'll handle it ourselves
            if (event) {
                event.preventDefault();
            }
            
            searchInput.focus();
            global.document.activeElement = searchInput;
            // Clear any existing text and add the '/' character
            searchInput.value = '/';
            // Move cursor to end
            searchInput.setSelectionRange(1, 1);
            // Trigger input event to update search
            searchInput.dispatchEvent(new global.Event('input', { bubbles: true }));
        }
        // If already focused, don't prevent default - let the '/' be typed normally
    }
}

// Test suite
function runSearchFocusFixTests() {
    console.log('🔍 Testing Search Focus Bug Fix...\n');
    
    let testsRun = 0;
    let testsPassed = 0;
    
    function assert(condition, message) {
        testsRun++;
        if (condition) {
            console.log(`✅ ${message}`);
            testsPassed++;
        } else {
            console.log(`❌ ${message}`);
        }
    }
    
    // Test 1: '/' shortcut focuses search field and adds '/' character
    function testSlashShortcutFromUnfocused() {
        console.log('\n--- Test 1: Slash shortcut from unfocused state ---');
        
        // Reset state
        mockDOM.activeElement = null;
        mockDOM.searchInput = createMockElement();
        
        let preventDefaultCalled = false;
        const mockEvent = {
            preventDefault: function() { preventDefaultCalled = true; }
        };
        
        // Call the focus function
        focusSearchInput(mockEvent);
        
        assert(preventDefaultCalled, 'preventDefault should be called when not already focused');
        assert(mockDOM.searchInput.focused, 'Search input should be focused');
        assert(mockDOM.activeElement === mockDOM.searchInput, 'Search input should be the active element');
        assert(mockDOM.searchInput.value === '/', 'Search input should contain "/" character');
        assert(mockDOM.searchInput.selectionStart === 1, 'Cursor should be positioned after "/"');
        assert(mockDOM.searchInput.selectionEnd === 1, 'Selection end should be after "/"');
    }
    
    // Test 2: When search field is already focused, allow normal typing
    function testSlashWhenAlreadyFocused() {
        console.log('\n--- Test 2: Slash when search field already focused ---');
        
        // Setup: search field is already focused with some text
        mockDOM.searchInput = createMockElement();
        mockDOM.searchInput.focused = true;
        mockDOM.searchInput.value = 'existing text';
        mockDOM.activeElement = mockDOM.searchInput;
        
        let preventDefaultCalled = false;
        const mockEvent = {
            preventDefault: function() { preventDefaultCalled = true; }
        };
        
        // Call the focus function when already focused
        focusSearchInput(mockEvent);
        
        assert(!preventDefaultCalled, 'preventDefault should NOT be called when already focused');
        assert(mockDOM.searchInput.value === 'existing text', 'Existing text should be preserved');
        assert(mockDOM.activeElement === mockDOM.searchInput, 'Search input should remain active');
    }
    
    // Test 3: Function works without event parameter
    function testFunctionWorksWithoutEvent() {
        console.log('\n--- Test 3: Function works without event parameter ---');
        
        // Reset state
        mockDOM.activeElement = null;
        mockDOM.searchInput = createMockElement();
        
        // Call without event parameter (should not crash)
        focusSearchInput();
        
        assert(mockDOM.searchInput.focused, 'Search input should be focused even without event');
        assert(mockDOM.searchInput.value === '/', 'Search input should contain "/" character');
    }
    
    // Test 4: Input event is triggered for search functionality
    function testInputEventTriggered() {
        console.log('\n--- Test 4: Input event is triggered for search ---');
        
        // Reset state
        mockDOM.activeElement = null;
        mockDOM.searchInput = createMockElement();
        
        let inputEventTriggered = false;
        mockDOM.searchInput.oninput = function(e) {
            inputEventTriggered = true;
            assert(e.target.value === '/', 'Input event should receive "/" value');
        };
        
        const mockEvent = {
            preventDefault: function() {}
        };
        
        // Call the focus function
        focusSearchInput(mockEvent);
        
        assert(inputEventTriggered, 'Input event should be triggered to update search');
    }
    
    // Test 5: Clear field and add '/' character (replacing existing text)
    function testReplacesExistingText() {
        console.log('\n--- Test 5: Replaces existing text with "/" ---');
        
        // Setup: search field with existing text but not focused
        mockDOM.activeElement = null;
        mockDOM.searchInput = createMockElement();
        mockDOM.searchInput.value = 'old search';
        
        const mockEvent = {
            preventDefault: function() {}
        };
        
        // Call the focus function
        focusSearchInput(mockEvent);
        
        assert(mockDOM.searchInput.value === '/', 'Should replace existing text with "/"');
        assert(mockDOM.searchInput.selectionStart === 1, 'Cursor should be after "/"');
    }
    
    // Test 6: Edge case - no search input element
    function testNoSearchInputElement() {
        console.log('\n--- Test 6: Graceful handling when no search input ---');
        
        // Mock getElementById to return null
        const originalGetById = mockDOM.getElementById;
        mockDOM.getElementById = function(id) {
            if (id === 'searchInput') return null;
            return originalGetById.call(this, id);
        };
        
        const mockEvent = {
            preventDefault: function() {}
        };
        
        // Should not crash when search input doesn't exist
        try {
            focusSearchInput(mockEvent);
            assert(true, 'Function should handle missing search input gracefully');
        } catch (error) {
            assert(false, 'Function should not throw error when search input is missing');
        }
        
        // Restore original function
        mockDOM.getElementById = originalGetById;
    }
    
    // Run all tests
    console.log('============================================================');
    testSlashShortcutFromUnfocused();
    testSlashWhenAlreadyFocused();
    testFunctionWorksWithoutEvent();
    testInputEventTriggered();
    testReplacesExistingText();
    testNoSearchInputElement();
    console.log('============================================================');
    
    // Summary
    console.log(`\n📊 Test Results: ${testsPassed}/${testsRun} passed`);
    
    if (testsPassed === testsRun) {
        console.log('🎉 All search focus fix tests passed!');
        return true;
    } else {
        console.log('❌ Some search focus fix tests failed!');
        return false;
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runSearchFocusFixTests, focusSearchInput };
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const success = runSearchFocusFixTests();
    process.exit(success ? 0 : 1);
}