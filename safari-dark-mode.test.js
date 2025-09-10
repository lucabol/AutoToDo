/**
 * Safari 14.3+ Dark Mode Feature Tests
 * Tests Safari-specific dark mode enhancements and compatibility
 */

// Mock browser environment for testing
function createMockEnvironment() {
    // Mock document
    const mockDocument = {
        body: {
            classList: {
                contains: function(className) { return this._classes && this._classes.includes(className); },
                add: function(className) { 
                    this._classes = this._classes || [];
                    if (!this._classes.includes(className)) this._classes.push(className);
                },
                remove: function(className) {
                    this._classes = this._classes || [];
                    this._classes = this._classes.filter(c => c !== className);
                },
                _classes: []
            }
        },
        head: {
            appendChild: function(element) {
                this._children = this._children || [];
                this._children.push(element);
            },
            _children: []
        },
        createElement: function(tagName) {
            return {
                tagName: tagName.toLowerCase(),
                name: '',
                content: '',
                textContent: ''
            };
        },
        querySelector: function(selector) {
            if (selector === 'meta[name="color-scheme"]') {
                return this.head._children && this.head._children.find(el => 
                    el.tagName === 'meta' && el.name === 'color-scheme'
                );
            }
            if (selector === '#themeToggle') {
                if (!this._themeToggle) {
                    this._themeToggle = {
                        querySelector: function(subSelector) {
                            if (subSelector === '.theme-icon') {
                                if (!this._themeIcon) this._themeIcon = { textContent: '🌙' };
                                return this._themeIcon;
                            }
                            if (subSelector === '.theme-text') {
                                if (!this._themeText) this._themeText = { textContent: 'Dark' };
                                return this._themeText;
                            }
                            return null;
                        }
                    };
                }
                return this._themeToggle;
            }
            return null;
        }
    };

    // Mock window
    const mockWindow = {
        matchMedia: function(query) {
            return {
                matches: query.includes('prefers-color-scheme: dark') ? false : true,
                media: query,
                addEventListener: function(type, listener) {
                    this._listeners = this._listeners || [];
                    this._listeners.push(listener);
                },
                _listeners: []
            };
        },
        dispatchEvent: function(event) {
            // Mock event dispatching
            return true;
        },
        CustomEvent: function(type, options) {
            this.type = type;
            this.detail = options ? options.detail : null;
        }
    };

    // Mock navigator
    const mockNavigator = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.3 Safari/605.1.15'
    };

    // Mock CSS
    const mockCSS = {
        supports: function(property, value) {
            const safariFeatures = {
                'color-scheme': ['light dark'],
                '-webkit-color-scheme': ['light dark'],
                'backdrop-filter': ['blur(10px)'],
                '-webkit-backdrop-filter': ['blur(10px)']
            };
            return safariFeatures[property]?.includes(value) || false;
        }
    };

    return { 
        document: mockDocument, 
        window: mockWindow, 
        navigator: mockNavigator, 
        CSS: mockCSS 
    };
}

// Mock TodoController for Safari 14.3+ features
class MockTodoController {
    constructor(mockEnv) {
        global.document = mockEnv.document;
        global.window = mockEnv.window;
        global.navigator = mockEnv.navigator;
        global.CSS = mockEnv.CSS;
        global.CustomEvent = mockEnv.window.CustomEvent;
        
        this.storage = {
            data: {},
            getItem: function(key) { return this.data[key]; },
            setItem: function(key, value) { this.data[key] = value; }
        };
        this.currentTheme = 'light';
        this.isSafari143Plus = this.detectSafari143Plus();
    }

    detectSafari143Plus() {
        const userAgent = navigator.userAgent;
        const isSafari = /Safari/.test(userAgent) && /Version/.test(userAgent);
        
        if (!isSafari) return false;
        
        const hasColorSchemeSupport = CSS.supports('color-scheme', 'light dark');
        const hasBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');
        const hasWebKitColorScheme = CSS.supports('-webkit-color-scheme', 'light dark');
        
        return hasColorSchemeSupport && hasBackdropFilter && hasWebKitColorScheme;
    }

    updateColorSchemeMeta(theme) {
        if (!this.isSafari143Plus) return;
        
        let metaTag = document.querySelector('meta[name="color-scheme"]');
        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.name = 'color-scheme';
            document.head.appendChild(metaTag);
        }
        
        metaTag.content = theme === 'dark' ? 'dark light' : 'light dark';
    }

    setTheme(theme, save = true) {
        const body = document.body;
        const themeToggle = document.querySelector('#themeToggle');
        const themeIcon = themeToggle?.querySelector('.theme-icon');
        const themeText = themeToggle?.querySelector('.theme-text');

        if (theme === 'dark') {
            body.classList.add('dark-theme');
            if (themeIcon) themeIcon.textContent = '☀️';
            if (themeText) themeText.textContent = 'Light';
            this.updateColorSchemeMeta('dark');
        } else {
            body.classList.remove('dark-theme');
            if (themeIcon) themeIcon.textContent = '🌙';
            if (themeText) themeText.textContent = 'Dark';
            this.updateColorSchemeMeta('light');
        }

        if (save && this.storage) {
            this.storage.setItem('todo-theme', theme);
        }

        this.currentTheme = theme;
        
        if (this.isSafari143Plus) {
            window.dispatchEvent(new CustomEvent('themechange', {
                detail: { theme, isSafari143Plus: true }
            }));
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
}

// Test Suite
function runSafariDarkModeTests() {
    console.log('🧪 Running Safari 14.3+ Dark Mode Tests...\n');
    
    let passed = 0;
    let failed = 0;

    function test(description, testFn) {
        try {
            testFn();
            console.log(`✅ ${description}`);
            passed++;
        } catch (error) {
            console.log(`❌ ${description}`);
            console.log(`   Error: ${error.message}`);
            failed++;
        }
    }

    // Setup
    const mockEnv = createMockEnvironment();
    const controller = new MockTodoController(mockEnv);

    // Test Safari 14.3+ Detection
    test('should detect Safari 14.3+ features correctly', () => {
        const detected = controller.detectSafari143Plus();
        if (!detected) {
            throw new Error('Failed to detect Safari 14.3+ features');
        }
    });

    // Test CSS supports queries for Safari features
    test('should support color-scheme CSS property', () => {
        const supported = CSS.supports('color-scheme', 'light dark');
        if (!supported) {
            throw new Error('color-scheme not supported');
        }
    });

    test('should support -webkit-color-scheme CSS property', () => {
        const supported = CSS.supports('-webkit-color-scheme', 'light dark');
        if (!supported) {
            throw new Error('-webkit-color-scheme not supported');
        }
    });

    test('should support backdrop-filter CSS property', () => {
        const supported = CSS.supports('backdrop-filter', 'blur(10px)');
        if (!supported) {
            throw new Error('backdrop-filter not supported');
        }
    });

    // Test color-scheme meta tag creation
    test('should create color-scheme meta tag for dark theme', () => {
        controller.setTheme('dark');
        const metaTag = document.querySelector('meta[name="color-scheme"]');
        if (!metaTag || metaTag.content !== 'dark light') {
            throw new Error('Color-scheme meta tag not created correctly for dark theme');
        }
    });

    test('should update color-scheme meta tag for light theme', () => {
        controller.setTheme('light');
        const metaTag = document.querySelector('meta[name="color-scheme"]');
        if (!metaTag || metaTag.content !== 'light dark') {
            throw new Error('Color-scheme meta tag not updated correctly for light theme');
        }
    });

    // Test theme toggle functionality
    test('should toggle theme correctly with Safari 14.3+ features', () => {
        controller.setTheme('light');
        controller.toggleTheme();
        if (controller.currentTheme !== 'dark') {
            throw new Error('Theme toggle failed');
        }
        
        const body = document.body;
        if (!body.classList.contains('dark-theme')) {
            throw new Error('Dark theme class not applied to body');
        }
    });

    // Test theme persistence
    test('should save theme preference to storage', () => {
        controller.setTheme('dark', true);
        const savedTheme = controller.storage.getItem('todo-theme');
        if (savedTheme !== 'dark') {
            throw new Error('Theme preference not saved correctly');
        }
    });

    // Test theme UI updates
    test('should update theme toggle button correctly', () => {
        const themeToggle = document.querySelector('#themeToggle');
        const themeIcon = themeToggle.querySelector('.theme-icon');
        const themeText = themeToggle.querySelector('.theme-text');
        
        controller.setTheme('dark');
        
        if (themeIcon.textContent !== '☀️') {
            throw new Error('Theme icon not updated for dark mode');
        }
        
        if (themeText.textContent !== 'Light') {
            throw new Error('Theme text not updated for dark mode');
        }
        
        controller.setTheme('light');
        
        if (themeIcon.textContent !== '🌙') {
            throw new Error('Theme icon not updated for light mode');
        }
        
        if (themeText.textContent !== 'Dark') {
            throw new Error('Theme text not updated for light mode');
        }
    });

    // Test Safari user agent detection
    test('should detect Safari user agent correctly', () => {
        const userAgent = navigator.userAgent;
        const isSafari = /Safari/.test(userAgent) && /Version/.test(userAgent);
        if (!isSafari) {
            throw new Error('Safari user agent not detected');
        }
    });

    // Test matchMedia functionality
    test('should support matchMedia for theme detection', () => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (!mediaQuery || typeof mediaQuery.addEventListener !== 'function') {
            throw new Error('matchMedia not properly supported');
        }
    });

    // Results
    console.log('\n==================================================');
    console.log('📊 Safari 14.3+ Dark Mode Test Summary:');
    console.log(`   Total: ${passed + failed}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log('==================================================');
    
    if (failed === 0) {
        console.log('🎉 All Safari 14.3+ dark mode tests passed!');
        return true;
    } else {
        console.log('❌ Some Safari 14.3+ dark mode tests failed!');
        return false;
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const success = runSafariDarkModeTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runSafariDarkModeTests };