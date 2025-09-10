/**
 * Performance Test for Large Todo Lists
 * Tests the application performance with 500+ todos to identify optimization needs
 */

// Generate test data for performance testing
function generateLargeTodoDataset(count = 500) {
    const todos = [];
    const categories = ['Work', 'Personal', 'Shopping', 'Health', 'Learning', 'Travel', 'Home'];
    const priorities = ['high', 'medium', 'low'];
    
    for (let i = 1; i <= count; i++) {
        const category = categories[i % categories.length];
        const priority = priorities[i % priorities.length];
        
        todos.push({
            id: `todo-${i}`,
            text: `${category} Task ${i}: Complete important ${category.toLowerCase()} activity with ${priority} priority`,
            completed: Math.random() > 0.7, // 30% completed
            timestamp: Date.now() - (Math.random() * 86400000 * 30), // Random within last 30 days
            category: category,
            priority: priority
        });
    }
    
    return todos;
}

// Performance testing suite
class PerformanceTester {
    constructor() {
        this.results = {};
    }
    
    async testRenderPerformance(todoCount) {
        console.log(`\n🧪 Testing render performance with ${todoCount} todos...`);
        
        const todos = generateLargeTodoDataset(todoCount);
        const startTime = performance.now();
        
        try {
            // Create mock DOM elements for testing
            const todoList = document.createElement('ul');
            todoList.id = 'todoList';
            document.body.appendChild(todoList);
            
            const view = new TodoView();
            
            // Test rendering
            const renderStart = performance.now();
            view.render(todos, todos, '');
            const renderEnd = performance.now();
            
            const renderTime = renderEnd - renderStart;
            console.log(`   📊 Render time: ${renderTime.toFixed(2)}ms`);
            
            // Clean up
            document.body.removeChild(todoList);
            
            return {
                todoCount,
                renderTime,
                success: true
            };
            
        } catch (error) {
            console.error(`   ❌ Error during render test: ${error.message}`);
            return {
                todoCount,
                renderTime: -1,
                success: false,
                error: error.message
            };
        }
    }
    
    async testSearchPerformance(todoCount) {
        console.log(`\n🔍 Testing search performance with ${todoCount} todos...`);
        
        const todos = generateLargeTodoDataset(todoCount);
        const model = new TodoModel();
        model.todos = todos;
        
        const searchTerms = ['Work', 'important', 'Task 1', 'priority', 'Complete'];
        let totalSearchTime = 0;
        
        for (const term of searchTerms) {
            const searchStart = performance.now();
            const filtered = model.filterTodos(term);
            const searchEnd = performance.now();
            
            const searchTime = searchEnd - searchStart;
            totalSearchTime += searchTime;
            
            console.log(`   🔍 Search "${term}": ${searchTime.toFixed(2)}ms (${filtered.length} results)`);
        }
        
        const avgSearchTime = totalSearchTime / searchTerms.length;
        console.log(`   📊 Average search time: ${avgSearchTime.toFixed(2)}ms`);
        
        return {
            todoCount,
            avgSearchTime,
            totalSearchTime,
            success: true
        };
    }
    
    async testMemoryUsage(todoCount) {
        console.log(`\n💾 Testing memory usage with ${todoCount} todos...`);
        
        const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        // Create large dataset
        const todos = generateLargeTodoDataset(todoCount);
        
        // Simulate application usage
        const model = new TodoModel();
        model.todos = todos;
        
        const view = new TodoView();
        if (document.getElementById('todoList')) {
            view.render(todos, todos, '');
        }
        
        const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        const memoryIncrease = finalMemory - initialMemory;
        
        console.log(`   📊 Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        
        return {
            todoCount,
            memoryIncrease,
            success: true
        };
    }
    
    async testVirtualScrolling(todoCount) {
        console.log(`\n📜 Testing virtual scrolling with ${todoCount} todos...`);
        
        try {
            const container = document.createElement('div');
            document.body.appendChild(container);
            
            const virtualScroll = new VirtualScrollManager({
                container: container,
                itemHeight: 60,
                renderCallback: (item) => {
                    const div = document.createElement('div');
                    div.textContent = item.text;
                    return div;
                }
            });
            
            const todos = generateLargeTodoDataset(todoCount);
            
            const renderStart = performance.now();
            virtualScroll.setItems(todos);
            const renderEnd = performance.now();
            
            const renderTime = renderEnd - renderStart;
            console.log(`   📊 Virtual scroll render time: ${renderTime.toFixed(2)}ms`);
            
            // Clean up
            virtualScroll.destroy();
            document.body.removeChild(container);
            
            return {
                todoCount,
                virtualScrollRenderTime: renderTime,
                success: true
            };
            
        } catch (error) {
            console.error(`   ❌ Virtual scrolling test failed: ${error.message}`);
            return {
                todoCount,
                virtualScrollRenderTime: -1,
                success: false,
                error: error.message
            };
        }
    }
    
    async runComprehensiveTest() {
        console.log('🚀 Starting Comprehensive Performance Tests for AutoToDo\n');
        console.log('Testing performance issues when handling 500+ todos in Safari 14+\n');
        
        const testSizes = [100, 500, 1000, 2000];
        
        for (const size of testSizes) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📊 TESTING WITH ${size} TODOS`);
            console.log(`${'='.repeat(60)}`);
            
            this.results[size] = {};
            
            // Test render performance
            this.results[size].render = await this.testRenderPerformance(size);
            
            // Test search performance
            this.results[size].search = await this.testSearchPerformance(size);
            
            // Test memory usage (if supported)
            if (performance.memory) {
                this.results[size].memory = await this.testMemoryUsage(size);
            }
            
            // Test virtual scrolling
            this.results[size].virtualScroll = await this.testVirtualScrolling(size);
        }
        
        this.generateReport();
    }
    
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 PERFORMANCE OPTIMIZATION ANALYSIS REPORT');
        console.log('='.repeat(80));
        
        console.log('\n🎯 PERFORMANCE TARGETS FOR 500+ TODOS:');
        console.log('   • Render time: < 100ms');
        console.log('   • Search time: < 50ms');
        console.log('   • Memory usage: < 10MB increase');
        console.log('   • Virtual scrolling: < 50ms');
        
        console.log('\n📈 RESULTS:');
        
        Object.keys(this.results).forEach(size => {
            const result = this.results[size];
            console.log(`\n   ${size} todos:`);
            
            if (result.render) {
                const status = result.render.success && result.render.renderTime < 100 ? '✅' : '❌';
                console.log(`     ${status} Render: ${result.render.renderTime.toFixed(2)}ms`);
            }
            
            if (result.search) {
                const status = result.search.success && result.search.avgSearchTime < 50 ? '✅' : '❌';
                console.log(`     ${status} Search: ${result.search.avgSearchTime.toFixed(2)}ms avg`);
            }
            
            if (result.memory) {
                const memoryMB = result.memory.memoryIncrease / 1024 / 1024;
                const status = result.memory.success && memoryMB < 10 ? '✅' : '❌';
                console.log(`     ${status} Memory: ${memoryMB.toFixed(2)}MB`);
            }
            
            if (result.virtualScroll) {
                const status = result.virtualScroll.success && result.virtualScroll.virtualScrollRenderTime < 50 ? '✅' : '❌';
                console.log(`     ${status} Virtual Scroll: ${result.virtualScroll.virtualScrollRenderTime.toFixed(2)}ms`);
            }
        });
        
        console.log('\n💡 RECOMMENDATIONS:');
        
        // Analyze 500+ todo performance
        const large = this.results[500] || this.results[1000];
        if (large) {
            if (large.render && large.render.renderTime > 100) {
                console.log('   🔧 Implement virtual scrolling for render optimization');
            }
            if (large.search && large.search.avgSearchTime > 50) {
                console.log('   🔧 Implement debounced search with indexing');
            }
            if (large.memory && large.memory.memoryIncrease / 1024 / 1024 > 10) {
                console.log('   🔧 Implement object pooling and memory cleanup');
            }
            if (large.virtualScroll && !large.virtualScroll.success) {
                console.log('   🔧 Fix virtual scrolling implementation');
            }
        }
        
        console.log('\n🎯 Safari 14+ Specific Optimizations Needed:');
        console.log('   • Implement -webkit-transform for GPU acceleration');
        console.log('   • Use contain: layout style paint for performance isolation');
        console.log('   • Optimize DOM manipulation with requestAnimationFrame');
        console.log('   • Implement efficient memory management');
        
        console.log('\n' + '='.repeat(80));
    }
}

// Mock DOM environment for Node.js testing
function setupMockDOM() {
    if (typeof document === 'undefined') {
        // Simple DOM mocking for Node.js
        const mockElement = {
            innerHTML: '',
            style: { cssText: '' },
            appendChild: () => {},
            removeChild: () => {},
            querySelector: () => null,
            querySelectorAll: () => [],
            addEventListener: () => {},
            removeEventListener: () => {},
            getBoundingClientRect: () => ({ height: 300, width: 400 }),
            classList: {
                add: () => {},
                remove: () => {},
                contains: () => false
            },
            id: ''
        };
        
        global.document = {
            createElement: () => ({ ...mockElement }),
            createDocumentFragment: () => ({ ...mockElement }),
            getElementById: () => ({ ...mockElement }),
            querySelector: () => ({ ...mockElement }),
            addEventListener: () => {},
            removeEventListener: () => {},
            body: {
                appendChild: () => {},
                removeChild: () => {}
            }
        };
        
        global.window = {
            addEventListener: () => {},
            removeEventListener: () => {},
            matchMedia: () => ({ matches: false, addEventListener: () => {} }),
            requestAnimationFrame: (cb) => setTimeout(cb, 16)
        };
        
        global.performance = { 
            now: () => Date.now(),
            memory: {
                usedJSHeapSize: Math.random() * 1000000,
                totalJSHeapSize: 10000000,
                jsHeapSizeLimit: 20000000
            }
        };
        
        // Mock console if needed
        if (typeof console === 'undefined') {
            global.console = {
                log: (...args) => process.stdout.write(args.join(' ') + '\n'),
                error: (...args) => process.stderr.write(args.join(' ') + '\n')
            };
        }
    }
}

// Load required classes for Node.js environment
function loadRequiredClasses() {
    if (typeof require !== 'undefined') {
        try {
            const fs = require('fs');
            
            // Initialize storageManager first
            eval(fs.readFileSync('./js/StorageManager.js', 'utf8'));
            
            // Initialize global storageManager instance
            global.storageManager = new StorageManager();
            global.window.storageManager = global.storageManager;
            
            // Load other classes in dependency order
            eval(fs.readFileSync('./js/PerformanceUtils.js', 'utf8'));
            eval(fs.readFileSync('./js/VirtualScrollManager.js', 'utf8'));
            eval(fs.readFileSync('./js/TodoModel.js', 'utf8'));
            eval(fs.readFileSync('./js/TodoView.js', 'utf8'));
            
            console.log('✅ All required classes loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load required classes:', error.message);
            throw error;
        }
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PerformanceTester,
        generateLargeTodoDataset,
        setupMockDOM
    };
}

// Run tests if executed directly
if (typeof window !== 'undefined' || (typeof require !== 'undefined' && require.main === module)) {
    setupMockDOM();
    loadRequiredClasses();
    
    const tester = new PerformanceTester();
    tester.runComprehensiveTest().catch(console.error);
}