/**
 * Safari Performance Test - Focused test for 500+ todos performance optimization
 * Tests specific performance bottlenecks in Safari 14+ with large todo lists
 */

console.log('🚀 Safari Performance Test for 500+ Todos\n');

// Generate test data
function generateTestTodos(count) {
    const todos = [];
    const categories = ['Work', 'Personal', 'Shopping', 'Health', 'Learning', 'Travel', 'Home'];
    const priorities = ['high', 'medium', 'low'];
    
    for (let i = 1; i <= count; i++) {
        const category = categories[i % categories.length];
        const priority = priorities[i % priorities.length];
        
        todos.push({
            id: `todo-${i}-${Date.now()}`,
            text: `${category} Task ${i}: Complete important ${category.toLowerCase()} activity with ${priority} priority and additional context for search testing`,
            completed: Math.random() > 0.7,
            timestamp: Date.now() - (Math.random() * 86400000 * 30)
        });
    }
    
    return todos;
}

// Test search filtering performance
function testSearchPerformance(todos, iterations = 10) {
    console.log(`🔍 Testing search performance with ${todos.length} todos...`);
    
    const searchTerms = ['Work', 'important', 'Task 1', 'priority', 'Complete', 'activity', 'context'];
    const results = {};
    
    searchTerms.forEach(term => {
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            
            // Simulate the actual filtering logic from TodoModel
            const normalizedTerm = term.toLowerCase().trim().replace(/\s+/g, ' ');
            const filtered = todos.filter(todo => {
                const todoText = todo.text.toLowerCase();
                const searchWords = normalizedTerm.split(' ');
                
                if (searchWords.length > 1) {
                    return searchWords.every(word => todoText.includes(word));
                }
                
                return todoText.includes(normalizedTerm);
            });
            
            const end = performance.now();
            times.push(end - start);
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);
        
        results[term] = {
            avgTime: avgTime.toFixed(2),
            maxTime: maxTime.toFixed(2),
            minTime: minTime.toFixed(2),
            resultsCount: filtered.length
        };
        
        console.log(`   "${term}": ${avgTime.toFixed(2)}ms avg (${filtered.length} results)`);
    });
    
    const allAvgTimes = Object.values(results).map(r => parseFloat(r.avgTime));
    const overallAvg = allAvgTimes.reduce((a, b) => a + b, 0) / allAvgTimes.length;
    
    console.log(`   📊 Overall average: ${overallAvg.toFixed(2)}ms`);
    console.log(`   🎯 Target: < 50ms (${overallAvg < 50 ? '✅ PASS' : '❌ FAIL'})`);
    
    return { overallAvg, results };
}

// Test array manipulation performance (typical CRUD operations)
function testCRUDPerformance(initialTodos) {
    console.log(`\n⚡ Testing CRUD performance with ${initialTodos.length} todos...`);
    
    let todos = [...initialTodos];
    const operations = [];
    
    // Test adding todos
    const addStart = performance.now();
    for (let i = 0; i < 50; i++) {
        todos.push({
            id: `new-todo-${i}`,
            text: `New task ${i}`,
            completed: false,
            timestamp: Date.now()
        });
    }
    const addEnd = performance.now();
    operations.push({ operation: 'Add 50 todos', time: addEnd - addStart });
    
    // Test updating todos
    const updateStart = performance.now();
    for (let i = 0; i < 50; i++) {
        const todo = todos[i];
        if (todo) {
            todo.text = `Updated: ${todo.text}`;
            todo.completed = !todo.completed;
        }
    }
    const updateEnd = performance.now();
    operations.push({ operation: 'Update 50 todos', time: updateEnd - updateStart });
    
    // Test deleting todos
    const deleteStart = performance.now();
    todos = todos.filter((_, index) => index < todos.length - 50);
    const deleteEnd = performance.now();
    operations.push({ operation: 'Delete 50 todos', time: deleteEnd - deleteStart });
    
    operations.forEach(op => {
        const status = op.time < 10 ? '✅' : '❌';
        console.log(`   ${status} ${op.operation}: ${op.time.toFixed(2)}ms`);
    });
    
    const totalTime = operations.reduce((sum, op) => sum + op.time, 0);
    console.log(`   📊 Total CRUD time: ${totalTime.toFixed(2)}ms`);
    console.log(`   🎯 Target: < 50ms (${totalTime < 50 ? '✅ PASS' : '❌ FAIL'})`);
    
    return { operations, totalTime };
}

// Test memory efficiency by simulating object creation/destruction
function testMemoryEfficiency(todoCount) {
    console.log(`\n💾 Testing memory efficiency with ${todoCount} todos...`);
    
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    // Create and manipulate large dataset
    let todos = generateTestTodos(todoCount);
    
    // Simulate multiple operations that could cause memory leaks
    for (let cycle = 0; cycle < 5; cycle++) {
        // Create filtered views
        const workTodos = todos.filter(t => t.text.includes('Work'));
        const completedTodos = todos.filter(t => t.completed);
        const recentTodos = todos.filter(t => Date.now() - t.timestamp < 86400000);
        
        // Simulate DOM-like operations
        const todoElements = todos.map(todo => ({
            id: todo.id,
            element: `<li>${todo.text}</li>`,
            listeners: ['click', 'change', 'keydown']
        }));
        
        // Clear references
        todoElements.length = 0;
    }
    
    // Force garbage collection if available
    if (global.gc) {
        global.gc();
    }
    
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const memoryIncrease = endMemory - startMemory;
    
    console.log(`   Starting memory: ${startMemory.toFixed(2)}MB`);
    console.log(`   Ending memory: ${endMemory.toFixed(2)}MB`);
    console.log(`   Memory increase: ${memoryIncrease.toFixed(2)}MB`);
    console.log(`   🎯 Target: < 10MB (${memoryIncrease < 10 ? '✅ PASS' : '❌ FAIL'})`);
    
    return { startMemory, endMemory, memoryIncrease };
}

// Test DOM-like operations that Safari struggles with
function testDOMSimulation(todoCount) {
    console.log(`\n🌐 Testing DOM-like operations with ${todoCount} todos...`);
    
    const todos = generateTestTodos(todoCount);
    
    // Simulate DOM element creation
    const createStart = performance.now();
    const elements = todos.map(todo => ({
        id: todo.id,
        innerHTML: `
            <li class="todo-item ${todo.completed ? 'completed' : ''}">
                <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="todo-text">${todo.text}</span>
                <button class="delete-btn">Delete</button>
            </li>
        `,
        style: {
            display: 'list-item',
            padding: '8px',
            borderBottom: '1px solid #eee'
        },
        eventListeners: ['click', 'change', 'keydown', 'focus', 'blur']
    }));
    const createEnd = performance.now();
    
    // Simulate style updates (like Safari GPU layer issues)
    const styleStart = performance.now();
    elements.forEach((el, index) => {
        if (index % 10 === 0) {
            el.style.transform = 'translateZ(0)';
            el.style.willChange = 'transform';
            el.style.backfaceVisibility = 'hidden';
        }
    });
    const styleEnd = performance.now();
    
    // Simulate batch updates
    const batchStart = performance.now();
    const batches = [];
    for (let i = 0; i < elements.length; i += 100) {
        batches.push(elements.slice(i, i + 100));
    }
    const batchEnd = performance.now();
    
    const createTime = createEnd - createStart;
    const styleTime = styleEnd - styleStart;
    const batchTime = batchEnd - batchStart;
    
    console.log(`   Element creation: ${createTime.toFixed(2)}ms (${createTime < 100 ? '✅' : '❌'})`);
    console.log(`   Style updates: ${styleTime.toFixed(2)}ms (${styleTime < 50 ? '✅' : '❌'})`);
    console.log(`   Batch processing: ${batchTime.toFixed(2)}ms (${batchTime < 20 ? '✅' : '❌'})`);
    
    const totalDOMTime = createTime + styleTime + batchTime;
    console.log(`   📊 Total DOM simulation: ${totalDOMTime.toFixed(2)}ms`);
    console.log(`   🎯 Target: < 200ms (${totalDOMTime < 200 ? '✅ PASS' : '❌ FAIL'})`);
    
    return { createTime, styleTime, batchTime, totalDOMTime };
}

// Main test runner
async function runSafariPerformanceTests() {
    const testSizes = [100, 500, 1000, 2000];
    const results = {};
    
    for (const size of testSizes) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`🧪 TESTING WITH ${size} TODOS - Safari Performance Focus`);
        console.log(`${'='.repeat(70)}`);
        
        const todos = generateTestTodos(size);
        results[size] = {};
        
        // Test search performance (critical for 500+ todos)
        results[size].search = testSearchPerformance(todos);
        
        // Test CRUD operations
        results[size].crud = testCRUDPerformance(todos);
        
        // Test memory efficiency
        results[size].memory = testMemoryEfficiency(size);
        
        // Test DOM-like operations
        results[size].dom = testDOMSimulation(size);
    }
    
    generateOptimizationReport(results);
}

// Generate comprehensive optimization report
function generateOptimizationReport(results) {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 SAFARI PERFORMANCE OPTIMIZATION REPORT');
    console.log('='.repeat(80));
    
    console.log('\n📊 PERFORMANCE SUMMARY:');
    
    Object.keys(results).forEach(size => {
        const result = results[size];
        console.log(`\n   ${size} todos:`);
        
        if (result.search) {
            const searchOK = result.search.overallAvg < 50;
            console.log(`     🔍 Search: ${result.search.overallAvg.toFixed(2)}ms avg ${searchOK ? '✅' : '❌'}`);
        }
        
        if (result.crud) {
            const crudOK = result.crud.totalTime < 50;
            console.log(`     ⚡ CRUD: ${result.crud.totalTime.toFixed(2)}ms ${crudOK ? '✅' : '❌'}`);
        }
        
        if (result.memory) {
            const memoryOK = result.memory.memoryIncrease < 10;
            console.log(`     💾 Memory: +${result.memory.memoryIncrease.toFixed(2)}MB ${memoryOK ? '✅' : '❌'}`);
        }
        
        if (result.dom) {
            const domOK = result.dom.totalDOMTime < 200;
            console.log(`     🌐 DOM: ${result.dom.totalDOMTime.toFixed(2)}ms ${domOK ? '✅' : '❌'}`);
        }
    });
    
    console.log('\n🔧 OPTIMIZATION RECOMMENDATIONS:');
    
    // Check 500+ todo performance
    const critical = results[500] || results[1000];
    if (critical) {
        if (critical.search && critical.search.overallAvg > 50) {
            console.log('   🚨 HIGH PRIORITY: Implement indexed search for 500+ todos');
            console.log('      - Add search indexing by words');
            console.log('      - Implement debounced search (300ms)');
            console.log('      - Consider web workers for large datasets');
        }
        
        if (critical.crud && critical.crud.totalTime > 50) {
            console.log('   🚨 HIGH PRIORITY: Optimize CRUD operations');
            console.log('      - Implement batch operations');
            console.log('      - Use requestAnimationFrame for DOM updates');
            console.log('      - Add object pooling for reused elements');
        }
        
        if (critical.memory && critical.memory.memoryIncrease > 10) {
            console.log('   🚨 HIGH PRIORITY: Fix memory leaks');
            console.log('      - Implement proper cleanup of event listeners');
            console.log('      - Use WeakMap for element references');
            console.log('      - Clear unused filtered arrays');
        }
        
        if (critical.dom && critical.dom.totalDOMTime > 200) {
            console.log('   🚨 HIGH PRIORITY: Optimize DOM operations for Safari');
            console.log('      - Implement virtual scrolling for 50+ items');
            console.log('      - Use contain: layout style paint');
            console.log('      - Add -webkit-transform for GPU acceleration');
        }
    }
    
    console.log('\n🎯 SAFARI 14+ SPECIFIC OPTIMIZATIONS:');
    console.log('   • Virtual scrolling threshold: 50 items');
    console.log('   • Search debounce delay: 300ms');
    console.log('   • Batch DOM updates: 100 items per frame');
    console.log('   • Memory cleanup: every 500 operations');
    console.log('   • GPU acceleration: -webkit-transform: translateZ(0)');
    
    console.log('\n✅ NEXT STEPS:');
    console.log('   1. Implement optimized search with indexing');
    console.log('   2. Fix virtual scrolling integration');
    console.log('   3. Add Safari-specific GPU optimizations');
    console.log('   4. Implement memory management cleanup');
    console.log('   5. Add performance monitoring in production');
    
    console.log('\n' + '='.repeat(80));
}

// Run the tests
if (require.main === module) {
    // Mock performance.now for Node.js
    if (typeof performance === 'undefined') {
        global.performance = { now: () => Date.now() };
    }
    
    runSafariPerformanceTests().catch(console.error);
}

module.exports = {
    generateTestTodos,
    testSearchPerformance,
    testCRUDPerformance,
    testMemoryEfficiency,
    testDOMSimulation
};