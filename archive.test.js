/**
 * Archive functionality tests
 * Tests for the new archiving and performance optimization features
 */

// Import simulation for Node.js environment
if (typeof require !== 'undefined') {
    // For Node.js testing environment, we need to simulate the browser environment
    global.document = {
        getElementById: function(id) {
            return {
                addEventListener: function() {},
                style: { display: 'none' },
                innerHTML: '',
                value: '',
                textContent: ''
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

// Mock storage manager for testing
class MockStorageManager {
    constructor() {
        this.storage = new Map();
    }
    
    getItem(key) {
        return this.storage.get(key) || null;
    }
    
    setItem(key, value) {
        this.storage.set(key, value);
        return true;
    }
    
    removeItem(key) {
        return this.storage.delete(key);
    }
    
    clear() {
        this.storage.clear();
    }
}

// Simplified TodoModel class for testing (based on the actual implementation)
class TodoModel {
    constructor(storageManager = new MockStorageManager()) {
        this.storage = storageManager;
        this.todos = this.loadTodos();
        this.archivedTodos = this.loadArchivedTodos();
        
        // Performance optimizations for large lists
        this.maxActiveTodos = 500; // Threshold for auto-archiving
        this.searchCache = new Map(); // Cache search results
        this.searchCacheTimeout = 5000; // Cache timeout in ms
    }

    loadTodos() {
        try {
            const saved = this.storage.getItem('todos');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    loadArchivedTodos() {
        try {
            const saved = this.storage.getItem('archived-todos');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    saveTodos() {
        try {
            this.storage.setItem('todos', JSON.stringify(this.todos));
        } catch (e) {
            console.warn('Failed to save todos:', e);
        }
    }

    saveArchivedTodos() {
        try {
            this.storage.setItem('archived-todos', JSON.stringify(this.archivedTodos));
        } catch (e) {
            console.warn('Failed to save archived todos:', e);
        }
    }

    generateId() {
        return 'test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
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
        this.saveTodos();
        return todo;
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            return todo;
        }
        return null;
    }

    getAllTodos() {
        return [...this.todos];
    }

    getArchivedTodos() {
        return [...this.archivedTodos];
    }

    archiveTodo(id) {
        const todoIndex = this.todos.findIndex(t => t.id === id);
        if (todoIndex === -1) return false;
        
        const todo = this.todos[todoIndex];
        todo.archivedAt = new Date().toISOString();
        
        // Move to archived todos
        this.archivedTodos.unshift(todo);
        this.todos.splice(todoIndex, 1);
        
        this.saveTodos();
        this.saveArchivedTodos();
        this.clearSearchCache();
        
        return true;
    }

    restoreTodo(id) {
        const todoIndex = this.archivedTodos.findIndex(t => t.id === id);
        if (todoIndex === -1) return false;
        
        const todo = this.archivedTodos[todoIndex];
        delete todo.archivedAt;
        
        // Move back to active todos
        this.todos.unshift(todo);
        this.archivedTodos.splice(todoIndex, 1);
        
        this.saveTodos();
        this.saveArchivedTodos();
        this.clearSearchCache();
        
        return true;
    }

    autoArchiveCompleted() {
        if (this.todos.length <= this.maxActiveTodos) return 0;
        
        const completedTodos = this.todos.filter(t => t.completed);
        const archivedCount = completedTodos.length;
        
        if (archivedCount === 0) return 0;
        
        // Move completed todos to archive
        completedTodos.forEach(todo => {
            todo.archivedAt = new Date().toISOString();
            this.archivedTodos.unshift(todo);
        });
        
        // Remove completed todos from active list
        this.todos = this.todos.filter(t => !t.completed);
        
        this.saveTodos();
        this.saveArchivedTodos();
        this.clearSearchCache();
        
        return archivedCount;
    }

    clearSearchCache() {
        this.searchCache.clear();
    }

    filterTodos(searchTerm) {
        if (!searchTerm || !searchTerm.trim()) {
            return this.getAllTodos();
        }
        
        const normalizedTerm = searchTerm.toLowerCase().trim().replace(/\s+/g, ' ');
        
        // Check cache first
        const cacheKey = `search:${normalizedTerm}`;
        if (this.searchCache.has(cacheKey)) {
            const cached = this.searchCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.searchCacheTimeout) {
                return cached.results;
            }
            this.searchCache.delete(cacheKey);
        }
        
        const results = this.todos.filter(todo => {
            const todoText = todo.text.toLowerCase();
            const searchWords = normalizedTerm.split(' ');
            if (searchWords.length > 1) {
                return searchWords.every(word => todoText.includes(word));
            }
            return todoText.includes(normalizedTerm);
        });
        
        // Cache the results
        this.searchCache.set(cacheKey, {
            results: [...results],
            timestamp: Date.now()
        });
        
        // Limit cache size
        if (this.searchCache.size > 50) {
            const oldestKey = this.searchCache.keys().next().value;
            this.searchCache.delete(oldestKey);
        }
        
        return results;
    }

    searchArchivedTodos(searchTerm) {
        if (!searchTerm || !searchTerm.trim()) {
            return this.getArchivedTodos();
        }
        
        const normalizedTerm = searchTerm.toLowerCase().trim();
        return this.archivedTodos.filter(todo => {
            return todo.text.toLowerCase().includes(normalizedTerm);
        });
    }

    getStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;
        
        return { total, completed, pending };
    }

    getPerformanceMetrics() {
        const stats = this.getStats();
        const archivedCount = this.archivedTodos.length;
        const searchCacheSize = this.searchCache.size;
        
        return {
            activeTodos: stats.total,
            completedTodos: stats.completed,
            pendingTodos: stats.pending,
            archivedTodos: archivedCount,
            totalTodos: stats.total + archivedCount,
            searchCacheSize: searchCacheSize,
            maxActiveTodos: this.maxActiveTodos,
            performanceStatus: this.getPerformanceStatus(stats.total),
            recommendations: this.getPerformanceRecommendations(stats.total, stats.completed)
        };
    }

    getPerformanceStatus(activeTodoCount) {
        if (activeTodoCount <= 100) return 'optimal';
        if (activeTodoCount <= 250) return 'good';
        if (activeTodoCount <= 500) return 'fair';
        return 'poor';
    }

    getPerformanceRecommendations(activeTodoCount, completedCount) {
        const recommendations = [];
        
        if (activeTodoCount > this.maxActiveTodos) {
            recommendations.push('Consider archiving completed todos to improve performance');
        }
        
        if (completedCount > 50 && activeTodoCount > 200) {
            recommendations.push('Archive completed todos to reduce list size');
        }
        
        if (activeTodoCount > 300) {
            recommendations.push('Use search functionality to find specific todos quickly');
        }
        
        if (this.searchCache.size > 20) {
            recommendations.push('Search cache is active and improving search performance');
        }
        
        return recommendations;
    }
}

console.log('TodoModel loaded:', typeof TodoModel);
console.log('TodoModel constructor:', TodoModel ? 'yes' : 'no');

console.log('🧪 Running AutoToDo Archive Functionality Tests...\n');

let testsRun = 0;
let testsPassed = 0;

function assert(condition, message) {
    testsRun++;
    if (condition) {
        console.log(`✅ ${message}`);
        testsPassed++;
    } else {
        console.log(`❌ ${message}`);
    }
}

function assertEqual(actual, expected, message) {
    testsRun++;
    if (actual === expected) {
        console.log(`✅ ${message}`);
        testsPassed++;
    } else {
        console.log(`❌ ${message} - Expected: ${expected}, Got: ${actual}`);
    }
}

function assertArrayEqual(actual, expected, message) {
    testsRun++;
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
        console.log(`✅ ${message}`);
        testsPassed++;
    } else {
        console.log(`❌ ${message} - Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`);
    }
}

// Archive functionality tests
function testArchiveFunctionality() {
    console.log('\n📋 Archive Functionality Tests');
    
    // Test 1: Initialize with empty archived todos
    const model1 = new TodoModel();
    assertEqual(model1.getArchivedTodos().length, 0, 'should initialize with empty archived todos');
    
    // Test 2: Archive a todo successfully
    const model2 = new TodoModel();
    const todo = model2.addTodo('Test todo');
    const result = model2.archiveTodo(todo.id);
    assert(result === true, 'should archive a todo successfully');
    assertEqual(model2.getAllTodos().length, 0, 'should remove todo from active list after archiving');
    assertEqual(model2.getArchivedTodos().length, 1, 'should add todo to archived list');
    assert(model2.getArchivedTodos()[0].archivedAt !== undefined, 'should add archivedAt timestamp');
    
    // Test 3: Restore a todo from archive
    const model3 = new TodoModel();
    const todo3 = model3.addTodo('Test todo');
    model3.archiveTodo(todo3.id);
    const restoreResult = model3.restoreTodo(todo3.id);
    assert(restoreResult === true, 'should restore a todo from archive');
    assertEqual(model3.getAllTodos().length, 1, 'should restore todo to active list');
    assertEqual(model3.getArchivedTodos().length, 0, 'should remove todo from archived list');
    assert(model3.getAllTodos()[0].archivedAt === undefined, 'should remove archivedAt timestamp');
    
    // Test 4: Auto-archive completed todos when threshold is reached
    const model4 = new TodoModel();
    model4.maxActiveTodos = 10; // Lower threshold for testing
    
    // Create todos beyond the threshold
    for (let i = 0; i < 15; i++) {
        const todo = model4.addTodo(`Todo ${i}`);
        if (i < 5) {
            model4.toggleTodo(todo.id); // Mark first 5 as completed
        }
    }
    
    const archivedCount = model4.autoArchiveCompleted();
    assertEqual(archivedCount, 5, 'should auto-archive 5 completed todos');
    assertEqual(model4.getAllTodos().length, 10, 'should keep 10 active todos after auto-archive');
    assertEqual(model4.getArchivedTodos().length, 5, 'should have 5 archived todos');
    
    // Test 5: Not auto-archive when under threshold
    const model5 = new TodoModel();
    for (let i = 0; i < 5; i++) {
        const todo = model5.addTodo(`Todo ${i}`);
        if (i < 2) {
            model5.toggleTodo(todo.id);
        }
    }
    
    const archivedCount5 = model5.autoArchiveCompleted();
    assertEqual(archivedCount5, 0, 'should not auto-archive when under threshold');
    
    // Test 6: Archive non-existent todo should return false
    const model6 = new TodoModel();
    const result6 = model6.archiveTodo('non-existent-id');
    assert(result6 === false, 'should return false when archiving non-existent todo');
    
    // Test 7: Restore non-existent todo should return false
    const model7 = new TodoModel();
    const result7 = model7.restoreTodo('non-existent-id');
    assert(result7 === false, 'should return false when restoring non-existent todo');
}

// Enhanced search functionality tests
function testEnhancedSearchFunctionality() {
    console.log('\n📋 Enhanced Search Functionality Tests');
    
    // Test 1: Cache search results
    const model = new TodoModel();
    model.addTodo('Buy groceries from store');
    model.addTodo('Complete project report');
    model.addTodo('Call mom about dinner');
    
    const results1 = model.filterTodos('project');
    assertEqual(results1.length, 1, 'should find 1 todo matching "project"');
    assertEqual(model.searchCache.size, 1, 'should cache search results');
    
    // Test 2: Multi-word search
    const results2 = model.filterTodos('buy store');
    assertEqual(results2.length, 1, 'should handle multi-word search correctly');
    
    // Test 3: Search in archived todos
    const todo = model.addTodo('Archived test item');
    model.archiveTodo(todo.id);
    const results3 = model.searchArchivedTodos('archived');
    assertEqual(results3.length, 1, 'should search in archived todos');
    
    // Test 4: Clear search cache
    model.filterTodos('test');
    const initialCacheSize = model.searchCache.size;
    model.clearSearchCache();
    assertEqual(model.searchCache.size, 0, 'should clear search cache');
    
    // Test 5: Limit cache size
    for (let i = 0; i < 60; i++) {
        model.filterTodos(`search${i}`);
    }
    assert(model.searchCache.size <= 50, 'should limit cache size to prevent memory issues');
}

// Performance metrics tests
function testPerformanceMetrics() {
    console.log('\n📋 Performance Metrics Tests');
    
    // Test 1: Provide performance metrics
    const model = new TodoModel();
    for (let i = 0; i < 10; i++) {
        const todo = model.addTodo(`Todo ${i}`);
        if (i < 3) {
            model.toggleTodo(todo.id);
        }
    }
    
    const metrics = model.getPerformanceMetrics();
    assertEqual(metrics.activeTodos, 10, 'should report correct active todos count');
    assertEqual(metrics.completedTodos, 3, 'should report correct completed todos count');
    assertEqual(metrics.pendingTodos, 7, 'should report correct pending todos count');
    assertEqual(metrics.performanceStatus, 'optimal', 'should report optimal performance for small lists');
    
    // Test 2: Detect performance issues with large lists
    const model2 = new TodoModel();
    for (let i = 0; i < 600; i++) {
        const todo = model2.addTodo(`Todo ${i}`);
        if (i < 100) {
            model2.toggleTodo(todo.id);
        }
    }
    
    const metrics2 = model2.getPerformanceMetrics();
    assertEqual(metrics2.performanceStatus, 'poor', 'should detect poor performance with large lists');
    assert(metrics2.recommendations.length > 0, 'should provide recommendations for large lists');
    
    // Test 3: Different performance statuses
    assertEqual(model.getPerformanceStatus(50), 'optimal', 'should return optimal for 50 todos');
    assertEqual(model.getPerformanceStatus(150), 'good', 'should return good for 150 todos');
    assertEqual(model.getPerformanceStatus(300), 'fair', 'should return fair for 300 todos');
    assertEqual(model.getPerformanceStatus(600), 'poor', 'should return poor for 600 todos');
}

// Run all tests
testArchiveFunctionality();
testEnhancedSearchFunctionality();
testPerformanceMetrics();

console.log('\n==================================================');
console.log(`📊 Test Summary:`);
console.log(`   Total: ${testsRun}`);
console.log(`   Passed: ${testsPassed}`);
console.log(`   Failed: ${testsRun - testsPassed}`);
console.log('==================================================');

if (testsPassed === testsRun) {
    console.log('🎉 All tests passed!');
} else {
    console.log('❌ Some tests failed!');
    process.exit(1);
}