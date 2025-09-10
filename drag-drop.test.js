/**
 * Unit Tests for Drag and Drop (Reorder) Functionality
 * Tests the reorderTodo method in TodoModel
 */

// Mock DOM and localStorage for testing
if (typeof window === 'undefined') {
    global.window = {};
    global.localStorage = {
        store: {},
        getItem: function(key) {
            return this.store[key] || null;
        },
        setItem: function(key, value) {
            this.store[key] = value;
        },
        clear: function() {
            this.store = {};
        }
    };
    global.crypto = {
        randomUUID: () => Math.random().toString(36).substr(2, 9)
    };
    
    // Mock StorageManager for Node.js testing
    global.storageManager = {
        getItem: function(key) {
            return global.localStorage.getItem(key);
        },
        setItem: function(key, value) {
            global.localStorage.setItem(key, value);
            return true;
        }
    };
}

// Load the TodoModel
const TodoModel = require('./js/TodoModel.js') || (typeof window !== 'undefined' ? window.TodoModel : null);

function runTests() {
    console.log('🧪 Running Drag and Drop (Reorder) Functionality Tests...');
    console.log();

    let testsPassed = 0;
    let testsFailed = 0;

    function test(description, testFn) {
        try {
            testFn();
            console.log(`✅ ${description}`);
            testsPassed++;
        } catch (error) {
            console.log(`❌ ${description}`);
            console.log(`   Error: ${error.message}`);
            testsFailed++;
        }
    }

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    function assertArrayEquals(actual, expected, message) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
    }

    // Test reorderTodo functionality
    test('should reorder todo from first to last position', () => {
        const model = new TodoModel();
        model.addTodo('First task');
        model.addTodo('Second task');
        model.addTodo('Third task');
        
        const todos = model.getAllTodos();
        // Note: todos are added with unshift(), so order is: Third, Second, First
        const firstTodoId = todos[0].id; // This is "Third task" (most recently added)
        
        // Move first todo to last position (index 2)
        const result = model.reorderTodo(firstTodoId, 2);
        
        assert(result === true, 'reorderTodo should return true on success');
        
        const reorderedTodos = model.getAllTodos();
        assert(reorderedTodos[2].id === firstTodoId, 'First todo should now be in last position');
        assert(reorderedTodos[2].text === todos[0].text, 'Todo text should be preserved');
    });

    test('should reorder todo from last to first position', () => {
        const model = new TodoModel();
        model.addTodo('First task');
        model.addTodo('Second task');
        model.addTodo('Third task');
        
        const todos = model.getAllTodos();
        const lastTodoId = todos[2].id; // This is "First task" (first added, now at end due to unshift)
        
        // Move last todo to first position (index 0)
        const result = model.reorderTodo(lastTodoId, 0);
        
        assert(result === true, 'reorderTodo should return true on success');
        
        const reorderedTodos = model.getAllTodos();
        assert(reorderedTodos[0].id === lastTodoId, 'Last todo should now be in first position');
        assert(reorderedTodos[0].text === todos[2].text, 'Todo text should be preserved');
    });

    test('should reorder todo to middle position', () => {
        const model = new TodoModel();
        model.addTodo('First task');
        model.addTodo('Second task');
        model.addTodo('Third task');
        model.addTodo('Fourth task');
        
        const todos = model.getAllTodos();
        const firstTodoId = todos[0].id; // Most recently added
        const originalLength = todos.length;
        
        // Move first todo to middle position (index 2)
        const result = model.reorderTodo(firstTodoId, 2);
        
        assert(result === true, 'reorderTodo should return true on success');
        
        const reorderedTodos = model.getAllTodos();
        assert(reorderedTodos[2].id === firstTodoId, 'First todo should now be in middle position');
        assert(reorderedTodos.length === originalLength, 'Total number of todos should remain the same');
    });

    test('should handle invalid todo ID', () => {
        const model = new TodoModel();
        model.addTodo('Test task');
        
        const result = model.reorderTodo('non-existent-id', 0);
        
        assert(result === false, 'reorderTodo should return false for invalid ID');
    });

    test('should handle invalid target index', () => {
        const model = new TodoModel();
        model.addTodo('Test task');
        
        const todos = model.getAllTodos();
        const todoId = todos[0].id;
        
        // Test negative index
        let result = model.reorderTodo(todoId, -1);
        assert(result === false, 'reorderTodo should return false for negative index');
        
        // Test index equal to array length (should be false since valid indices are 0 to length-1)
        result = model.reorderTodo(todoId, todos.length);
        assert(result === false, 'reorderTodo should return false for index equal to array length');
    });

    test('should persist reorder changes to localStorage', () => {
        // Use mock localStorage for this test
        const mockStorage = {};
        const originalLS = global.localStorage;
        global.localStorage = {
            getItem: (key) => mockStorage[key] || null,
            setItem: (key, value) => mockStorage[key] = value
        };
        
        const model = new TodoModel();
        model.addTodo('First task');
        model.addTodo('Second task');
        
        const todos = model.getAllTodos();
        const firstTodoId = todos[0].id;
        const firstTodoText = todos[0].text;
        
        // Reorder
        model.reorderTodo(firstTodoId, 1);
        
        // Create new model instance to test persistence
        const newModel = new TodoModel();
        const loadedTodos = newModel.getAllTodos();
        
        assert(loadedTodos[1].id === firstTodoId, 'Reordered todos should persist in localStorage');
        assert(loadedTodos[1].text === firstTodoText, 'Todo content should persist correctly');
        
        // Restore original localStorage
        global.localStorage = originalLS;
    });

    test('should handle reordering with same position', () => {
        const model = new TodoModel();
        model.addTodo('First task');
        model.addTodo('Second task');
        
        const todos = model.getAllTodos();
        const firstTodoId = todos[0].id;
        const originalOrder = todos.map(t => t.id);
        
        // Try to move to same position
        const result = model.reorderTodo(firstTodoId, 0);
        
        assert(result === true, 'reorderTodo should return true even for same position');
        
        const newTodos = model.getAllTodos();
        const newOrder = newTodos.map(t => t.id);
        
        assertArrayEquals(newOrder, originalOrder, 'Order should remain the same when moving to same position');
    });

    console.log();
    console.log('==================================================');
    console.log(`📊 Test Summary:`);
    console.log(`   Total: ${testsPassed + testsFailed}`);
    console.log(`   Passed: ${testsPassed}`);
    console.log(`   Failed: ${testsFailed}`);
    console.log('==================================================');

    if (testsFailed === 0) {
        console.log('🎉 All drag and drop tests passed!');
    } else {
        console.log(`❌ ${testsFailed} test(s) failed`);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests };