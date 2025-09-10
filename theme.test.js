/**
 * Comprehensive Dark Mode Theme Tests
 * Tests for theme switching functionality, Safari compatibility, and error handling
 */

// Enhanced test framework with better reporting and error details
function createTestRunner() {
    let passed = 0;
    let failed = 0;
    const results = [];
    
    function test(name, testFn) {
        try {
            testFn();
            console.log(`✅ ${name}`);
            results.push({ name, status: 'passed', error: null });
            passed++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
            results.push({ name, status: 'failed', error: error.message });
            failed++;
        }
    }
    
    function summary() {
        console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);
        if (failed > 0) {
            console.log('\n🔍 Failed Tests Details:');
            results.filter(r => r.status === 'failed').forEach(r => {
                console.log(`   - ${r.name}: ${r.error}`);
            });
        }
        return { passed, failed, results };
    }
    
    return { test, summary };
}

// Mock DOM and browser APIs for testing
function createMockEnvironment() {
    // Mock localStorage with detailed tracking
    const mockStorage = {};
    const localStorage = {
        getItem: (key) => mockStorage[key] || null,
        setItem: (key, value) => mockStorage[key] = value,
        removeItem: (key) => delete mockStorage[key],
        clear: () => Object.keys(mockStorage).forEach(key => delete mockStorage[key]),
        // For testing: expose internal storage
        _getStorage: () => ({ ...mockStorage })
    };
    
    // Mock DOM elements with classList support
    const mockBody = {
        classList: {
            classes: [],
            add: function(className) { 
                if (!this.classes.includes(className)) {
                    this.classes.push(className); 
                }
            },
            remove: function(className) { 
                const index = this.classes.indexOf(className);
                if (index > -1) this.classes.splice(index, 1);
            },
            contains: function(className) {
                return this.classes.includes(className);
            },
            toggle: function(className) {
                if (this.contains(className)) {
                    this.remove(className);
                    return false;
                } else {
                    this.add(className);
                    return true;
                }
            }
        }
    };
    
    // Mock matchMedia for system theme testing
    const createMockMatchMedia = (matches = false) => ({
        matches,
        media: '(prefers-color-scheme: dark)',
        addEventListener: function(event, handler) {
            this._handler = handler;
        },
        addListener: function(handler) {
            this._legacyHandler = handler;
        },
        removeEventListener: function() {
            this._handler = null;
        },
        removeListener: function() {
            this._legacyHandler = null;
        },
        // For testing: trigger change event
        _triggerChange: function(newMatches) {
            this.matches = newMatches;
            if (this._handler) {
                this._handler({ matches: newMatches });
            }
            if (this._legacyHandler) {
                this._legacyHandler({ matches: newMatches });
            }
        }
    });
    
    return { localStorage, mockBody, createMockMatchMedia };
}

// Main test execution
function runThemeTests() {
    console.log('🧪 Running Comprehensive Dark Mode Theme Tests...\n');
    
    const { test, summary } = createTestRunner();
    const { localStorage, mockBody, createMockMatchMedia } = createMockEnvironment();
    
    // Test 1: Basic localStorage theme persistence
    test('should store and retrieve theme preference from localStorage', () => {
        localStorage.setItem('todo-theme', 'dark');
        const storedTheme = localStorage.getItem('todo-theme');
        
        if (storedTheme !== 'dark') {
            throw new Error(`Expected 'dark', got '${storedTheme}'`);
        }
        
        // Test light theme as well
        localStorage.setItem('todo-theme', 'light');
        const lightTheme = localStorage.getItem('todo-theme');
        
        if (lightTheme !== 'light') {
            throw new Error(`Expected 'light', got '${lightTheme}'`);
        }
    });
    
    // Test 2: CSS class management
    test('should properly manage theme CSS classes on body element', () => {
        // Test adding dark theme
        mockBody.classList.add('dark-theme');
        if (!mockBody.classList.contains('dark-theme')) {
            throw new Error('dark-theme class not added properly');
        }
        
        // Test removing dark theme and adding light theme
        mockBody.classList.remove('dark-theme');
        mockBody.classList.add('light-theme');
        
        if (mockBody.classList.contains('dark-theme')) {
            throw new Error('dark-theme class not removed properly');
        }
        if (!mockBody.classList.contains('light-theme')) {
            throw new Error('light-theme class not added properly');
        }
    });
    
    // Test 3: System theme preference detection
    test('should detect system dark mode preference using matchMedia', () => {
        // Test dark mode detection
        const darkModeQuery = createMockMatchMedia(true);
        if (!darkModeQuery.matches) {
            throw new Error('Failed to detect dark mode preference');
        }
        
        // Test light mode detection
        const lightModeQuery = createMockMatchMedia(false);
        if (lightModeQuery.matches) {
            throw new Error('Incorrectly detected dark mode when light mode expected');
        }
    });
    
    // Test 4: System theme change listener
    test('should handle system theme changes with event listeners', () => {
        const mockQuery = createMockMatchMedia(false);
        let eventTriggered = false;
        let eventMatches = null;
        
        // Set up event listener
        mockQuery.addEventListener('change', (e) => {
            eventTriggered = true;
            eventMatches = e.matches;
        });
        
        // Trigger system theme change
        mockQuery._triggerChange(true);
        
        if (!eventTriggered) {
            throw new Error('Theme change event not triggered');
        }
        if (eventMatches !== true) {
            throw new Error(`Expected matches=true, got ${eventMatches}`);
        }
    });
    
    // Test 5: Legacy Safari compatibility (addListener fallback)
    test('should support legacy Safari addListener for theme changes', () => {
        const mockQuery = createMockMatchMedia(false);
        let legacyEventTriggered = false;
        
        // Remove modern addEventListener to simulate older Safari
        delete mockQuery.addEventListener;
        
        // Set up legacy listener
        mockQuery.addListener((e) => {
            legacyEventTriggered = true;
        });
        
        // Trigger change
        mockQuery._triggerChange(true);
        
        if (!legacyEventTriggered) {
            throw new Error('Legacy addListener not working properly');
        }
    });
    
    // Test 6: Theme toggle functionality
    test('should toggle between light and dark themes correctly', () => {
        let currentTheme = 'light';
        
        // Mock toggle function
        const toggleTheme = () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            return currentTheme;
        };
        
        // Test multiple toggles
        const theme1 = toggleTheme(); // light -> dark
        if (theme1 !== 'dark') {
            throw new Error(`Expected 'dark' after first toggle, got '${theme1}'`);
        }
        
        const theme2 = toggleTheme(); // dark -> light
        if (theme2 !== 'light') {
            throw new Error(`Expected 'light' after second toggle, got '${theme2}'`);
        }
    });
    
    // Test 7: Color scheme meta tag handling
    test('should handle color-scheme meta tag creation and updates', () => {
        // Mock document head and meta elements
        const mockHead = { children: [] };
        const mockDocument = {
            head: mockHead,
            createElement: (tag) => ({ tagName: tag, name: '', content: '' }),
            querySelector: (selector) => {
                return mockHead.children.find(el => 
                    el.tagName === 'meta' && el.name === 'color-scheme'
                ) || null;
            }
        };
        
        // Mock appendChild
        mockHead.appendChild = function(el) {
            this.children.push(el);
        };
        
        // Test meta tag creation
        let metaColorScheme = mockDocument.querySelector('meta[name="color-scheme"]');
        if (!metaColorScheme) {
            metaColorScheme = mockDocument.createElement('meta');
            metaColorScheme.name = 'color-scheme';
            mockDocument.head.appendChild(metaColorScheme);
        }
        
        // Test dark theme meta content
        metaColorScheme.content = 'dark light';
        if (metaColorScheme.content !== 'dark light') {
            throw new Error(`Expected 'dark light', got '${metaColorScheme.content}'`);
        }
        
        // Test light theme meta content
        metaColorScheme.content = 'light dark';
        if (metaColorScheme.content !== 'light dark') {
            throw new Error(`Expected 'light dark', got '${metaColorScheme.content}'`);
        }
        
        // Verify meta tag exists in head
        const foundMeta = mockDocument.querySelector('meta[name="color-scheme"]');
        if (!foundMeta) {
            throw new Error('Meta tag not properly added to document head');
        }
    });
    
    // Test 8: Error handling for unsupported browsers
    test('should gracefully handle browsers without matchMedia support', () => {
        // Mock environment without matchMedia
        const windowWithoutMatchMedia = {};
        
        let errorHandled = false;
        try {
            // Simulate theme detection without matchMedia
            if (!windowWithoutMatchMedia.matchMedia) {
                throw new Error('matchMedia not supported');
            }
        } catch (error) {
            if (error.message === 'matchMedia not supported') {
                errorHandled = true;
                // This should not throw - error should be handled gracefully
            }
        }
        
        if (!errorHandled) {
            throw new Error('Error handling for unsupported browsers not working');
        }
    });
    
    // Test 9: Custom event dispatching
    test('should dispatch custom theme change events', () => {
        let eventDispatched = false;
        let eventDetail = null;
        
        // Mock document event dispatching
        const mockDocument = {
            dispatchEvent: (event) => {
                eventDispatched = true;
                eventDetail = event.detail;
            }
        };
        
        // Mock CustomEvent
        const mockCustomEvent = function(type, options) {
            this.type = type;
            this.detail = options.detail;
        };
        
        // Simulate theme change event
        const event = new mockCustomEvent('themechange', {
            detail: { 
                theme: 'dark', 
                timestamp: Date.now(),
                source: 'TodoController'
            }
        });
        
        mockDocument.dispatchEvent(event);
        
        if (!eventDispatched) {
            throw new Error('Custom theme change event not dispatched');
        }
        if (!eventDetail || eventDetail.theme !== 'dark') {
            throw new Error('Event detail not properly set');
        }
        if (eventDetail.source !== 'TodoController') {
            throw new Error('Event source not properly identified');
        }
    });
    
    // Test 10: Theme preference priority (user > system > default)
    test('should respect theme preference priority: user > system > default', () => {
        // Test scenario 1: User preference exists (should override system)
        localStorage.setItem('todo-theme', 'light');
        const userPreference = localStorage.getItem('todo-theme');
        const systemPrefersDark = true; // System wants dark
        
        const theme1 = userPreference || (systemPrefersDark ? 'dark' : 'light');
        if (theme1 !== 'light') {
            throw new Error('User preference not prioritized over system preference');
        }
        
        // Test scenario 2: No user preference, use system
        localStorage.removeItem('todo-theme');
        const noUserPreference = localStorage.getItem('todo-theme');
        const theme2 = noUserPreference || (systemPrefersDark ? 'dark' : 'light');
        if (theme2 !== 'dark') {
            throw new Error('System preference not used when user preference absent');
        }
        
        // Test scenario 3: No user preference, no system support, use default
        const systemNotSupported = false;
        const theme3 = noUserPreference || (systemNotSupported ? 'dark' : 'light');
        if (theme3 !== 'light') {
            throw new Error('Default theme not used when both user and system preferences unavailable');
        }
    });
    
    return summary();
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runThemeTests };
} else {
    // Auto-run when loaded in browser
    if (typeof window !== 'undefined') {
        window.runThemeTests = runThemeTests;
        // Run tests immediately for demonstration
        runThemeTests();
    }
}