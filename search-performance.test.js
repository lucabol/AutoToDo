/**
 * High-Performance Search Tests for AutoToDo Application
 * Tests search optimizations with large datasets (500+ todos) for Safari 14+
 */

console.log('🚀 Running AutoToDo Search Performance Tests...\n');

// Test configuration for large datasets
const LARGE_TEST_SIZES = [100, 250, 500, 750, 1000];
const SEARCH_QUERIES = [
    'meeting',
    'project work',
    'buy groceries',
    'call doctor appointment',
    'finish presentation slides',
    'review team performance',
    'update project documentation',
    'schedule follow-up meetings'
];

// Mock DOM environment for testing
function createMockDOM() {
    const mockElement = {
        innerHTML: '',
        style: { cssText: '' },
        appendChild: () => {},
        removeChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        getAttribute: () => null,
        setAttribute: () => {},
        removeAttribute: () => {},
        classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
        },
        getBoundingClientRect: () => ({ height: 300, width: 400 })
    };
    
    global.document = {
        createElement: () => mockElement,
        createDocumentFragment: () => mockElement,
        getElementById: () => mockElement,
        querySelector: () => mockElement,
        addEventListener: () => {},
        removeEventListener: () => {}
    };
    
    global.window = {
        addEventListener: () => {},
        removeEventListener: () => {},
        matchMedia: () => ({ matches: false, addEventListener: () => {} }),
        requestAnimationFrame: (cb) => setTimeout(cb, 16),
        performance: { now: () => Date.now() }
    };
    
    global.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
    };
    
    // Mock navigator for Safari detection
    global.navigator = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
}

// Generate test todos with realistic content
function generateTestTodos(count) {
    const todos = [];
    const templates = [
        'Buy groceries for dinner tonight',
        'Call the doctor to schedule appointment',
        'Finish the quarterly project report',
        'Review team performance metrics',
        'Update project documentation',
        'Schedule follow-up meeting with client',
        'Prepare presentation slides for tomorrow',
        'Fix the bug in search functionality',
        'Organize files in project folder',
        'Send email to team about deadline',
        'Complete code review for pull request',
        'Test the new feature implementation',
        'Write unit tests for the module',
        'Deploy changes to production server',
        'Backup important data files',
        'Update dependencies in package.json',
        'Refactor legacy code for better performance',
        'Create documentation for API endpoints',
        'Set up monitoring for application',
        'Optimize database queries for speed'
    ];
    
    for (let i = 0; i < count; i++) {
        const template = templates[i % templates.length];
        const variation = Math.floor(i / templates.length);
        const text = variation > 0 ? `${template} (task ${variation + 1})` : template;
        
        todos.push({
            id: `todo-${i}`,
            text: text,
            completed: Math.random() > 0.7,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return todos;
}

// Measure function execution time
function measureTime(fn, label = 'Operation') {
    const start = Date.now();
    const result = fn();
    const end = Date.now();
    const duration = end - start;
    console.log(`⏱️  ${label}: ${duration}ms`);
    return { result, duration };
}

// Test search performance
async function testSearchPerformance() {
    console.log('📊 Testing Search Performance Optimizations\n');
    
    const results = {
        linearSearch: {},
        optimizedSearch: {},
        cacheHitTimes: {},
        indexBuildTimes: {}
    };
    
    for (const size of LARGE_TEST_SIZES) {
        console.log(`\n🔍 Testing with ${size} todos:`);
        
        const todos = generateTestTodos(size);
        
        // Test with SearchOptimizer (optimized search)
        const optimizer = new SearchOptimizer({
            cacheSize: 100,
            indexThreshold: 50,
            fuzzySearch: true,
            debug: false
        });
        
        // Measure index build time
        const { duration: indexTime } = measureTime(() => {
            optimizer.setData(todos);
        }, `Index build for ${size} items`);
        results.indexBuildTimes[size] = indexTime;
        
        // Test optimized search performance
        const optimizedTimes = [];
        for (const query of SEARCH_QUERIES) {
            const { duration } = measureTime(() => {
                return optimizer.search(query);
            }, `Optimized search "${query}"`);
            optimizedTimes.push(duration);
        }
        results.optimizedSearch[size] = {
            average: optimizedTimes.reduce((a, b) => a + b, 0) / optimizedTimes.length,
            min: Math.min(...optimizedTimes),
            max: Math.max(...optimizedTimes)
        };
        
        // Test cache hit performance
        const cacheQuery = SEARCH_QUERIES[0];
        optimizer.search(cacheQuery); // Prime the cache
        const { duration: cacheHitTime } = measureTime(() => {
            return optimizer.search(cacheQuery);
        }, `Cache hit "${cacheQuery}"`);
        results.cacheHitTimes[size] = cacheHitTime;
        
        // Test linear search (fallback method)
        const linearTimes = [];
        for (const query of SEARCH_QUERIES) {
            const { duration } = measureTime(() => {
                const normalizedQuery = query.toLowerCase();
                return todos.filter(todo => {
                    const todoText = todo.text.toLowerCase();
                    const queryWords = normalizedQuery.split(' ');
                    if (queryWords.length === 1) {
                        return todoText.includes(normalizedQuery);
                    }
                    return queryWords.every(word => todoText.includes(word));
                });
            }, `Linear search "${query}"`);
            linearTimes.push(duration);
        }
        results.linearSearch[size] = {
            average: linearTimes.reduce((a, b) => a + b, 0) / linearTimes.length,
            min: Math.min(...linearTimes),
            max: Math.max(...linearTimes)
        };
    }
    
    return results;
}

// Test Safari-specific optimizations
async function testSafariOptimizations() {
    console.log('\n🧭 Testing Safari-Specific Optimizations\n');
    
    const optimizer = new SearchOptimizer({
        cacheSize: 100,
        indexThreshold: 50,
        fuzzySearch: true,
        debug: true
    });
    
    // Simulate Safari environment
    global.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15';
    
    const largeTodos = generateTestTodos(1000);
    optimizer.setData(largeTodos);
    
    console.log('🔧 Applying Safari optimizations...');
    optimizer.applySafariOptimizations();
    
    const stats = optimizer.getStats();
    console.log('📈 Safari optimization stats:', {
        dataSize: stats.dataSize,
        indexSize: stats.indexSize,
        cacheSize: stats.cacheSize,
        safariOptimizations: stats.safariOptimizations
    });
    
    // Test search performance with Safari optimizations
    const safariTimes = [];
    for (const query of SEARCH_QUERIES.slice(0, 5)) { // Test subset for Safari
        const { duration } = measureTime(() => {
            return optimizer.search(query);
        }, `Safari optimized search "${query}"`);
        safariTimes.push(duration);
    }
    
    return {
        averageTime: safariTimes.reduce((a, b) => a + b, 0) / safariTimes.length,
        optimizationsApplied: stats.safariOptimizations
    };
}

// Generate performance report
function generateReport(searchResults, safariResults) {
    console.log('\n📊 PERFORMANCE REPORT');
    console.log('='.repeat(50));
    
    console.log('\n🚀 Search Performance Comparison:');
    console.log('Dataset Size | Linear Avg | Optimized Avg | Improvement');
    console.log('-'.repeat(55));
    
    for (const size of LARGE_TEST_SIZES) {
        const linear = searchResults.linearSearch[size];
        const optimized = searchResults.optimizedSearch[size];
        const improvement = ((linear.average - optimized.average) / linear.average * 100).toFixed(1);
        
        console.log(`${size.toString().padStart(11)} | ${linear.average.toFixed(1).padStart(10)}ms | ${optimized.average.toFixed(1).padStart(13)}ms | ${improvement.padStart(10)}%`);
    }
    
    console.log('\n⚡ Cache Hit Performance:');
    console.log('Dataset Size | Cache Hit Time');
    console.log('-'.repeat(30));
    
    for (const size of LARGE_TEST_SIZES) {
        const cacheTime = searchResults.cacheHitTimes[size];
        console.log(`${size.toString().padStart(11)} | ${cacheTime.toString().padStart(13)}ms`);
    }
    
    console.log('\n🏗️  Index Build Times:');
    console.log('Dataset Size | Build Time');
    console.log('-'.repeat(25));
    
    for (const size of LARGE_TEST_SIZES) {
        const buildTime = searchResults.indexBuildTimes[size];
        console.log(`${size.toString().padStart(11)} | ${buildTime.toString().padStart(9)}ms`);
    }
    
    console.log('\n🧭 Safari 14+ Optimizations:');
    console.log(`Average search time: ${safariResults.averageTime.toFixed(1)}ms`);
    console.log(`Optimizations applied: ${safariResults.optimizationsApplied ? '✅' : '❌'}`);
    
    // Performance benchmarks
    console.log('\n🎯 Performance Benchmarks:');
    const largest = LARGE_TEST_SIZES[LARGE_TEST_SIZES.length - 1];
    const largestOptimized = searchResults.optimizedSearch[largest];
    
    console.log(`✅ Target: < 50ms search time for 1000+ todos`);
    console.log(`📊 Actual: ${largestOptimized.average.toFixed(1)}ms average search time`);
    console.log(`🎉 Status: ${largestOptimized.average < 50 ? 'PASSED' : 'NEEDS IMPROVEMENT'}`);
    
    console.log(`\n✅ Target: < 5ms cache hit time`);
    console.log(`📊 Actual: ${searchResults.cacheHitTimes[largest]}ms cache hit time`);
    console.log(`🎉 Status: ${searchResults.cacheHitTimes[largest] < 5 ? 'PASSED' : 'NEEDS IMPROVEMENT'}`);
}

// Run all tests
async function runTests() {
    try {
        createMockDOM();
        
        // Load required modules using require and make them globally available
        global.PerformanceUtils = require('./js/PerformanceUtils.js');
        
        // Make PerformanceUtils available in the global scope for SearchOptimizer
        global.window.PerformanceUtils = global.PerformanceUtils;
        
        const SearchOptimizer = require('./js/SearchOptimizer.js');
        global.SearchOptimizer = SearchOptimizer;
        
        console.log('🧪 AutoToDo Search Performance Test Suite');
        console.log('Target: 500+ todos on Safari 14+');
        console.log('=' .repeat(50));
        
        const searchResults = await testSearchPerformance();
        const safariResults = await testSafariOptimizations();
        
        generateReport(searchResults, safariResults);
        
        console.log('\n✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.code === 'ENOENT' || error.code === 'MODULE_NOT_FOUND') {
            console.error('Make sure all required files exist and are properly exported');
            console.error('Required files: js/PerformanceUtils.js, js/SearchOptimizer.js');
        } else {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = {
    generateTestTodos,
    testSearchPerformance,
    testSafariOptimizations
};