/**
 * Unit Tests for AutoToDo Search Functionality
 * 
 * This file contains comprehensive tests for the search functionality
 * implemented in the TodoApp class. Tests cover:
 * - Search input handling
 * - Todo filtering
 * - State management
 * - Case-insensitive matching
 * - Integration with CRUD operations
 */

// Mock DOM elements for testing
class MockElement {
    constructor() {
        this.style = { display: 'none' };
        this.innerHTML = '';
        this.value = '';
        this.eventListeners = {};
    }
    
    addEventListener(event, callback) {
        this.eventListeners[event] = callback;
    }
    
    trigger(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event](data || { target: this });
        }
    }
}

// Mock DOM
const mockDOM = {
    elements: {},
    getElementById: function(id) {
        if (!this.elements[id]) {
            this.elements[id] = new MockElement();
        }
        return this.elements[id];
    },
    createElement: function(tag) {
        return new MockElement();
    },
    addEventListener: function() {}
};

// Mock global objects
global.document = mockDOM;
global.localStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    }
};
global.confirm = () => true;

// TodoApp class (extracted from index.html for testing)
class TodoApp {
    constructor(testMode = false) {
        this.todos = testMode ? [] : this.loadTodos();
        this.editingId = null;
        this.searchQuery = '';
        this.testMode = testMode;
        if (!testMode) {
            this.init();
        }
    }

    init() {
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        if (this.testMode) return;
        
        const form = document.getElementById('addTodoForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
    }

    loadTodos() {
        const saved = localStorage.getItem('todos');
        return saved ? JSON.parse(saved) : [];
    }

    saveTodos() {
        if (!this.testMode) {
            localStorage.setItem('todos', JSON.stringify(this.todos));
        }
    }

    generateId() {
        // Use modern crypto.randomUUID() if available (most modern browsers)
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        
        // Fallback: More robust custom implementation
        // Combines timestamp, high-precision timer, and crypto-random values
        const timestamp = Date.now().toString(36);
        const performance = (typeof window !== 'undefined' && window.performance?.now() || Date.now()).toString(36);
        
        // Generate cryptographically random values if crypto.getRandomValues is available
        let randomPart = '';
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const array = new Uint8Array(8);
            crypto.getRandomValues(array);
            randomPart = Array.from(array, byte => byte.toString(36)).join('');
        } else {
            // Final fallback for very old browsers
            randomPart = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
        }
        
        return timestamp + '-' + performance + '-' + randomPart;
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();
        
        if (!text) return;

        const todo = {
            id: this.generateId(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        input.value = '';
        this.render();
    }

    // Method to add todo in test mode
    addTodoForTest(text, completed = false) {
        const todo = {
            id: this.generateId(),
            text: text,
            completed: completed,
            createdAt: new Date().toISOString()
        };
        this.todos.unshift(todo);
        return todo;
    }

    deleteTodo(id) {
        if (!this.testMode && !confirm('Are you sure you want to delete this todo?')) {
            return;
        }
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
        this.render();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
        }
    }

    startEdit(id) {
        this.editingId = id;
        this.render();
    }

    saveEdit(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim()) {
            todo.text = newText.trim();
            this.editingId = null;
            this.saveTodos();
            this.render();
        }
    }

    cancelEdit() {
        this.editingId = null;
        this.render();
    }

    handleSearch(query) {
        this.searchQuery = query.toLowerCase().trim();
        this.render();
    }

    filterTodos() {
        if (!this.searchQuery) {
            return this.todos;
        }
        return this.todos.filter(todo => 
            todo.text.toLowerCase().includes(this.searchQuery)
        );
    }

    render() {
        const todoList = document.getElementById(this.testMode ? 'testTodoList' : 'todoList');
        const emptyState = document.getElementById(this.testMode ? 'testEmptyState' : 'emptyState');
        const noResults = document.getElementById(this.testMode ? 'testNoResults' : 'noResults');
        
        const filteredTodos = this.filterTodos();

        // Hide all states initially
        if (todoList) todoList.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        if (noResults) noResults.style.display = 'none';

        if (this.todos.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (filteredTodos.length === 0 && this.searchQuery) {
            if (noResults) noResults.style.display = 'block';
            return;
        }

        if (todoList) {
            todoList.style.display = 'block';
            todoList.innerHTML = filteredTodos.map(todo => {
                return `<li data-id="${todo.id}">${todo.text}</li>`;
            }).join('');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

// Test Suite for Search Functionality
testRunner.test('handleSearch should update searchQuery correctly', function() {
    const app = new TodoApp(true);
    app.handleSearch('Test Query');
    this.assertEqual(app.searchQuery, 'test query', 'Search query should be lowercase and trimmed');
});

testRunner.test('handleSearch should handle empty search', function() {
    const app = new TodoApp(true);
    app.handleSearch('   ');
    this.assertEqual(app.searchQuery, '', 'Empty search should result in empty string');
});

testRunner.test('filterTodos should return all todos when search is empty', function() {
    const app = new TodoApp(true);
    app.addTodoForTest('Buy groceries');
    app.addTodoForTest('Walk the dog');
    app.searchQuery = '';
    
    const filtered = app.filterTodos();
    this.assertEqual(filtered.length, 2, 'Should return all todos when search is empty');
});

testRunner.test('filterTodos should filter todos by search query', function() {
    const app = new TodoApp(true);
    app.addTodoForTest('Buy groceries');
    app.addTodoForTest('Walk the dog');
    app.addTodoForTest('Call dentist');
    app.searchQuery = 'buy';
    
    const filtered = app.filterTodos();
    this.assertEqual(filtered.length, 1, 'Should return only matching todos');
    this.assertEqual(filtered[0].text, 'Buy groceries', 'Should return the correct todo');
});

testRunner.test('filterTodos should be case insensitive', function() {
    const app = new TodoApp(true);
    app.addTodoForTest('Buy GROCERIES');
    app.addTodoForTest('walk the DOG');
    app.searchQuery = 'buy groceries';
    
    const filtered = app.filterTodos();
    this.assertEqual(filtered.length, 1, 'Should match case insensitively');
    this.assertEqual(filtered[0].text, 'Buy GROCERIES', 'Should return case insensitive match');
});

testRunner.test('filterTodos should handle partial matches', function() {
    const app = new TodoApp(true);
    app.addTodoForTest('Buy groceries for dinner');
    app.addTodoForTest('Walk the dog');
    app.searchQuery = 'grocer';
    
    const filtered = app.filterTodos();
    this.assertEqual(filtered.length, 1, 'Should match partial text');
    this.assertEqual(filtered[0].text, 'Buy groceries for dinner', 'Should return partial match');
});

testRunner.test('filterTodos should return empty array when no matches', function() {
    const app = new TodoApp(true);
    app.addTodoForTest('Buy groceries');
    app.addTodoForTest('Walk the dog');
    app.searchQuery = 'nonexistent';
    
    const filtered = app.filterTodos();
    this.assertEqual(filtered.length, 0, 'Should return empty array when no matches');
});

testRunner.test('render should show empty state when no todos exist', function() {
    const app = new TodoApp(true);
    app.render();
    
    const emptyState = document.getElementById('testEmptyState');
    const noResults = document.getElementById('testNoResults');
    const todoList = document.getElementById('testTodoList');
    
    this.assertEqual(emptyState.style.display, 'block', 'Empty state should be visible');
    this.assertEqual(noResults.style.display, 'none', 'No results should be hidden');
    this.assertEqual(todoList.style.display, 'none', 'Todo list should be hidden');
});

testRunner.test('render should show no results state when search has no matches', function() {
    const app = new TodoApp(true);
    app.addTodoForTest('Buy groceries');
    app.searchQuery = 'nonexistent';
    app.render();
    
    const emptyState = document.getElementById('testEmptyState');
    const noResults = document.getElementById('testNoResults');
    const todoList = document.getElementById('testTodoList');
    
    this.assertEqual(emptyState.style.display, 'none', 'Empty state should be hidden');
    this.assertEqual(noResults.style.display, 'block', 'No results should be visible');
    this.assertEqual(todoList.style.display, 'none', 'Todo list should be hidden');
});

testRunner.test('render should show filtered todos when search has matches', function() {
    const app = new TodoApp(true);
    app.addTodoForTest('Buy groceries');
    app.addTodoForTest('Walk the dog');
    app.searchQuery = 'buy';
    app.render();
    
    const emptyState = document.getElementById('testEmptyState');
    const noResults = document.getElementById('testNoResults');
    const todoList = document.getElementById('testTodoList');
    
    this.assertEqual(emptyState.style.display, 'none', 'Empty state should be hidden');
    this.assertEqual(noResults.style.display, 'none', 'No results should be hidden');
    this.assertEqual(todoList.style.display, 'block', 'Todo list should be visible');
    this.assertTrue(todoList.innerHTML.includes('Buy groceries'), 'Should render matching todo');
    this.assertFalse(todoList.innerHTML.includes('Walk the dog'), 'Should not render non-matching todo');
});

testRunner.test('search integration should maintain search after todo operations', function() {
    const app = new TodoApp(true);
    const todo1 = app.addTodoForTest('Buy groceries');
    const todo2 = app.addTodoForTest('Walk the dog');
    app.searchQuery = 'buy';
    
    // Test toggle operation maintains search
    app.toggleTodo(todo1.id);
    const filtered = app.filterTodos();
    this.assertEqual(filtered.length, 1, 'Search should be maintained after toggle');
    this.assertTrue(filtered[0].completed, 'Todo should be toggled');
    
    // Test delete operation maintains search
    app.deleteTodo(todo2.id);
    this.assertEqual(app.searchQuery, 'buy', 'Search query should be maintained after delete');
    this.assertEqual(app.todos.length, 1, 'Todo should be deleted');
});

testRunner.test('search should handle special characters', function() {
    const app = new TodoApp(true);
    app.addTodoForTest('Buy groceries & milk');
    app.addTodoForTest('Call mom @ 3pm');
    app.searchQuery = '&';
    
    const filtered = app.filterTodos();
    this.assertEqual(filtered.length, 1, 'Should handle special characters');
    this.assertEqual(filtered[0].text, 'Buy groceries & milk', 'Should match special characters');
});

testRunner.test('search state management should reset search correctly', function() {
    const app = new TodoApp(true);
    app.addTodoForTest('Buy groceries');
    app.addTodoForTest('Walk the dog');
    
    // Set search and verify filtering
    app.handleSearch('buy');
    this.assertEqual(app.filterTodos().length, 1, 'Should filter with search');
    
    // Clear search and verify all todos shown
    app.handleSearch('');
    this.assertEqual(app.filterTodos().length, 2, 'Should show all todos when search cleared');
});

testRunner.test('search should handle multiple word queries', function() {
    const app = new TodoApp(true);
    app.addTodoForTest('Buy groceries for dinner');
    app.addTodoForTest('Walk the dog in park');
    app.addTodoForTest('Call mom');
    app.searchQuery = 'for dinner';
    
    const filtered = app.filterTodos();
    this.assertEqual(filtered.length, 1, 'Should match multiple word queries');
    this.assertEqual(filtered[0].text, 'Buy groceries for dinner', 'Should return correct match for multi-word search');
});

testRunner.test('search should work with completed todos', function() {
    const app = new TodoApp(true);
    app.addTodoForTest('Buy groceries', false);
    app.addTodoForTest('Walk the dog', true);
    app.searchQuery = 'walk';
    
    const filtered = app.filterTodos();
    this.assertEqual(filtered.length, 1, 'Should find completed todos in search');
    this.assertTrue(filtered[0].completed, 'Found todo should be completed');
});

// Tests for generateId method improvements
testRunner.test('generateId should generate unique IDs', function() {
    const app = new TodoApp(true);
    const ids = new Set();
    
    // Generate 100 IDs and ensure they are all unique
    for (let i = 0; i < 100; i++) {
        const id = app.generateId();
        this.assertFalse(ids.has(id), `Generated duplicate ID: ${id}`);
        ids.add(id);
    }
    
    this.assertEqual(ids.size, 100, 'Should generate 100 unique IDs');
});

testRunner.test('generateId should generate valid string IDs', function() {
    const app = new TodoApp(true);
    
    for (let i = 0; i < 10; i++) {
        const id = app.generateId();
        this.assertTrue(typeof id === 'string', 'ID should be a string');
        this.assertTrue(id.length > 0, 'ID should not be empty');
    }
});

testRunner.test('generateId should handle rapid generation', function() {
    const app = new TodoApp(true);
    const ids = [];
    
    // Generate many IDs in rapid succession
    for (let i = 0; i < 50; i++) {
        ids.push(app.generateId());
    }
    
    // Check for uniqueness
    const uniqueIds = new Set(ids);
    this.assertEqual(uniqueIds.size, ids.length, 'All rapidly generated IDs should be unique');
});

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TodoApp, TestRunner, testRunner };
}

// Auto-run tests if this file is executed directly
if (require.main === module) {
    testRunner.runTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}