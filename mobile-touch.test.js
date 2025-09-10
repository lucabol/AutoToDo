/**
 * Mobile Touch Interaction Tests
 * 
 * PURPOSE: Comprehensive testing of mobile touch optimizations including:
 * - Touch event handling for faster response times
 * - Touch state management to prevent duplicate events
 * - Visual feedback for touch interactions
 * - Accessibility compliance for touch targets
 * 
 * COVERAGE:
 * - Todo item touch interactions (edit, delete, toggle)
 * - Button touch interactions (theme toggle, clear search, add todo)
 * - Touch state management and event prevention
 * - Visual feedback and accessibility features
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Set up DOM environment
const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
const css = fs.readFileSync(path.resolve(__dirname, 'styles.css'), 'utf8');

const dom = new JSDOM(html, {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.localStorage = dom.window.localStorage;
global.TouchEvent = dom.window.TouchEvent || class TouchEvent extends Event {};

// Add CSS to document
const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);

// Load application modules
eval(fs.readFileSync(path.resolve(__dirname, 'js/TodoModel.js'), 'utf8'));
eval(fs.readFileSync(path.resolve(__dirname, 'js/TodoView.js'), 'utf8'));
eval(fs.readFileSync(path.resolve(__dirname, 'js/StorageManager.js'), 'utf8'));
eval(fs.readFileSync(path.resolve(__dirname, 'js/PerformanceUtils.js'), 'utf8'));
eval(fs.readFileSync(path.resolve(__dirname, 'js/KeyboardShortcutManager.js'), 'utf8'));
eval(fs.readFileSync(path.resolve(__dirname, 'js/KeyboardHandlers.js'), 'utf8'));
eval(fs.readFileSync(path.resolve(__dirname, 'js/ShortcutsConfig.js'), 'utf8'));
eval(fs.readFileSync(path.resolve(__dirname, 'js/HelpModalBuilder.js'), 'utf8'));
eval(fs.readFileSync(path.resolve(__dirname, 'js/TodoController.js'), 'utf8'));

// Test utilities
const TestUtils = {
    /**
     * Create a mock touch event
     * @param {string} type - Event type (touchstart, touchend, etc.)
     * @param {Element} target - Target element  
     * @param {Object} options - Additional options
     * @returns {TouchEvent} Mock touch event
     */
    createTouchEvent(type, target, options = {}) {
        const event = new TouchEvent(type, {
            bubbles: true,
            cancelable: true,
            ...options
        });
        
        // Mock touch-specific properties
        Object.defineProperty(event, 'target', { value: target });
        Object.defineProperty(event, 'touches', { value: [] });
        Object.defineProperty(event, 'changedTouches', { value: [] });
        
        return event;
    },

    /**
     * Simulate a complete touch interaction (touchstart + touchend)
     * @param {Element} element - Element to touch
     * @param {Object} options - Touch options
     * @returns {Promise} Promise that resolves after touch simulation
     */
    async simulateTouch(element, options = {}) {
        const touchStart = this.createTouchEvent('touchstart', element, options);
        const touchEnd = this.createTouchEvent('touchend', element, options);
        
        element.dispatchEvent(touchStart);
        
        // Small delay to simulate realistic touch duration
        await new Promise(resolve => setTimeout(resolve, 50));
        
        element.dispatchEvent(touchEnd);
        
        // Allow event processing
        await new Promise(resolve => setTimeout(resolve, 10));
    },

    /**
     * Wait for a specified amount of time
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise} Promise that resolves after delay
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Check if an element meets minimum touch target size (44px)
     * @param {Element} element - Element to check
     * @returns {boolean} True if element meets accessibility requirements
     */
    meetsMinimumTouchTarget(element) {
        const style = window.getComputedStyle(element);
        const width = parseInt(style.width) || element.offsetWidth;
        const height = parseInt(style.height) || element.offsetHeight;
        
        return width >= 44 && height >= 44;
    }
};

// Test Suite
class MobileTouchTests {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.controller = null;
    }

    /**
     * Set up test environment
     */
    setUp() {
        // Clear localStorage
        localStorage.clear();
        
        // Initialize application
        const model = new TodoModel();
        const view = new TodoView();
        this.controller = new TodoController(model, view);
        
        // Add some test todos
        model.addTodo('Test todo 1');
        model.addTodo('Test todo 2');
        model.addTodo('Test todo 3');
        view.render(model.getAllTodos());
    }

    /**
     * Run a single test
     * @param {string} testName - Name of the test
     * @param {Function} testFn - Test function
     */
    async runTest(testName, testFn) {
        try {
            await testFn.call(this);
            console.log(`✅ PASS: ${testName}`);
            this.passed++;
        } catch (error) {
            console.log(`❌ FAIL: ${testName}`);
            console.log(`   Error: ${error.message}`);
            this.failed++;
        }
    }

    /**
     * Assert that a condition is true
     * @param {boolean} condition - Condition to check
     * @param {string} message - Error message if condition is false
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    /**
     * Test touch event handling on todo items
     */
    async testTodoItemTouchHandling() {
        const todoItems = document.querySelectorAll('.todo-item');
        this.assert(todoItems.length > 0, 'Should have todo items to test');

        const firstTodo = todoItems[0];
        const editButton = firstTodo.querySelector('[data-action="edit"]');
        const deleteButton = firstTodo.querySelector('[data-action="delete"]');
        const checkbox = firstTodo.querySelector('[data-action="toggle"]');

        // Test edit button touch
        if (editButton) {
            const initialTouchHandled = this.controller.touchHandled;
            await TestUtils.simulateTouch(editButton);
            
            // Should handle touch interaction
            this.assert(
                this.controller.touchHandled !== initialTouchHandled || 
                firstTodo.classList.contains('editing'),
                'Edit button should respond to touch events'
            );
        }

        // Test delete button touch
        if (deleteButton) {
            // Mock confirm dialog to always return true
            const originalConfirm = window.confirm;
            window.confirm = () => true;
            
            const todoCountBefore = this.controller.model.getAllTodos().length;
            await TestUtils.simulateTouch(deleteButton);
            
            const todoCountAfter = this.controller.model.getAllTodos().length;
            this.assert(
                todoCountAfter < todoCountBefore,
                'Delete button should remove todo on touch'
            );
            
            // Restore original confirm
            window.confirm = originalConfirm;
        }

        // Test checkbox touch
        if (checkbox) {
            const todo = this.controller.model.getAllTodos().find(t => 
                t.id === checkbox.dataset.id
            );
            const initialCompleted = todo ? todo.completed : false;
            
            await TestUtils.simulateTouch(checkbox);
            
            const updatedTodo = this.controller.model.getAllTodos().find(t => 
                t.id === checkbox.dataset.id
            );
            
            if (updatedTodo) {
                this.assert(
                    updatedTodo.completed !== initialCompleted,
                    'Checkbox should toggle completion status on touch'
                );
            }
        }
    }

    /**
     * Test touch event handling on buttons
     */
    async testButtonTouchHandling() {
        // Test theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const initialTheme = document.body.classList.contains('dark-theme');
            await TestUtils.simulateTouch(themeToggle);
            
            const newTheme = document.body.classList.contains('dark-theme');
            this.assert(
                newTheme !== initialTheme,
                'Theme toggle should respond to touch events'
            );
        }

        // Test clear search button
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        const searchInput = document.getElementById('searchInput');
        
        if (clearSearchBtn && searchInput) {
            // Set some search text
            searchInput.value = 'test search';
            this.controller.searchTerm = 'test search';
            
            await TestUtils.simulateTouch(clearSearchBtn);
            
            this.assert(
                searchInput.value === '' && this.controller.searchTerm === '',
                'Clear search button should clear search on touch'
            );
        }

        // Test add todo form submission
        const addTodoForm = document.getElementById('addTodoForm');
        const todoInput = document.getElementById('todoInput');
        const submitButton = addTodoForm?.querySelector('[type="submit"]');
        
        if (addTodoForm && todoInput && submitButton) {
            const initialTodoCount = this.controller.model.getAllTodos().length;
            todoInput.value = 'New touch todo';
            
            await TestUtils.simulateTouch(submitButton);
            
            const newTodoCount = this.controller.model.getAllTodos().length;
            this.assert(
                newTodoCount > initialTodoCount,
                'Add todo form should submit on touch'
            );
        }
    }

    /**
     * Test touch state management prevents duplicate events
     */
    async testTouchStateManagement() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        const initialTheme = document.body.classList.contains('dark-theme');
        
        // Simulate rapid touch events
        await TestUtils.simulateTouch(themeToggle);
        const firstChangeTheme = document.body.classList.contains('dark-theme');
        
        // Immediately simulate click event (should be prevented)
        const clickEvent = new MouseEvent('click', { bubbles: true });
        themeToggle.dispatchEvent(clickEvent);
        
        const afterClickTheme = document.body.classList.contains('dark-theme');
        
        this.assert(
            firstChangeTheme !== initialTheme,
            'Touch event should trigger theme change'
        );
        
        this.assert(
            afterClickTheme === firstChangeTheme,
            'Click event should be prevented after touch event'
        );
    }

    /**
     * Test visual feedback for touch interactions
     */
    async testVisualFeedback() {
        const todoItems = document.querySelectorAll('.todo-item [data-action]');
        if (todoItems.length === 0) return;

        const button = todoItems[0];
        
        // Simulate touchstart
        const touchStartEvent = TestUtils.createTouchEvent('touchstart', button);
        button.dispatchEvent(touchStartEvent);
        
        // Check for visual feedback (scale transform)
        const style = window.getComputedStyle(button);
        const hasVisualFeedback = 
            style.transform && style.transform.includes('scale') ||
            button.style.transform && button.style.transform.includes('scale');
        
        this.assert(
            hasVisualFeedback,
            'Touch start should provide visual feedback'
        );
        
        // Simulate touchend
        const touchEndEvent = TestUtils.createTouchEvent('touchend', button);
        button.dispatchEvent(touchEndEvent);
        
        // Allow time for style reset
        await TestUtils.wait(100);
        
        // Visual feedback should be removed
        const afterStyle = window.getComputedStyle(button);
        const feedbackRemoved = 
            !afterStyle.transform.includes('scale') &&
            (!button.style.transform || !button.style.transform.includes('scale'));
        
        this.assert(
            feedbackRemoved,
            'Visual feedback should be removed after touch end'
        );
    }

    /**
     * Test touch target accessibility requirements
     */
    async testTouchTargetAccessibility() {
        // Check theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            this.assert(
                TestUtils.meetsMinimumTouchTarget(themeToggle),
                'Theme toggle should meet minimum 44px touch target size'
            );
        }

        // Check todo action buttons
        const actionButtons = document.querySelectorAll('.todo-item [data-action]');
        actionButtons.forEach((button, index) => {
            this.assert(
                TestUtils.meetsMinimumTouchTarget(button),
                `Todo action button ${index + 1} should meet minimum touch target size`
            );
        });

        // Check clear search button
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            this.assert(
                TestUtils.meetsMinimumTouchTarget(clearSearchBtn),
                'Clear search button should meet minimum touch target size'
            );
        }
    }

    /**
     * Test touch events work correctly across different scenarios
     */
    async testTouchEventScenarios() {
        // Test 1: Multiple rapid touches should not cause issues
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const initialTheme = document.body.classList.contains('dark-theme');
            
            // Rapid touches
            await TestUtils.simulateTouch(themeToggle);
            await TestUtils.wait(50);
            await TestUtils.simulateTouch(themeToggle);
            await TestUtils.wait(50);
            await TestUtils.simulateTouch(themeToggle);
            
            // Should still work correctly
            const finalTheme = document.body.classList.contains('dark-theme');
            this.assert(
                finalTheme !== initialTheme,
                'Multiple rapid touches should not break functionality'
            );
        }

        // Test 2: Touch events during editing
        const todoItems = document.querySelectorAll('.todo-item');
        if (todoItems.length > 0) {
            const firstTodo = todoItems[0];
            const editButton = firstTodo.querySelector('[data-action="edit"]');
            
            if (editButton) {
                await TestUtils.simulateTouch(editButton);
                
                // Todo should be in editing mode
                this.assert(
                    firstTodo.classList.contains('editing') || 
                    firstTodo.querySelector('input[type="text"]'),
                    'Touch edit should activate editing mode'
                );
            }
        }

        // Test 3: Touch events with disabled elements
        const todoInput = document.getElementById('todoInput');
        if (todoInput) {
            todoInput.disabled = true;
            
            // Touch on disabled element should not cause errors
            try {
                await TestUtils.simulateTouch(todoInput);
                this.assert(true, 'Touch on disabled element should not cause errors');
            } catch (error) {
                this.assert(false, `Touch on disabled element caused error: ${error.message}`);
            }
            
            todoInput.disabled = false;
        }
    }

    /**
     * Run all mobile touch tests
     */
    async runAllTests() {
        console.log('🧪 Running Mobile Touch Interaction Tests...\n');
        
        this.setUp();
        
        await this.runTest('Todo item touch handling', this.testTodoItemTouchHandling);
        await this.runTest('Button touch handling', this.testButtonTouchHandling);
        await this.runTest('Touch state management prevents duplicates', this.testTouchStateManagement);
        await this.runTest('Visual feedback for touch interactions', this.testVisualFeedback);
        await this.runTest('Touch target accessibility requirements', this.testTouchTargetAccessibility);
        await this.runTest('Touch events work across scenarios', this.testTouchEventScenarios);
        
        console.log('\n==================================================');
        console.log('📊 Mobile Touch Test Summary:');
        console.log(`   Total: ${this.passed + this.failed}`);
        console.log(`   Passed: ${this.passed}`);
        console.log(`   Failed: ${this.failed}`);
        console.log('==================================================');
        
        if (this.failed === 0) {
            console.log('🎉 All mobile touch tests passed!');
        } else {
            console.log('⚠️  Some mobile touch tests failed.');
            process.exit(1);
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tests = new MobileTouchTests();
    tests.runAllTests().catch(console.error);
}

module.exports = MobileTouchTests;