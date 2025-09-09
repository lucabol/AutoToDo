/**
 * Unit Tests for AutoToDo Delete Functionality
 * 
 * This file contains comprehensive unit tests for the delete functionality
 * to ensure robustness and handle various edge cases.
 */

// Mock localStorage for Node.js testing environment
const mockLocalStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    clear: function() {
        this.data = {};
    }
};

// Mock confirm function for testing
let mockConfirmResponse = true;
const mockConfirm = (message) => mockConfirmResponse;

// Mock console for capturing logs
const mockConsole = {
    logs: [],
    log: function(...args) {
        this.logs.push(args.join(' '));
    }
};

// TodoApp class for testing (extracted business logic)
class TestableTodoApp {
    constructor() {
        this.localStorage = mockLocalStorage;
        this.confirm = mockConfirm;
        this.console = mockConsole;
        this.todos = this.loadTodos();
    }

    loadTodos() {
        const saved = this.localStorage.getItem('todos');
        return saved ? JSON.parse(saved) : [];
    }

    saveTodos() {
        this.localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addTodo(text) {
        if (!text || !text.trim()) return null;

        const todo = {
            id: this.generateId(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.console.log('Todo added successfully:', todo);
        return todo;
    }

    deleteTodo(id) {
        if (this.confirm('Are you sure you want to delete this todo?')) {
            const initialLength = this.todos.length;
            this.todos = this.todos.filter(todo => todo.id !== id);
            const deleted = initialLength > this.todos.length;
            if (deleted) {
                this.saveTodos();
                this.console.log(`Todo with id ${id} deleted successfully`);
            }
            return deleted;
        }
        return false;
    }

    findTodo(id) {
        return this.todos.find(todo => todo.id === id);
    }

    getTodoCount() {
        return this.todos.length;
    }
}

// Test Runner
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(description, testFunction) {
        this.tests.push({ description, testFunction });
    }

    run() {
        console.log('🧪 Running Unit Tests for Delete Functionality\n');
        console.log('='.repeat(60));

        for (const test of this.tests) {
            try {
                // Reset mocks before each test
                mockLocalStorage.clear();
                mockConsole.logs = [];
                mockConfirmResponse = true;

                test.testFunction();
                console.log(`✅ PASS: ${test.description}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ FAIL: ${test.description}`);
                console.log(`   Error: ${error.message}`);
                this.failed++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
        
        if (this.failed === 0) {
            console.log('🎉 All tests passed! Delete functionality is robust.');
        } else {
            console.log(`⚠️  ${this.failed} test(s) failed. Review the implementation.`);
        }

        return this.failed === 0;
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, but got ${actual}`);
        }
    }
}

// Test Suite
const runner = new TestRunner();

// Test 1: Basic Delete Functionality
runner.test('should delete an existing todo successfully', () => {
    const app = new TestableTodoApp();
    const todo = app.addTodo('Test todo');
    
    runner.assert(app.getTodoCount() === 1, 'Todo should be added');
    
    const deleted = app.deleteTodo(todo.id);
    
    runner.assert(deleted === true, 'Delete operation should return true');
    runner.assert(app.getTodoCount() === 0, 'Todo count should be 0 after deletion');
    runner.assert(app.findTodo(todo.id) === undefined, 'Todo should not be found after deletion');
});

// Test 2: Delete with Confirmation Dialog
runner.test('should show confirmation dialog before deleting', () => {
    const app = new TestableTodoApp();
    const todo = app.addTodo('Test todo');
    
    // Mock user canceling deletion
    mockConfirmResponse = false;
    
    const deleted = app.deleteTodo(todo.id);
    
    runner.assert(deleted === false, 'Delete should return false when user cancels');
    runner.assert(app.getTodoCount() === 1, 'Todo should still exist after cancellation');
    runner.assert(app.findTodo(todo.id) !== undefined, 'Todo should be found after cancellation');
});

// Test 3: Delete Non-existent Todo
runner.test('should handle deletion of non-existent todo gracefully', () => {
    const app = new TestableTodoApp();
    app.addTodo('Test todo');
    
    const initialCount = app.getTodoCount();
    const deleted = app.deleteTodo('non-existent-id');
    
    runner.assert(deleted === false, 'Deleting non-existent todo should return false');
    runner.assert(app.getTodoCount() === initialCount, 'Todo count should remain unchanged');
});

// Test 4: Delete from Empty List
runner.test('should handle deletion from empty todo list', () => {
    const app = new TestableTodoApp();
    
    runner.assert(app.getTodoCount() === 0, 'Initial todo count should be 0');
    
    const deleted = app.deleteTodo('any-id');
    
    runner.assert(deleted === false, 'Deleting from empty list should return false');
    runner.assert(app.getTodoCount() === 0, 'Todo count should remain 0');
});

// Test 5: Multiple Consecutive Deletions
runner.test('should handle multiple consecutive deletions', () => {
    const app = new TestableTodoApp();
    const todo1 = app.addTodo('First todo');
    const todo2 = app.addTodo('Second todo');
    const todo3 = app.addTodo('Third todo');
    
    runner.assert(app.getTodoCount() === 3, 'Should have 3 todos initially');
    
    // Delete first todo
    let deleted1 = app.deleteTodo(todo1.id);
    runner.assert(deleted1 === true, 'First deletion should succeed');
    runner.assert(app.getTodoCount() === 2, 'Should have 2 todos after first deletion');
    
    // Delete second todo
    let deleted2 = app.deleteTodo(todo2.id);
    runner.assert(deleted2 === true, 'Second deletion should succeed');
    runner.assert(app.getTodoCount() === 1, 'Should have 1 todo after second deletion');
    
    // Delete third todo
    let deleted3 = app.deleteTodo(todo3.id);
    runner.assert(deleted3 === true, 'Third deletion should succeed');
    runner.assert(app.getTodoCount() === 0, 'Should have 0 todos after third deletion');
});

// Test 6: Delete Specific Todo from Multiple Todos
runner.test('should delete only the specified todo from a list', () => {
    const app = new TestableTodoApp();
    const todo1 = app.addTodo('Keep this one');
    const todo2 = app.addTodo('Delete this one');
    const todo3 = app.addTodo('Keep this one too');
    
    runner.assert(app.getTodoCount() === 3, 'Should have 3 todos initially');
    
    const deleted = app.deleteTodo(todo2.id);
    
    runner.assert(deleted === true, 'Deletion should succeed');
    runner.assert(app.getTodoCount() === 2, 'Should have 2 todos after deletion');
    runner.assert(app.findTodo(todo1.id) !== undefined, 'First todo should still exist');
    runner.assert(app.findTodo(todo2.id) === undefined, 'Second todo should be deleted');
    runner.assert(app.findTodo(todo3.id) !== undefined, 'Third todo should still exist');
});

// Test 7: Verify localStorage Persistence After Delete
runner.test('should persist changes to localStorage after deletion', () => {
    const app = new TestableTodoApp();
    const todo = app.addTodo('Test todo');
    
    // Verify todo is saved
    const savedBefore = JSON.parse(mockLocalStorage.getItem('todos'));
    runner.assert(savedBefore.length === 1, 'Todo should be saved to localStorage');
    
    app.deleteTodo(todo.id);
    
    // Verify deletion is persisted
    const savedAfter = JSON.parse(mockLocalStorage.getItem('todos'));
    runner.assert(savedAfter.length === 0, 'Deletion should be persisted to localStorage');
});

// Test 8: Verify Logging for Delete Operations
runner.test('should log successful delete operations', () => {
    const app = new TestableTodoApp();
    const todo = app.addTodo('Test todo');
    
    mockConsole.logs = []; // Clear logs
    app.deleteTodo(todo.id);
    
    const deleteLog = mockConsole.logs.find(log => 
        log.includes('deleted successfully') && log.includes(todo.id)
    );
    runner.assert(deleteLog !== undefined, 'Should log successful deletion');
});

// Test 9: Edge Case - Delete with Invalid ID Types
runner.test('should handle deletion with invalid ID types', () => {
    const app = new TestableTodoApp();
    app.addTodo('Test todo');
    
    const initialCount = app.getTodoCount();
    
    // Test with null
    let deleted1 = app.deleteTodo(null);
    runner.assert(deleted1 === false, 'Should handle null ID');
    
    // Test with undefined
    let deleted2 = app.deleteTodo(undefined);
    runner.assert(deleted2 === false, 'Should handle undefined ID');
    
    // Test with empty string
    let deleted3 = app.deleteTodo('');
    runner.assert(deleted3 === false, 'Should handle empty string ID');
    
    runner.assert(app.getTodoCount() === initialCount, 'Todo count should remain unchanged');
});

// Test 10: Confirm Dialog Message Content
runner.test('should show correct confirmation message', () => {
    const app = new TestableTodoApp();
    const todo = app.addTodo('Test todo');
    
    let confirmMessage = '';
    app.confirm = (message) => {
        confirmMessage = message;
        return true;
    };
    
    app.deleteTodo(todo.id);
    
    runner.assert(
        confirmMessage === 'Are you sure you want to delete this todo?',
        'Should show correct confirmation message'
    );
});

// Run all tests
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { TestRunner, TestableTodoApp };
} else {
    // Browser environment
    runner.run();
}

// For Node.js execution
if (typeof require !== 'undefined' && require.main === module) {
    runner.run();
}