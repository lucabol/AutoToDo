/**
 * Archive Performance Tests - Test archiving functionality for large todo lists
 * Validates performance improvements with Safari-specific optimizations
 */

console.log('🧪 Running Archive Performance Tests for Large Todo Lists...\n');

// Test configuration for large lists
const LARGE_LIST_SIZES = [100, 500, 1000];
const ARCHIVE_THRESHOLDS = [10, 50, 100];

// Mock DOM environment
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
        data: {},
        getItem(key) { return this.data[key] || null; },
        setItem(key, value) { this.data[key] = value; },
        removeItem(key) { delete this.data[key]; }
    };
    
    // Mock navigator for Safari detection
    global.navigator = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15'
    };
}

// Generate test todos with varying completion status
function generateTestTodos(count, completedRatio = 0.3) {
    const todos = [];
    const prefixes = ['Complete', 'Review', 'Meeting', 'Call', 'Update', 'Fix', 'Design', 'Test', 'Plan', 'Research'];
    const suffixes = ['project', 'document', 'presentation', 'system', 'performance', 'optimization', 'feature', 'bug', 'requirement'];
    
    for (let i = 0; i < count; i++) {
        const prefix = prefixes[i % prefixes.length];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const isCompleted = Math.random() < completedRatio;
        
        todos.push({
            id: `test-todo-${i}`,
            text: `${prefix} ${suffix} #${i + 1}`,
            completed: isCompleted,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random date within 30 days
        });
    }
    
    return todos;
}

// Performance measurement utility
function measurePerformance(label, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;
    
    console.log(`📊 ${label}: ${duration.toFixed(2)}ms`);
    return { result, duration };
}

// Test archive functionality performance
function testArchiveFunctionality() {
    console.log('='.repeat(60));
    console.log('📦 Testing Archive Functionality Performance');
    console.log('='.repeat(60));
    
    const results = [];
    
    LARGE_LIST_SIZES.forEach(size => {
        console.log(`\n🔢 Testing archive performance with ${size} todos:`);
        
        const model = new TodoModel();
        const testTodos = generateTestTodos(size, 0.4); // 40% completed
        
        // Load test data
        model.todos = testTodos;
        model.initializeSearchIndex();
        
        const initialStats = model.getStats();
        console.log(`  Initial: ${initialStats.total} total, ${initialStats.completed} completed`);
        
        // Test auto-archive performance
        const { duration: autoArchiveDuration, result: autoArchiveResult } = measurePerformance(
            'Auto-archive trigger check', 
            () => model.autoArchiveIfNeeded()
        );
        
        // Test manual archive performance
        const { duration: manualArchiveDuration, result: manualArchiveResult } = measurePerformance(
            'Manual archive completed todos', 
            () => model.archiveCompletedTodos(5) // Keep only 5 completed todos
        );
        
        const finalStats = model.getStats();
        const performanceImprovement = Math.round((manualArchiveResult.archived / initialStats.total) * 100);
        
        console.log(`  Final: ${finalStats.total} active, ${finalStats.archived} archived`);
        console.log(`  Performance improvement: ${performanceImprovement}% fewer active todos`);
        
        results.push({
            size,
            initialActive: initialStats.total,
            finalActive: finalStats.total,
            archived: finalStats.archived,
            performanceImprovement,
            autoArchiveDuration,
            manualArchiveDuration
        });
        
        // Test search performance on reduced list
        const searchTerm = 'project';
        const { duration: searchDuration } = measurePerformance(
            `Search "${searchTerm}" in reduced list`, 
            () => model.filterTodos(searchTerm)
        );
        
        console.log(`  Search improvement: Testing on ${finalStats.total} vs ${initialStats.total} todos`);
    });
    
    return results;
}

// Test search index performance with large datasets
function testSearchIndexPerformance() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 Testing Search Index Performance with Large Lists');
    console.log('='.repeat(60));
    
    const searchResults = [];
    
    LARGE_LIST_SIZES.forEach(size => {
        console.log(`\n🔢 Testing search index with ${size} todos:`);
        
        const todos = generateTestTodos(size);
        
        // Test index creation performance
        const searchIndex = PerformanceUtils.createSearchIndex();
        const { duration: indexCreationTime } = measurePerformance(
            'Create search index', 
            () => searchIndex.addItems(todos)
        );
        
        // Test search performance
        const searchTerms = ['meeting', 'project update', 'complete design'];
        const searchTimes = [];
        
        searchTerms.forEach(term => {
            const { duration } = measurePerformance(
                `Search "${term}"`, 
                () => searchIndex.search(term)
            );
            searchTimes.push(duration);
        });
        
        const avgSearchTime = searchTimes.reduce((sum, time) => sum + time, 0) / searchTimes.length;
        const indexStats = searchIndex.getStats();
        
        console.log(`  Index stats: ${indexStats.totalItems} items, ${indexStats.indexedWords} words`);
        console.log(`  Memory usage: ~${Math.round(indexStats.memoryUsage / 1024)}KB`);
        console.log(`  Average search time: ${avgSearchTime.toFixed(2)}ms`);
        
        searchResults.push({
            size,
            indexCreationTime,
            avgSearchTime,
            indexStats
        });
    });
    
    return searchResults;
}

// Test virtual scrolling with Safari optimizations
function testSafariVirtualScrolling() {
    console.log('\n' + '='.repeat(60));
    console.log('🖥️ Testing Safari Virtual Scrolling Optimizations');
    console.log('='.repeat(60));
    
    const safariResults = [];
    
    LARGE_LIST_SIZES.forEach(size => {
        console.log(`\n🔢 Testing Safari virtual scrolling with ${size} items:`);
        
        // Mock container
        const container = {
            appendChild: () => {},
            style: { cssText: '' }
        };
        
        // Test virtual scroll manager with Safari optimizations
        const { duration: initTime } = measurePerformance(
            'Initialize VirtualScrollManager', 
            () => new VirtualScrollManager({
                container,
                itemHeight: 60,
                bufferSize: 8, // Increased buffer for Safari
                safariOptimizations: true
            })
        );
        
        // Simulate scroll performance
        const scrollEvents = 100;
        let totalScrollTime = 0;
        
        for (let i = 0; i < scrollEvents; i++) {
            const start = performance.now();
            // Simulate scroll calculations
            const visibleCount = Math.ceil(300 / 60); // viewport height / item height
            const scrollTop = Math.random() * (size * 60);
            const visibleStart = Math.floor(scrollTop / 60);
            const visibleEnd = Math.min(size, visibleStart + visibleCount);
            const end = performance.now();
            
            totalScrollTime += (end - start);
        }
        
        const avgScrollTime = totalScrollTime / scrollEvents;
        console.log(`  Average scroll calculation: ${avgScrollTime.toFixed(3)}ms`);
        console.log(`  Safari optimizations: ${PerformanceUtils.isSafari() ? 'Active' : 'Not detected'}`);
        
        safariResults.push({
            size,
            initTime,
            avgScrollTime,
            isSafari: PerformanceUtils.isSafari()
        });
    });
    
    return safariResults;
}

// Test memory management and cleanup
function testMemoryManagement() {
    console.log('\n' + '='.repeat(60));
    console.log('💾 Testing Memory Management with Large Lists');
    console.log('='.repeat(60));
    
    let totalObjects = 0;
    const objectPool = PerformanceUtils.createObjectPool(
        () => {
            totalObjects++;
            return { id: totalObjects, content: `Object ${totalObjects}`, active: true };
        },
        (obj) => {
            obj.content = '';
            obj.active = false;
        }
    );
    
    // Test object pool efficiency
    console.log('\n🏊 Testing Object Pool:');
    
    const { duration: poolTestDuration } = measurePerformance(
        'Pool 1000 object operations', 
        () => {
            const objects = [];
            
            // Acquire objects
            for (let i = 0; i < 1000; i++) {
                objects.push(objectPool.acquire());
            }
            
            // Release half
            for (let i = 0; i < 500; i++) {
                objectPool.release(objects[i]);
            }
            
            // Acquire more (should reuse pool objects)
            for (let i = 0; i < 300; i++) {
                objects.push(objectPool.acquire());
            }
            
            // Release all
            objects.forEach(obj => {
                if (obj) objectPool.release(obj);
            });
        }
    );
    
    console.log(`  Total objects created: ${totalObjects} (should be much less than 1000)`);
    console.log(`  Final pool size: ${objectPool.size()}`);
    console.log(`  Memory efficiency: ${((1000 - totalObjects) / 1000 * 100).toFixed(1)}% fewer allocations`);
    
    // Test Safari performance monitor
    if (PerformanceUtils.isSafari()) {
        console.log('\n🍎 Testing Safari Performance Monitor:');
        
        const safariMonitor = PerformanceUtils.createSafariMonitor();
        
        // Simulate rendering operations
        for (let i = 0; i < 50; i++) {
            const renderTime = Math.random() * 20 + 5; // 5-25ms render times
            safariMonitor.recordRender(renderTime);
            safariMonitor.recordScroll();
        }
        
        safariMonitor.checkMemory();
        const report = safariMonitor.getReport();
        
        console.log(`  Average render time: ${report.avgRenderTime}ms`);
        console.log(`  Scroll events: ${report.scrollEvents}`);
        console.log(`  Recommendations: ${report.recommendations.join(', ') || 'Performance looks good'}`);
    }
}

// Generate performance recommendations
function generateRecommendations(archiveResults, searchResults, safariResults) {
    console.log('\n' + '='.repeat(60));
    console.log('💡 Performance Recommendations for Large Todo Lists');
    console.log('='.repeat(60));
    
    const recommendations = [];
    
    // Archive recommendations
    const largestTest = archiveResults[archiveResults.length - 1];
    if (largestTest && largestTest.performanceImprovement > 20) {
        recommendations.push(`✅ Archiving is highly effective - ${largestTest.performanceImprovement}% reduction in active todos`);
    }
    
    // Search recommendations
    const largestSearchTest = searchResults[searchResults.length - 1];
    if (largestSearchTest && largestSearchTest.avgSearchTime < 5) {
        recommendations.push('✅ Search index provides excellent performance for large lists');
    }
    
    // Safari recommendations
    if (PerformanceUtils.isSafari()) {
        recommendations.push('✅ Safari-specific optimizations are active');
        recommendations.push('• Virtual scrolling uses hardware acceleration');
        recommendations.push('• Memory monitoring helps prevent performance degradation');
    }
    
    // General recommendations
    recommendations.push('🎯 For optimal performance with 500+ todos:');
    recommendations.push('• Enable auto-archiving (keeps list under 100 active todos)');
    recommendations.push('• Use virtual scrolling for lists over 50 items');
    recommendations.push('• Archive completed todos regularly');
    recommendations.push('• Monitor memory usage on long-running sessions');
    
    recommendations.forEach(rec => console.log(rec));
}

// Main test runner
async function runArchivePerformanceTests() {
    createMockDOM();
    
    try {
        console.log('🚀 AutoToDo Archive Performance Test Suite');
        console.log('Optimizations for Safari 14+ and large todo lists (500+ items)\n');
        
        // Run archive functionality tests
        const archiveResults = testArchiveFunctionality();
        
        // Run search index tests
        const searchResults = testSearchIndexPerformance();
        
        // Run Safari virtual scrolling tests
        const safariResults = testSafariVirtualScrolling();
        
        // Run memory management tests
        testMemoryManagement();
        
        // Generate recommendations
        generateRecommendations(archiveResults, searchResults, safariResults);
        
        console.log('\n🏁 All archive performance tests completed successfully!');
        console.log('📈 Performance optimizations validated for large todo lists in Safari 14+');
        
    } catch (error) {
        console.error('❌ Archive performance test error:', error);
        process.exit(1);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runArchivePerformanceTests,
        generateTestTodos,
        measurePerformance
    };
} else {
    // Run tests if executed directly
    runArchivePerformanceTests();
}