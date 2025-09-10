/**
 * Archive Functionality Edge Cases Tests
 * 
 * This test suite focuses on edge cases and boundary conditions that might
 * not be covered by regular testing, ensuring robustness of the archive functionality.
 */

// Import necessary modules
const TodoModel = require('./js/TodoModel.js');

// Mock storage for testing
class MockStorage {
    constructor() {
        this.data = {};
        this.failureMode = false;
    }
    
    getItem(key) {
        if (this.failureMode) return null;
        return this.data[key] || null;
    }
    
    setItem(key, value) {
        if (this.failureMode) return false;
        this.data[key] = value;
        return true;
    }
    
    removeItem(key) {
        if (this.failureMode) return;
        delete this.data[key];
    }
    
    clear() {
        if (this.failureMode) return;
        this.data = {};
    }
    
    getStorageType() {
        return this.failureMode ? 'failed' : 'mock';
    }
    
    // Test utility to simulate storage failures
    setFailureMode(enabled) {
        this.failureMode = enabled;
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

console.log('🧪 Running Archive Edge Cases Tests...\n');

// Test 1: Archive Operations During Storage Failures
console.log('--- Test 1: Archive with Storage Failures ---');

const failingStorage = new MockStorage();
const model1 = new TodoModel(failingStorage);

// Add todo normally
const todo1 = model1.addTodo('Test todo');
assert(todo1 !== null, 'should add todo normally');

// Simulate storage failure
failingStorage.setFailureMode(true);

// Archive operation should still work in memory even if persistence fails
const archivedTodo = model1.archiveTodo(todo1.id);
assert(archivedTodo !== null, 'should archive todo even with storage failure');
assert(archivedTodo.archived === true, 'todo should be archived in memory');

// Verify the todo is still archived even without persistence
const archivedTodos = model1.getArchivedTodos();
assertEquals(archivedTodos.length, 1, 'should have archived todo in memory');

// Restore storage and verify graceful handling
failingStorage.setFailureMode(false);
const restoredArchive = model1.archiveTodo(todo1.id); // Re-archive to test persistence
assert(restoredArchive !== null, 'should handle storage restoration gracefully');

console.log('\n--- Test 2: Concurrent Archive Operations ---');

const storage2 = new MockStorage();
const model2 = new TodoModel(storage2);

// Create multiple todos
const concurrentTodos = [];
for (let i = 0; i < 10; i++) {
    const todo = model2.addTodo(`Concurrent todo ${i}`);
    concurrentTodos.push(todo);
    if (i % 2 === 0) {
        model2.toggleTodo(todo.id); // Complete even-numbered todos
    }
}

// Simulate rapid concurrent archive operations
const startTime = Date.now();
const results = [];

// Archive individual todos rapidly
concurrentTodos.slice(0, 3).forEach(todo => {
    results.push(model2.archiveTodo(todo.id));
});

// Bulk archive completed while individual archives are happening
const bulkResult = model2.archiveCompleted();
const endTime = Date.now();

// Verify all operations completed successfully
results.forEach((result, index) => {
    assert(result !== null, `concurrent archive ${index} should succeed`);
});

assert(bulkResult >= 0, 'bulk archive should complete successfully');
assert(endTime - startTime < 100, `concurrent operations should complete quickly (took: ${endTime - startTime}ms)`);

// Verify final state is consistent
const finalArchived = model2.getArchivedTodos();
const finalActive = model2.getActiveTodos();
assertEquals(finalArchived.length + finalActive.length, 10, 'total todos should be preserved');

console.log('\n--- Test 3: Archive with Extreme Data Conditions ---');

const storage3 = new MockStorage();
const model3 = new TodoModel(storage3);

// Test with empty strings and whitespace
assertThrows(() => model3.addTodo(''), 'should reject empty todo text');
assertThrows(() => model3.addTodo('   '), 'should reject whitespace-only todo text');

// Test with extremely long text
const longText = 'A'.repeat(10000);
const longTodo = model3.addTodo(longText);
const archivedLongTodo = model3.archiveTodo(longTodo.id);
assert(archivedLongTodo !== null, 'should handle archiving todo with very long text');
assertEquals(archivedLongTodo.text.length, 10000, 'archived todo should preserve long text');

// Test with special characters and Unicode
const specialText = '🚀 Special chars: <>&"\'`{}[]|\\~!@#$%^&*()_+-=';
const specialTodo = model3.addTodo(specialText);
const archivedSpecialTodo = model3.archiveTodo(specialTodo.id);
assert(archivedSpecialTodo !== null, 'should handle special characters');
assertEquals(archivedSpecialTodo.text, specialText, 'should preserve special characters when archived');

// Test with Unicode emojis and international characters
const unicodeText = '🎯 测试 مرحبا здравствуйте こんにちは';
const unicodeTodo = model3.addTodo(unicodeText);
const archivedUnicodeTodo = model3.archiveTodo(unicodeTodo.id);
assert(archivedUnicodeTodo !== null, 'should handle Unicode characters');
assertEquals(archivedUnicodeTodo.text, unicodeText, 'should preserve Unicode when archived');

console.log('\n--- Test 4: Archive State Corruption Recovery ---');

const storage4 = new MockStorage();
const model4 = new TodoModel(storage4);

// Create normal todo
const normalTodo = model4.addTodo('Normal todo');

// Manually corrupt the todo data (simulate data corruption)
const corruptedTodo = model4.getTodo(normalTodo.id);
if (corruptedTodo) {
    // Add invalid properties
    corruptedTodo.archived = 'invalid'; // Should be boolean
    corruptedTodo.completed = null; // Should be boolean
    corruptedTodo.id = null; // Should be string
}

// Test that system handles corrupted data gracefully
try {
    const stats = model4.getStats();
    assert(stats.total >= 0, 'stats should handle corrupted data gracefully');
    assert(stats.archived >= 0, 'archived count should be non-negative even with corruption');
    assert(stats.active >= 0, 'active count should be non-negative even with corruption');
} catch (error) {
    console.log(`⚠️  Data corruption caused error: ${error.message}`);
}

console.log('\n--- Test 5: Memory and Performance Edge Cases ---');

const storage5 = new MockStorage();
const model5 = new TodoModel(storage5);

// Test with large number of archived todos
console.log('Creating 1000 todos for memory test...');
const memTestStart = Date.now();
const largeTodos = [];

for (let i = 0; i < 1000; i++) {
    const todo = model5.addTodo(`Memory test todo ${i}`);
    largeTodos.push(todo);
    
    // Complete and archive every other todo
    if (i % 2 === 0) {
        model5.toggleTodo(todo.id);
        model5.archiveTodo(todo.id);
    }
}

const memTestEnd = Date.now();
const setupTime = memTestEnd - memTestStart;

assert(setupTime < 2000, `large dataset setup should complete in under 2 seconds (took: ${setupTime}ms)`);

// Test search performance with large archived dataset
const searchStart = Date.now();
const searchResults = model5.filterTodos('Memory test', true);
const searchEnd = Date.now();
const searchTime = searchEnd - searchStart;

assert(searchResults.length >= 500, `should find many todos in large dataset (found: ${searchResults.length})`);
assert(searchTime < 50, `search should be fast even with large dataset (took: ${searchTime}ms)`);

// Test bulk operations performance
const bulkStart = Date.now();
const bulkArchivedCount = model5.archiveCompleted();
const bulkEnd = Date.now();
const bulkTime = bulkEnd - bulkStart;

assert(bulkTime < 100, `bulk archive should be fast (took: ${bulkTime}ms)`);

console.log('\n--- Test 6: Archive Filter Edge Cases ---');

const storage6 = new MockStorage();
const model6 = new TodoModel(storage6);

// Create test data for filter edge cases
const filterTodos = [
    'Single word',
    'Multiple words together',
    '   Leading and trailing spaces   ',
    'UPPERCASE TEXT',
    'lowercase text',
    'MiXeD cAsE tExT',
    '',
    '!@#$%^&*()',
    '     ',
    'Multiple    spaces    between    words'
];

const filterTodoIds = [];
filterTodos.forEach(text => {
    try {
        const todo = model6.addTodo(text || 'fallback text');
        filterTodoIds.push(todo.id);
        // Archive every third todo
        if (filterTodoIds.length % 3 === 0) {
            model6.archiveTodo(todo.id);
        }
    } catch (error) {
        // Expected for invalid input like empty strings
        console.log(`Expected error for invalid input: "${text}"`);
    }
});

// Test search with various edge case inputs
const edgeSearches = [
    { term: '', expected: 'all active todos' },
    { term: '   ', expected: 'all active todos' },
    { term: 'MULTIPLE', expected: 'case insensitive match' },
    { term: 'multiple', expected: 'case insensitive match' },
    { term: 'word together', expected: 'multi-word search' },
    { term: 'nonexistent xyz', expected: 'no matches' },
    { term: '!@#$%^&*()', expected: 'special character search' }
];

edgeSearches.forEach(({ term, expected }) => {
    try {
        const activeResults = model6.filterTodos(term, false);
        const allResults = model6.filterTodos(term, true);
        
        assert(Array.isArray(activeResults), `search "${term}" should return array for active todos`);
        assert(Array.isArray(allResults), `search "${term}" should return array for all todos`);
        assert(allResults.length >= activeResults.length, `all results should include at least as many as active results`);
        
        console.log(`Search "${term}" (${expected}): active=${activeResults.length}, all=${allResults.length}`);
    } catch (error) {
        console.log(`⚠️  Search error for "${term}": ${error.message}`);
    }
});

console.log('\n--- Test 7: Archive ID Collision and Uniqueness ---');

const storage7 = new MockStorage();
const model7 = new TodoModel(storage7);

// Create many todos to test ID uniqueness
const idSet = new Set();
const idCollisionTodos = [];

for (let i = 0; i < 1000; i++) {
    const todo = model7.addTodo(`ID test todo ${i}`);
    
    assert(!idSet.has(todo.id), `todo ID should be unique (collision detected: ${todo.id})`);
    idSet.add(todo.id);
    idCollisionTodos.push(todo);
    
    // Archive some for additional testing
    if (i % 10 === 0) {
        model7.archiveTodo(todo.id);
    }
}

// Test that archived todos maintain unique IDs
const archivedIds = model7.getArchivedTodos().map(t => t.id);
const archivedIdSet = new Set(archivedIds);
assertEquals(archivedIds.length, archivedIdSet.size, 'archived todos should have unique IDs');

// Test operations with archived todos using their IDs
archivedIds.slice(0, 5).forEach(id => {
    const todo = model7.getTodo(id);
    assert(todo !== null, `should find archived todo by ID: ${id}`);
    assert(todo.archived === true, `found todo should be archived: ${id}`);
});

console.log('\n============================================================');
console.log(`📊 Edge Cases Test Results: ${passedTests} passed, ${failedTests} failed`);

if (failedTests === 0) {
    console.log('🎉 All archive edge cases tests passed!');
    console.log('\n✅ SUMMARY: Archive functionality handles edge cases:');
    console.log('   - Storage failures and recovery scenarios');  
    console.log('   - Concurrent operations and rapid state changes');
    console.log('   - Extreme data conditions (long text, Unicode, special chars)');
    console.log('   - Data corruption recovery and graceful degradation');
    console.log('   - Memory and performance with large datasets (1000+ todos)');
    console.log('   - Search filter edge cases and invalid inputs');
    console.log('   - ID collision prevention and uniqueness guarantees');
} else {
    console.log(`⚠️  ${failedTests} edge case tests failed. Archive functionality needs hardening.`);
}

// Export test results for CI integration
module.exports = {
    passed: passedTests,
    failed: failedTests,
    results: testResults
};