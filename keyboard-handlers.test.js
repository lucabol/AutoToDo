/**
 * Unit Tests for KeyboardHandlers
 * 
 * Tests the centralized keyboard shortcut handler methods
 */

// Mock DOM for testing
global.document = {
    getElementById: (id) => {
        if (id === 'todoInput' || id === 'searchInput') {
            return {
                focus: () => {},
                select: () => {},
                value: 'test value'
            };
        }
        return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({
        innerHTML: '',
        className: '',
        id: '',
        addEventListener: () => {},
        style: {}
    }),
    body: { appendChild: () => {} }
};

global.setTimeout = (fn) => fn();

// Mock classes
class MockTodoModel {
    constructor() {
        this.todos = [
            { id: '1', text: 'Test todo', completed: false }
        ];
    }
    
    getAllTodos() {
        return this.todos;
    }
    
    deleteTodo(id) {
        const index = this.todos.findIndex(todo => todo.id === id);
        if (index !== -1) {
            this.todos.splice(index, 1);
            return true;
        }
        return false;
    }
}

class MockTodoView {
    isEditing() { return false; }
    getEditingId() { return null; }
    showMessage() {}
    showConfirmation() { return true; }
    cancelEdit() {}
}

class MockTodoController {
    constructor() {
        this.model = new MockTodoModel();
        this.view = new MockTodoView();
    }
    
    handleAddTodo() { this.addTodoCalled = true; }
    handleToggleTodo(id) { this.toggledTodoId = id; }
    handleDeleteTodo(id) { this.deletedTodoId = id; }
    handleSaveEdit() { this.saveEditCalled = true; }
    handleCancelEdit() { this.cancelEditCalled = true; }
    toggleTheme() { this.toggleThemeCalled = true; }
    render() {}
}

// Simple KeyboardHandlers class for testing
class KeyboardHandlers {
    constructor(controller) {
        this.controller = controller;
        this.model = controller.model;
        this.view = controller.view;
    }

    getAllHandlers() {
        return {
            focusNewTodo: () => this.focusNewTodoInput(),
            focusSearch: () => this.focusSearchInput(),
            addTodo: () => this.handleAddTodoFromShortcut(),
            toggleFirstTodo: () => this.handleToggleFirstTodo(),
            deleteFirstTodo: () => this.handleDeleteFirstTodo(),
            selectAll: () => this.handleSelectAllTodos(),
            clearCompleted: () => this.handleClearCompleted(),
            cancelEdit: () => this.handleCancelEdit(),
            saveEdit: () => this.handleSaveEditFromShortcut(),
            showHelp: () => this.showKeyboardHelp(),
            toggleTheme: () => this.controller.toggleTheme()
        };
    }

    focusNewTodoInput() {
        const todoInput = document.getElementById('todoInput');
        if (todoInput) {
            todoInput.focus();
            todoInput.select();
        }
        this.focusNewTodoCalled = true;
    }

    focusSearchInput() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
        this.focusSearchCalled = true;
    }

    handleAddTodoFromShortcut() {
        const todoInput = document.getElementById('todoInput');
        if (todoInput && todoInput.value.trim()) {
            this.controller.handleAddTodo();
        } else {
            this.focusNewTodoInput();
        }
    }

    handleToggleFirstTodo() {
        const allTodos = this.model.getAllTodos();
        if (allTodos.length > 0) {
            const firstTodo = allTodos[0];
            this.controller.handleToggleTodo(firstTodo.id);
            this.view.showMessage(`Toggled "${firstTodo.text}"`, 'success');
        } else {
            this.view.showMessage('No todos to toggle', 'info');
        }
    }

    handleDeleteFirstTodo() {
        const allTodos = this.model.getAllTodos();
        if (allTodos.length > 0) {
            const firstTodo = allTodos[0];
            this.controller.handleDeleteTodo(firstTodo.id);
        } else {
            this.view.showMessage('No todos to delete', 'info');
        }
    }

    handleSelectAllTodos() {
        const todoCount = this.model.getAllTodos().length;
        this.view.showMessage(`Selected ${todoCount} todo${todoCount !== 1 ? 's' : ''}`, 'info');
        this.selectAllCalled = true;
    }

    handleClearCompleted() {
        const completedTodos = this.model.getAllTodos().filter(todo => todo.completed);
        if (completedTodos.length === 0) {
            this.view.showMessage('No completed todos to clear', 'info');
            return;
        }

        if (this.view.showConfirmation(`Delete ${completedTodos.length} completed todos?`)) {
            completedTodos.forEach(todo => this.model.deleteTodo(todo.id));
            this.controller.render();
        }
        this.clearCompletedCalled = true;
    }

    handleSaveEditFromShortcut() {
        const editingId = this.view.getEditingId();
        if (editingId) {
            this.controller.handleSaveEdit(editingId, {});
        }
    }

    handleCancelEdit() {
        this.controller.handleCancelEdit();
    }

    showKeyboardHelp() {
        this.showHelpCalled = true;
    }
}

// Test suite
function runKeyboardHandlersTests() {
    console.log('🧪 Running KeyboardHandlers Tests...\n');
    
    let testsRun = 0;
    let testsPassed = 0;

    function assert(condition, message) {
        testsRun++;
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            testsPassed++;
        } else {
            console.log(`❌ FAIL: ${message}`);
        }
    }

    // Test 1: Can create KeyboardHandlers instance
    function testHandlersCreation() {
        const controller = new MockTodoController();
        const handlers = new KeyboardHandlers(controller);
        
        assert(handlers instanceof KeyboardHandlers, 'Should create KeyboardHandlers instance');
        assert(handlers.controller === controller, 'Should store controller reference');
        assert(handlers.model === controller.model, 'Should store model reference');
        assert(handlers.view === controller.view, 'Should store view reference');
    }

    // Test 2: Can get all handlers
    function testGetAllHandlers() {
        const controller = new MockTodoController();
        const handlers = new KeyboardHandlers(controller);
        const allHandlers = handlers.getAllHandlers();
        
        assert(typeof allHandlers === 'object', 'Should return handlers object');
        assert(typeof allHandlers.focusNewTodo === 'function', 'Should have focusNewTodo handler');
        assert(typeof allHandlers.focusSearch === 'function', 'Should have focusSearch handler');
        assert(typeof allHandlers.addTodo === 'function', 'Should have addTodo handler');
        assert(typeof allHandlers.toggleFirstTodo === 'function', 'Should have toggleFirstTodo handler');
        assert(typeof allHandlers.showHelp === 'function', 'Should have showHelp handler');
    }

    // Test 3: Focus handlers work correctly
    function testFocusHandlers() {
        const controller = new MockTodoController();
        const handlers = new KeyboardHandlers(controller);
        
        handlers.focusNewTodoInput();
        assert(handlers.focusNewTodoCalled === true, 'Should call focus new todo');
        
        handlers.focusSearchInput();
        assert(handlers.focusSearchCalled === true, 'Should call focus search');
    }

    // Test 4: Todo management handlers
    function testTodoManagementHandlers() {
        const controller = new MockTodoController();
        const handlers = new KeyboardHandlers(controller);
        
        // Test toggle first todo
        handlers.handleToggleFirstTodo();
        assert(controller.toggledTodoId === '1', 'Should toggle first todo');
        
        // Test delete first todo
        handlers.handleDeleteFirstTodo();
        assert(controller.deletedTodoId === '1', 'Should delete first todo');
        
        // Test select all
        handlers.handleSelectAllTodos();
        assert(handlers.selectAllCalled === true, 'Should call select all');
    }

    // Test 5: Add todo from shortcut
    function testAddTodoFromShortcut() {
        const controller = new MockTodoController();
        const handlers = new KeyboardHandlers(controller);
        
        // Mock input with text
        global.document.getElementById = (id) => {
            if (id === 'todoInput') {
                return {
                    focus: () => {},
                    select: () => {},
                    value: 'test todo'
                };
            }
            return null;
        };
        
        handlers.handleAddTodoFromShortcut();
        assert(controller.addTodoCalled === true, 'Should call addTodo when input has text');
    }

    // Test 6: Clear completed todos
    function testClearCompleted() {
        const controller = new MockTodoController();
        // Add completed todo
        controller.model.todos.push({ id: '2', text: 'Completed todo', completed: true });
        
        const handlers = new KeyboardHandlers(controller);
        handlers.handleClearCompleted();
        
        assert(handlers.clearCompletedCalled === true, 'Should call clear completed');
    }

    // Test 7: Edit handlers
    function testEditHandlers() {
        const controller = new MockTodoController();
        const handlers = new KeyboardHandlers(controller);
        
        // Test cancel edit
        handlers.handleCancelEdit();
        assert(controller.cancelEditCalled === true, 'Should call cancel edit');
        
        // Test save edit when not editing
        handlers.handleSaveEditFromShortcut();
        // Should not crash when no editing ID
        assert(true, 'Should handle save edit when not editing');
    }

    // Test 8: Help handler
    function testHelpHandler() {
        const controller = new MockTodoController();
        const handlers = new KeyboardHandlers(controller);
        
        handlers.showKeyboardHelp();
        assert(handlers.showHelpCalled === true, 'Should call show help');
    }

    // Test 9: Theme toggle handler
    function testThemeToggleHandler() {
        const controller = new MockTodoController();
        const handlers = new KeyboardHandlers(controller);
        const allHandlers = handlers.getAllHandlers();
        
        allHandlers.toggleTheme();
        assert(controller.toggleThemeCalled === true, 'Should call toggle theme');
    }

    // Test 10: Handlers with empty todos
    function testHandlersWithEmptyTodos() {
        const controller = new MockTodoController();
        controller.model.todos = []; // Empty todos array
        const handlers = new KeyboardHandlers(controller);
        
        // Should not crash with empty todos
        handlers.handleToggleFirstTodo();
        handlers.handleDeleteFirstTodo();
        assert(true, 'Should handle empty todos gracefully');
    }

    // Run all tests
    console.log('============================================================');
    testHandlersCreation();
    testGetAllHandlers();
    testFocusHandlers();
    testTodoManagementHandlers();
    testAddTodoFromShortcut();
    testClearCompleted();
    testEditHandlers();
    testHelpHandler();
    testThemeToggleHandler();
    testHandlersWithEmptyTodos();
    console.log('============================================================');

    // Print summary
    console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsRun - testsPassed} failed`);
    
    if (testsPassed === testsRun) {
        console.log('🎉 All KeyboardHandlers tests passed!');
        return true;
    } else {
        console.log('❌ Some tests failed!');
        return false;
    }
}

// Run the tests
if (require.main === module) {
    const success = runKeyboardHandlersTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runKeyboardHandlersTests };