/**
 * Archive Functionality Tests
 * Tests for the archive functionality in TodoModel, TodoController, and TodoView
 */

// Import modules
const TodoModel = require('./js/TodoModel.js');

// Mock storage for testing
class MockStorage {
    constructor() {
        this.data = {};
    }
    
    getItem(key) {
        return this.data[key] || null;
    }
    
    setItem(key, value) {
        this.data[key] = value;
        return true;
    }
    
    removeItem(key) {
        delete this.data[key];
    }
    
    clear() {
        this.data = {};
    }
    
    getStorageType() {
        return 'mock';
    }
}

// Mock localStorage for Node.js environment
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
};

// Test results tracking
let passedTests = 0;
let failedTests = 0;
let testResults = [];

function assert(condition, message) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
        passedTests++;
        testResults.push({ status: 'PASS', message });
    } else {
        console.log(`❌ FAIL: ${message}`);
        failedTests++;
        testResults.push({ status: 'FAIL', message });
    }
}

function assertEquals(actual, expected, message) {
    assert(actual === expected, `${message} (expected: ${expected}, actual: ${actual})`);
}

function assertArrayEquals(actual, expected, message) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    assert(actualStr === expectedStr, `${message} (expected: ${expectedStr}, actual: ${actualStr})`);
}

console.log('🧪 Running Archive Functionality Tests...\n');

// Test 1: TodoModel Archive Methods
console.log('--- Test 1: TodoModel Archive Methods ---');

const storage = new MockStorage();
const model = new TodoModel(storage);

// Add test todos
const todo1 = model.addTodo('Todo 1', 'high');
const todo2 = model.addTodo('Todo 2', 'medium');
const todo3 = model.addTodo('Todo 3', 'low');

// Complete some todos
model.toggleTodo(todo1.id);
model.toggleTodo(todo2.id);

// Test archiving individual todo
const archivedTodo = model.archiveTodo(todo1.id);
assert(archivedTodo !== null, 'should return archived todo');
assert(archivedTodo.archived === true, 'archived todo should have archived flag set');
assertEquals(model.getArchivedTodos().length, 1, 'should have 1 archived todo');
assertEquals(model.getActiveTodos().length, 2, 'should have 2 active todos');

// Test unarchiving todo
const unarchivedTodo = model.unarchiveTodo(todo1.id);
assert(unarchivedTodo !== null, 'should return unarchived todo');
assert(unarchivedTodo.archived === false, 'unarchived todo should have archived flag false');
assertEquals(model.getArchivedTodos().length, 0, 'should have 0 archived todos');
assertEquals(model.getActiveTodos().length, 3, 'should have 3 active todos');

// Test archiving completed todos
const archivedCount = model.archiveCompleted();
assertEquals(archivedCount, 2, 'should archive 2 completed todos');
assertEquals(model.getArchivedTodos().length, 2, 'should have 2 archived todos');
assertEquals(model.getActiveTodos().length, 1, 'should have 1 active todo');

// Test stats with archived todos
const stats = model.getStats();
assertEquals(stats.total, 3, 'total todos should be 3');
assertEquals(stats.archived, 2, 'archived todos should be 2');
assertEquals(stats.active, 1, 'active todos should be 1');
assertEquals(stats.completed, 2, 'completed todos should be 2');

// Test 2: Archive Filtering and Search
console.log('\n--- Test 2: Archive Filtering and Search ---');

// Test filtering without archived
let filtered = model.filterTodos('todo', false);
assertEquals(filtered.length, 1, 'should find 1 active todo');

// Test filtering with archived
filtered = model.filterTodos('todo', true);
assertEquals(filtered.length, 3, 'should find 3 todos including archived');

// Test empty search without archived
filtered = model.filterTodos('', false);
assertEquals(filtered.length, 1, 'empty search should return active todos only');

// Test empty search with archived
filtered = model.filterTodos('', true);
assertEquals(filtered.length, 3, 'empty search with archived should return all todos');

// Test search that only matches archived todos
model.getArchivedTodos()[0].text = 'archived special task';
filtered = model.filterTodos('special', false);
assertEquals(filtered.length, 0, 'search without archived should not find archived-only matches');

filtered = model.filterTodos('special', true);
assertEquals(filtered.length, 1, 'search with archived should find archived-only matches');

// Test 3: Edge Cases
console.log('\n--- Test 3: Archive Edge Cases ---');

// Test archiving non-existent todo
const nonExistentArchive = model.archiveTodo('non-existent-id');
assert(nonExistentArchive === null, 'should return null for non-existent todo');

// Test unarchiving non-existent todo  
const nonExistentUnarchive = model.unarchiveTodo('non-existent-id');
assert(nonExistentUnarchive === null, 'should return null for non-existent todo');

// Test archiving already archived todo
const alreadyArchivedTodo = model.getArchivedTodos()[0];
const reArchive = model.archiveTodo(alreadyArchivedTodo.id);
assert(reArchive.archived === true, 'should still be archived');

// Test unarchiving active todo
const activeTodo = model.getActiveTodos()[0];
const unarchiveActive = model.unarchiveTodo(activeTodo.id);
assert(unarchiveActive.archived === false, 'should still be active');

// Test archiving completed when no completed todos exist
// First unarchive all and mark as incomplete
model.getAllTodos().forEach(todo => {
    model.unarchiveTodo(todo.id);
    if (todo.completed) {
        model.toggleTodo(todo.id);
    }
});

const noCompletedArchive = model.archiveCompleted();
assertEquals(noCompletedArchive, 0, 'should archive 0 todos when none completed');

// Test 4: Persistence
console.log('\n--- Test 4: Archive Persistence ---');

// Create a fresh storage for persistence test
const persistStorage = new MockStorage();
const persistModel = new TodoModel(persistStorage);

// Archive a todo and verify it persists
const persistTodo = persistModel.addTodo('Persist test todo', 'medium');
persistModel.toggleTodo(persistTodo.id);
persistModel.archiveTodo(persistTodo.id);

// Create new model instance with same storage
const model2 = new TodoModel(persistStorage);
const persistedTodos = model2.getAllTodos();
const persistedArchivedTodo = persistedTodos.find(t => t.id === persistTodo.id);

assert(persistedArchivedTodo !== undefined, 'archived todo should persist');
if (persistedArchivedTodo) {
    assert(persistedArchivedTodo.archived === true, 'persisted todo should be archived');
}

// Test 5: Performance with Large Dataset
console.log('\n--- Test 5: Archive Performance Test ---');

// Create a model with many todos for performance testing
const perfStorage = new MockStorage();
const perfModel = new TodoModel(perfStorage);

console.log('Creating 500+ todos for performance test...');
const startTime = Date.now();

// Add 600 todos (mix of completed and pending)
for (let i = 1; i <= 600; i++) {
    const todo = perfModel.addTodo(`Performance Todo ${i}`, i % 3 === 0 ? 'high' : 'medium');
    if (i % 2 === 0) {
        perfModel.toggleTodo(todo.id); // Mark every other todo as completed
    }
}

const addTime = Date.now() - startTime;
console.log(`✅ Added 600 todos in ${addTime}ms`);

// Test archive completed performance
const archiveStartTime = Date.now();
const archivedPerfCount = perfModel.archiveCompleted();
const archiveTime = Date.now() - archiveStartTime;

console.log(`✅ Archived ${archivedPerfCount} completed todos in ${archiveTime}ms`);
assert(archivedPerfCount === 300, 'should archive 300 completed todos');

// Test search performance with archived todos
const searchStartTime = Date.now();
const searchResults = perfModel.filterTodos('Performance', true);
const searchTime = Date.now() - searchStartTime;

console.log(`✅ Searched through 600 todos (including archived) in ${searchTime}ms`);
assert(searchResults.length === 600, 'should find all todos in search');

// Test active-only search performance
const activeSearchStartTime = Date.now();
const activeSearchResults = perfModel.filterTodos('Performance', false);
const activeSearchTime = Date.now() - activeSearchStartTime;

console.log(`✅ Searched through active todos only in ${activeSearchTime}ms`);
assert(activeSearchResults.length === 300, 'should find 300 active todos');

// Performance assertions
assert(addTime < 1000, 'should add 600 todos in less than 1 second');
assert(archiveTime < 100, 'should archive completed todos in less than 100ms');
assert(searchTime < 50, 'should search all todos in less than 50ms');
assert(activeSearchTime < 50, 'should search active todos in less than 50ms');

// Test 6: Archive with Other Operations
console.log('\n--- Test 6: Archive Integration with Other Operations ---');

const integrationModel = new TodoModel(new MockStorage());

// Add todos
const integrationTodo1 = integrationModel.addTodo('Integration Todo 1', 'high');
const integrationTodo2 = integrationModel.addTodo('Integration Todo 2', 'medium');

// Complete and archive one
integrationModel.toggleTodo(integrationTodo1.id);
integrationModel.archiveTodo(integrationTodo1.id);

// Test editing archived todo
const editResult = integrationModel.updateTodo(integrationTodo1.id, 'Edited Archived Todo');
assert(editResult !== null, 'should be able to edit archived todo');
assert(editResult.archived === true, 'edited todo should remain archived');
assertEquals(editResult.text, 'Edited Archived Todo', 'should update archived todo text');

// Test deleting archived todo
const beforeDeleteCount = integrationModel.getAllTodos().length;
const deleteResult = integrationModel.deleteTodo(integrationTodo1.id);
const afterDeleteCount = integrationModel.getAllTodos().length;

assert(deleteResult === true, 'should be able to delete archived todo');
assertEquals(afterDeleteCount, beforeDeleteCount - 1, 'should remove archived todo from total count');

// Test reordering with archived todos (create more todos)
const reorderTodo1 = integrationModel.addTodo('Reorder 1', 'high');
const reorderTodo2 = integrationModel.addTodo('Reorder 2', 'medium');
integrationModel.toggleTodo(reorderTodo1.id);
integrationModel.archiveTodo(reorderTodo1.id);

const reorderResult = integrationModel.reorderTodo(reorderTodo2.id, 0);
assert(reorderResult === true, 'should be able to reorder with archived todos present');

// Display final results
console.log('\n============================================================');
console.log(`📊 Archive Test Results: ${passedTests} passed, ${failedTests} failed`);

if (failedTests === 0) {
    console.log('🎉 All archive functionality tests passed!');
    console.log('\n✅ SUMMARY: Archive functionality is working correctly');
    console.log('   - Individual todo archiving/unarchiving works');
    console.log('   - Bulk archiving of completed todos works');
    console.log('   - Search with archived todos works correctly');
    console.log('   - Archive persistence works');
    console.log('   - Performance with 500+ todos is acceptable');
    console.log('   - Integration with other operations works');
} else {
    console.log('❌ Some archive functionality tests failed!');
    
    console.log('\nFailed tests:');
    testResults.filter(result => result.status === 'FAIL').forEach(result => {
        console.log(`   - ${result.message}`);
    });
    
    process.exit(1);
}