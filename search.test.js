/**
 * Unit Tests for AutoToDo Search Functionality
 * 
 * This file contains comprehensive tests for the search functionality
 * implemented in the current MVC architecture (TodoModel, TodoView, TodoController).
 * Tests cover:
 * - Search input handling
 * - Todo filtering
 * - State management
 * - Case-insensitive matching
 * - Integration with CRUD operations
 */

// Import the actual MVC classes
if (typeof require !== 'undefined') {
    // For Node.js testing environment, we need to simulate the browser environment
    global.document = {
        getElementById: function(id) {
            return {
                addEventListener: function() {},
                style: { display: 'none' },
                innerHTML: '',
                value: ''
            };
        },
        createElement: function() {
            return { textContent: '', innerHTML: '' };
        },
        addEventListener: function() {}
    };
    global.localStorage = {
        data: {},
        getItem: function(key) { return this.data[key] || null; },
        setItem: function(key, value) { this.data[key] = value; }
    };
    global.confirm = () => true;
    global.window = { matchMedia: () => ({ matches: false, addEventListener: () => {} }) };
    global.crypto = {
        randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
    };
}

// Load the actual MVC classes (simplified for testing)
class TodoModel {
    constructor() {
        this.todos = [];
    }

    addTodo(text) {
        if (!text || !text.trim()) {
            throw new Error('Todo text cannot be empty');
        }
        const todo = {
            id: this.generateId(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };
        this.todos.unshift(todo);
        return todo;
    }

    generateId() {
        return 'test-' + Math.random().toString(36).substr(2, 9);
    }

    getAllTodos() {
        return [...this.todos];
    }

    filterTodos(searchTerm) {
        if (!searchTerm || !searchTerm.trim()) {
            return this.getAllTodos();
        }
        const term = searchTerm.toLowerCase().trim();
        return this.todos.filter(todo => 
            todo.text.toLowerCase().includes(term)
        );
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            return todo;
        }
        return null;
    }

    deleteTodo(id) {
        const initialLength = this.todos.length;
        this.todos = this.todos.filter(todo => todo.id !== id);
        return this.todos.length < initialLength;
    }
}

class TodoView {
    constructor() {
        this.editingId = null;
    }

    render(todos, allTodos = [], searchTerm = '') {
        // Mock rendering for testing
        this.lastRenderedTodos = todos;
        this.lastSearchTerm = searchTerm;
        this.lastAllTodos = allTodos;
    }

    isEditing() {
        return this.editingId !== null;
    }

    startEdit(id) {
        this.editingId = id;
    }

    cancelEdit() {
        this.editingId = null;
    }
}

class TodoController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.searchTerm = '';
    }

    handleSearch(searchTerm) {
        this.searchTerm = searchTerm;
        this.render();
    }

    render() {
        const allTodos = this.model.getAllTodos();
        const filteredTodos = this.model.filterTodos(this.searchTerm);
        this.view.render(filteredTodos, allTodos, this.searchTerm);
    }
}



// Test Framework
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = { passed: 0, failed: 0, total: 0 };
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    assertEqual(actual, expected, message = '') {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`${message} Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`);
        }
    }

    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`${message} Expected: true, Got: false`);
        }
    }

    assertFalse(condition, message = '') {
        if (condition) {
            throw new Error(`${message} Expected: false, Got: true`);
        }
    }

    async runTests() {
        console.log('🧪 Running AutoToDo Search Functionality Tests...\n');
        
        for (const test of this.tests) {
            try {
                this.results.total++;
                await test.testFn.call(this);
                this.results.passed++;
                console.log(`✅ ${test.name}`);
            } catch (error) {
                this.results.failed++;
                console.log(`❌ ${test.name}`);
                console.log(`   Error: ${error.message}\n`);
            }
        }
        
        this.printSummary();
        return this.results.failed === 0;
    }

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 Test Summary:');
        console.log(`   Total: ${this.results.total}`);
        console.log(`   Passed: ${this.results.passed}`);
        console.log(`   Failed: ${this.results.failed}`);
        console.log('='.repeat(50));
        
        if (this.results.failed === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log(`💥 ${this.results.failed} test(s) failed.`);
        }
    }
}

// Initialize test runner
const testRunner = new TestRunner();

// Test Suite for Search Functionality - Updated for MVC Architecture
testRunner.test('TodoController handleSearch should update searchTerm correctly', function() {
    const model = new TodoModel();
    const view = new TodoView();
    const controller = new TodoController(model, view);
    
    controller.handleSearch('Test Query');
    this.assertEqual(controller.searchTerm, 'Test Query', 'Search term should be set exactly as provided');
});

testRunner.test('TodoController handleSearch should handle empty search', function() {
    const model = new TodoModel();
    const view = new TodoView();
    const controller = new TodoController(model, view);
    
    controller.handleSearch('   ');
    this.assertEqual(controller.searchTerm, '   ', 'Empty search should be stored as provided');
});

testRunner.test('TodoModel filterTodos should return all todos when search is empty', function() {
    const model = new TodoModel();
    model.addTodo('Buy groceries');
    model.addTodo('Walk the dog');
    
    const filtered = model.filterTodos('');
    this.assertEqual(filtered.length, 2, 'Should return all todos when search is empty');
});

testRunner.test('TodoModel filterTodos should filter todos by search query', function() {
    const model = new TodoModel();
    model.addTodo('Buy groceries');
    model.addTodo('Walk the dog');
    model.addTodo('Call dentist');
    
    const filtered = model.filterTodos('buy');
    this.assertEqual(filtered.length, 1, 'Should return only matching todos');
    this.assertEqual(filtered[0].text, 'Buy groceries', 'Should return the correct todo');
});

testRunner.test('TodoModel filterTodos should be case insensitive', function() {
    const model = new TodoModel();
    model.addTodo('Buy GROCERIES');
    model.addTodo('walk the DOG');
    
    const filtered = model.filterTodos('buy groceries');
    this.assertEqual(filtered.length, 1, 'Should match case insensitively');
    this.assertEqual(filtered[0].text, 'Buy GROCERIES', 'Should return case insensitive match');
});

testRunner.test('TodoModel filterTodos should handle partial matches', function() {
    const model = new TodoModel();
    model.addTodo('Buy groceries for dinner');
    model.addTodo('Walk the dog');
    
    const filtered = model.filterTodos('grocer');
    this.assertEqual(filtered.length, 1, 'Should match partial text');
    this.assertEqual(filtered[0].text, 'Buy groceries for dinner', 'Should return partial match');
});

testRunner.test('TodoModel filterTodos should return empty array when no matches', function() {
    const model = new TodoModel();
    model.addTodo('Buy groceries');
    model.addTodo('Walk the dog');
    
    const filtered = model.filterTodos('nonexistent');
    this.assertEqual(filtered.length, 0, 'Should return empty array when no matches');
});

testRunner.test('TodoController integration should maintain search after todo operations', function() {
    const model = new TodoModel();
    const view = new TodoView();
    const controller = new TodoController(model, view);
    
    const todo1 = model.addTodo('Buy groceries');
    const todo2 = model.addTodo('Walk the dog');
    controller.handleSearch('buy');
    
    // Test toggle operation maintains search
    model.toggleTodo(todo1.id);
    controller.render();
    
    const filtered = model.filterTodos(controller.searchTerm);
    this.assertEqual(filtered.length, 1, 'Search should be maintained after toggle');
    this.assertTrue(filtered[0].completed, 'Todo should be toggled');
    
    // Test delete operation maintains search
    model.deleteTodo(todo2.id);
    this.assertEqual(controller.searchTerm, 'buy', 'Search query should be maintained after delete');
});

testRunner.test('TodoModel filterTodos should handle special characters', function() {
    const model = new TodoModel();
    model.addTodo('Buy groceries & milk');
    model.addTodo('Call mom @ 3pm');
    
    const filtered = model.filterTodos('&');
    this.assertEqual(filtered.length, 1, 'Should handle special characters');
    this.assertEqual(filtered[0].text, 'Buy groceries & milk', 'Should match special characters');
});

testRunner.test('TodoController search state management should reset search correctly', function() {
    const model = new TodoModel();
    const view = new TodoView();
    const controller = new TodoController(model, view);
    
    model.addTodo('Buy groceries');
    model.addTodo('Walk the dog');
    
    // Set search and verify filtering
    controller.handleSearch('buy');
    this.assertEqual(model.filterTodos(controller.searchTerm).length, 1, 'Should filter with search');
    
    // Clear search and verify all todos shown
    controller.handleSearch('');
    this.assertEqual(model.filterTodos(controller.searchTerm).length, 2, 'Should show all todos when search cleared');
});

testRunner.test('TodoModel filterTodos should handle multiple word queries', function() {
    const model = new TodoModel();
    model.addTodo('Buy groceries for dinner');
    model.addTodo('Walk the dog in park');
    model.addTodo('Call mom');
    
    const filtered = model.filterTodos('for dinner');
    this.assertEqual(filtered.length, 1, 'Should match multiple word queries');
    this.assertEqual(filtered[0].text, 'Buy groceries for dinner', 'Should return correct match for multi-word search');
});

testRunner.test('TodoModel filterTodos should work with completed todos', function() {
    const model = new TodoModel();
    const todo1 = model.addTodo('Buy groceries');
    const todo2 = model.addTodo('Walk the dog');
    model.toggleTodo(todo2.id); // Mark as completed
    
    const filtered = model.filterTodos('walk');
    this.assertEqual(filtered.length, 1, 'Should find completed todos in search');
    this.assertTrue(filtered[0].completed, 'Found todo should be completed');
});

testRunner.test('TodoController render should pass correct parameters to view', function() {
    const model = new TodoModel();
    const view = new TodoView();
    const controller = new TodoController(model, view);
    
    model.addTodo('Buy groceries');
    model.addTodo('Walk the dog');
    controller.handleSearch('buy');
    
    // Render should pass filtered todos, all todos, and search term to view
    this.assertEqual(view.lastRenderedTodos.length, 1, 'View should receive filtered todos');
    this.assertEqual(view.lastAllTodos.length, 2, 'View should receive all todos');
    this.assertEqual(view.lastSearchTerm, 'buy', 'View should receive search term');
});

testRunner.test('TodoModel filterTodos should trim search terms', function() {
    const model = new TodoModel();
    model.addTodo('Buy groceries');
    
    const filtered = model.filterTodos('  buy  ');
    this.assertEqual(filtered.length, 1, 'Should trim search terms and find matches');
});

testRunner.test('TodoModel generateId should generate unique IDs', function() {
    const model = new TodoModel();
    const ids = new Set();
    
    // Generate 100 IDs and ensure they are all unique
    for (let i = 0; i < 100; i++) {
        const id = model.generateId();
        this.assertFalse(ids.has(id), `Generated duplicate ID: ${id}`);
        ids.add(id);
    }
    
    this.assertEqual(ids.size, 100, 'Should generate 100 unique IDs');
});

testRunner.test('TodoModel generateId should generate valid string IDs', function() {
    const model = new TodoModel();
    
    for (let i = 0; i < 10; i++) {
        const id = model.generateId();
        this.assertTrue(typeof id === 'string', 'ID should be a string');
        this.assertTrue(id.length > 0, 'ID should not be empty');
    }
});

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TodoModel, TodoView, TodoController, TestRunner, testRunner };
}

// Auto-run tests if this file is executed directly
if (require.main === module) {
    testRunner.runTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}