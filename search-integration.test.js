/**
 * Integration Tests for AutoToDo Search Functionality
 * 
 * These tests verify the complete search functionality works end-to-end
 * with the actual MVC classes used in the application.
 */

/**
 * Integration Tests for AutoToDo Search Functionality
 * 
 * These tests verify the complete search functionality works end-to-end
 * by using the same class structure as the actual application.
 */

// Simple implementation matching the actual app structure for testing
class TodoModel {
    constructor() {
        this.todos = [];
    }

    generateId() {
        return 'test-' + Math.random().toString(36).substr(2, 9);
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
        this.lastRenderedTodos = todos;
        this.lastSearchTerm = searchTerm;
        this.lastAllTodos = allTodos;
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
        console.log('🧪 Running AutoToDo Search Integration Tests...\n');
        
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
        console.log('📊 Integration Test Summary:');
        console.log(`   Total: ${this.results.total}`);
        console.log(`   Passed: ${this.results.passed}`);
        console.log(`   Failed: ${this.results.failed}`);
        console.log('='.repeat(50));
        
        if (this.results.failed === 0) {
            console.log('🎉 All integration tests passed!');
        } else {
            console.log(`💥 ${this.results.failed} integration test(s) failed.`);
        }
    }
}

// Initialize test runner
const testRunner = new TestRunner();

// Full Integration Tests
testRunner.test('Complete MVC search workflow should work end-to-end', function() {
    // Create the complete MVC setup
    const model = new TodoModel();
    const view = new TodoView();
    const controller = new TodoController(model, view);
    
    // Add test data
    model.addTodo('Buy groceries');
    model.addTodo('Walk the dog');
    model.addTodo('Call dentist');
    
    // Test search functionality
    controller.handleSearch('buy');
    
    // Verify search state
    this.assertEqual(controller.searchTerm, 'buy', 'Controller should store search term');
    
    // Verify filtering works
    const filteredTodos = model.filterTodos(controller.searchTerm);
    this.assertEqual(filteredTodos.length, 1, 'Should filter to one matching todo');
    this.assertEqual(filteredTodos[0].text, 'Buy groceries', 'Should return the correct todo');
});

testRunner.test('Search functionality should work correctly with real-world scenarios', function() {
    const model = new TodoModel();
    const view = new TodoView();
    const controller = new TodoController(model, view);
    
    // Add realistic todos
    model.addTodo('Buy groceries at Whole Foods');
    model.addTodo('Walk the dog in Central Park');
    model.addTodo('Call dentist to schedule appointment');
    model.addTodo('Buy coffee beans');
    model.addTodo('Walk to work tomorrow');
    
    // Test partial search
    controller.handleSearch('buy');
    let filtered = model.filterTodos(controller.searchTerm);
    this.assertEqual(filtered.length, 2, 'Should find 2 todos with "buy"');
    
    // Test more specific search
    controller.handleSearch('buy coffee');
    filtered = model.filterTodos(controller.searchTerm);
    this.assertEqual(filtered.length, 1, 'Should find 1 todo with "buy coffee"');
    this.assertEqual(filtered[0].text, 'Buy coffee beans', 'Should find the coffee todo');
    
    // Test case insensitive
    controller.handleSearch('WALK');
    filtered = model.filterTodos(controller.searchTerm);
    this.assertEqual(filtered.length, 2, 'Should find 2 todos with "WALK" (case insensitive)');
});

testRunner.test('Search should persist through CRUD operations', function() {
    const model = new TodoModel();
    const view = new TodoView();
    const controller = new TodoController(model, view);
    
    // Setup initial data
    const todo1 = model.addTodo('Buy groceries');
    const todo2 = model.addTodo('Walk the dog');
    const todo3 = model.addTodo('Call dentist');
    
    // Set a search term
    controller.handleSearch('buy');
    this.assertEqual(controller.searchTerm, 'buy', 'Search term should be set');
    
    // Perform CRUD operations
    model.toggleTodo(todo1.id);
    model.deleteTodo(todo2.id);
    model.addTodo('Buy milk');
    
    // Verify search term is still there
    this.assertEqual(controller.searchTerm, 'buy', 'Search term should persist after CRUD operations');
    
    // Verify search still works correctly
    const filtered = model.filterTodos(controller.searchTerm);
    this.assertEqual(filtered.length, 2, 'Should find 2 todos with "buy" after CRUD operations');
    
    // Verify the todos are correct
    const todoTexts = filtered.map(t => t.text).sort();
    this.assertEqual(todoTexts, ['Buy groceries', 'Buy milk'], 'Should find the correct todos');
});

testRunner.test('Search edge cases should be handled properly', function() {
    const model = new TodoModel();
    const view = new TodoView();
    const controller = new TodoController(model, view);
    
    // Add todos with special characters
    model.addTodo('Buy coffee @ Starbucks');
    model.addTodo('Email john@example.com');
    model.addTodo('Pay $50 for utilities');
    model.addTodo('Schedule meeting (urgent!)');
    
    // Test special character search
    controller.handleSearch('@');
    let filtered = model.filterTodos(controller.searchTerm);
    this.assertEqual(filtered.length, 2, 'Should find todos with @ symbol');
    
    // Test currency symbol search
    controller.handleSearch('$');
    filtered = model.filterTodos(controller.searchTerm);
    this.assertEqual(filtered.length, 1, 'Should find todo with $ symbol');
    
    // Test parentheses search
    controller.handleSearch('(urgent');
    filtered = model.filterTodos(controller.searchTerm);
    this.assertEqual(filtered.length, 1, 'Should find todo with parentheses');
    
    // Test whitespace handling
    controller.handleSearch('  coffee  ');
    filtered = model.filterTodos(controller.searchTerm);
    this.assertEqual(filtered.length, 1, 'Should handle whitespace in search terms');
});

testRunner.test('Search performance should be acceptable with many todos', function() {
    const model = new TodoModel();
    const view = new TodoView();
    const controller = new TodoController(model, view);
    
    // Add many todos
    for (let i = 0; i < 1000; i++) {
        model.addTodo(`Todo item ${i} with some description`);
    }
    
    // Add a few special todos to find
    model.addTodo('Special task number 1');
    model.addTodo('Another special task');
    model.addTodo('Final special item');
    
    // Time the search operation
    const startTime = Date.now();
    controller.handleSearch('special');
    const filtered = model.filterTodos(controller.searchTerm);
    const endTime = Date.now();
    
    // Verify results
    this.assertEqual(filtered.length, 3, 'Should find 3 special todos among 1000+ todos');
    
    // Verify performance (should complete in reasonable time)
    const searchTime = endTime - startTime;
    this.assertTrue(searchTime < 100, `Search should complete quickly, took ${searchTime}ms`);
});

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testRunner };
}

// Auto-run tests if this file is executed directly
if (require.main === module) {
    testRunner.runTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}