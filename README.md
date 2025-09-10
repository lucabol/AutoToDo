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

### Implementation Verification and Code References

This section provides complete verification that all documented shortcuts are accurately implemented in the codebase, with direct references to the actual implementation code.

#### Shortcut Implementation Cross-Reference

All keyboard shortcuts documented above are implemented in `js/ShortcutsConfig.js`. Here's the exact mapping between documentation and code:

| Documented Shortcut | Implementation in ShortcutsConfig.js | Line Range | Context | Category |
|---------------------|---------------------------------------|------------|---------|----------|
| **Ctrl+N** (Focus new todo) | `key: 'n', ctrlKey: true, action: focusNewTodo` | Lines 39-46 | global | Navigation |
| **Ctrl+F** (Focus search) | `key: 'f', ctrlKey: true, action: focusSearch` | Lines 48-55 | global | Navigation |
| **/** (Focus search) | `key: '/', action: focusSearch` | Lines 57-63 | global | Navigation |
| **Ctrl+Enter** (Add todo) | `key: 'Enter', ctrlKey: true, action: addTodo` | Lines 67-74 | global | Todo Management |
| **Ctrl+T** (Toggle first todo) | `key: 't', ctrlKey: true, action: toggleFirstTodo` | Lines 76-83 | global | Todo Management |
| **Ctrl+Delete** (Delete first todo) | `key: 'Delete', ctrlKey: true, action: deleteFirstTodo` | Lines 85-92 | global | Todo Management |
| **Ctrl+A** (Select all todos) | `key: 'a', ctrlKey: true, action: selectAll` | Lines 94-101 | global | Todo Management |
| **Ctrl+Shift+D** (Clear completed) | `key: 'd', ctrlKey: true, shiftKey: true, action: clearCompleted` | Lines 103-111 | global | Todo Management |
| **Escape** (Cancel editing) | `key: 'Escape', action: cancelEdit` | Lines 115-120 | editing | Editing |
| **Ctrl+S** (Save in edit mode) | `key: 's', ctrlKey: true, action: saveEdit` | Lines 122-129 | editing | Editing |
| **Enter** (Save in edit mode) | `key: 'Enter', action: saveEdit` | Lines 131-137 | editing | Editing |
| **Ctrl+H** (Show help) | `key: 'h', ctrlKey: true, action: showHelp` | Lines 141-148 | global | General |
| **?** (Show help) | `key: '?', action: showHelp` | Lines 150-156 | global | General |
| **F1** (Show help) | `key: 'F1', action: showHelp` | Lines 158-164 | global | General |
| **Ctrl+M** (Toggle theme) | `key: 'm', ctrlKey: true, action: toggleTheme` | Lines 166-173 | global | General |

#### Actual Implementation Code Snippets

Here are key code snippets from the actual implementation files:

**1. Navigation Shortcuts (from `js/ShortcutsConfig.js`):**
```javascript
// Focus new todo input - Ctrl+N
{
    key: 'n',
    ctrlKey: true,
    context: 'global',
    action: focusNewTodo,
    description: 'Focus new todo input (Ctrl+N)',
    category: 'Navigation'
},

// Focus search input - Ctrl+F and /
{
    key: 'f',
    ctrlKey: true,
    context: 'global', 
    action: focusSearch,
    description: 'Focus search input (Ctrl+F)',
    category: 'Navigation'
},
{
    key: '/',
    context: 'global',
    action: focusSearch,
    description: 'Focus search input (/)',
    category: 'Navigation'
}
```

**2. Todo Management Shortcuts (from `js/ShortcutsConfig.js`):**
```javascript
// Add new todo - Ctrl+Enter
{
    key: 'Enter',
    ctrlKey: true,
    context: 'global',
    action: addTodo,
    description: 'Add new todo (Ctrl+Enter)',
    category: 'Todo Management'
},

// Select all todos - Ctrl+A
{
    key: 'a',
    ctrlKey: true,
    context: 'global',
    action: selectAll,
    description: 'Select all todos (Ctrl+A)',
    category: 'Todo Management'
},

// Clear completed todos - Ctrl+Shift+D
{
    key: 'd',
    ctrlKey: true,
    shiftKey: true,
    context: 'global',
    action: clearCompleted,
    description: 'Clear completed todos (Ctrl+Shift+D)',
    category: 'Todo Management'
}
```

**3. Editing Mode Shortcuts (from `js/ShortcutsConfig.js`):**
```javascript
// Cancel editing - Escape
{
    key: 'Escape',
    context: 'editing',
    action: cancelEdit,
    description: 'Cancel editing (Escape)',
    category: 'Editing'
},

// Save changes - Ctrl+S and Enter
{
    key: 's',
    ctrlKey: true,
    context: 'editing',
    action: saveEdit,
    description: 'Save changes (Ctrl+S)',
    category: 'Editing'
},
{
    key: 'Enter',
    context: 'editing',
    action: saveEdit,
    description: 'Save changes (Enter)',
    category: 'Editing'
}
```

#### Verification Commands

You can verify the implementation accuracy using these browser console commands:

```javascript
// View all implemented shortcuts
const shortcuts = ShortcutsConfig.getShortcuts({});
console.table(shortcuts.map(s => ({
    Key: ShortcutsConfig.formatKeyCombo(s),
    Description: s.description,
    Category: s.category,
    Context: s.context
})));

// Count shortcuts by category
const byCategory = ShortcutsConfig.groupByCategory(shortcuts);
Object.keys(byCategory).forEach(cat => 
    console.log(`${cat}: ${byCategory[cat].length} shortcuts`)
);

// Verify specific shortcut exists
const findShortcut = (key, ctrlKey = false) =>
    shortcuts.find(s => s.key === key && s.ctrlKey === ctrlKey);
console.log('Ctrl+N exists:', findShortcut('n', true) ? '✅' : '❌');
```

#### Implementation Architecture

The keyboard shortcut system uses a three-file architecture:

1. **`js/ShortcutsConfig.js`** - Centralized shortcut definitions (shown above)
2. **`js/KeyboardShortcutManager.js`** - Event handling and context management
3. **`js/TodoController.js`** - Action handlers that connect shortcuts to application functionality

**Total Shortcuts Implemented:** 15 shortcuts across 4 categories (Navigation: 3, Todo Management: 5, Editing: 3, General: 4)

**Verification Status:** ✅ All 15 documented shortcuts verified against actual implementation code

### Developer Customization

#### Adding Custom Shortcuts

To add new shortcuts, modify `ShortcutsConfig.js`:

```javascript
// 1. Add shortcut configuration
{
    key: 'i',
    ctrlKey: true,
    context: 'global',
    action: showStats,
    description: 'Show todo statistics (Ctrl+I)',
    category: 'General'
}

// 2. Add handler to TodoController
showStats() {
    const completed = this.model.todos.filter(todo => todo.completed).length;
    const total = this.model.todos.length;
    alert(`Statistics: ${completed}/${total} todos completed`);
}
```

#### Configuration Properties
- **`key`** - Keyboard key
- **`ctrlKey/shiftKey/altKey`** - Modifier keys (boolean)
- **`context`** - `'global'`, `'editing'`, or custom
- **`action`** - Function to execute
- **`description`** - Help text
- **`category`** - Group for help dialog

#### Testing Custom Shortcuts
```javascript
// Test in browser console
document.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'i', ctrlKey: true, bubbles: true
}));
```

## Contributing to the Shortcut System

We welcome community contributions to enhance AutoToDo's keyboard shortcut system! This section provides comprehensive guidelines for developers who want to add new shortcuts, modify existing ones, or improve the shortcut system.

### Why Contribute?

Your contributions help:
- **Improve user productivity** through better keyboard navigation
- **Enhance accessibility** for users with different needs
- **Support diverse workflows** and use cases
- **Build a stronger community** around efficient task management

### Getting Started

#### Prerequisites
- Basic knowledge of JavaScript ES6+
- Understanding of DOM event handling
- Familiarity with Git and GitHub workflow
- A modern web browser for testing

#### Development Setup
1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/AutoToDo.git
   cd AutoToDo
   ```

2. **Set up local development:**
   ```bash
   # Serve locally to avoid CORS issues
   python -m http.server 8000
   # Or: npx http-server -p 8000
   ```

3. **Test current functionality:**
   - Open http://localhost:8000
   - Press Ctrl+H to view existing shortcuts
   - Test all current shortcuts to understand the system

### Contribution Process

#### Step 1: Planning Your Contribution

**Before you start coding:**
1. **Check existing shortcuts** - Review current shortcuts to avoid conflicts
2. **Open a discussion issue** - Describe your proposed shortcut and get community feedback
3. **Follow design principles** - Ensure your shortcut fits the existing patterns
4. **Consider accessibility** - Make sure it works with screen readers and assistive technologies

#### Step 2: Design Principles

**Intuitive Design:**
- Use mnemonic keys where possible (Ctrl+S for Save, Ctrl+F for Find)
- Follow established patterns in the application
- Make shortcuts discoverable and memorable

**Technical Requirements:**
- **Non-conflicting**: Avoid overriding essential browser shortcuts
- **Context-appropriate**: Use global context sparingly, prefer specific contexts
- **Cross-platform**: Test on Windows, Mac, and Linux
- **Accessible**: Work with screen readers and keyboard navigation

#### Step 3: Implementation

**Core Files to Modify:**
- **`js/ShortcutsConfig.js`** - Define your new shortcuts
- **`js/TodoController.js`** - Implement action handlers
- **`js/KeyboardShortcutManager.js`** - Modify only if adding new context types

**Example Implementation:**
```javascript
// 1. Add to ShortcutsConfig.js
{
    key: 'r',
    ctrlKey: true,
    context: 'global',
    action: 'archiveCompleted',
    description: 'Archive completed todos (Ctrl+R)',
    category: 'Todo Management'
}

// 2. Add handler to TodoController.js
initializeShortcutHandlers() {
    const handlers = {
        // ... existing handlers
        archiveCompleted: () => this.archiveCompleted()
    };
    this.shortcutManager.setHandlers(handlers);
}

// 3. Implement the action method
archiveCompleted() {
    const completed = this.model.todos.filter(todo => todo.completed);
    if (completed.length === 0) {
        this.view.showMessage('No completed todos to archive');
        return;
    }
    
    this.model.archiveTodos(completed);
    this.view.showMessage(`Archived ${completed.length} todos`);
    this.view.render();
}
```

**Configuration Properties:**
- **`key`**: The main key (lowercase letter, number, or special key name)
- **`ctrlKey`**: true for Ctrl+Key combinations
- **`shiftKey`**: true for Shift+Key combinations  
- **`altKey`**: true for Alt+Key combinations
- **`context`**: 'global', 'edit', or custom context
- **`action`**: Handler function name (string)
- **`description`**: User-friendly description for help dialog
- **`category`**: Logical grouping for help dialog organization

#### Step 4: Testing

**Required Tests:**
1. **Unit tests** - Add tests to `keyboard-shortcuts.test.js`
2. **Integration tests** - Add tests to `keyboard-shortcut-manager.test.js`
3. **Manual testing** - Test in multiple browsers and contexts

**Example Test:**
```javascript
// Add to keyboard-shortcuts.test.js
describe('Archive Completed Functionality', () => {
    test('should archive completed todos with Ctrl+R', () => {
        // Setup completed todos
        controller.model.todos = [
            { id: 1, text: 'Task 1', completed: true },
            { id: 2, text: 'Task 2', completed: false }
        ];
        
        // Trigger shortcut
        const event = new KeyboardEvent('keydown', {
            key: 'r',
            ctrlKey: true
        });
        
        document.dispatchEvent(event);
        
        // Verify only uncompleted todos remain
        expect(controller.model.todos).toHaveLength(1);
        expect(controller.model.todos[0].text).toBe('Task 2');
    });
});
```

#### Step 5: Documentation

**Update README.md:**
1. Add your shortcut to the appropriate category section
2. Include clear description and usage context
3. Update any relevant examples or workflows

**Required Documentation Format:**
```markdown
- **Ctrl+R** - Archive completed todos
  - Removes all completed todos from the active list
  - Shows confirmation message with count
  - Only available when todos exist
```

#### Step 6: Pull Request

**PR Requirements:**
- Clear, descriptive title
- Detailed description of the new shortcut functionality
- Screenshots or GIFs showing the shortcut in action (if UI changes)
- All tests passing
- Updated documentation

**PR Template:**
```markdown
## New Shortcut: [Shortcut Description]

**Shortcut:** Ctrl+[Key]
**Action:** [Brief description]
**Context:** [global/edit/specific]

### Changes Made
- [ ] Added shortcut to ShortcutsConfig.js
- [ ] Implemented handler in TodoController.js
- [ ] Added unit tests
- [ ] Updated README documentation
- [ ] Tested across major browsers

### Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] No conflicts with existing shortcuts
- [ ] Works with screen readers

### Additional Notes
[Any specific considerations or edge cases]
```

### Review Criteria

Your contribution will be evaluated on:

**Functionality:**
- ✅ Works across major browsers (Chrome, Firefox, Safari, Edge)
- ✅ No conflicts with existing shortcuts or browser defaults
- ✅ Handles edge cases gracefully
- ✅ Provides appropriate user feedback

**Code Quality:**
- ✅ Follows existing code conventions and patterns
- ✅ Includes comprehensive tests with good coverage
- ✅ Clear, maintainable implementation
- ✅ Proper error handling

**User Experience:**
- ✅ Enhances user productivity and workflow
- ✅ Intuitive and discoverable shortcut choice
- ✅ Works with accessibility tools
- ✅ Consistent with application design principles

**Documentation:**
- ✅ Clear, accurate documentation updates
- ✅ Includes usage examples and context
- ✅ Updates help system appropriately

### Advanced Contributions

#### Custom Context Types
For complex shortcuts that need special behavior contexts:

```javascript
// Add to KeyboardShortcutManager.js
getCurrentContext() {
    if (this.customCondition()) return 'custom';
    // ... existing context logic
}

// Add to ShortcutsConfig.js
{
    key: 'x',
    ctrlKey: true,
    context: 'custom',
    action: 'customAction',
    description: 'Custom context action (Ctrl+X)',
    category: 'Advanced'
}
```

#### Multi-Key Combinations
For shortcuts requiring multiple keys:

```javascript
{
    key: 'ArrowUp',
    ctrlKey: true,
    shiftKey: true,
    context: 'global',
    action: 'moveToTop',
    description: 'Move todo to top (Ctrl+Shift+↑)',
    category: 'Todo Management'
}
```

### Community Support

**Getting Help:**
- **GitHub Discussions**: Ask questions and get community feedback
- **GitHub Issues**: Report bugs or request features
- **Code Review**: Get feedback on your implementations

**Collaboration:**
- Review and test other community contributions
- Share ideas and best practices
- Help improve documentation and examples

### Recognition

Contributors who enhance the shortcut system will be:
- **Acknowledged** in release notes and commit history
- **Invited** to test new features before public release
- **Given priority** consideration for future feature discussions
- **Featured** as community contributors in project documentation

Your contributions make AutoToDo better for everyone. Thank you for helping build a more efficient, accessible todo application!

### Code Implementation Reference

#### Core Files
- **`js/ShortcutsConfig.js`** - Defines all shortcuts
- **`js/KeyboardShortcutManager.js`** - Handles events and context
- **`js/TodoController.js`** - Connects shortcuts to actions

#### Example Implementation
```javascript
// Shortcut definition (ShortcutsConfig.js)
{
    key: 'n',
    ctrlKey: true,
    context: 'global',
    action: focusNewTodo,
    description: 'Focus new todo input (Ctrl+N)',
    category: 'Navigation'
}

// Handler registration (TodoController.js)
const handlers = {
    focusNewTodo: () => this.focusNewTodo(),
    addTodo: () => this.addTodo(),
    // ... other handlers
};
```

#### Debug Commands
```javascript
// Browser console - inspect current shortcuts
console.log(shortcutManager.getAllShortcuts());
```

This code reference ensures complete accuracy between documentation and implementation, allowing developers to verify that all documented shortcuts exist and function as described in the actual codebase.

### Testing and Validation Methodology

AutoToDo employs comprehensive testing methodologies to ensure keyboard shortcuts work reliably across different scenarios and maintain consistency during development.

### Testing and Validation

#### Test Files
- **`keyboard-shortcuts.test.js`** - End-to-end behavior testing (13 tests)
- **`keyboard-shortcut-manager.test.js`** - Unit tests (33 tests)
- **`shortcuts-config.test.js`** - Configuration validation

#### Running Tests
```bash
node keyboard-shortcuts.test.js          # Main shortcut tests
node keyboard-shortcut-manager.test.js   # Manager unit tests
node shortcuts-config.test.js            # Config validation
```

#### Test Coverage
- ✅ Individual shortcut functionality
- ✅ Context-aware behavior
- ✅ Error handling
- ✅ Browser compatibility
- ✅ Performance validation

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


This comprehensive testing approach ensures keyboard shortcuts remain reliable, performant, and user-friendly across all development cycles and deployment environments.

### Visual Guide

#### Built-in Help System
Access comprehensive shortcut reference via:
- **Ctrl+H**, **?**, or **F1** - Opens categorized shortcuts dialog

#### Quick Workflows
- **Task Entry**: `Ctrl+N` → type → `Ctrl+Enter` → repeat
- **Search**: `/` → type → filter results
- **Management**: `Ctrl+T` (toggle), `Ctrl+Shift+D` (clear completed)

#### Visual Feedback
- Focus indicators show active elements
- Selection highlighting for batch operations  
- Status animations and confirmation dialogs
- Smooth theme transitions

### User Customization Options

#### Browser Extensions
- **Vimium** (Chrome/Firefox) - Vim-style navigation
- **Shortkeys** (Chrome) - Custom keyboard shortcuts
- **Surfingkeys** (Chrome/Firefox) - Advanced keyboard control

#### Developer Tools
```javascript
// Custom shortcut example (F12 Console)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        // Your custom action here
    }
});
```

#### User Script Managers
- **Tampermonkey** - Run custom scripts across browsers
- **Greasemonkey** (Firefox) - User script management

### Pro Tips
- **Built-in Help**: Press **Ctrl+H** for complete shortcuts reference
- **Rapid Entry**: Use **Ctrl+N** → type → **Ctrl+Enter** for quick task additions
- **Quick Search**: Press **/** to instantly jump to search
- **Batch Operations**: **Ctrl+A** + **Ctrl+Shift+D** for quick cleanup
- **Theme Toggle**: **Ctrl+M** switches light/dark modes

### Undo and Revert Actions
- **Escape** - Cancel editing, discard changes
- **Clear input** - Ctrl+A then Delete in input fields  
- **Dialog dismissal** - Escape or click outside

**Current Limitations**: No global undo for deletions or status changes. Use confirmation dialogs carefully.

### International Keyboards
- **Letter shortcuts** (Ctrl+N, Ctrl+F) work on all layouts
- **Special characters** (/, ?) may vary by layout - use Ctrl+F for search instead
- **Function keys** (F1, Escape) work universally
- **Help dialog** (Ctrl+H) shows shortcuts using your keyboard's actual characters

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
Have an idea for a useful keyboard shortcut? We'd love to hear from you! 

**For quick suggestions:**
When suggesting new shortcuts:

1. **Check existing shortcuts first**: Review the comprehensive [Keyboard Shortcuts](#keyboard-shortcuts) section to ensure your suggestion doesn't conflict with existing functionality
2. **Consider accessibility**: Think about how your suggestion would work across different keyboard layouts and accessibility needs
3. **Provide use case context**: Explain when and why the shortcut would be useful in typical workflows

**For technical contributions:**
If you're interested in implementing shortcuts yourself, see our comprehensive [Contributing to the Shortcut System](#contributing-to-the-shortcut-system) guide, which includes step-by-step development instructions, code examples, and testing requirements.

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



### Recognition

Contributors who provide valuable feedback or suggestions will be:
- Acknowledged in release notes when their suggestions are implemented
- Invited to test new features before public release
- Given priority consideration for future feature discussions

Your engagement helps make AutoToDo better for everyone. Thank you for being part of our community!
