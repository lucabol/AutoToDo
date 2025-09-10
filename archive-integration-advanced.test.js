/**
 * Advanced Integration Tests for Archive Functionality
 * 
 * These tests cover complex interaction scenarios between archive functionality
 * and other features that may not be caught by individual unit tests.
 * Focus on edge cases, boundary conditions, and real-world usage patterns.
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

console.log('🧪 Running Advanced Archive Integration Tests...\n');

// Test 1: Archive During Active Search Session
console.log('--- Test 1: Archive Operations During Active Search ---');

const storage1 = new MockStorage();
const model1 = new TodoModel(storage1);

// Create test data that matches search terms
const searchTodo1 = model1.addTodo('JavaScript unit testing');
const searchTodo2 = model1.addTodo('JavaScript integration testing');
const searchTodo3 = model1.addTodo('CSS styling work');
const searchTodo4 = model1.addTodo('HTML accessibility audit');

// Complete some todos
model1.toggleTodo(searchTodo1.id);
model1.toggleTodo(searchTodo3.id);

// Test: Search for JavaScript todos, then archive one during search
let searchResults = model1.filterTodos('JavaScript', false);
assertEquals(searchResults.length, 2, 'should find 2 active JavaScript todos initially');

// Archive one of the search results
model1.archiveTodo(searchTodo1.id);

// Search again - should now find 1 active result
searchResults = model1.filterTodos('JavaScript', false);
assertEquals(searchResults.length, 1, 'should find 1 active JavaScript todo after archiving');

// Search with archived included - should find both again
searchResults = model1.filterTodos('JavaScript', true);
assertEquals(searchResults.length, 2, 'should find 2 JavaScript todos when including archived');

// Test: Multi-word search with archived todos
const multiWordResults = model1.filterTodos('JavaScript testing', true);
assertEquals(multiWordResults.length, 2, 'multi-word search should work with archived todos');

console.log('');

// Test 2: Archive and Unarchive Operations with Complex Filtering
console.log('--- Test 2: Complex Archive/Unarchive with Filtering ---');

const storage2 = new MockStorage();
const model2 = new TodoModel(storage2);

// Create mixed completion status todos
const todo1 = model2.addTodo('Important task A');
const todo2 = model2.addTodo('Important task B');
const todo3 = model2.addTodo('Regular task C');
const todo4 = model2.addTodo('Important task D');

// Mark some as completed
model2.toggleTodo(todo1.id);
model2.toggleTodo(todo3.id);

// Archive mix of completed and incomplete todos
model2.archiveTodo(todo1.id); // completed + archived
model2.archiveTodo(todo4.id); // incomplete + archived

// Test filtering behavior
let activeTodos = model2.getActiveTodos();
assertEquals(activeTodos.length, 2, 'should have 2 active todos');

let archivedTodos = model2.getArchivedTodos();
assertEquals(archivedTodos.length, 2, 'should have 2 archived todos');

// Test search across different states
let importantActive = model2.filterTodos('Important', false);
assertEquals(importantActive.length, 1, 'should find 1 active Important todo');

let importantAll = model2.filterTodos('Important', true);
assertEquals(importantAll.length, 3, 'should find 3 Important todos including archived');

// Unarchive a todo and verify search updates
model2.unarchiveTodo(todo4.id);
importantActive = model2.filterTodos('Important', false);
assertEquals(importantActive.length, 2, 'should find 2 active Important todos after unarchiving');

console.log('');

// Test 3: Bulk Archive Operations with Search Integration
console.log('--- Test 3: Bulk Archive with Search Integration ---');

const storage3 = new MockStorage();
const model3 = new TodoModel(storage3);

// Create multiple completed todos with different keywords
const completedTasks = [
    model3.addTodo('Completed project A documentation'),
    model3.addTodo('Completed project B testing'),
    model3.addTodo('Completed project C deployment'),
    model3.addTodo('Incomplete project D planning')
];

// Mark first 3 as completed
completedTasks.slice(0, 3).forEach(todo => model3.toggleTodo(todo.id));

// Test search before bulk archive
let projectResults = model3.filterTodos('project', false);
assertEquals(projectResults.length, 4, 'should find 4 project todos before archiving');

// Bulk archive completed todos
const archivedCount = model3.archiveCompleted();
assertEquals(archivedCount, 3, 'should archive 3 completed todos');

// Test search after bulk archive
projectResults = model3.filterTodos('project', false);
assertEquals(projectResults.length, 1, 'should find 1 active project todo after bulk archive');

// Test search with archived included
projectResults = model3.filterTodos('project', true);
assertEquals(projectResults.length, 4, 'should find all 4 project todos when including archived');

// Test specific keywords in archived todos
let completedResults = model3.filterTodos('Completed', true);
assertEquals(completedResults.length, 3, 'should find 3 Completed todos in archived search');

completedResults = model3.filterTodos('Completed', false);
assertEquals(completedResults.length, 0, 'should find 0 Completed todos in active-only search');

console.log('');

// Test 4: Archive Operations with Todo Editing States
console.log('--- Test 4: Archive Behavior with Todo Updates ---');

const storage4 = new MockStorage();
const model4 = new TodoModel(storage4);

// Create todos for editing tests
const editTodo1 = model4.addTodo('Original text');
const editTodo2 = model4.addTodo('Another task');

// Complete and archive first todo
model4.toggleTodo(editTodo1.id);
model4.archiveTodo(editTodo1.id);

// Test: Update text of archived todo
const updatedTodo = model4.updateTodo(editTodo1.id, 'Updated archived text');
assert(updatedTodo !== null, 'should be able to update archived todo text');
assertEquals(updatedTodo.text, 'Updated archived text', 'archived todo text should be updated');
assert(updatedTodo.archived === true, 'todo should remain archived after text update');

// Test: Toggle completion status of archived todo
const toggledTodo = model4.toggleTodo(editTodo1.id);
assert(toggledTodo !== null, 'should be able to toggle archived todo completion');
assert(toggledTodo.completed === false, 'archived todo should be marked incomplete');
assert(toggledTodo.archived === true, 'todo should remain archived after completion toggle');

// Test: Search for updated archived todo
let updatedSearchResults = model4.filterTodos('Updated', true);
assertEquals(updatedSearchResults.length, 1, 'should find updated archived todo in search');

updatedSearchResults = model4.filterTodos('Original', true);
assertEquals(updatedSearchResults.length, 0, 'should not find old text in archived todo search');

console.log('');

// Test 5: Edge Cases with Empty States and Boundary Conditions
console.log('--- Test 5: Edge Cases and Boundary Conditions ---');

const storage5 = new MockStorage();
const model5 = new TodoModel(storage5);

// Test bulk archive with no completed todos
let emptyArchivedCount = model5.archiveCompleted();
assertEquals(emptyArchivedCount, 0, 'should archive 0 todos when none completed');

// Test search on empty list
let emptySearchResults = model5.filterTodos('anything', false);
assertEquals(emptySearchResults.length, 0, 'should find 0 results searching empty list');

emptySearchResults = model5.filterTodos('anything', true);
assertEquals(emptySearchResults.length, 0, 'should find 0 results searching empty list with archived');

// Add one todo and archive it immediately
const singleTodo = model5.addTodo('Single task');
model5.toggleTodo(singleTodo.id);
model5.archiveTodo(singleTodo.id);

// Test edge case: all todos archived
let edgeActiveTodos = model5.getActiveTodos();
assertEquals(edgeActiveTodos.length, 0, 'should have 0 active todos when all archived');

let edgeArchivedTodos = model5.getArchivedTodos();
assertEquals(edgeArchivedTodos.length, 1, 'should have 1 archived todo');

// Test search when all todos archived
let archivedSearchResults = model5.filterTodos('Single', false);
assertEquals(archivedSearchResults.length, 0, 'should find 0 active results when all archived');

archivedSearchResults = model5.filterTodos('Single', true);
assertEquals(archivedSearchResults.length, 1, 'should find 1 archived result when including archived');

// Test unarchive the only todo
model5.unarchiveTodo(singleTodo.id);
edgeActiveTodos = model5.getActiveTodos();
assertEquals(edgeActiveTodos.length, 1, 'should have 1 active todo after unarchiving only todo');

console.log('');

// Test Summary
console.log('🎯 Advanced Integration Test Results:');
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
    console.log('\n🎉 All advanced integration tests passed!');
    process.exit(0);
}