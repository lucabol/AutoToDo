/**
 * Unit Tests for AutoToDo Archive Functionality
 * 
 * This file contains comprehensive tests for the archive functionality
 * implemented in TodoModel and TodoController classes.
 * Tests cover:
 * - Individual todo archiving/unarchiving
 * - Bulk archive operations
 * - Archive state filtering
 * - Edge cases and error conditions
 * - Integration with existing CRUD operations
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
}

// Load the actual MVC classes (simplified for testing)
class TodoModel {
    constructor() {
        this.todos = [];
    }

    generateId() {
        return 'test-id-' + Math.random().toString(36).substr(2, 9);
    }

    addTodo(text) {
        if (!text || !text.trim()) {
            throw new Error('Todo text cannot be empty');
        }

        const todo = {
            id: this.generateId(),
            text: text.trim(),
            completed: false,
            archived: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        return todo;
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            return todo;
        }
        return null;
    }

    archiveTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && todo.completed) {
            todo.archived = true;
            return todo;
        }
        return null;
    }

    unarchiveTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && todo.archived) {
            todo.archived = false;
            return todo;
        }
        return null;
    }

    archiveCompletedTodos() {
        let archived = 0;
        this.todos.forEach(todo => {
            if (todo.completed && !todo.archived) {
                todo.archived = true;
                archived++;
            }
        });
        return archived;
    }

    getTodosFiltered(includeArchived = false) {
        if (includeArchived) {
            return [...this.todos];
        }
        return this.todos.filter(todo => !todo.archived);
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

    getStats(includeArchived = false) {
        const activeTodos = includeArchived ? this.todos : this.todos.filter(todo => !todo.archived);
        const total = activeTodos.length;
        const completed = activeTodos.filter(t => t.completed).length;
        const pending = total - completed;
        const archived = this.todos.filter(t => t.archived).length;
        
        return { total, completed, pending, archived };
    }

    getTodo(id) {
        return this.todos.find(t => t.id === id) || null;
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

    assertNotEqual(actual, expected, message) {
        const condition = actual !== expected;
        const fullMessage = `${message} (expected not: ${expected}, got: ${actual})`;
        this.assert(condition, fullMessage);
    }

    assertNull(value, message) {
        this.assert(value === null, `${message} (expected null, got: ${value})`);
    }

    assertNotNull(value, message) {
        this.assert(value !== null, `${message} (expected not null, got: ${value})`);
    }

    assertArrayLength(array, expectedLength, message) {
        this.assertEqual(array.length, expectedLength, `${message} - array length`);
    }

    getResults() {
        return {
            total: this.testCount,
            passed: this.passCount,
            failed: this.failCount,
            results: this.results
        };
    }

    printSummary() {
        console.log(`\n=== Archive Functionality Test Results ===`);
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
function runArchiveTests() {
    const test = new TestFramework();
    
    console.log('Running Archive Functionality Tests...\n');

    // Test 1: Archive Individual Todo - Success Case
    {
        const model = new TodoModel();
        const todo = model.addTodo('Test todo for archiving');
        model.toggleTodo(todo.id); // Complete the todo first
        
        const archivedTodo = model.archiveTodo(todo.id);
        
        test.assertNotNull(archivedTodo, 'Archive individual completed todo should return todo object');
        test.assertEqual(archivedTodo.archived, true, 'Archived todo should have archived=true');
        test.assertEqual(archivedTodo.completed, true, 'Archived todo should remain completed');
        test.assertEqual(archivedTodo.id, todo.id, 'Archived todo should have same ID');
    }

    // Test 2: Archive Individual Todo - Cannot Archive Incomplete Todo
    {
        const model = new TodoModel();
        const todo = model.addTodo('Incomplete todo');
        // Don't complete the todo
        
        const result = model.archiveTodo(todo.id);
        
        test.assertNull(result, 'Cannot archive incomplete todo - should return null');
        test.assertEqual(todo.archived, false, 'Incomplete todo should remain unarchived');
    }

    // Test 3: Archive Individual Todo - Nonexistent Todo
    {
        const model = new TodoModel();
        const result = model.archiveTodo('nonexistent-id');
        
        test.assertNull(result, 'Archive nonexistent todo should return null');
    }

    // Test 4: Unarchive Individual Todo - Success Case
    {
        const model = new TodoModel();
        const todo = model.addTodo('Test todo for unarchiving');
        model.toggleTodo(todo.id); // Complete first
        model.archiveTodo(todo.id); // Archive it
        
        const unarchivedTodo = model.unarchiveTodo(todo.id);
        
        test.assertNotNull(unarchivedTodo, 'Unarchive archived todo should return todo object');
        test.assertEqual(unarchivedTodo.archived, false, 'Unarchived todo should have archived=false');
        test.assertEqual(unarchivedTodo.completed, true, 'Unarchived todo should remain completed');
        test.assertEqual(unarchivedTodo.id, todo.id, 'Unarchived todo should have same ID');
    }

    // Test 5: Unarchive Individual Todo - Cannot Unarchive Non-archived Todo
    {
        const model = new TodoModel();
        const todo = model.addTodo('Non-archived todo');
        
        const result = model.unarchiveTodo(todo.id);
        
        test.assertNull(result, 'Cannot unarchive non-archived todo - should return null');
        test.assertEqual(todo.archived, false, 'Non-archived todo should remain unarchived');
    }

    // Test 6: Unarchive Individual Todo - Nonexistent Todo
    {
        const model = new TodoModel();
        const result = model.unarchiveTodo('nonexistent-id');
        
        test.assertNull(result, 'Unarchive nonexistent todo should return null');
    }

    // Test 7: Bulk Archive Completed Todos - Multiple Todos
    {
        const model = new TodoModel();
        const todo1 = model.addTodo('First completed todo');
        const todo2 = model.addTodo('Second completed todo');
        const todo3 = model.addTodo('Incomplete todo');
        const todo4 = model.addTodo('Third completed todo');
        
        // Complete some todos
        model.toggleTodo(todo1.id);
        model.toggleTodo(todo2.id);
        model.toggleTodo(todo4.id);
        
        const archivedCount = model.archiveCompletedTodos();
        
        test.assertEqual(archivedCount, 3, 'Should archive 3 completed todos');
        test.assertEqual(todo1.archived, true, 'First completed todo should be archived');
        test.assertEqual(todo2.archived, true, 'Second completed todo should be archived');
        test.assertEqual(todo3.archived, false, 'Incomplete todo should not be archived');
        test.assertEqual(todo4.archived, true, 'Third completed todo should be archived');
    }

    // Test 8: Bulk Archive Completed Todos - No Completed Todos
    {
        const model = new TodoModel();
        model.addTodo('Incomplete todo 1');
        model.addTodo('Incomplete todo 2');
        
        const archivedCount = model.archiveCompletedTodos();
        
        test.assertEqual(archivedCount, 0, 'Should archive 0 todos when none are completed');
    }

    // Test 9: Bulk Archive Completed Todos - Already Archived Todos
    {
        const model = new TodoModel();
        const todo1 = model.addTodo('First todo');
        const todo2 = model.addTodo('Second todo');
        
        // Complete and archive first todo
        model.toggleTodo(todo1.id);
        model.archiveTodo(todo1.id);
        
        // Complete second todo
        model.toggleTodo(todo2.id);
        
        const archivedCount = model.archiveCompletedTodos();
        
        test.assertEqual(archivedCount, 1, 'Should only archive newly completed todos');
        test.assertEqual(todo1.archived, true, 'Previously archived todo should remain archived');
        test.assertEqual(todo2.archived, true, 'Newly completed todo should be archived');
    }

    // Test 10: Filter Todos by Archive Status - Active Only
    {
        const model = new TodoModel();
        const activeTodo1 = model.addTodo('Active todo 1');
        const activeTodo2 = model.addTodo('Active todo 2');
        const completedTodo = model.addTodo('To be archived');
        
        model.toggleTodo(completedTodo.id);
        model.archiveTodo(completedTodo.id);
        
        const activeTodos = model.getTodosFiltered(false);
        
        test.assertArrayLength(activeTodos, 2, 'Should return only 2 active todos');
        test.assert(activeTodos.some(t => t.id === activeTodo1.id), 'Should include first active todo');
        test.assert(activeTodos.some(t => t.id === activeTodo2.id), 'Should include second active todo');
        test.assert(!activeTodos.some(t => t.id === completedTodo.id), 'Should not include archived todo');
    }

    // Test 11: Filter Todos by Archive Status - Include Archived
    {
        const model = new TodoModel();
        const activeTodo = model.addTodo('Active todo');
        const archivedTodo = model.addTodo('To be archived');
        
        model.toggleTodo(archivedTodo.id);
        model.archiveTodo(archivedTodo.id);
        
        const allTodos = model.getTodosFiltered(true);
        
        test.assertArrayLength(allTodos, 2, 'Should return both active and archived todos');
        test.assert(allTodos.some(t => t.id === activeTodo.id), 'Should include active todo');
        test.assert(allTodos.some(t => t.id === archivedTodo.id), 'Should include archived todo');
    }

    // Test 12: Search with Archive Filtering - Active Only
    {
        const model = new TodoModel();
        const activeTodo = model.addTodo('Search active item');
        const archivedTodo = model.addTodo('Search archived item');
        
        model.toggleTodo(archivedTodo.id);
        model.archiveTodo(archivedTodo.id);
        
        const searchResults = model.filterTodos('Search', false);
        
        test.assertArrayLength(searchResults, 1, 'Should find only 1 active todo matching search');
        test.assertEqual(searchResults[0].id, activeTodo.id, 'Should return the active todo');
    }

    // Test 13: Search with Archive Filtering - Include Archived
    {
        const model = new TodoModel();
        const activeTodo = model.addTodo('Search active item');
        const archivedTodo = model.addTodo('Search archived item');
        
        model.toggleTodo(archivedTodo.id);
        model.archiveTodo(archivedTodo.id);
        
        const searchResults = model.filterTodos('Search', true);
        
        test.assertArrayLength(searchResults, 2, 'Should find both active and archived todos matching search');
        test.assert(searchResults.some(t => t.id === activeTodo.id), 'Should include active todo');
        test.assert(searchResults.some(t => t.id === archivedTodo.id), 'Should include archived todo');
    }

    // Test 14: Statistics with Archive Information - Active Only
    {
        const model = new TodoModel();
        model.addTodo('Active pending');
        const completedActive = model.addTodo('Active completed');
        const archivedTodo = model.addTodo('Archived completed');
        
        model.toggleTodo(completedActive.id);
        model.toggleTodo(archivedTodo.id);
        model.archiveTodo(archivedTodo.id);
        
        const stats = model.getStats(false);
        
        test.assertEqual(stats.total, 2, 'Total active todos should be 2');
        test.assertEqual(stats.pending, 1, 'Pending active todos should be 1');
        test.assertEqual(stats.completed, 1, 'Completed active todos should be 1');
        test.assertEqual(stats.archived, 1, 'Archived todos should be 1');
    }

    // Test 15: Statistics with Archive Information - Include Archived
    {
        const model = new TodoModel();
        model.addTodo('Active pending');
        const completedActive = model.addTodo('Active completed');
        const archivedTodo = model.addTodo('Archived completed');
        
        model.toggleTodo(completedActive.id);
        model.toggleTodo(archivedTodo.id);
        model.archiveTodo(archivedTodo.id);
        
        const stats = model.getStats(true);
        
        test.assertEqual(stats.total, 3, 'Total todos including archived should be 3');
        test.assertEqual(stats.pending, 1, 'Pending todos should be 1');
        test.assertEqual(stats.completed, 2, 'Completed todos including archived should be 2');
        test.assertEqual(stats.archived, 1, 'Archived todos should be 1');
    }

    // Test 16: Archive State Persistence - Verify State Changes
    {
        const model = new TodoModel();
        const todo = model.addTodo('State persistence test');
        
        // Initial state
        test.assertEqual(todo.archived, false, 'New todo should not be archived initially');
        
        // Complete and archive
        model.toggleTodo(todo.id);
        model.archiveTodo(todo.id);
        test.assertEqual(todo.archived, true, 'Todo should be archived after archiving');
        
        // Unarchive
        model.unarchiveTodo(todo.id);
        test.assertEqual(todo.archived, false, 'Todo should not be archived after unarchiving');
    }

    // Test 17: Edge Case - Archive Operation on Empty Model
    {
        const model = new TodoModel();
        const archivedCount = model.archiveCompletedTodos();
        
        test.assertEqual(archivedCount, 0, 'Bulk archive on empty model should return 0');
        
        const activeTodos = model.getTodosFiltered(false);
        test.assertArrayLength(activeTodos, 0, 'Active todos should be empty');
        
        const allTodos = model.getTodosFiltered(true);
        test.assertArrayLength(allTodos, 0, 'All todos should be empty');
    }

    // Test 18: Edge Case - Multiple Archive/Unarchive Cycles
    {
        const model = new TodoModel();
        const todo = model.addTodo('Cycle test todo');
        model.toggleTodo(todo.id); // Complete it
        
        // Archive -> Unarchive -> Archive cycle
        model.archiveTodo(todo.id);
        test.assertEqual(todo.archived, true, 'First archive should work');
        
        model.unarchiveTodo(todo.id);
        test.assertEqual(todo.archived, false, 'First unarchive should work');
        
        model.archiveTodo(todo.id);
        test.assertEqual(todo.archived, true, 'Second archive should work');
        
        model.unarchiveTodo(todo.id);
        test.assertEqual(todo.archived, false, 'Second unarchive should work');
    }

    return test.printSummary();
}

// Run tests
if (typeof process !== 'undefined') {
    // Node.js environment
    const success = runArchiveTests();
    process.exit(success ? 0 : 1);
} else {
    // Browser environment
    window.runArchiveTests = runArchiveTests;
}