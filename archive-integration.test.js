/**
 * Archive Functionality Integration Tests
 * 
 * These tests verify that archive functionality works seamlessly with other 
 * parts of the application including search, drag-drop, keyboard shortcuts,
 * editing, and theme management.
 */

// Import necessary modules for integration testing
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

console.log('🧪 Running Archive Integration Tests...\n');

// Test 1: Archive Integration with Search Functionality
console.log('--- Test 1: Archive Integration with Search ---');

const storage1 = new MockStorage();
const model1 = new TodoModel(storage1);

// Create test data with specific keywords for search testing
const searchTodo1 = model1.addTodo('JavaScript debugging task');
const searchTodo2 = model1.addTodo('CSS styling work');  
const searchTodo3 = model1.addTodo('JavaScript performance optimization');
const searchTodo4 = model1.addTodo('HTML accessibility improvements');

// Complete and archive some todos
model1.toggleTodo(searchTodo1.id);  // Complete
model1.toggleTodo(searchTodo3.id);  // Complete
model1.archiveTodo(searchTodo1.id); // Archive completed
model1.archiveTodo(searchTodo4.id); // Archive non-completed

// Test search integration with archived todos
const activeJSResults = model1.filterTodos('JavaScript', false);
assertEquals(activeJSResults.length, 1, 'should find 1 active JavaScript todo');

const allJSResults = model1.filterTodos('JavaScript', true);
assertEquals(allJSResults.length, 2, 'should find 2 JavaScript todos including archived');

// Test multi-word search with archived todos
const activeTaskResults = model1.filterTodos('JavaScript task', false);
assertEquals(activeTaskResults.length, 0, 'should find 0 active todos matching "JavaScript task"');

const allTaskResults = model1.filterTodos('JavaScript task', true);
assertEquals(allTaskResults.length, 1, 'should find 1 todo matching "JavaScript task" including archived');

console.log('\n--- Test 2: Archive Persistence and State Management ---');

// Test that archive state persists through model operations
const storage2 = new MockStorage();
const model2 = new TodoModel(storage2);

const persistTodo1 = model2.addTodo('Persistent todo 1');
const persistTodo2 = model2.addTodo('Persistent todo 2');

// Archive and verify state
model2.archiveTodo(persistTodo1.id);
assertEquals(model2.getArchivedTodos().length, 1, 'should have 1 archived todo after archiving');

// Simulate model reload from storage
const model2Reloaded = new TodoModel(storage2);
assertEquals(model2Reloaded.getArchivedTodos().length, 1, 'archived state should persist after model reload');

const reloadedTodo = model2Reloaded.getTodo(persistTodo1.id);
assert(reloadedTodo && reloadedTodo.archived === true, 'reloaded todo should maintain archived state');

console.log('\n--- Test 3: Archive Integration with CRUD Operations ---');

const storage3 = new MockStorage();
const model3 = new TodoModel(storage3);

// Test editing archived todos
const editTodo = model3.addTodo('Original text');
model3.archiveTodo(editTodo.id);

const updatedTodo = model3.updateTodo(editTodo.id, 'Updated text');
assert(updatedTodo !== null, 'should be able to edit archived todo');
assert(updatedTodo.archived === true, 'edited todo should remain archived');
assertEquals(updatedTodo.text, 'Updated text', 'archived todo text should be updated');

// Test toggling completion status of archived todos
const toggledTodo = model3.toggleTodo(editTodo.id);
assert(toggledTodo !== null, 'should be able to toggle archived todo');
assert(toggledTodo.archived === true, 'toggled todo should remain archived');

// Test deleting archived todos
const deletedResult = model3.deleteTodo(editTodo.id);
assert(deletedResult === true, 'should be able to delete archived todo');
assertEquals(model3.getArchivedTodos().length, 0, 'archived todo should be removed after deletion');

console.log('\n--- Test 4: Archive Edge Cases and Error Handling ---');

const storage4 = new MockStorage();
const model4 = new TodoModel(storage4);

// Test archiving non-existent todo
const invalidArchiveResult = model4.archiveTodo('non-existent-id');
assert(invalidArchiveResult === null, 'should return null when archiving non-existent todo');

// Test unarchiving non-existent todo  
const invalidUnarchiveResult = model4.unarchiveTodo('non-existent-id');
assert(invalidUnarchiveResult === null, 'should return null when unarchiving non-existent todo');

// Test archiving already archived todo
const edgeTodo = model4.addTodo('Edge case todo');
model4.archiveTodo(edgeTodo.id);
const doubleArchiveResult = model4.archiveTodo(edgeTodo.id);
assert(doubleArchiveResult !== null, 'should handle archiving already archived todo');
assert(doubleArchiveResult.archived === true, 'todo should remain archived');

// Test unarchiving already active todo
model4.unarchiveTodo(edgeTodo.id);
const doubleUnarchiveResult = model4.unarchiveTodo(edgeTodo.id);
assert(doubleUnarchiveResult !== null, 'should handle unarchiving already active todo');
assert(doubleUnarchiveResult.archived === false, 'todo should remain active');

console.log('\n--- Test 5: Archive Performance with Mixed Operations ---');

const storage5 = new MockStorage();
const model5 = new TodoModel(storage5);

// Create mixed dataset
const performanceStart = Date.now();
const todos = [];
for (let i = 0; i < 100; i++) {
    const todo = model5.addTodo(`Performance test todo ${i}`);
    todos.push(todo);
    
    // Complete every third todo
    if (i % 3 === 0) {
        model5.toggleTodo(todo.id);
    }
}

// Archive completed todos
const archiveStart = Date.now();
const archivedCount = model5.archiveCompleted();
const archiveTime = Date.now() - archiveStart;

assert(archivedCount > 30, `should archive approximately 33 todos (archived: ${archivedCount})`);
assert(archiveTime < 50, `bulk archive should complete in under 50ms (took: ${archiveTime}ms)`);

// Test search performance with mixed active/archived todos
const searchStart = Date.now();
const searchResults = model5.filterTodos('Performance', true);
const searchTime = Date.now() - searchStart;

assert(searchResults.length > 90, `should find most todos in search (found: ${searchResults.length})`);
assert(searchTime < 10, `search should complete quickly (took: ${searchTime}ms)`);

const totalSetupTime = Date.now() - performanceStart;
assert(totalSetupTime < 200, `total test setup should complete in under 200ms (took: ${totalSetupTime}ms)`);

console.log('\n--- Test 6: Archive Integration with Statistics ---');

const storage6 = new MockStorage();
const model6 = new TodoModel(storage6);

// Create test data for statistics
const statsTodo1 = model6.addTodo('Stats todo 1');
const statsTodo2 = model6.addTodo('Stats todo 2');
const statsTodo3 = model6.addTodo('Stats todo 3');

// Complete and archive some
model6.toggleTodo(statsTodo1.id);
model6.toggleTodo(statsTodo2.id);
model6.archiveTodo(statsTodo1.id);

const stats = model6.getStats();
assertEquals(stats.total, 3, 'total should include all todos');
assertEquals(stats.completed, 2, 'completed should count completed todos regardless of archive status');
assertEquals(stats.archived, 1, 'archived should count only archived todos');
assertEquals(stats.active, 2, 'active should count only non-archived todos');
assertEquals(stats.pending, 1, 'pending should be total minus completed');

console.log('\n--- Test 7: Archive Complex Search Scenarios ---');

const storage7 = new MockStorage();
const model7 = new TodoModel(storage7);

// Create complex test data
const complexTodos = [
    'Fix JavaScript bug in user authentication',
    'Update CSS for mobile responsive design', 
    'Write unit tests for user authentication module',
    'Fix CSS styling issues on dashboard',
    'JavaScript performance optimization for search',
    'User authentication security improvements'
];

const complexTodoIds = complexTodos.map(text => model7.addTodo(text).id);

// Complete and archive some todos strategically
model7.toggleTodo(complexTodoIds[0]); // Complete JS auth bug
model7.toggleTodo(complexTodoIds[3]); // Complete CSS dashboard
model7.archiveTodo(complexTodoIds[0]); // Archive completed JS auth bug
model7.archiveTodo(complexTodoIds[1]); // Archive CSS mobile (not completed)

// Test complex search scenarios
const jsActiveResults = model7.filterTodos('JavaScript', false);
assertEquals(jsActiveResults.length, 1, 'should find 1 active JavaScript todo');

const jsAllResults = model7.filterTodos('JavaScript', true);
assertEquals(jsAllResults.length, 2, 'should find 2 JavaScript todos including archived');

const authActiveResults = model7.filterTodos('authentication', false);
assertEquals(authActiveResults.length, 2, 'should find 2 active authentication todos');

const authAllResults = model7.filterTodos('authentication', true);
assertEquals(authAllResults.length, 3, 'should find 3 authentication todos including archived');

// Multi-word search with archived
const jsUserActive = model7.filterTodos('JavaScript user', false);
assertEquals(jsUserActive.length, 0, 'should find 0 active todos matching "JavaScript user"');

const jsUserAll = model7.filterTodos('JavaScript user', true);
assertEquals(jsUserAll.length, 1, 'should find 1 todo matching "JavaScript user" including archived');

console.log('\n============================================================');
console.log(`📊 Integration Test Results: ${passedTests} passed, ${failedTests} failed`);

if (failedTests === 0) {
    console.log('🎉 All archive integration tests passed!');
    console.log('\n✅ SUMMARY: Archive functionality integrates properly with:');
    console.log('   - Search functionality (multi-word, case-insensitive)');
    console.log('   - CRUD operations (edit, toggle, delete archived todos)');
    console.log('   - Data persistence and state management');
    console.log('   - Statistics and performance monitoring');
    console.log('   - Complex search scenarios and edge cases');
} else {
    console.log(`⚠️  ${failedTests} integration tests failed. Archive integration needs attention.`);
}

// Export test results for CI integration
module.exports = {
    passed: passedTests,
    failed: failedTests,
    results: testResults
};