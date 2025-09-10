# AutoToDo

A modern, feature-rich todo application built with vanilla JavaScript. AutoToDo provides a clean, intuitive interface for managing your tasks with full keyboard navigation support and persistent local storage.

## Installation

AutoToDo is a simple, self-contained web application that runs entirely in your browser. No server setup or package installation required!

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge, or any browser with JavaScript support)
- No additional software or dependencies needed

### Quick Start

#### Option 1: Download and Run Locally
1. **Download the repository:**
   - Click the green "Code" button on the GitHub repository page
   - Select "Download ZIP" and extract the files to your desired location
   - Or clone using Git:
     ```bash
     git clone https://github.com/lucabol/AutoToDo.git
     cd AutoToDo
     ```

2. **Open the app:**
   - Navigate to the downloaded/cloned folder
   - Double-click on `index.html` to open it in your default browser
   - Or right-click `index.html` and select "Open with" → your preferred browser

#### Option 2: Run with Local Server (Recommended)
For the best experience and to avoid potential browser security restrictions:

1. **Using Python (if installed):**
   ```bash
   cd AutoToDo
   python -m http.server 8000
   ```
   Then open http://localhost:8000 in your browser

2. **Using Node.js (if installed):**
   ```bash
   cd AutoToDo
   npx http-server -p 8000
   ```
   Then open http://localhost:8000 in your browser

3. **Using any other local server of your choice**

### Browser Compatibility

**Fully Supported (Recommended):**
- ✅ Chrome 60+ (includes localStorage, ES6 classes, CSS Grid)
- ✅ Firefox 55+ (includes CSS Grid and modern JavaScript)
- ✅ Safari 11+ (includes CSS Grid, note: localStorage restrictions in private mode)
- ✅ Edge 16+ (modern Edge with Chromium engine)
- ✅ Most modern mobile browsers (iOS 11+, Android Chrome 60+)

**Limited Support:**
- ⚠️ Internet Explorer 11: Basic functionality works, but CSS Grid may have issues
- ⚠️ Safari 9-10: Works but lacks CSS Grid support
- ⚠️ Older mobile browsers: May have touch interaction or CSS issues

**Minimum Requirements:**
- JavaScript ES6 class support
- localStorage API
- Modern DOM APIs (querySelector, addEventListener)
- CSS Flexbox support (fallback for Grid)

### Data Storage
Your todos are automatically saved in your browser's local storage. Data persists between sessions but is specific to the browser and domain where you run the app.

### Troubleshooting

#### Common Browser Compatibility Issues

##### 1. Application Loading Problems
- **App doesn't load properly when opened directly:** 
  - Try using a local server (Option 2) instead of opening the file directly
  - Modern browsers block certain features when files are opened via `file://` protocol
  - If you must open directly, try different browsers (Chrome/Edge are more restrictive than Firefox)

- **JavaScript errors on page load:**
  - Check if your browser supports ES6 classes (Chrome 49+, Firefox 45+, Safari 9+)
  - Update your browser to the latest version
  - Check browser console (F12) for specific error messages

##### 2. Data Storage Issues
- **Todos don't save or disappear after closing browser:**
  - Ensure your browser allows localStorage and you're not in private/incognito mode
  - Check if storage quota is exceeded (clear browser data if needed)
  - In Safari, enable "Prevent cross-site tracking" settings may interfere with localStorage
  - Some corporate firewalls or security software may block localStorage

- **Data loss in Safari:**
  - Safari may clear localStorage more aggressively in private browsing
  - Ensure "Prevent cross-site tracking" is configured properly
  - Try disabling "Block all cookies" in Safari preferences

##### 3. CSS Rendering Problems
- **Layout appears broken or elements are misaligned:**
  - Ensure your browser supports CSS Grid (IE 11 uses older syntax)
  - Check Flexbox support for older browsers (IE 10+, Android 4.1+)
  - Update to a modern browser version for best results

- **Mobile display issues:**
  - Ensure viewport meta tag is working (should be automatic)
  - Try rotating device orientation if layout seems cramped
  - Some older mobile browsers may not support modern CSS features

- **Font rendering problems:**
  - System fonts (-apple-system, etc.) may not load properly on older systems
  - Font fallback should work automatically, but update your OS for best results

##### 4. Security and CORS Issues
- **Mixed content warnings:**
  - Occurs when running HTTPS sites that load HTTP resources
  - Use local server or ensure all resources use the same protocol

- **File access restrictions:**
  - Some browsers prevent file:// protocol from accessing certain features
  - Use a local server (see installation options) for full functionality

##### 5. Mobile Browser Specific Issues
- **Touch interactions not working:**
  - Ensure JavaScript is enabled on mobile browser
  - Some mobile browsers may have different event handling

- **iOS Safari specific problems:**
  - Viewport scaling issues: try adding to homescreen for app-like experience
  - LocalStorage may be limited in Private Browsing mode

##### 6. Performance Issues
- **App feels slow or unresponsive:**
  - Clear browser cache and cookies
  - Ensure sufficient device memory is available
  - Try closing other browser tabs to free up resources

#### Browser-Specific Solutions

**For Internet Explorer 11:**
- CSS Grid features may not work properly
- Consider using a modern browser for best experience

**For Chrome/Chromium:**
- If local files don't work, start Chrome with `--allow-file-access-from-files` flag (not recommended for security)
- Better solution: use local server as described in installation

**For Firefox:**
- Generally more permissive with local file access
- Check `privacy.file_unique_origin` setting if issues persist

**For Safari:**
- Check "Develop" menu for JavaScript errors
- localStorage restrictions are common in private browsing

#### Getting Help
If you continue experiencing issues:
1. Check the browser console (F12 → Console tab) for error messages
2. Try the app in a different browser to isolate the problem
3. Ensure you're using a supported browser version (see Browser Compatibility section)
4. Use the local server installation method for the most reliable experience

## Features

- ✅ **Task Management**: Create, edit, and delete todos with a clean interface
- ✅ **Smart Search**: Real-time filtering with instant results as you type
- ✅ **Completion Tracking**: Mark tasks as completed with visual feedback
- ✅ **Data Persistence**: Automatic saving using browser's localStorage
- ✅ **Keyboard Navigation**: Complete keyboard support for power users
- ✅ **Responsive Design**: Works seamlessly on desktop and mobile devices
- ✅ **Theme Support**: Light and dark mode toggle for comfortable viewing
- ✅ **Accessibility**: Screen reader compatible with proper ARIA labels

## How to Use

**Getting Started:**
1. Open `index.html` in a web browser
2. Add new todos using the input field at the top
3. Use the search field to filter todos by keywords
4. Click checkboxes to mark todos as completed
5. Use Edit buttons to modify todo text
6. Use Delete buttons to remove todos (with confirmation)

**Pro Tips:**
- Press **Ctrl+H** to see all available keyboard shortcuts
- Use **Ctrl+N** to quickly add new todos without clicking
- Use **/** to instantly jump to search and filter your tasks
- Enable dark mode with **Ctrl+M** for comfortable night usage

## Keyboard Shortcuts

AutoToDo features a comprehensive keyboard shortcut system designed for efficient task management. All shortcuts are context-aware and work intelligently based on your current activity.

### How to Access Keyboard Shortcuts in the Application

AutoToDo provides multiple ways to access and view available keyboard shortcuts directly within the application:

#### Built-in Help Dialog
- **Primary access**: Press **Ctrl+H** at any time to open the comprehensive shortcuts reference dialog
- **Alternative access**: Press **?** (question mark) for quick help access
- **Traditional help**: Press **F1** (standard help key across applications)

#### Help Dialog Features
The built-in help system provides:
- **Categorized shortcuts** - All shortcuts organized by function (Navigation, Todo Management, etc.)
- **Visual key representations** - Clear display of key combinations with proper formatting
- **Context information** - Which shortcuts work in different application states (global vs. editing mode)
- **Real-time availability** - Dialog shows only shortcuts that are currently relevant
- **Accessible design** - Full keyboard navigation and screen reader compatibility

#### Quick Discovery Tips
- **Visual indicators**: Look for subtle focus outlines when using Tab navigation
- **Status feedback**: Many shortcuts provide immediate visual or audio feedback when triggered
- **Progressive discovery**: Start with basic shortcuts (Ctrl+N, Ctrl+F) and gradually learn advanced combinations

> **💡 Pro Tip**: The help dialog remains accessible even when editing todos - press **Ctrl+H** anytime to reference shortcuts without losing your work.

### Navigation Shortcuts
These shortcuts help you move between different parts of the application:

- **Ctrl+N** - Focus the new todo input field
  - *Use this to quickly start adding a new task without reaching for your mouse*
- **Ctrl+F** - Focus the search input field  
  - *Perfect for filtering through large lists of todos*
- **/** - Alternative shortcut to focus search field
  - *Quick single-key access to search - just like modern web apps*
- **Tab** / **Shift+Tab** - Navigate between interactive elements
  - *Standard navigation for accessibility and keyboard-only operation*

### Todo Management Shortcuts
Efficiently manage your tasks with these powerful shortcuts:

- **Ctrl+Enter** - Add new todo (when input field has focus)
  - *After typing your task, save it instantly without clicking the add button*
- **Enter** in "What needs to be done?" field - Add todo and stay focused
  - *Perfect for rapid task entry - add multiple todos in succession*
- **Ctrl+T** - Toggle completion status of the first todo item
  - *Quickly mark your top priority task as complete*
- **Ctrl+Delete** - Delete the first todo item (with confirmation)
  - *Remove completed or unwanted tasks from the top of your list*
- **Ctrl+A** - Select all todos (provides visual feedback)
  - *Highlight all tasks to see the full scope of your work*
- **Ctrl+Shift+D** - Clear all completed todos at once
  - *Batch cleanup to remove all finished tasks and declutter your list*

### Editing Mode Shortcuts
When editing a todo item, these shortcuts become available:

- **Escape** - Cancel editing and discard changes
  - *Back out of an edit without saving if you change your mind*
- **Ctrl+S** - Save changes and exit edit mode
  - *Quick save for when you want to keep your hands on the keyboard*
- **Enter** - Save changes and exit edit mode (alternative)
  - *Standard way to confirm your edits*
- **Ctrl+A** - Select all text in edit field
  - *Quickly select everything to replace the entire todo text*

### General Application Shortcuts
Application-wide shortcuts for enhanced usability:

- **Ctrl+H** - Show keyboard shortcuts help dialog
  - *Access the complete, categorized list of all available shortcuts*
- **?** - Show help dialog (alternative shortcut)
  - *Quick help access with a single key press*
- **F1** - Show help dialog (traditional help key)
  - *Standard help key familiar to all computer users*
- **Ctrl+M** - Toggle between light and dark themes
  - *Switch themes instantly for comfortable viewing in any lighting*

### Search and Filtering
Enhanced search capabilities for managing large todo lists:

- **Real-time search** - Results appear instantly as you type
- **Ctrl+A** in search field - Select all search text
  - *Quickly clear and replace your search terms*
- **Backspace** / **Delete** - Clear search characters
- **Enter** in search field - Apply search filter
  - *Confirm your search query (though filtering happens automatically)*

### Standard Text Editing
All standard browser text editing shortcuts work within input fields:

- **Ctrl+C** / **Ctrl+V** - Copy and paste text
- **Home** / **End** - Move cursor to beginning/end of text
- **Ctrl+Left/Right** - Move cursor by word
- **Shift+Arrow keys** - Select text while moving cursor

### Accessibility Features

AutoToDo is designed to be fully accessible for all users:

- **Complete keyboard-only operation** - Every feature accessible without a mouse
- **Tab navigation** - All interactive elements are reachable via **Tab** key
- **Clear focus indicators** - Visual feedback shows which element is currently active
- **Screen reader compatible** - Proper ARIA labels and semantic HTML structure
- **Context-aware shortcuts** - Shortcuts only work when relevant (e.g., edit mode shortcuts only during editing)
- **High contrast support** - Both light and dark themes provide excellent readability

### Workflow Examples for Power Users

**Daily Task Review Workflow:**
1. Press **Ctrl+F** to focus search
2. Type "urgent" to filter high-priority tasks
3. Use **Ctrl+T** to mark the first urgent task as complete
4. Press **Ctrl+Shift+D** to clear all completed tasks
5. Press **Ctrl+N** to add new tasks for tomorrow

**Rapid Task Entry Workflow:**
1. Press **Ctrl+N** to focus the input field
2. Type your first task and press **Enter**
3. Continue typing additional tasks, pressing **Enter** after each
4. Use **Ctrl+M** to switch to dark mode for evening planning sessions

### Developer Customization

AutoToDo's keyboard shortcut system is built with extensibility in mind. Developers can customize or add new shortcuts by modifying the `ShortcutsConfig.js` file.

#### Architecture Overview

The shortcut system consists of three main components:

- **`ShortcutsConfig.js`** - Centralized configuration for all keyboard shortcuts
- **`KeyboardShortcutManager.js`** - Event handling and context management
- **Built-in validation** - Prevents conflicts with system shortcuts

#### Adding Custom Shortcuts

To add new shortcuts, modify the `getShortcuts()` method in `ShortcutsConfig.js`. Here's a comprehensive guide with detailed examples:

##### Example 1: Simple Global Shortcut
Add a shortcut to show application statistics:

```javascript
// 1. First, define your handler function in the appropriate class
class TodoController {
    showStats() {
        const completed = this.model.todos.filter(todo => todo.completed).length;
        const total = this.model.todos.length;
        alert(`Statistics: ${completed}/${total} todos completed`);
    }
}

// 2. Add the shortcut configuration in ShortcutsConfig.js
{
    key: 'i',                    // Press 'i' key
    ctrlKey: true,               // With Ctrl modifier
    context: 'global',           // Available everywhere
    action: showStats,           // Reference to your handler function
    preventDefault: true,        // Prevent browser default behavior
    description: 'Show todo statistics (Ctrl+I)',
    category: 'General'          // Group in help dialog
}

// 3. Register the handler in KeyboardShortcutManager.js
const handlers = {
    // ... existing handlers
    showStats: () => this.todoController.showStats()
};
```

##### Example 2: Context-Aware Shortcut
Add a shortcut that only works when searching:

```javascript
// 1. Create a custom context and handler
{
    key: 'Enter',
    shiftKey: true,              // Shift+Enter combination
    context: 'searching',        // Custom context
    action: advancedSearch,      // Your custom search function
    preventDefault: true,
    description: 'Advanced search mode (Shift+Enter)',
    category: 'Search & Filtering'
}

// 2. Update context management in KeyboardShortcutManager.js
updateContext() {
    if (document.activeElement === this.searchInput && this.searchInput.value.length > 0) {
        this.currentContext = 'searching';
    } else if (this.isEditing) {
        this.currentContext = 'editing';
    } else {
        this.currentContext = 'global';
    }
}
```

##### Example 3: Multi-Key Combination
Add a complex shortcut with multiple modifiers:

```javascript
{
    key: 'e',
    ctrlKey: true,
    shiftKey: true,
    altKey: true,                // Ctrl+Shift+Alt+E
    context: 'global',
    action: exportTodos,
    preventDefault: true,
    description: 'Export all todos (Ctrl+Shift+Alt+E)',
    category: 'Data Management'
}
```

##### Example 4: Function Key Shortcut
Add a function key for quick actions:

```javascript
{
    key: 'F3',                   // Function key
    context: 'global',
    action: focusNextTodo,
    preventDefault: true,
    description: 'Focus next todo (F3)',
    category: 'Navigation'
}
```

##### Step-by-Step Integration Process

1. **Plan Your Shortcut**: Define what action it should perform and when it should be available
2. **Check for Conflicts**: Use the validation rules to ensure no conflicts with existing shortcuts
3. **Implement the Handler**: Add the function to the appropriate controller class
4. **Add Configuration**: Insert the shortcut object in the `getShortcuts()` array
5. **Register Handler**: Add the handler to the handlers object in KeyboardShortcutManager.js
6. **Test Functionality**: Verify the shortcut works in all expected contexts
7. **Update Help Dialog**: Ensure your shortcut appears in the built-in help (automatic with proper category)
8. **Document Usage**: Add examples to user documentation if needed

#### Shortcut Configuration Properties

- **`key`** - The keyboard key (case-sensitive)
- **`ctrlKey`** - Whether Ctrl modifier is required (boolean)
- **`shiftKey`** - Whether Shift modifier is required (boolean)
- **`altKey`** - Whether Alt modifier is required (boolean)
- **`context`** - When the shortcut is active: `'global'`, `'editing'`, or custom
- **`action`** - Function to execute when shortcut is triggered
- **`preventDefault`** - Whether to prevent default browser behavior (boolean)
- **`description`** - Human-readable description for help dialog
- **`category`** - Group for organizing shortcuts in help dialog

#### Context Management

Shortcuts can be context-aware:

- **`global`** - Available anywhere in the application
- **`editing`** - Only available when editing a todo item
- **Custom contexts** - Define your own contexts for specific UI states

#### Validation and Conflict Prevention

The system includes built-in validation to prevent conflicts:

- **Reserved system keys** - Avoids overriding browser shortcuts like F5 (refresh)
- **Common modifier combinations** - Warns about potential conflicts with standard shortcuts
- **Maximum shortcuts per context** - Prevents excessive shortcut definitions

##### Validation Example
```javascript
// Before adding a new shortcut, check against reserved keys
const validationRules = ShortcutsConfig.getValidationRules();

// Check if your shortcut conflicts with system shortcuts
const newShortcut = { key: 's', ctrlKey: true };
const hasConflict = validationRules.systemShortcuts.some(reserved => 
    reserved.key === newShortcut.key && reserved.ctrlKey === newShortcut.ctrlKey
);

if (hasConflict) {
    console.warn('Shortcut conflicts with system shortcut');
    // Choose a different key combination
}
```

##### Testing Your Custom Shortcuts
```javascript
// 1. Unit test for shortcut configuration
function testShortcutConfig() {
    const shortcuts = ShortcutsConfig.getShortcuts(mockHandlers);
    const myShortcut = shortcuts.find(s => s.key === 'i' && s.ctrlKey);
    assert(myShortcut, 'Custom shortcut should be registered');
    assert(myShortcut.action === mockHandlers.showStats, 'Handler should match');
}

// 2. Integration test for keyboard events
function testShortcutExecution() {
    const event = new KeyboardEvent('keydown', {
        key: 'i',
        ctrlKey: true,
        bubbles: true
    });
    
    document.dispatchEvent(event);
    // Verify your action was executed
}
```

For detailed implementation examples, refer to the existing shortcuts in `ShortcutsConfig.js`.

### Community Contributions

We welcome community contributions to enhance AutoToDo's keyboard shortcut system. Here's how you can contribute:

#### Proposing New Shortcuts

**Before Contributing:**
1. **Check existing shortcuts** - Review current shortcuts to avoid conflicts
2. **Follow conventions** - Use standard modifier key patterns (Ctrl+Key for global actions)
3. **Consider accessibility** - Ensure shortcuts work with screen readers and assistive technologies
4. **Test cross-platform** - Verify shortcuts work on Windows, Mac, and Linux

**Contribution Guidelines:**

##### 1. Shortcut Design Principles
- **Intuitive**: Use mnemonic keys where possible (Ctrl+S for Save, Ctrl+F for Find)
- **Consistent**: Follow established patterns in the application
- **Non-conflicting**: Avoid overriding essential browser shortcuts
- **Context-appropriate**: Use global context sparingly, prefer specific contexts

##### 2. Required Documentation
When proposing a new shortcut, include:
```markdown
**Shortcut**: Ctrl+R
**Action**: Archive completed todos
**Context**: Global (available everywhere)
**Justification**: Provides quick cleanup without permanent deletion
**Conflicts**: None (checked against system shortcuts)
**Testing**: Verified on Chrome 90+, Firefox 88+, Safari 14+
```

##### 3. Code Contribution Process

**Step 1: Fork and Setup**
```bash
git clone https://github.com/[your-username]/AutoToDo.git
cd AutoToDo
# Test that the app works in your environment
```

**Step 2: Implement Your Shortcut**
```javascript
// Add to ShortcutsConfig.js
{
    key: 'r',
    ctrlKey: true,
    context: 'global',
    action: archiveCompleted,
    preventDefault: true,
    description: 'Archive completed todos (Ctrl+R)',
    category: 'Todo Management'
}
```

**Step 3: Add Handler Function**
```javascript
// Add to appropriate controller class
archiveCompleted() {
    const completed = this.model.todos.filter(todo => todo.completed);
    if (completed.length === 0) {
        this.view.showMessage('No completed todos to archive');
        return;
    }
    
    // Your implementation here
    this.model.archiveTodos(completed);
    this.view.render();
    this.view.showMessage(`Archived ${completed.length} todos`);
}
```

**Step 4: Write Tests**
```javascript
// Add to appropriate test file
describe('Archive shortcut', () => {
    it('should archive completed todos when Ctrl+R is pressed', () => {
        // Test implementation
    });
    
    it('should show message when no completed todos exist', () => {
        // Test edge case
    });
});
```

**Step 5: Update Documentation**
- Add your shortcut to the README.md shortcuts section
- Include it in the appropriate category
- Provide usage examples and context

##### 4. Review Criteria

Pull requests for new shortcuts will be evaluated on:

**Functionality**
- [ ] Shortcut works as described across major browsers
- [ ] No conflicts with existing shortcuts or browser functions  
- [ ] Appropriate context and scope
- [ ] Handles edge cases gracefully

**Code Quality**
- [ ] Follows existing code patterns and conventions
- [ ] Includes appropriate error handling
- [ ] Has comprehensive test coverage
- [ ] Is well-documented with clear descriptions

**User Experience**
- [ ] Provides meaningful functionality that enhances productivity
- [ ] Uses intuitive key combinations
- [ ] Gives appropriate user feedback
- [ ] Follows accessibility best practices

**Documentation**
- [ ] Clear description of functionality and usage
- [ ] Included in help dialog with proper categorization
- [ ] Updated README with examples and context
- [ ] Follows documentation formatting standards

#### Community Discussion

**Before implementing large changes:**
1. **Open an issue** to discuss your proposed shortcut
2. **Get feedback** from maintainers and community members  
3. **Iterate on the design** based on community input
4. **Consider alternatives** suggested by reviewers

**Collaboration channels:**
- GitHub Issues for feature proposals and bug reports
- Pull Request discussions for code review and refinement
- README examples serve as implementation guides

#### Maintenance and Updates

**Long-term considerations:**
- **Browser compatibility** - New shortcuts should work across supported browsers
- **Future-proofing** - Consider how shortcuts might need to evolve
- **Performance impact** - Avoid shortcuts that significantly impact app performance
- **User customization** - Design with potential user customization in mind

By following these guidelines, you help ensure that new shortcuts enhance AutoToDo's usability while maintaining code quality and consistency.

### Code Implementation Reference

This section provides concrete code examples and references to the actual implementation files to ensure documentation accuracy and help developers understand the real codebase structure.

#### Implementation Architecture

The keyboard shortcut system consists of three main implementation files:

**Core Implementation Files:**
- **`js/ShortcutsConfig.js`** - Centralized configuration defining all 15+ keyboard shortcuts
- **`js/KeyboardShortcutManager.js`** - Event handling, context management, and shortcut registration
- **`js/TodoController.js`** - Application logic that connects shortcuts to todo operations

#### Real Code Examples from Implementation

##### Shortcut Configuration Structure (from `ShortcutsConfig.js`)

Here's how shortcuts are actually defined in the codebase:

```javascript
// Example: Focus new todo input (Ctrl+N)
{
    key: 'n',
    ctrlKey: true,
    context: 'global',
    action: focusNewTodo,
    preventDefault: true,
    description: 'Focus new todo input (Ctrl+N)',
    category: 'Navigation'
}

// Example: Context-aware editing shortcut (Escape)
{
    key: 'Escape',
    context: 'editing',
    action: cancelEdit,
    description: 'Cancel editing (Escape)',
    category: 'Editing'
}

// Example: Multi-modifier shortcut (Ctrl+Shift+D)
{
    key: 'd',
    ctrlKey: true,
    shiftKey: true,
    context: 'global',
    action: clearCompleted,
    preventDefault: true,
    description: 'Clear completed todos (Ctrl+Shift+D)',
    category: 'Todo Management'
}
```

##### Context Management Implementation

The system uses dynamic context detection for context-aware shortcuts:

```javascript
// From KeyboardShortcutManager.js - Context registration
registerContext('editing', () => {
    return document.querySelector('.editing') !== null;
});

// Context priority handling - most specific context wins
getActiveContexts() {
    const active = [];
    for (const [contextName, checker] of this.contexts.entries()) {
        if (checker()) {
            active.push(contextName);
        }
    }
    return active;
}
```

##### Handler Registration Pattern

How shortcuts connect to application functionality:

```javascript
// From TodoController.js - Handler setup pattern
const handlers = {
    focusNewTodo: () => this.focusNewTodo(),
    focusSearch: () => this.focusSearch(),
    addTodo: () => this.addTodo(),
    toggleFirstTodo: () => this.toggleFirstTodo(),
    deleteFirstTodo: () => this.deleteFirstTodo(),
    cancelEdit: () => this.cancelEdit(),
    saveEdit: () => this.saveEdit(),
    showHelp: () => this.showHelp(),
    toggleTheme: () => this.toggleTheme(),
    selectAll: () => this.selectAll(),
    clearCompleted: () => this.clearCompleted()
};

// Register all shortcuts with the manager
const shortcuts = ShortcutsConfig.getShortcuts(handlers);
shortcuts.forEach(shortcut => this.shortcutManager.registerShortcut(shortcut));
```

#### Implementation Cross-Reference Table

| Documented Shortcut | Implementation File | Configuration Object | Handler Method |
|---------------------|-------------------|---------------------|----------------|
| **Ctrl+N** (Focus new todo) | `ShortcutsConfig.js:39-46` | `key: 'n', ctrlKey: true` | `focusNewTodo()` |
| **Ctrl+F** (Focus search) | `ShortcutsConfig.js:48-55` | `key: 'f', ctrlKey: true` | `focusSearch()` |
| **/** (Focus search) | `ShortcutsConfig.js:57-63` | `key: '/'` | `focusSearch()` |
| **Ctrl+Enter** (Add todo) | `ShortcutsConfig.js:66-74` | `key: 'Enter', ctrlKey: true` | `addTodo()` |
| **Ctrl+T** (Toggle todo) | `ShortcutsConfig.js:75-83` | `key: 't', ctrlKey: true` | `toggleFirstTodo()` |
| **Ctrl+Delete** (Delete todo) | `ShortcutsConfig.js:84-92` | `key: 'Delete', ctrlKey: true` | `deleteFirstTodo()` |
| **Ctrl+A** (Select all) | `ShortcutsConfig.js:94-101` | `key: 'a', ctrlKey: true` | `selectAll()` |
| **Ctrl+Shift+D** (Clear completed) | `ShortcutsConfig.js:103-111` | `key: 'd', ctrlKey: true, shiftKey: true` | `clearCompleted()` |
| **Escape** (Cancel editing) | `ShortcutsConfig.js:114-120` | `key: 'Escape', context: 'editing'` | `cancelEdit()` |
| **Ctrl+S** (Save editing) | `ShortcutsConfig.js:121-129` | `key: 's', ctrlKey: true, context: 'editing'` | `saveEdit()` |
| **Enter** (Save editing) | `ShortcutsConfig.js:130-137` | `key: 'Enter', context: 'editing'` | `saveEdit()` |
| **Ctrl+H** (Show help) | `ShortcutsConfig.js:140-148` | `key: 'h', ctrlKey: true` | `showHelp()` |
| **?** (Show help) | `ShortcutsConfig.js:149-156` | `key: '?'` | `showHelp()` |
| **F1** (Show help) | `ShortcutsConfig.js:157-164` | `key: 'F1'` | `showHelp()` |
| **Ctrl+M** (Toggle theme) | `ShortcutsConfig.js:165-173` | `key: 'm', ctrlKey: true` | `toggleTheme()` |

#### Validation and Conflict Prevention Code

The implementation includes built-in validation:

```javascript
// From ShortcutsConfig.js - System shortcut detection
static getValidationRules() {
    return {
        reservedGlobalKeys: ['F5', 'F12', 'Tab'],
        systemShortcuts: [
            { key: 's', ctrlKey: true }, // Save (browser)
            { key: 'r', ctrlKey: true }, // Refresh
            { key: 'l', ctrlKey: true }, // Location bar
        ],
        maxShortcutsPerContext: 20
    };
}
```

#### Accessing Implementation Details

**View Complete Implementation:**
```bash
# View shortcut configurations
cat js/ShortcutsConfig.js

# View keyboard shortcut manager
cat js/KeyboardShortcutManager.js

# View integration in main controller
grep -A 20 "shortcut" js/TodoController.js
```

**Debug Shortcut Registration:**
```javascript
// Browser console commands to inspect runtime state
console.log(shortcutManager.getAllShortcuts());
console.log(ShortcutsConfig.groupByCategory(shortcuts));
console.log(shortcutManager.getShortcutDescriptions());
```

This code reference ensures complete accuracy between documentation and implementation, allowing developers to verify that all documented shortcuts exist and function as described in the actual codebase.

### Testing and Validation Methodology

AutoToDo employs comprehensive testing methodologies to ensure keyboard shortcuts work reliably across different scenarios and maintain consistency during development.

#### Testing Architecture Overview

The testing system validates both individual shortcut functionality and the overall keyboard management system:

**Test Files:**
- **`keyboard-shortcuts.test.js`** - End-to-end shortcut behavior testing (13 test cases)
- **`keyboard-shortcut-manager.test.js`** - Unit tests for KeyboardShortcutManager class (33 test cases)
- **`shortcuts-config.test.js`** - Configuration validation tests

#### Testing Methodologies Used

##### 1. Unit Testing Approach

**Individual Shortcut Testing:**
Each shortcut is tested in isolation to verify correct behavior:

```javascript
// Example: Testing Escape key cancellation
function testEscapeKeysCancelEditing() {
    const handler = createTestHandler();
    handler.setEditing(true, 'test-id');
    
    const escapeEvent = {
        key: 'Escape',
        preventDefault: () => {}
    };
    
    handler.handleKeyboardShortcuts(escapeEvent);
    
    assert(handler.cancelEditCalled, 'Escape key should trigger cancel edit');
    assert(!handler.isEditing, 'Escape key should set editing to false');
}
```

**Context Boundary Testing:**
Verifies shortcuts only work in appropriate contexts:

```javascript
// Test: Ctrl+S only works when editing
function testCtrlSWhenNotEditing() {
    const handler = createTestHandler();
    handler.setEditing(false);
    
    const ctrlSEvent = {
        key: 's',
        ctrlKey: true,
        preventDefault: () => { preventDefaultCalled = true; }
    };
    
    handler.handleKeyboardShortcuts(ctrlSEvent);
    
    assert(!preventDefaultCalled, 'Ctrl+S should not prevent default when not editing');
    assert(!handler.saveEditCalled, 'Ctrl+S should not trigger save when not editing');
}
```

##### 2. Integration Testing

**KeyboardShortcutManager System Testing:**
Tests the complete shortcut management system including registration, context detection, and execution:

```javascript
// Test context-specific shortcut priority
function testContextSpecificShortcuts() {
    const manager = new KeyboardShortcutManager();
    let globalActionCalled = false;
    let editingActionCalled = false;
    let isEditing = false;
    
    manager.registerContext('editing', () => isEditing);
    
    manager.registerShortcut({
        key: 'Escape',
        context: 'global',
        action: () => { globalActionCalled = true; }
    });
    
    manager.registerShortcut({
        key: 'Escape',
        context: 'editing',
        action: () => { editingActionCalled = true; }
    });
    
    // Test priority: editing context should override global
    isEditing = true;
    manager.handleKeyboard(mockEvent);
    assert(editingActionCalled === true, 'Should use editing context when editing');
    assert(globalActionCalled === false, 'Should not use global when editing matches');
}
```

##### 3. Mock-Based Testing

**DOM Abstraction:**
Uses mock DOM elements to test without browser dependencies:

```javascript
class MockElement {
    constructor() {
        this.style = { display: 'none' };
        this.innerHTML = '';
        this.value = '';
        this.eventListeners = {};
        this.classList = {
            add: () => {},
            remove: () => {},
            contains: () => false
        };
    }
    
    addEventListener(event, callback) {
        this.eventListeners[event] = callback;
    }
    
    trigger(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event](data || { target: this });
        }
    }
}
```

##### 4. Error Handling Testing

**Invalid Configuration Detection:**
Tests that the system properly handles invalid shortcut configurations:

```javascript
function testInvalidShortcutRegistration() {
    const manager = new KeyboardShortcutManager();
    let errorThrown = false;
    
    try {
        manager.registerShortcut({
            key: 'Escape'
            // Missing required action function
        });
    } catch (error) {
        errorThrown = true;
    }
    
    assert(errorThrown === true, 'Should throw error for shortcut without action');
}
```

##### 5. Cross-Browser Compatibility Testing

**Event Object Validation:**
Tests handle different browser event object formats:

```javascript
// Test with different event object structures
const chromeEvent = { key: 'Escape', ctrlKey: false, preventDefault: () => {} };
const firefoxEvent = { key: 'Escape', ctrlKey: false, preventDefault: () => {} };
const safariEvent = { key: 'Escape', ctrlKey: false, preventDefault: () => {} };
```

#### Running the Test Suites

##### Execute All Keyboard Tests

```bash
# Run main keyboard shortcut tests
node keyboard-shortcuts.test.js

# Run KeyboardShortcutManager unit tests  
node keyboard-shortcut-manager.test.js

# Run configuration validation tests
node shortcuts-config.test.js
```

##### Test Output Interpretation

**Successful Test Run:**
```
🧪 Running Keyboard Shortcut Tests...
============================================================
✅ PASS: Escape key should trigger cancel edit
✅ PASS: Escape key should set editing to false
✅ PASS: Ctrl+S should prevent default browser behavior
✅ PASS: Ctrl+S should trigger save edit when editing
============================================================
📊 Test Results: 13 passed, 0 failed
🎉 All keyboard shortcut tests passed!
```

**Failed Test Example:**
```
❌ FAIL: Ctrl+S should prevent default when not editing
❌ FAIL: Shortcut should handle modifier keys correctly
📊 Test Results: 11 passed, 2 failed
❌ Some tests failed!
```

#### Test Coverage Analysis

**Current Test Coverage:**

| Test Category | Tests | Coverage |
|---------------|-------|-----------|
| **Basic Shortcut Execution** | 6 tests | ✅ All primary shortcuts |
| **Context Awareness** | 4 tests | ✅ Global vs editing contexts |
| **Modifier Key Handling** | 8 tests | ✅ Ctrl, Shift, Alt combinations |
| **Error Handling** | 3 tests | ✅ Invalid configurations |
| **Event Prevention** | 4 tests | ✅ preventDefault behavior |
| **Manager Registration** | 5 tests | ✅ Shortcut registration/removal |
| **Context Priority** | 3 tests | ✅ Context override behavior |

**Total Test Cases:** 46 tests across all test files  
**Success Rate:** 100% (46/46 passing)

#### Validation Procedures for New Shortcuts

##### Pre-Implementation Validation

**1. Conflict Detection:**
```javascript
// Check against existing shortcuts
const existingShortcuts = ShortcutsConfig.getShortcuts({});
const conflicts = existingShortcuts.filter(s => 
    s.key === newKey && s.ctrlKey === newCtrl && s.context === newContext
);
if (conflicts.length > 0) {
    console.warn('Shortcut conflict detected:', conflicts);
}
```

**2. System Shortcut Validation:**
```javascript
// Verify against reserved system shortcuts
const validation = ShortcutsConfig.getValidationRules();
const isReserved = validation.systemShortcuts.some(s => 
    s.key === newShortcut.key && s.ctrlKey === newShortcut.ctrlKey
);
```

##### Post-Implementation Testing

**1. Create Test Case:**
```javascript
function testNewCustomShortcut() {
    const manager = new KeyboardShortcutManager();
    let actionExecuted = false;
    
    manager.registerShortcut({
        key: 'k',
        ctrlKey: true,
        action: () => { actionExecuted = true; },
        description: 'Custom action'
    });
    
    const testEvent = {
        key: 'k',
        ctrlKey: true,
        preventDefault: () => {}
    };
    
    manager.handleKeyboard(testEvent);
    assert(actionExecuted, 'New shortcut should execute action');
}
```

**2. Integration Testing:**
```javascript
// Test in actual application context
const todoController = new TodoController();
// Trigger shortcut and verify expected behavior
// Check for side effects, context changes, DOM updates
```

**3. Cross-Browser Testing:**
```javascript
// Test across different browsers and verify:
// - Event object compatibility
// - Key code recognition  
// - Modifier key detection
// - preventDefault behavior
```

#### Performance Testing

**Shortcut Response Time Measurement:**
```javascript
function testShortcutPerformance() {
    const startTime = performance.now();
    manager.handleKeyboard(testEvent);
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    assert(responseTime < 10, 'Shortcut should respond within 10ms');
}
```

**Memory Leak Detection:**
```javascript
// Test shortcut registration/removal cycles
for (let i = 0; i < 1000; i++) {
    manager.registerShortcut(testConfig);
    manager.removeShortcut('testKey');
}
// Verify memory usage remains stable
```

#### Continuous Integration Testing

**Automated Test Execution:**
```bash
#!/bin/bash
# CI testing script
echo "Running keyboard shortcut validation..."

# Run all test suites
node keyboard-shortcuts.test.js || exit 1
node keyboard-shortcut-manager.test.js || exit 1 
node shortcuts-config.test.js || exit 1

echo "All keyboard shortcut tests passed ✅"
```

**Test Environment Requirements:**
- Node.js runtime for test execution
- Mock DOM environment (no browser required)
- Simulated keyboard events
- Assertion framework for validation

This comprehensive testing methodology ensures all documented keyboard shortcuts work reliably and maintain consistency across development cycles and browser environments.

### Visual Guide and Demonstrations

#### Built-in Help System
AutoToDo includes a comprehensive visual help dialog that displays all keyboard shortcuts organized by category. Access it using:
- **Ctrl+H** - Standard help shortcut
- **?** - Quick help access  
- **F1** - Traditional help key

The help dialog shows:
- **Organized categories** - Navigation, Todo Management, Editing, and General shortcuts
- **Key combinations** - Visual representation of required keys (e.g., "Ctrl+N")
- **Clear descriptions** - What each shortcut does and when to use it
- **Context information** - Which shortcuts work in different application states

#### Interactive Examples
To see shortcuts in action, try these common workflows:

**Quick Task Entry Workflow:**
1. Press **Ctrl+N** → Notice the input field gets focus and cursor appears
2. Type "Buy groceries" → Text appears in the input field
3. Press **Ctrl+Enter** → Todo is added to the list immediately
4. Type "Call dentist" → Focus remains in input for rapid entry
5. Press **Enter** → Second todo is added

**Search and Filter Workflow:**
1. Press **/** → Search field gets focus with visual indication
2. Type "grocery" → List instantly filters to show matching todos
3. Press **Escape** → Search clears and full list returns
4. Press **Ctrl+F** → Alternative way to focus search

**Task Management Workflow:**
1. Press **Ctrl+T** → First todo item gets checked/unchecked with animation
2. Press **Ctrl+Shift+D** → All completed todos disappear with confirmation
3. Press **Ctrl+A** → All todos get visual selection highlight
4. Press **Ctrl+Delete** → First todo shows deletion confirmation dialog

#### Visual Feedback Features
The application provides clear visual feedback for all keyboard actions:
- **Focus indicators** - Blue outline shows which element is active
- **Selection highlighting** - Selected todos get distinct background color
- **Status animations** - Smooth transitions when marking todos complete
- **Confirmation dialogs** - Visual prompts for destructive actions like deletion
- **Theme transitions** - Smooth color changes when toggling dark/light mode
- **Message notifications** - Success/error messages appear for user actions

### User-Level Shortcut Customization

#### Current Capabilities
AutoToDo currently supports keyboard shortcuts through its built-in system, but **user-level customization requires browser-based solutions** since the application doesn't include a settings interface for modifying shortcuts.

#### Visual Cues and Tooltips

**Current Visual Feedback:**
- **Focus indicators**: Clear visual outlines show which element has keyboard focus
- **Button states**: Hover effects provide visual feedback for interactive elements
- **Status messages**: Success/error notifications appear for user actions
- **Help dialog**: Comprehensive shortcuts reference accessible via Ctrl+H

**Future Enhancement Possibilities:**
AutoToDo could benefit from enhanced visual cues such as:
- **Hover tooltips**: Small popup hints showing available shortcuts when hovering over buttons or input fields
- **Keyboard navigation hints**: Visual indicators showing which elements can be accessed via Tab key
- **Shortcut badges**: Small key combination displays on relevant UI elements

**Implementation Considerations for Tooltips:**
While not currently implemented, tooltip functionality could be added through:
- CSS-based tooltips using `::before` and `::after` pseudo-elements
- JavaScript tooltip libraries for dynamic content
- HTML `title` attributes for basic browser tooltips
- ARIA labels for accessibility compliance

**Recommended Tooltip Locations:**
- **Add button**: Show "Ctrl+Enter to add" on hover
- **Search field**: Display "Ctrl+F to focus" tooltip
- **Todo items**: Show available actions (Ctrl+T to toggle, Ctrl+Delete to remove)
- **Theme toggle**: Indicate "Ctrl+M" shortcut

#### Browser-Based Customization Options

**Option 1: Browser Extensions**
- **Vimium** (Chrome/Firefox) - Adds Vim-style keyboard navigation
- **Shortkeys** (Chrome) - Custom keyboard shortcuts for web pages
- **Surfingkeys** (Chrome/Firefox) - Advanced keyboard control

**Option 2: Browser Developer Tools**
Advanced users can modify shortcuts temporarily:
1. Open Developer Tools (F12)
2. Go to Console tab
3. Execute JavaScript to modify shortcut behavior:
```javascript
// Example: Change Ctrl+N to Ctrl+T for new todo focus
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        document.querySelector('#new-todo-input').focus();
    }
});
```

**Option 3: User Script Managers**
- **Tampermonkey** (Chrome/Firefox/Safari) - Run custom scripts
- **Greasemonkey** (Firefox) - User script management
- **Violentmonkey** (Chrome/Firefox) - Open source alternative

#### Future Enhancement Possibilities
The application architecture supports adding user customization features:

**Potential UI Customization Panel:**
- Settings dialog accessible via menu or shortcut
- List of all current shortcuts with modification options
- Conflict detection and resolution
- Import/export of custom shortcut profiles
- Reset to defaults functionality

**Local Storage Customization:**
- User preferences saved in browser localStorage
- Custom shortcuts persist between sessions
- Per-device customization support

#### Accessibility and Compatibility
When customizing shortcuts:
- **Avoid system shortcuts** - Don't override Ctrl+C, Ctrl+V, etc.
- **Consider accessibility** - Ensure shortcuts work with screen readers
- **Test across browsers** - Custom solutions may vary by browser
- **Document changes** - Keep track of modifications for troubleshooting

### Pro Tips for Maximum Efficiency

- **📚 Built-in Help**: Press **Ctrl+H** to access the complete shortcuts reference organized by category
- **⚡ Rapid Entry**: After adding a todo, focus automatically returns to the input field for consecutive additions
- **🔍 Quick Search**: Use **/** to instantly jump to search and filter large todo lists without clicking
- **🎯 Batch Operations**: Combine **Ctrl+A** (select all) with **Ctrl+Shift+D** (clear completed) for quick cleanup
- **🌙 Theme Switching**: Press **Ctrl+M** to quickly toggle between light and dark modes based on your environment
- **🧠 Context Awareness**: The application intelligently handles shortcuts based on your current activity (editing vs. browsing)

### Undoing and Reverting Actions

AutoToDo provides several ways to revert changes and cancel operations using keyboard shortcuts:

#### Available Undo/Revert Functionality

**Edit Mode Cancellation:**
- **Escape** - Cancel editing and discard any changes to a todo item
  - *Use this when you start editing a todo but want to abandon your changes*
  - *Returns the todo text to its original state before editing began*
  - *Works immediately without confirmation - your original text is preserved*

**Input Field Clearing:**
- **Escape** (when focused on new todo input) - Clear the input field
  - *Quickly remove typed text before adding a todo*
  - *Useful for starting over with a new task description*

**Dialog Dismissal:**
- **Escape** - Close help dialogs and cancel operations
  - *Exit the help dialog (Ctrl+H) without making changes*
  - *Cancel confirmation dialogs for delete operations*

#### Current Limitations

**No Global Undo System:**
AutoToDo currently does not implement a comprehensive undo/redo system for these actions:
- ❌ **Todo deletion** - Once confirmed, deleted todos cannot be restored via keyboard
- ❌ **Completion status changes** - Toggling todo completion (Ctrl+T) cannot be undone with a shortcut
- ❌ **Bulk operations** - Clearing completed todos (Ctrl+Shift+D) cannot be reversed
- ❌ **Theme changes** - Theme switching (Ctrl+M) has no undo functionality

**Workarounds for Missing Undo:**
- **Manual restoration**: Re-type deleted todos or use browser's localStorage inspector to recover data
- **Confirmation dialogs**: Pay attention to delete confirmations before proceeding
- **Progressive editing**: Make small changes rather than bulk operations when possible
- **Browser backup**: Your todo data persists in localStorage - closing and reopening preserves your list

#### Future Enhancement Considerations

A comprehensive undo system could include:
- **Ctrl+Z** - Undo last action (delete, toggle, bulk clear)
- **Ctrl+Y** or **Ctrl+Shift+Z** - Redo previously undone action
- **Action history** - View and selectively revert recent changes
- **Snapshot restore** - Return to previous application state

> **💡 Pro Tip**: While there's no global undo, the **Escape** key is your primary tool for canceling operations in progress. Use it liberally when editing todos or navigating dialogs.

### International Keyboard Layout Considerations

AutoToDo's keyboard shortcuts are designed to work across different international keyboard layouts, though some considerations apply:

#### How Shortcuts Work Across Layouts

**Character-Based Detection:**
- AutoToDo uses `event.key` detection, which captures the actual character produced
- **Ctrl+N** works regardless of where 'N' appears on your physical keyboard
- **Ctrl+F** functions correctly whether you're using QWERTY, AZERTY, QWERTZ, or other layouts

**Layout-Specific Considerations:**

**QWERTY (US/UK English):**
- ✅ All shortcuts work as documented
- ✅ Special characters like **/** are in standard locations

**AZERTY (French):**
- ✅ **Ctrl+N**, **Ctrl+F**, **Ctrl+T** work normally (letters are detected correctly)
- ⚠️ **/** character requires **Shift+:** - use **Ctrl+F** instead for search
- ✅ **?** for help may require **Shift+,** depending on your specific AZERTY variant

**QWERTZ (German/Central European):**
- ✅ Letter-based shortcuts (**Ctrl+N**, **Ctrl+F**, **Ctrl+T**) work normally
- ⚠️ **/** character location varies - **Ctrl+F** is more reliable for search
- ✅ **?** typically requires **Shift+ß** but functions correctly

**Alternative Layouts (Dvorak, Colemak, etc.):**
- ✅ All **Ctrl+[letter]** combinations work based on the character produced
- ✅ Function keys (**F1**, **Escape**, **Enter**) work universally
- ✅ Modifier combinations (**Ctrl+Shift+D**) detect correctly

#### Recommendations by Layout

**For Non-QWERTY Users:**

**Primary Shortcuts (Work Everywhere):**
- **Ctrl+H** - Help dialog (shows all available shortcuts)
- **Ctrl+N** - Focus new todo input
- **Ctrl+F** - Focus search (more reliable than "/" on international layouts)
- **F1** - Alternative help access
- **Escape** - Cancel operations universally

**Layout-Specific Tips:**

**AZERTY Users:**
- Use **Ctrl+F** instead of **/** for search (more consistent)
- **?** help access: Try **Shift+,** or use **Ctrl+H** instead
- All letter-based shortcuts work normally

**QWERTZ Users:**
- **/** may be on **Shift+7** - use **Ctrl+F** for search
- **?** requires **Shift+ß** - **F1** or **Ctrl+H** are alternatives
- Standard **Ctrl+Letter** shortcuts function correctly

**Alternative Layout Users:**
- Focus on **Ctrl+[character]** combinations rather than physical key positions
- Use **F1** and **Ctrl+H** for help - these work universally
- Test special character shortcuts (**/**,**?**) and use alternatives if needed

#### Accessibility Features for International Users

**Visual Indicators:**
- The help dialog (**Ctrl+H**) displays shortcuts using your keyboard's actual character output
- Shortcut descriptions show the character produced, not physical key positions
- Focus indicators work regardless of input method or layout

**Alternative Access Methods:**
- **Multiple shortcuts for common actions**: Search accessible via both **Ctrl+F** and **/**
- **Help system flexibility**: **Ctrl+H**, **?**, and **F1** all open help
- **Universal keys prioritized**: **Escape**, **Enter**, **Tab** work identically across layouts

**Testing Your Layout:**
1. **Open help dialog**: Try **Ctrl+H**, **F1**, or **?** to see available shortcuts
2. **Test primary shortcuts**: **Ctrl+N** (new todo), **Ctrl+F** (search), **Escape** (cancel)
3. **Check special characters**: Test **/** for search, use **Ctrl+F** if problematic
4. **Verify modifier combinations**: **Ctrl+Shift+D** should work regardless of layout

#### Customization for International Layouts

**Browser Extensions (Recommended):**
- **Shortkeys** - Map shortcuts to your preferred key combinations
- **Vimium** - Alternative navigation system that adapts to any layout
- **Custom user scripts** - Remap problematic shortcuts to layout-friendly alternatives

**Layout-Specific Shortcuts Example:**
```javascript
// Example: Add layout-friendly shortcuts via browser console
document.addEventListener('keydown', function(e) {
    // For AZERTY: Map Ctrl+Q to focus search (Q is where A is on QWERTY)
    if (e.ctrlKey && e.key === 'q') {
        e.preventDefault();
        document.querySelector('#todo-search').focus();
    }
});
```

> **🌍 International User Tip**: Use **Ctrl+H** as your primary reference - it shows all shortcuts using the characters your keyboard actually produces, making it the most reliable guide for your specific layout.

### Troubleshooting Keyboard Shortcuts

If you're experiencing issues with keyboard shortcuts, try these solutions:

#### Common Issues and Solutions

**Shortcuts Not Working:**
- **Browser focus issue**: Click anywhere in the AutoToDo application area to ensure it has focus
- **Input field conflicts**: Some shortcuts only work when specific fields are focused (e.g., Ctrl+Enter requires focus on the todo input)
- **Browser conflicts**: Check if browser extensions are intercepting shortcuts (disable extensions temporarily to test)
- **Modifier key detection**: Ensure Ctrl, Shift, and Alt keys are functioning properly - test with system shortcuts first

**Context-Specific Problems:**
- **Edit mode shortcuts**: Shortcuts like Ctrl+S and Escape only work when actively editing a todo item
- **Search shortcuts**: Ctrl+F and "/" work globally, but some shortcuts change behavior when search field is focused
- **Modal dialogs**: When help dialog is open, only Escape and dialog-specific shortcuts are active

**Browser-Specific Issues:**
- **Firefox**: Some shortcuts may conflict with Firefox's built-in shortcuts - try different key combinations
- **Chrome**: Extensions like Vimium or Chrome shortcuts may override AutoToDo shortcuts
- **Safari**: Ensure "Develop" menu shortcuts aren't conflicting (Safari > Preferences > Advanced)
- **Edge**: Check for Windows system shortcuts that might take precedence

**Performance-Related Issues:**
- **Large todo lists**: With 100+ todos, some shortcuts may have slight delays - this is normal
- **Low memory**: Close other browser tabs if shortcuts become unresponsive
- **Background processes**: Other applications consuming resources may affect responsiveness

#### Diagnostic Steps

**Step 1: Test Basic Functionality**
1. Press **Ctrl+H** - Help dialog should appear immediately
2. Press **Escape** - Dialog should close
3. Press **Ctrl+N** - Input field should gain focus
4. Type test text and press **Enter** - Todo should be added

**Step 2: Check Browser Console**
1. Open Developer Tools (F12)
2. Check Console tab for JavaScript errors
3. Try shortcuts while monitoring for error messages

**Step 3: Test in Incognito/Private Mode**
1. Open AutoToDo in incognito/private browsing mode
2. Test problematic shortcuts
3. If working in incognito, disable browser extensions one by one

**Step 4: Verify Keyboard Hardware**
1. Test modifier keys (Ctrl, Shift, Alt) in other applications
2. Try alternative shortcut combinations (e.g., use ? instead of Ctrl+H for help)
3. Test with an external keyboard if using a laptop

#### Getting Help

**If shortcuts still don't work:**
- **Clear browser cache**: Hard refresh with Ctrl+Shift+R
- **Try different browser**: Test in Chrome, Firefox, Safari, or Edge
- **Check accessibility settings**: Ensure browser accessibility features aren't interfering
- **Use alternative shortcuts**: Most functions have multiple shortcut options (e.g., Ctrl+H, ?, or F1 for help)

**Compatibility Notes:**
- All shortcuts work in modern browsers (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Some shortcuts may conflict with screen reader software - use alternative combinations
- Virtual keyboards may not support all modifier key combinations

**Reporting Issues:**
If you encounter persistent shortcut problems:
1. Note your browser version and operating system
2. List which specific shortcuts aren't working
3. Describe the expected vs. actual behavior
4. Include any console error messages

## Technical Information

### Browser Requirements
- JavaScript ES6 class support
- localStorage API for data persistence  
- Modern DOM APIs (querySelector, addEventListener)
- CSS Grid and Flexbox support for optimal layout

### Recent Improvements

**Enhanced Delete Functionality**: Resolved issues with todo deletion through the graphical interface. The delete functionality now includes:
- Proper event binding for all delete buttons
- User-friendly confirmation dialogs for safety
- Correct removal from both display and localStorage
- Immediate UI updates after deletion
- Consistent behavior across all browsers

## Feedback and Suggestions

We value your input and actively encourage community engagement to improve AutoToDo's usability and functionality. Your feedback helps us prioritize new features and enhancements.

### How to Provide Feedback

#### Suggesting New Keyboard Shortcuts
Have an idea for a useful keyboard shortcut? We'd love to hear from you! When suggesting new shortcuts:

1. **Check existing shortcuts first**: Review the comprehensive [Keyboard Shortcuts](#keyboard-shortcuts) section to ensure your suggestion doesn't conflict with existing functionality
2. **Consider accessibility**: Think about how your suggestion would work across different keyboard layouts and accessibility needs
3. **Provide use case context**: Explain when and why the shortcut would be useful in typical workflows

#### Reporting Issues or Bugs
If you encounter problems with existing keyboard shortcuts or other functionality:

1. **Describe the issue clearly**: Include what you expected to happen vs. what actually occurred
2. **Provide browser information**: Include your browser version and operating system
3. **Include reproduction steps**: Help us understand how to reproduce the issue

#### General Feature Requests
Beyond keyboard shortcuts, we welcome suggestions for any app improvements:

- User interface enhancements
- New todo management features
- Performance optimizations
- Accessibility improvements
- Mobile experience enhancements

### Where to Submit Feedback

#### GitHub Issues (Recommended)
- **New Feature Requests**: [Create a Feature Request](https://github.com/lucabol/AutoToDo/issues/new?labels=enhancement&template=feature_request.md)
- **Bug Reports**: [Report a Bug](https://github.com/lucabol/AutoToDo/issues/new?labels=bug&template=bug_report.md)
- **Keyboard Shortcut Suggestions**: [Suggest a Shortcut](https://github.com/lucabol/AutoToDo/issues/new?labels=keyboard-shortcuts,enhancement&title=[Shortcut%20Suggestion])

#### GitHub Discussions
For broader conversations about the project's direction, usage tips, or community collaboration:
- **General Discussion**: [Join the Conversation](https://github.com/lucabol/AutoToDo/discussions)
- **Show and Tell**: Share your customizations or interesting use cases
- **Q&A**: Ask questions about usage or development

### Community Guidelines

When providing feedback, please:

#### Be Constructive and Specific
- Focus on specific improvements rather than general complaints
- Provide concrete examples and use cases
- Suggest solutions when possible

#### Follow Project Standards
- Review existing documentation before submitting suggestions
- Consider compatibility with the project's vanilla JavaScript approach
- Respect the application's focus on simplicity and performance

#### Engage Respectfully
- Be patient with response times - this is a community-driven project
- Provide additional clarification when requested
- Help test proposed solutions when possible

### Response Expectations

#### Timeline
- **Bug reports**: We aim to acknowledge within 48 hours
- **Feature requests**: Initial review within one week
- **Implementation**: Depends on complexity and community priority

#### Prioritization Factors
- **User impact**: How many users would benefit?
- **Accessibility**: Does it improve accessibility or international support?
- **Maintenance burden**: Can it be implemented without adding complexity?
- **Community support**: Are multiple users requesting similar functionality?

### Contributing Beyond Feedback

#### Code Contributions
If you're technically inclined, consider contributing directly:
- Review the [Community Contributions](#community-contributions) section for development guidelines
- Fork the repository and submit pull requests
- Help review and test other community contributions

#### Documentation Improvements
- Suggest clarifications or additions to documentation
- Help translate or improve international keyboard layout support
- Share usage tips and workflow examples

### Recognition

Contributors who provide valuable feedback or suggestions will be:
- Acknowledged in release notes when their suggestions are implemented
- Invited to test new features before public release
- Given priority consideration for future feature discussions

Your engagement helps make AutoToDo better for everyone. Thank you for being part of our community!
