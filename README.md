# AutoToDo
A todo app automatically created by AI starting from just a readme file. It lets you create, read, update and delete Todos with a graphical UI.

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
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 16+
- ✅ Most modern mobile browsers

### Data Storage
Your todos are automatically saved in your browser's local storage. Data persists between sessions but is specific to the browser and domain where you run the app.

### Troubleshooting
- **App doesn't load properly when opened directly:** Try using a local server (Option 2) instead of opening the file directly
- **Todos don't save:** Ensure your browser allows localStorage and you're not in private/incognito mode
- **Styling issues:** Make sure you're using a modern browser that supports CSS Grid and Flexbox

## Features
- ✅ Create new todos with a simple form
- ✅ View all todos in a clean, organized list
- ✅ Search todos by keywords in real-time
- ✅ Edit existing todos inline
- ✅ Delete todos with confirmation dialog
- ✅ Mark todos as completed with checkboxes
- ✅ Data persistence using localStorage
- ✅ Responsive design with modern UI

## How to Use
1. Open `index.html` in a web browser
2. Add new todos using the input field at the top
3. Use the search field to filter todos by keywords
4. Click checkboxes to mark todos as completed
5. Use Edit buttons to modify todo text
6. Use Delete buttons to remove todos (with confirmation)

## Keyboard Shortcuts
AutoToDo supports comprehensive keyboard shortcuts to help you navigate and interact with the app more efficiently:

### Adding Todos
- **Enter** in "What needs to be done?" field - Add the new todo and automatically focus back to input field for quick consecutive additions
- **Tab** from input field - Move focus to "Add Todo" button, then **Enter** or **Space** to add

### Search and Filtering
- **Tab** to search field or click directly to focus
- Type to search (real-time filtering as you type)
- **Ctrl+A** - Select all text in search field
- **Backspace** or **Delete** - Clear search characters
- **Enter** in search field - Apply search filter (though real-time search works automatically)

### Todo List Navigation
- **Tab** - Navigate between todo checkboxes, Edit buttons, and Delete buttons
- **Shift+Tab** - Navigate backwards through elements
- **Enter** or **Space** on focused buttons - Activate Edit/Delete actions
- **Space** on focused checkbox - Toggle todo completion status
- **Arrow keys** - Navigate within text when editing

### Editing Todos
- **Enter** or click "Edit" button - Enter edit mode for a todo
- **Enter** in edit field - Save changes and return to view mode
- **Escape** - Cancel edit mode and discard changes
- **Tab** within edit mode - Move between edit input, Save, and Cancel buttons
- **Ctrl+A** in edit field - Select all text for quick replacement

### Text Selection and Editing
- **Ctrl+A** - Select all text in any input field
- **Ctrl+C** / **Ctrl+V** - Copy and paste text (standard browser shortcuts)
- **Home** / **End** - Move cursor to beginning/end of text
- **Ctrl+Left/Right** - Move cursor by word
- **Shift+Arrow keys** - Select text while moving cursor

### Accessibility Features
- All interactive elements are keyboard accessible via **Tab** navigation
- Focus indicators clearly show which element is active
- Screen readers can navigate the todo list structure
- No mouse required - complete keyboard-only operation is supported

### Tips for Efficient Use
- After adding a todo, focus automatically returns to the input field for rapid todo creation
- Use the search field to quickly filter large todo lists
- **Tab** through todos to quickly mark multiple items as complete using **Space**
- The app maintains focus context - editing a todo and pressing **Escape** returns focus appropriately
- All standard browser text editing shortcuts work within input fields

## Bug Fix
Fixed the issue where users were unable to delete todos using the graphical UI. The delete functionality now works correctly with:
- Proper event binding for delete buttons
- Confirmation dialogs for safety
- Correct removal from both DOM and localStorage
- UI updates after deletion
