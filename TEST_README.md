# AutoToDo Search Functionality Tests

This directory contains comprehensive unit tests for the search functionality implemented in the AutoToDo application.

## Test Files

### `search.test.js`
Command-line unit tests that can be run with Node.js. These tests cover:
- Search input handling (`handleSearch` method)
- Todo filtering (`filterTodos` method) 
- Case-insensitive search functionality
- State management during search operations
- Integration with CRUD operations
- Edge cases and special characters

### `test.html`
Browser-based unit tests with a visual interface. These tests provide:
- Interactive test runner in the browser
- Visual test results with pass/fail indicators
- Same comprehensive test coverage as the Node.js tests
- Real DOM interaction testing

## Running the Tests

### Command Line Tests
```bash
# Run tests using Node.js
npm test

# Or run directly
node search.test.js
```

### Browser Tests
```bash
# Open test.html in your browser
open test.html

# Or use the npm script
npm run test:browser
```

### Run All Tests
```bash
npm run test:all
```

## Test Coverage

The test suite covers the following scenarios:

### Search Input Handling
- ✅ Properly updates search query with lowercase and trimmed input
- ✅ Handles empty search queries
- ✅ Manages whitespace-only search inputs

### Todo Filtering
- ✅ Returns all todos when search is empty
- ✅ Filters todos based on search query
- ✅ Case-insensitive matching
- ✅ Partial text matching
- ✅ Returns empty array when no matches found
- ✅ Handles special characters in search
- ✅ Multi-word search queries
- ✅ Searches both completed and incomplete todos

### State Management
- ✅ Shows empty state when no todos exist
- ✅ Shows "no results" state when search has no matches
- ✅ Shows filtered todos when search has matches
- ✅ Maintains search context after CRUD operations
- ✅ Properly resets search state

### Integration Testing
- ✅ Search persists after toggling todo completion
- ✅ Search persists after deleting todos
- ✅ Search persists after editing todos
- ✅ Proper state transitions between different search states

## Test Architecture

The tests are designed to be:
- **Independent**: Each test can run in isolation
- **Comprehensive**: Cover all search functionality aspects
- **Fast**: Lightweight with no external dependencies
- **Maintainable**: Clear test names and assertions
- **Cross-platform**: Work in both Node.js and browser environments

## Adding New Tests

To add new tests, follow this pattern:

```javascript
testRunner.test('descriptive test name', function() {
    // Arrange
    const app = new TodoApp(true);
    app.addTodoForTest('Test todo');
    
    // Act
    app.handleSearch('test');
    
    // Assert
    this.assertEqual(app.searchQuery, 'test', 'Should set search query');
});
```

## Continuous Integration

These tests are designed to integrate easily with CI/CD pipelines:
- Exit code 0 for success, 1 for failure
- Clear console output for debugging
- No external dependencies required
- Fast execution time