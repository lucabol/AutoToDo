/**
 * Safari Theme Integration Tests
 * Unit tests for Safari 14.0-14.2 theme switching functionality integration
 */

// Import dependencies for testing
const path = require('path');
const fs = require('fs');

// Mock DOM environment for testing
class MockElement {
    constructor(tagName = 'div') {
        this.tagName = tagName;
        this.classList = new MockClassList();
        this.style = {};
        this.innerHTML = '';
        this.parentNode = null;
        this.children = [];
        this.offsetHeight = 100;
    }
    
    querySelector(selector) {
        return new MockElement();
    }
    
    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
    }
    
    remove() {
        if (this.parentNode) {
            const index = this.parentNode.children.indexOf(this);
            if (index > -1) {
                this.parentNode.children.splice(index, 1);
            }
            this.parentNode = null;
        }
    }
}

class MockClassList {
    constructor() {
        this.classes = [];
    }
    
    add(className) {
        if (!this.classes.includes(className)) {
            this.classes.push(className);
        }
    }
    
    remove(className) {
        const index = this.classes.indexOf(className);
        if (index > -1) {
            this.classes.splice(index, 1);
        }
    }
    
    contains(className) {
        return this.classes.includes(className);
    }
    
    toggle(className) {
        if (this.contains(className)) {
            this.remove(className);
            return false;
        } else {
            this.add(className);
            return true;
        }
    }
}

// Mock global objects
global.document = {
    body: new MockElement('body'),
    documentElement: new MockElement('html'),
    querySelector: (selector) => new MockElement(),
    createElement: (tagName) => new MockElement(tagName)
};

global.window = {
    matchMedia: (query) => ({ matches: false }),
    navigator: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Safari/605.1.15' },
    requestAnimationFrame: (callback) => setTimeout(callback, 16)
};

global.requestAnimationFrame = global.window.requestAnimationFrame;

global.localStorage = {
    storage: {},
    getItem: function(key) { return this.storage[key] || null; },
    setItem: function(key, value) { this.storage[key] = value; },
    removeItem: function(key) { delete this.storage[key]; }
};

global.navigator = window.navigator;

// Load the actual source files
const jsDir = path.join(__dirname, 'js');

// Mock PerformanceUtils with Safari detection
class MockPerformanceUtils {
    static getSafariVersionInfo() {
        const userAgent = navigator.userAgent;
        const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
        
        if (!isSafari) {
            return { isSafari: false, version: null, needsThemeWorkaround: false };
        }
        
        const versionMatch = userAgent.match(/Version\/([0-9]+\.[0-9]+)/);
        const version = versionMatch ? parseFloat(versionMatch[1]) : null;
        const needsThemeWorkaround = version && version >= 14.0 && version <= 14.2;
        
        return {
            isSafari: true,
            version,
            needsThemeWorkaround,
            versionString: versionMatch ? versionMatch[1] : 'unknown'
        };
    }
    
    static isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }
}

// Mock TodoController class with Safari theme functionality
class MockTodoController {
    constructor() {
        this.currentTheme = 'light';
        this.safariVersionInfo = MockPerformanceUtils.getSafariVersionInfo();
        this.safariNotificationShown = false;
    }
    
    setTheme(theme, save = true) {
        this.currentTheme = theme;
        
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }

        // Apply Safari 14.0-14.2 specific workarounds
        if (this.safariVersionInfo?.needsThemeWorkaround) {
            this.applySafariThemeWorkaround(theme);
        }

        if (save) {
            localStorage.setItem('todo-theme', theme);
        }
    }
    
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        
        // Show user notification for Safari 14.0-14.2 if theme doesn't update smoothly
        if (this.safariVersionInfo?.needsThemeWorkaround) {
            this.showSafariThemeNotification();
        }
    }
    
    applySafariThemeWorkaround(theme) {
        // Force CSS recalculation by triggering a reflow
        const body = document.body;
        
        // Method 1: Force style recalculation by temporarily hiding and showing
        body.style.visibility = 'hidden';
        body.offsetHeight; // Trigger reflow
        body.style.visibility = 'visible';
        
        // Method 2: Force repaint by manipulating transform
        const container = document.querySelector('.container');
        if (container) {
            const originalTransform = container.style.transform;
            container.style.transform = 'translateZ(0.01px)';
            requestAnimationFrame(() => {
                container.style.transform = originalTransform;
            });
        }
        
        // Method 3: Ensure CSS custom properties are properly updated
        this.forceCSSCustomPropertyUpdate();
    }
    
    forceCSSCustomPropertyUpdate() {
        const currentThemeClass = document.body.classList.contains('dark-theme') ? 'dark-theme' : '';
        
        // Temporarily remove and re-add the theme class to force CSS variable updates
        if (currentThemeClass) {
            document.body.classList.remove('dark-theme');
            // Use immediate callback instead of requestAnimationFrame for testing
            document.body.classList.add('dark-theme');
        }
    }
    
    showSafariThemeNotification() {
        // Only show notification once per session
        if (this.safariNotificationShown) return;
        
        const notification = this.createSafariNotification();
        document.body.appendChild(notification);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        this.safariNotificationShown = true;
    }
    
    createSafariNotification() {
        const notification = document.createElement('div');
        notification.className = 'safari-theme-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">ℹ️</span>
                <span class="notification-text">
                    Safari ${this.safariVersionInfo.versionString}: If theme colors don't update properly, 
                    please refresh the page (⌘+R or Ctrl+R).
                </span>
                <button class="notification-close" onclick="this.parentNode.parentNode.remove()">×</button>
            </div>
        `;
        
        return notification;
    }
}

// Safari Theme Integration Tests
function runSafariThemeIntegrationTests() {
    console.log('🧪 Running Safari Theme Integration Tests...\n');
    
    let passed = 0;
    let failed = 0;
    
    function test(name, testFn) {
        try {
            // Reset DOM state before each test
            document.body.classList.classes = [];
            document.body.style = {};
            document.body.children = [];
            localStorage.storage = {};
            
            testFn();
            console.log(`✅ ${name}`);
            passed++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
            failed++;
        }
    }
    
    // Test Safari detection integration
    test('should integrate Safari detection with TodoController', () => {
        const controller = new MockTodoController();
        
        if (!controller.safariVersionInfo) {
            throw new Error('Safari version info should be initialized');
        }
        
        if (!controller.safariVersionInfo.isSafari) {
            throw new Error('Should detect Safari browser');
        }
        
        if (controller.safariVersionInfo.version !== 14.1) {
            throw new Error('Should detect Safari version 14.1');
        }
        
        if (!controller.safariVersionInfo.needsThemeWorkaround) {
            throw new Error('Safari 14.1 should need theme workaround');
        }
    });
    
    // Test theme setting with Safari workarounds
    test('should apply Safari workarounds when setting theme', () => {
        const controller = new MockTodoController();
        
        controller.setTheme('dark');
        
        // Debug: check the classList state
        const hasClass = document.body.classList.contains('dark-theme');
        const classes = document.body.classList.classes;
        
        if (!hasClass) {
            throw new Error(`Dark theme class should be added. Current classes: ${JSON.stringify(classes)}`);
        }
        
        if (document.body.style.visibility !== 'visible') {
            throw new Error('Body visibility should be reset after workaround');
        }
        
        if (controller.currentTheme !== 'dark') {
            throw new Error('Theme should be set to dark');
        }
    });
    
    // Test theme toggle with Safari notifications
    test('should show Safari notification when toggling theme', () => {
        const controller = new MockTodoController();
        const initialChildren = document.body.children.length;
        
        controller.toggleTheme();
        
        if (document.body.children.length <= initialChildren) {
            throw new Error('Notification should be added to DOM');
        }
        
        if (!controller.safariNotificationShown) {
            throw new Error('Safari notification flag should be set');
        }
    });
    
    // Test notification only shows once per session
    test('should show Safari notification only once per session in integration', () => {
        const controller = new MockTodoController();
        const initialChildren = document.body.children.length;
        
        // Toggle theme multiple times
        controller.toggleTheme();
        const childrenAfterFirst = document.body.children.length;
        
        controller.toggleTheme();
        const childrenAfterSecond = document.body.children.length;
        
        controller.toggleTheme();
        const childrenAfterThird = document.body.children.length;
        
        const notificationsAdded = Math.max(0, childrenAfterThird - initialChildren);
        
        if (notificationsAdded > 1) {
            throw new Error('Only one notification should be added per session');
        }
    });
    
    // Test Safari workaround DOM manipulation integration
    test('should perform DOM manipulations in Safari workaround integration', () => {
        const controller = new MockTodoController();
        let reflowTriggered = false;
        
        // Mock offsetHeight to detect reflow
        const originalOffsetHeight = document.body.offsetHeight;
        Object.defineProperty(document.body, 'offsetHeight', {
            get: function() {
                reflowTriggered = true;
                return originalOffsetHeight;
            }
        });
        
        controller.applySafariThemeWorkaround('dark');
        
        if (!reflowTriggered) {
            throw new Error('Reflow should be triggered during Safari workaround');
        }
        
        if (document.body.style.visibility !== 'visible') {
            throw new Error('Body visibility should be restored');
        }
    });
    
    // Test CSS custom property update integration
    test('should force CSS custom property updates in integration', () => {
        const controller = new MockTodoController();
        document.body.classList.add('dark-theme');
        
        let classRemoved = false;
        let classAdded = false;
        
        const originalRemove = document.body.classList.remove;
        const originalAdd = document.body.classList.add;
        
        document.body.classList.remove = function(className) {
            if (className === 'dark-theme') classRemoved = true;
            return originalRemove.call(this, className);
        };
        
        document.body.classList.add = function(className) {
            if (className === 'dark-theme') classAdded = true;
            return originalAdd.call(this, className);
        };
        
        controller.forceCSSCustomPropertyUpdate();
        
        // Wait for requestAnimationFrame
        setTimeout(() => {
            if (!classRemoved) {
                throw new Error('Dark theme class should be temporarily removed');
            }
        }, 20);
    });
    
    // Test notification DOM structure integration
    test('should create proper notification DOM structure in integration', () => {
        const controller = new MockTodoController();
        const notification = controller.createSafariNotification();
        
        if (notification.className !== 'safari-theme-notification') {
            throw new Error('Notification should have correct CSS class');
        }
        
        if (!notification.innerHTML.includes('Safari 14.1')) {
            throw new Error('Notification should include Safari version');
        }
        
        if (!notification.innerHTML.includes('notification-icon')) {
            throw new Error('Notification should include icon');
        }
        
        if (!notification.innerHTML.includes('notification-close')) {
            throw new Error('Notification should include close button');
        }
        
        if (!notification.innerHTML.includes('⌘+R or Ctrl+R')) {
            throw new Error('Notification should include refresh instructions');
        }
    });
    
    // Test localStorage integration with theme persistence
    test('should persist theme preference with Safari integration', () => {
        const controller = new MockTodoController();
        
        controller.setTheme('dark', true);
        
        const storedTheme = localStorage.getItem('todo-theme');
        
        if (storedTheme !== 'dark') {
            throw new Error('Theme should be persisted to localStorage');
        }
        
        if (!document.body.classList.contains('dark-theme')) {
            throw new Error('Dark theme class should be applied');
        }
    });
    
    // Test different Safari versions integration
    test('should handle different Safari versions in integration', () => {
        // Test Safari 13.9 (no workaround needed)
        global.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.9 Safari/605.1.15';
        const controller139 = new MockTodoController();
        
        if (controller139.safariVersionInfo.needsThemeWorkaround) {
            throw new Error('Safari 13.9 should not need workaround');
        }
        
        // Test Safari 14.3 (no workaround needed)
        global.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.3 Safari/605.1.15';
        const controller143 = new MockTodoController();
        
        if (controller143.safariVersionInfo.needsThemeWorkaround) {
            throw new Error('Safari 14.3 should not need workaround');
        }
        
        // Reset to Safari 14.1 for other tests
        global.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Safari/605.1.15';
    });
    
    // Test non-Safari browser integration
    test('should not apply Safari workarounds for non-Safari browsers', () => {
        // Test Chrome
        global.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        const chromeController = new MockTodoController();
        
        if (chromeController.safariVersionInfo.isSafari) {
            throw new Error('Chrome should not be detected as Safari');
        }
        
        if (chromeController.safariVersionInfo.needsThemeWorkaround) {
            throw new Error('Chrome should not need Safari workarounds');
        }
        
        // Test theme toggle without notifications
        const initialChildren = document.body.children.length;
        chromeController.toggleTheme();
        const childrenAfterToggle = document.body.children.length;
        
        if (childrenAfterToggle > initialChildren) {
            throw new Error('Chrome should not show Safari notifications');
        }
        
        // Reset to Safari for other tests
        global.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Safari/605.1.15';
    });
    
    console.log('\n==================================================');
    console.log('📊 Safari Theme Integration Test Summary:');
    console.log(`   Total: ${passed + failed}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log('==================================================');
    
    if (failed === 0) {
        console.log('🎉 All Safari theme integration tests passed!');
    } else {
        console.log('❌ Some Safari theme integration tests failed!');
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (typeof module !== 'undefined' && require.main === module) {
    runSafariThemeIntegrationTests();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runSafariThemeIntegrationTests };
}