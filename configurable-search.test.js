/**
 * Unit Tests for Configurable Search Debounce Functionality
 * 
 * This file tests the configurable search debounce delay functionality
 * in the TodoController class, ensuring:
 * - Default debounce delay works
 * - Custom debounce delays can be set
 * - Search configuration options are respected
 * - Backward compatibility is maintained
 */

// Setup browser environment simulation for Node.js testing
if (typeof require !== 'undefined') {
    // For Node.js testing environment, we need to simulate the browser environment
    global.document = {
        getElementById: function(id) {
            const mockElement = {
                addEventListener: function() {},
                style: { display: 'none' },
                innerHTML: '',
                value: '',
                textContent: '',
                classList: {
                    add: function() {},
                    remove: function() {},
                    toggle: function() {}
                },
                querySelector: function() { return mockElement; }
            };
            return mockElement;
        },
        createElement: function() {
            return { 
                textContent: '', 
                innerHTML: '',
                classList: {
                    add: function() {},
                    remove: function() {}
                }
            };
        },
        addEventListener: function() {},
        body: {
            classList: {
                add: function() {},
                remove: function() {}
            }
        }
    };
    
    global.localStorage = {
        data: {},
        getItem: function(key) { return this.data[key] || null; },
        setItem: function(key, value) { this.data[key] = value; },
        clear: function() { this.data = {}; }
    };
    
    global.confirm = () => true;
    global.window = { 
        matchMedia: () => ({ 
            matches: false, 
            addEventListener: () => {} 
        }) 
    };
    
    global.crypto = {
        randomUUID: function() {
            return 'test-uuid-' + Math.random().toString(36).substr(2, 9);
        }
    };
    
    // Mock setTimeout and clearTimeout for testing
    global.testTimers = [];
    global.testTimerIdCounter = 0;
    
    global.setTimeout = function(callback, delay) {
        const timerId = ++global.testTimerIdCounter;
        global.testTimers.push({
            id: timerId,
            callback: callback,
            delay: delay,
            created: Date.now()
        });
        return timerId;
    };
    
    global.clearTimeout = function(timerId) {
        const index = global.testTimers.findIndex(timer => timer.id === timerId);
        if (index >= 0) {
            global.testTimers.splice(index, 1);
        }
    };
    
    global.triggerTestTimers = function() {
        const timers = [...global.testTimers];
        global.testTimers = [];
        timers.forEach(timer => timer.callback());
    };
    
    global.clearTestTimers = function() {
        global.testTimers = [];
    };
}

// Simplified TodoModel for testing
class TodoModel {
    constructor() {
        this.todos = [];
    }

    addTodo(text) {
        const todo = {
            id: 'test-id-' + Math.random().toString(36).substr(2, 9),
            text: text.trim(),
            completed: false,
            archived: false,
            createdAt: new Date().toISOString()
        };
        this.todos.unshift(todo);
        return todo;
    }

    filterTodos(searchTerm, includeArchived = false) {
        let todosToSearch = includeArchived ? this.todos : this.todos.filter(todo => !todo.archived);
        
        if (!searchTerm || !searchTerm.trim()) {
            return [...todosToSearch];
        }
        
        const normalizedTerm = searchTerm.toLowerCase().trim();
        return todosToSearch.filter(todo => 
            todo.text.toLowerCase().includes(normalizedTerm)
        );
    }

    getTodosFiltered(includeArchived = false) {
        if (includeArchived) {
            return [...this.todos];
        }
        return this.todos.filter(todo => !todo.archived);
    }
}

// Simplified TodoView for testing
class TodoView {
    constructor() {
        this.renderCallCount = 0;
        this.lastRenderData = null;
    }

    render(filteredTodos, allTodos, searchTerm, showArchived) {
        this.renderCallCount++;
        this.lastRenderData = {
            filteredTodos: filteredTodos || [],
            allTodos: allTodos || [],
            searchTerm: searchTerm || '',
            showArchived: showArchived || false
        };
    }

    isEditing() {
        return false;
    }
}

// Simplified TodoController for testing (without full keyboard management)
class TodoController {
    constructor(model, view, options = {}) {
        this.model = model;
        this.view = view;
        this.searchTerm = '';
        this.searchDebounceTimer = null;
        this.showArchived = false;
        
        // Configuration options with defaults
        this.options = {
            searchDebounceDelay: 150, // Default 150ms debounce delay
            keyboardDebug: false,
            keyboardLogging: false,
            keyboardValidateConflicts: true,
            ...options
        };
    }

    handleSearch(searchTerm) {
        // Clear previous timer
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
        
        // Debounce search for performance with large datasets
        // Use configurable delay (default 150ms)
        this.searchDebounceTimer = setTimeout(() => {
            this.searchTerm = searchTerm;
            this.render();
        }, this.options.searchDebounceDelay);
    }

    setSearchDebounceDelay(delay) {
        if (typeof delay === 'number' && delay >= 0) {
            this.options.searchDebounceDelay = delay;
        }
    }

    getSearchDebounceDelay() {
        return this.options.searchDebounceDelay;
    }

    render() {
        const allTodos = this.model.getTodosFiltered(this.showArchived);
        const filteredTodos = this.model.filterTodos(this.searchTerm, this.showArchived);
        this.view.render(filteredTodos, allTodos, this.searchTerm, this.showArchived);
    }
}

// Test Framework
class TestFramework {
    constructor() {
        this.testCount = 0;
        this.passCount = 0;
        this.failCount = 0;
        this.results = [];
    }

    assert(condition, message) {
        this.testCount++;
        if (condition) {
            this.passCount++;
            this.results.push({ type: 'pass', message });
            if (typeof process !== 'undefined') {
                console.log(`✓ ${message}`);
            }
        } else {
            this.failCount++;
            this.results.push({ type: 'fail', message });
            if (typeof process !== 'undefined') {
                console.log(`✗ ${message}`);
            }
        }
    }

    assertEqual(actual, expected, message) {
        const condition = actual === expected;
        const fullMessage = `${message} (expected: ${expected}, got: ${actual})`;
        this.assert(condition, fullMessage);
    }

    printSummary() {
        console.log(`\n=== Configurable Search Debounce Test Results ===`);
        console.log(`Total: ${this.testCount}, Passed: ${this.passCount}, Failed: ${this.failCount}`);
        console.log(`Success Rate: ${this.testCount > 0 ? ((this.passCount / this.testCount) * 100).toFixed(1) : 0}%`);
        
        if (this.failCount > 0) {
            console.log('\nFailed Tests:');
            this.results.filter(r => r.type === 'fail').forEach(r => {
                console.log(`  ✗ ${r.message}`);
            });
        }
        
        return this.failCount === 0;
    }
}

// Test Suite
function runConfigurableSearchTests() {
    const test = new TestFramework();
    
    console.log('Running Configurable Search Debounce Tests...\n');

    // Test 1: Default Configuration
    {
        const model = new TodoModel();
        const view = new TodoView();
        const controller = new TodoController(model, view);
        
        test.assertEqual(controller.getSearchDebounceDelay(), 150, 'Default search debounce delay should be 150ms');
    }

    // Test 2: Custom Configuration via Constructor
    {
        const model = new TodoModel();
        const view = new TodoView();
        const controller = new TodoController(model, view, { searchDebounceDelay: 300 });
        
        test.assertEqual(controller.getSearchDebounceDelay(), 300, 'Custom search debounce delay should be 300ms');
    }

    // Test 3: Zero Debounce Delay Configuration
    {
        const model = new TodoModel();
        const view = new TodoView();
        const controller = new TodoController(model, view, { searchDebounceDelay: 0 });
        
        test.assertEqual(controller.getSearchDebounceDelay(), 0, 'Zero debounce delay should be allowed');
    }

    // Test 4: Runtime Configuration Change
    {
        const model = new TodoModel();
        const view = new TodoView();
        const controller = new TodoController(model, view);
        
        // Change delay at runtime
        controller.setSearchDebounceDelay(500);
        test.assertEqual(controller.getSearchDebounceDelay(), 500, 'Runtime configuration change should work');
    }

    // Test 5: Invalid Configuration Values are Ignored
    {
        const model = new TodoModel();
        const view = new TodoView();
        const controller = new TodoController(model, view, { searchDebounceDelay: 200 });
        
        const originalDelay = controller.getSearchDebounceDelay();
        
        // Try invalid values
        controller.setSearchDebounceDelay(-1);
        test.assertEqual(controller.getSearchDebounceDelay(), originalDelay, 'Negative delay should be ignored');
        
        controller.setSearchDebounceDelay('invalid');
        test.assertEqual(controller.getSearchDebounceDelay(), originalDelay, 'Non-numeric delay should be ignored');
        
        controller.setSearchDebounceDelay(null);
        test.assertEqual(controller.getSearchDebounceDelay(), originalDelay, 'Null delay should be ignored');
    }

    // Test 6: Search Timer Creation with Default Delay
    {
        if (typeof global !== 'undefined' && global.clearTestTimers) {
            global.clearTestTimers();
            
            const model = new TodoModel();
            const view = new TodoView();
            const controller = new TodoController(model, view);
            
            // Add some test todos
            model.addTodo('Test todo 1');
            model.addTodo('Test todo 2');
            
            // Perform search
            controller.handleSearch('test');
            
            // Check that timer was created with correct delay
            test.assertEqual(global.testTimers.length, 1, 'Should create one timer for search');
            test.assertEqual(global.testTimers[0].delay, 150, 'Timer should use default 150ms delay');
            
            // Trigger the timer
            global.triggerTestTimers();
            
            // Verify render was called
            test.assertEqual(view.renderCallCount, 1, 'Search should trigger render after debounce');
            test.assertEqual(controller.searchTerm, 'test', 'Search term should be set after debounce');
        }
    }

    // Test 7: Search Timer Creation with Custom Delay
    {
        if (typeof global !== 'undefined' && global.clearTestTimers) {
            global.clearTestTimers();
            
            const model = new TodoModel();
            const view = new TodoView();
            const controller = new TodoController(model, view, { searchDebounceDelay: 250 });
            
            // Perform search
            controller.handleSearch('custom');
            
            // Check that timer was created with correct delay
            test.assertEqual(global.testTimers.length, 1, 'Should create one timer for search');
            test.assertEqual(global.testTimers[0].delay, 250, 'Timer should use custom 250ms delay');
        }
    }

    // Test 8: Search Timer Cancellation on Rapid Input
    {
        if (typeof global !== 'undefined' && global.clearTestTimers) {
            global.clearTestTimers();
            
            const model = new TodoModel();
            const view = new TodoView();
            const controller = new TodoController(model, view, { searchDebounceDelay: 100 });
            
            // Rapid search inputs
            controller.handleSearch('first');
            test.assertEqual(global.testTimers.length, 1, 'Should create first timer');
            
            controller.handleSearch('second');
            test.assertEqual(global.testTimers.length, 1, 'Should cancel first timer and create second');
            
            controller.handleSearch('third');
            test.assertEqual(global.testTimers.length, 1, 'Should cancel second timer and create third');
            
            // Trigger final timer
            global.triggerTestTimers();
            
            test.assertEqual(controller.searchTerm, 'third', 'Should only execute final search term');
            test.assertEqual(view.renderCallCount, 1, 'Should only render once after all rapid inputs');
        }
    }

    // Test 9: Zero Delay Search (Immediate Execution)
    {
        if (typeof global !== 'undefined' && global.clearTestTimers) {
            global.clearTestTimers();
            
            const model = new TodoModel();
            const view = new TodoView();
            const controller = new TodoController(model, view, { searchDebounceDelay: 0 });
            
            // Perform search with zero delay
            controller.handleSearch('immediate');
            
            // Check that timer was created with zero delay
            test.assertEqual(global.testTimers.length, 1, 'Should create timer even with zero delay');
            test.assertEqual(global.testTimers[0].delay, 0, 'Timer should use zero delay');
        }
    }

    // Test 10: Options Object Merging
    {
        const model = new TodoModel();
        const view = new TodoView();
        const controller = new TodoController(model, view, {
            searchDebounceDelay: 400,
            keyboardDebug: true,
            customOption: 'test'
        });
        
        test.assertEqual(controller.options.searchDebounceDelay, 400, 'Custom searchDebounceDelay should be set');
        test.assertEqual(controller.options.keyboardDebug, true, 'Custom keyboardDebug should be set');
        test.assertEqual(controller.options.keyboardLogging, false, 'Default keyboardLogging should be preserved');
        test.assertEqual(controller.options.customOption, 'test', 'Custom options should be included');
    }

    // Test 11: Backward Compatibility (No Options Parameter)
    {
        const model = new TodoModel();
        const view = new TodoView();
        const controller = new TodoController(model, view); // No options parameter
        
        test.assertEqual(controller.getSearchDebounceDelay(), 150, 'Should use default delay when no options provided');
        test.assert(controller.options, 'Options object should exist even when not provided');
        test.assertEqual(controller.options.keyboardDebug, false, 'Default keyboard options should be set');
    }

    // Test 12: Search Functionality Still Works with Configuration
    {
        if (typeof global !== 'undefined' && global.clearTestTimers) {
            global.clearTestTimers();
            
            const model = new TodoModel();
            const view = new TodoView();
            const controller = new TodoController(model, view, { searchDebounceDelay: 50 });
            
            // Add test todos
            model.addTodo('Buy groceries');
            model.addTodo('Walk the dog');
            model.addTodo('Read a book');
            
            // Perform search
            controller.handleSearch('dog');
            
            // Trigger timer
            global.triggerTestTimers();
            
            // Verify search results
            test.assertEqual(view.lastRenderData.searchTerm, 'dog', 'Search term should be passed to view');
            test.assertEqual(view.lastRenderData.filteredTodos.length, 1, 'Should filter to matching todos');
            test.assertEqual(view.lastRenderData.filteredTodos[0].text, 'Walk the dog', 'Should find correct todo');
        }
    }

    return test.printSummary();
}

// Run tests
if (typeof process !== 'undefined') {
    // Node.js environment
    const success = runConfigurableSearchTests();
    process.exit(success ? 0 : 1);
} else {
    // Browser environment
    window.runConfigurableSearchTests = runConfigurableSearchTests;
}