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

> **💡 Quick Help**: Press **Ctrl+H**, **?**, or **F1** anytime to view the built-in shortcuts reference dialog.

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

To add new shortcuts, modify the `getShortcuts()` method in `ShortcutsConfig.js`:

```javascript
// Example: Add a new shortcut for archiving todos
{
    key: 'r',
    ctrlKey: true,
    context: 'global',
    action: archiveTodo,
    preventDefault: true,
    description: 'Archive selected todo (Ctrl+R)',
    category: 'Todo Management'
}
```

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

For detailed implementation examples, refer to the existing shortcuts in `ShortcutsConfig.js`.

### Pro Tips for Maximum Efficiency

- **📚 Built-in Help**: Press **Ctrl+H** to access the complete shortcuts reference organized by category
- **⚡ Rapid Entry**: After adding a todo, focus automatically returns to the input field for consecutive additions
- **🔍 Quick Search**: Use **/** to instantly jump to search and filter large todo lists without clicking
- **🎯 Batch Operations**: Combine **Ctrl+A** (select all) with **Ctrl+Shift+D** (clear completed) for quick cleanup
- **🌙 Theme Switching**: Press **Ctrl+M** to quickly toggle between light and dark modes based on your environment
- **🧠 Context Awareness**: The application intelligently handles shortcuts based on your current activity (editing vs. browsing)

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
