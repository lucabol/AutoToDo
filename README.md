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
AutoToDo supports several keyboard shortcuts to help you navigate and interact with the app more efficiently:

### General Navigation
- **Tab** - Navigate between form elements and interactive controls (standard browser behavior)
- **Space** - Toggle checkboxes when focused on them

### Adding Todos
- **Enter** in "What needs to be done?" field - Add the new todo and automatically focus back on the input field for quick consecutive additions

### Editing Todos
- **Enter** in edit mode - Save changes and return to view mode
- **Escape** in edit mode - Cancel editing and discard changes, returning to the original text

### Search Functionality
- **Enter** in search field - Apply search filter (though search works in real-time as you type)

### Tips for Efficient Use
- After adding a todo, the input field automatically stays focused for adding more todos quickly
- Use **Tab** to navigate to checkboxes and press **Space** to mark todos as completed
- When editing a todo, press **Escape** to cancel changes if you make a mistake
- Use the search field to quickly find specific todos in large lists
- The app is fully keyboard accessible - you can perform all actions using only the keyboard

## Bug Fix
Fixed the issue where users were unable to delete todos using the graphical UI. The delete functionality now works correctly with:
- Proper event binding for delete buttons
- Confirmation dialogs for safety
- Correct removal from both DOM and localStorage
- UI updates after deletion
