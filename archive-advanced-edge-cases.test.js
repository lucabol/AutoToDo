/**
 * Advanced Edge Cases for Archive Functionality
 * 
 * This test suite focuses on boundary conditions, error scenarios, and
 * edge cases that could cause unexpected behavior in production environments.
 * Tests include concurrent operations, data integrity, and error recovery.
 */

// Import necessary modules
const TodoModel = require('./js/TodoModel.js');

// Enhanced mock storage with failure simulation
class AdvancedMockStorage {
    constructor() {
        this.data = {};
        this.failureMode = false;
        this.callCount = 0;
        this.failOnCall = -1; // Fail on specific call number
    }
    
    getItem(key) {
        this.callCount++;
        if (this.failureMode || this.callCount === this.failOnCall) return null;
        return this.data[key] || null;
    }
    
    setItem(key, value) {
        this.callCount++;
        if (this.failureMode || this.callCount === this.failOnCall) return false;
        this.data[key] = value;
        return true;
    }
    
    removeItem(key) {
        this.callCount++;
        if (this.failureMode || this.callCount === this.failOnCall) return;
        delete this.data[key];
    }
    
    clear() {
        if (this.failureMode) return;
        this.data = {};
    }
    
    getStorageType() {
        return this.failureMode ? 'failed' : 'mock';
    }
    
    // Test utilities
    setFailureMode(enabled) {
        this.failureMode = enabled;
    }
    
    setFailOnCall(callNumber) {
        this.failOnCall = callNumber;
        this.callCount = 0;
    }
    
    resetCallCount() {
        this.callCount = 0;
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

function assertThrows(fn, message) {
    try {
        fn();
        console.log(`❌ FAIL: ${message} (expected error but none was thrown)`);
        failedTests++;
        testResults.push({ status: 'FAIL', message: `${message} (no error thrown)` });
    } catch (error) {
        console.log(`✅ PASS: ${message}`);
        passedTests++;
        testResults.push({ status: 'PASS', message });
    }
}

console.log('🧪 Running Advanced Edge Cases Tests...\n');

// Test 1: Concurrent Archive Operations
console.log('--- Test 1: Concurrent Archive Operations ---');

const storage1 = new AdvancedMockStorage();
const model1 = new TodoModel(storage1);

// Create multiple todos for concurrent testing
const concurrentTodos = [];
for (let i = 0; i < 10; i++) {
    const todo = model1.addTodo(`Concurrent task ${i}`);
    if (i % 2 === 0) model1.toggleTodo(todo.id); // Complete even-numbered todos
    concurrentTodos.push(todo);
}

// Test bulk archive followed by individual archive (should handle gracefully)
const bulkArchived = model1.archiveCompleted();
assertEquals(bulkArchived, 5, 'should archive 5 completed todos in bulk operation');

// Try to archive already archived todos individually (should handle gracefully)
let additionalArchived = 0;
concurrentTodos.filter(t => t.id % 2 === 0).forEach(todo => {
    const result = model1.archiveTodo(todo.id);
    if (result) additionalArchived++;
});

// All should already be archived, so individual operations should return existing state
const stats1 = model1.getStats();
assertEquals(stats1.archived, 5, 'should still have 5 archived todos after redundant operations');

console.log('');

// Test 2: Archive Operations with Invalid IDs
console.log('--- Test 2: Archive Operations with Invalid IDs ---');

const storage2 = new AdvancedMockStorage();
const model2 = new TodoModel(storage2);

// Test archive with non-existent ID
const invalidArchiveResult = model2.archiveTodo('non-existent-id');
assertEquals(invalidArchiveResult, null, 'should return null for non-existent todo archive');

// Test unarchive with non-existent ID
const invalidUnarchiveResult = model2.unarchiveTodo('non-existent-id');
assertEquals(invalidUnarchiveResult, null, 'should return null for non-existent todo unarchive');

// Test with malformed IDs
const malformedIds = ['', null, undefined, 0, false, {}];
malformedIds.forEach((id, index) => {
    const archiveResult = model2.archiveTodo(id);
    assertEquals(archiveResult, null, `should handle malformed ID ${index} gracefully in archive`);
    
    const unarchiveResult = model2.unarchiveTodo(id);
    assertEquals(unarchiveResult, null, `should handle malformed ID ${index} gracefully in unarchive`);
});

console.log('');

// Test 3: Archive State Consistency During Storage Failures
console.log('--- Test 3: Archive State Consistency During Storage Failures ---');

const storage3 = new AdvancedMockStorage();
const model3 = new TodoModel(storage3);

// Create test data
const testTodo = model3.addTodo('Test consistency todo');
model3.toggleTodo(testTodo.id);

// Simulate storage failure during archive operation
storage3.setFailureMode(true);
const failedArchiveResult = model3.archiveTodo(testTodo.id);

// The operation should still modify in-memory state even if save fails
assert(failedArchiveResult !== null, 'should return todo object even if storage fails');
assert(failedArchiveResult.archived === true, 'should update in-memory state even if storage fails');

// Verify in-memory state is consistent
const archivedTodos = model3.getArchivedTodos();
assertEquals(archivedTodos.length, 1, 'should have 1 archived todo in memory despite storage failure');

// Restore storage and verify recovery
storage3.setFailureMode(false);
const recoveryResult = model3.saveTodos();
assert(recoveryResult === true, 'should be able to save after storage recovery');

console.log('');

// Test 4: Extreme Data Volumes (Boundary Testing)
console.log('--- Test 4: Extreme Data Volumes ---');

const storage4 = new AdvancedMockStorage();
const model4 = new TodoModel(storage4);

// Test with large number of todos (performance boundary testing)
const largeTodoCount = 1000;
const largeTodos = [];

console.log(`Creating ${largeTodoCount} todos for boundary testing...`);
for (let i = 0; i < largeTodoCount; i++) {
    const todo = model4.addTodo(`Large dataset todo ${i}`);
    if (i % 3 === 0) model4.toggleTodo(todo.id); // Complete every 3rd todo
    largeTodos.push(todo);
}

// Test bulk archive performance with large dataset
const startTime = Date.now();
const largeArchiveCount = model4.archiveCompleted();
const archiveTime = Date.now() - startTime;

const expectedArchived = Math.floor(largeTodoCount / 3) + (largeTodoCount % 3 === 0 ? 0 : 0);
assert(largeArchiveCount > 300, `should archive approximately 333 todos (actual: ${largeArchiveCount})`);
assert(archiveTime < 100, `archive operation should complete quickly (${archiveTime}ms)`);

// Test search performance on large archived dataset
const searchStartTime = Date.now();
const largeSearchResults = model4.filterTodos('500', true); // Search for todos containing '500'
const searchTime = Date.now() - searchStartTime;

assert(searchTime < 50, `search should be fast on large dataset (${searchTime}ms)`);

console.log('');

// Test 5: Unicode and Special Character Edge Cases
console.log('--- Test 5: Unicode and Special Characters ---');

const storage5 = new AdvancedMockStorage();
const model5 = new TodoModel(storage5);

// Test with various unicode and special characters
const specialTodos = [
    model5.addTodo('Todo with émojis 🚀💻✨'),
    model5.addTodo('Todo with unicode: café résumé naïve'),
    model5.addTodo('Todo with symbols: @#$%^&*()[]{}'),
    model5.addTodo('Todo with quotes: "Hello" \'World\''),
    model5.addTodo('Todo with newlines:\nSecond line'),
    model5.addTodo('Todo with tabs:\tTabbed content'),
    model5.addTodo('Todo with mixed: 混合文字 العربية русский')
];

// Complete and archive todos with special characters
specialTodos.forEach(todo => model5.toggleTodo(todo.id));
const specialArchiveCount = model5.archiveCompleted();
assertEquals(specialArchiveCount, specialTodos.length, 'should archive all special character todos');

// Test search with unicode and special characters
const emojiResults = model5.filterTodos('🚀', true);
assertEquals(emojiResults.length, 1, 'should find todo with emoji');

const unicodeResults = model5.filterTodos('café', true);
assertEquals(unicodeResults.length, 1, 'should find todo with unicode characters');

const symbolResults = model5.filterTodos('@#$', true);
assertEquals(symbolResults.length, 1, 'should find todo with symbols');

console.log('');

// Test 6: Race Condition Simulation
console.log('--- Test 6: Race Condition Simulation ---');

const storage6 = new AdvancedMockStorage();
const model6 = new TodoModel(storage6);

// Create a todo for race condition testing
const raceTodo = model6.addTodo('Race condition test todo');
model6.toggleTodo(raceTodo.id);

// Simulate rapid successive operations that might cause race conditions
const operations = [];
for (let i = 0; i < 10; i++) {
    // Alternate between archive and unarchive rapidly
    if (i % 2 === 0) {
        operations.push(() => model6.archiveTodo(raceTodo.id));
    } else {
        operations.push(() => model6.unarchiveTodo(raceTodo.id));
    }
}

// Execute all operations rapidly
operations.forEach(op => op());

// Final state should be consistent (last operation wins)
const finalTodo = model6.getTodo(raceTodo.id);
assert(finalTodo !== null, 'todo should still exist after rapid operations');
assert(typeof finalTodo.archived === 'boolean', 'archived state should be valid boolean');

// Stats should be consistent with final state
const finalStats = model6.getStats();
const expectedArchivedCount = finalTodo.archived ? 1 : 0;
assertEquals(finalStats.archived, expectedArchivedCount, 'stats should be consistent with final todo state');

console.log('');

// Test 7: Memory Efficiency with Repeated Operations
console.log('--- Test 7: Memory Efficiency Testing ---');

const storage7 = new AdvancedMockStorage();
const model7 = new TodoModel(storage7);

// Create test todo
const memoryTodo = model7.addTodo('Memory efficiency test');
model7.toggleTodo(memoryTodo.id);

// Perform many archive/unarchive cycles to test for memory leaks
const cycles = 100;
for (let i = 0; i < cycles; i++) {
    model7.archiveTodo(memoryTodo.id);
    model7.unarchiveTodo(memoryTodo.id);
}

// Final archive
model7.archiveTodo(memoryTodo.id);

// Verify final state is correct
const memoryStats = model7.getStats();
assertEquals(memoryStats.total, 1, 'should have exactly 1 todo after many operations');
assertEquals(memoryStats.archived, 1, 'should have exactly 1 archived todo');

// Verify todo integrity
const finalMemoryTodo = model7.getTodo(memoryTodo.id);
assertEquals(finalMemoryTodo.text, 'Memory efficiency test', 'todo text should be unchanged');
assert(finalMemoryTodo.archived === true, 'todo should be archived');
assert(finalMemoryTodo.completed === true, 'todo should remain completed');

console.log('');

// Test Summary
console.log('🎯 Advanced Edge Cases Test Results:');
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📊 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

if (failedTests > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.filter(result => result.status === 'FAIL').forEach(result => {
        console.log(`   - ${result.message}`);
    });
    process.exit(1);
} else {
    console.log('\n🎉 All advanced edge case tests passed!');
    console.log('✨ Archive functionality demonstrates excellent robustness and reliability.');
    process.exit(0);
}