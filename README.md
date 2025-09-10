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

**For Safari 14+ (Specific Issues and Solutions):**

Safari 14 and later versions include enhanced privacy features and stricter security policies that can affect web applications like AutoToDo. Here are common issues and their solutions:

*localStorage and Data Persistence Issues:*
- **Intelligent Tracking Prevention (ITP) clears data:** Safari 14+ may automatically clear localStorage after 7 days of inactivity
  - Solution: Regularly use the app to prevent automatic data clearing
  - Workaround: Export/backup your todos periodically (copy from browser console: `JSON.stringify(localStorage.getItem('todos'))`)
  - Consider adding AutoToDo to your Home Screen (iOS) for app-like persistence

- **Private browsing severely limits storage:** 
  - Solution: Use regular browsing mode for persistent todo storage
  - Alternative: Keep Safari window open to maintain session storage during private browsing

- **Cross-site tracking settings interfere with localStorage:**
  - Go to Safari Preferences → Privacy → Uncheck "Prevent cross-site tracking" if you experience data loss
  - Or: Safari Settings → Privacy & Security → Allow "Website tracking" for better localStorage reliability

*CSS Rendering and Layout Issues:*
- **Flexbox gap property not supported (Safari 14.0):**
  - Issue: Todo items may appear too close together
  - Auto-fixed: The app uses margin-based spacing as fallback
  - Update to Safari 14.1+ for full flexbox gap support

- **CSS Grid behavior differences:**
  - Some grid layouts may render slightly differently than other browsers
  - The app includes Safari-specific CSS adjustments
  - If layout appears broken, try zooming in/out (Cmd +/-) to force re-render

- **Dark mode CSS variable issues:**
  - Theme switching may not work smoothly on Safari 14.0-14.2
  - Solution: Update to Safari 14.3+ for improved CSS custom properties support
  - Workaround: Refresh the page after switching themes if colors don't update

*JavaScript and Performance Issues:*
- **Crypto.randomUUID() not available (Safari 14.0-14.5):**
  - The app automatically falls back to alternative ID generation methods
  - No action required - this is handled transparently

- **Performance with large todo lists:**
  - Safari 14+ may be slower with 500+ todos due to enhanced memory management
  - Solution: Use search functionality to filter large lists
  - Consider archiving completed todos by exporting them and starting fresh

*Mobile Safari (iOS 14+) Specific Issues:*
- **Viewport scaling problems:**
  - Add AutoToDo to Home Screen for better mobile experience (Share → Add to Home Screen)
  - This provides app-like viewport handling and persistent storage

- **Touch interaction delays:**
  - Enable "Fast clicking" by ensuring JavaScript is enabled
  - Disable "Reduce Motion" in iOS Accessibility settings if animations feel sluggish

- **Keyboard shortcuts not working:**
  - External keyboard shortcuts work better with AutoToDo added to Home Screen
  - Some shortcuts may conflict with iOS system shortcuts

*Troubleshooting Steps for Safari 14+:*
1. **First, try these quick fixes:**
   - Update Safari to the latest version (Safari → About Safari)
   - Clear browser cache and cookies for the AutoToDo domain
   - Disable browser extensions temporarily to rule out conflicts

2. **For localStorage issues:**
   - Check Storage settings: Safari Preferences → Websites → Local Storage → Allow for this website
   - Verify you're not in Private Browsing mode (file:// or domain should show normal, not dark address bar)
   - Test with a local server (http://localhost) instead of file:// protocol

3. **For layout/rendering issues:**
   - Try force-refresh with Cmd+Shift+R (macOS) or Ctrl+Shift+R
   - Check zoom level is at 100% (View → Actual Size or Cmd+0)
   - Enable "Show Develop menu" and use "Disable Caches" while testing

4. **If problems persist:**
   - Use Safari's Web Inspector (Develop → Show Web Inspector) to check Console for errors
   - Compare behavior with Chrome/Firefox to confirm if it's Safari-specific
   - Consider using Chrome or Firefox as alternatives if Safari issues can't be resolved

#### Getting Help
If you continue experiencing issues:
1. Check the browser console (F12 → Console tab) for error messages
2. Try the app in a different browser to isolate the problem
3. Ensure you're using a supported browser version (see Browser Compatibility section)
4. Use the local server installation method for the most reliable experience

### Mobile Browser Troubleshooting

AutoToDo is designed to work seamlessly on mobile devices, but mobile browsers can present unique challenges. This section provides comprehensive solutions for mobile-specific issues.

#### Touch and Interaction Issues

##### Touch Events Not Responding
- **Symptoms:** Buttons, checkboxes, or input fields don't respond to taps
- **Solutions:**
  - Ensure JavaScript is enabled in your mobile browser settings
  - Try tapping more precisely on the center of interactive elements
  - Disable any ad blockers or script blockers temporarily
  - Clear browser cache and reload the page
  - Try using a different mobile browser (Chrome, Firefox, Safari, Edge)

##### Delayed or Double-Tap Issues
- **Symptoms:** Need to tap twice or experience delays when interacting with elements
- **Solutions:**
  - Disable "double-tap to zoom" in browser settings if available
  - Use single, deliberate taps rather than quick successive taps
  - Ensure the viewport meta tag is working properly (refresh the page)
  - Try rotating device orientation and back to reset touch calibration

##### Scroll and Swipe Conflicts
- **Symptoms:** Difficulty scrolling through todos or accidental interactions while scrolling
- **Solutions:**
  - Use slower, more deliberate scroll gestures
  - Scroll using empty areas between todo items
  - If using iOS Safari, disable "Prevent Cross-Site Tracking" temporarily
  - Clear browser data to reset touch gesture recognition

#### Mobile Layout and Display Issues

##### Cramped or Overlapping Interface
- **Symptoms:** Elements appear too close together or overlap on small screens
- **Solutions:**
  - Rotate device to landscape mode for more space
  - Zoom out slightly using browser zoom controls (pinch gesture)
  - Use browser's "Request Desktop Site" for temporary wider layout
  - Update to latest browser version for improved responsive design support

##### Text Too Small to Read
- **Symptoms:** Todo text, buttons, or interface elements are difficult to read
- **Solutions:**
  - Use device accessibility settings to increase system font size
  - Zoom in using pinch gesture or browser zoom controls
  - Enable "Large Text" or "Bold Text" in device accessibility settings
  - Try landscape orientation for wider text display

##### Cut-off or Hidden Elements
- **Symptoms:** Parts of the interface are not visible or cut off
- **Solutions:**
  - Refresh the page to recalculate viewport dimensions
  - Rotate device orientation and back to trigger layout recalculation
  - Clear browser cache and reload
  - Disable browser zoom and reset to 100% (double-tap address bar area)

#### iOS Safari Specific Issues

##### App Constantly Reloads or Refreshes
- **Symptoms:** App restarts or loses state when switching between apps
- **Solutions:**
  - Add the app to home screen for better memory management
  - Close unnecessary browser tabs to free up memory
  - Restart Safari app completely (double-tap home button, swipe up on Safari)
  - Update iOS to latest version for improved memory management

##### LocalStorage Data Loss
- **Symptoms:** Todos disappear after closing browser or switching apps
- **Solutions:**
  - Disable "Private Browsing" mode - check if URL bar is dark
  - Turn off "Prevent Cross-Site Tracking" in Safari settings
  - Enable "Block All Cookies" → Never in Safari settings
  - Add app to home screen to run in standalone mode

##### Keyboard Issues
- **Symptoms:** Virtual keyboard doesn't appear, hides content, or causes layout issues
- **Solutions:**
  - Tap directly in the center of input fields
  - If keyboard doesn't appear, double-tap the input field
  - Scroll manually when keyboard hides input fields
  - Use "Done" button on keyboard instead of hiding manually

##### Touch Target Problems
- **Symptoms:** Difficulty tapping small buttons or checkboxes
- **Solutions:**
  - Use iOS accessibility feature "AssistiveTouch" for more precise taps
  - Enable "Button Shapes" in iOS accessibility settings for clearer targets
  - Try tapping slightly above or below the target if direct taps don't work
  - Use landscape mode for larger touch targets

#### Android Browser Compatibility

##### Chrome Mobile Issues
- **Symptoms:** App doesn't load properly or features don't work
- **Solutions:**
  - Update Chrome to latest version from Google Play Store
  - Clear Chrome app data: Settings → Apps → Chrome → Storage → Clear Data
  - Disable Chrome's "Lite Mode" or "Data Saver" if enabled
  - Try loading in Chrome's incognito mode to rule out extension conflicts

##### Samsung Internet Browser
- **Symptoms:** Layout issues or functionality problems
- **Solutions:**
  - Enable "Desktop Mode" temporarily to test compatibility
  - Update Samsung Internet to latest version
  - Clear browser data and cache
  - Disable "Smart Anti-Tracking" if todos don't save properly

##### Default Android Browser (older versions)
- **Symptoms:** App doesn't work on older Android devices
- **Solutions:**
  - Install Chrome, Firefox, or Opera for better compatibility
  - Enable JavaScript in browser settings
  - Clear all browser data and try again
  - Consider using "Desktop Site" mode for fuller compatibility

#### Performance Optimization for Mobile

##### App Feels Slow or Unresponsive
- **Solutions:**
  - Close other browser tabs to free up memory
  - Restart browser app completely
  - Clear browser cache and cookies
  - Disable browser extensions if any are installed
  - Free up device storage space (keep at least 1GB free)
  - Charge device - some browsers reduce performance on low battery

##### Large Number of Todos Causing Lag
- **Solutions:**
  - Consider archiving completed todos by deleting them periodically
  - Use the search feature to filter large lists instead of scrolling
  - Break down large todos into smaller, more manageable tasks
  - Clear completed todos regularly using Ctrl+Shift+D

##### Slow Loading or Network Issues
- **Solutions:**
  - Use local server method instead of file:// protocol
  - Ensure strong Wi-Fi or mobile data connection
  - Disable mobile data restrictions for your browser app
  - Try loading in airplane mode (if files are cached locally)

#### Battery and Performance Optimization

##### High Battery Usage
- **Solutions:**
  - Enable browser's "Data Saver" or "Lite Mode" when available
  - Use dark theme to reduce screen power consumption
  - Close the app when not in use rather than leaving it open
  - Reduce screen brightness while using the app

##### Memory Optimization
- **Solutions:**
  - Regularly clear browser cache and data
  - Close other apps running in background
  - Restart device if experiencing persistent slowness
  - Use "Low Power Mode" (iOS) or "Battery Saver" (Android) if needed

#### Mobile-Specific Keyboard Shortcuts

Since mobile devices don't have physical keyboards, most keyboard shortcuts won't work. However:
- **iOS with External Keyboard:** All keyboard shortcuts work as documented
- **Android with External Keyboard:** Most shortcuts work, some may require different key combinations
- **Virtual Keyboards:** Focus shortcuts work - tapping input fields will show relevant virtual keyboards
- **Voice Input:** Use device voice input features in todo input fields for hands-free todo creation

#### Connectivity and Offline Usage

##### Using AutoToDo Offline
- **Solutions:**
  - Load the app while connected to internet first
  - Once loaded, the app works offline for basic todo operations
  - Data syncs to localStorage immediately (no internet required)
  - For local server method, ensure server remains running for offline access

##### Network-Related Issues
- **Solutions:**
  - Use local server method (http://localhost:8000) instead of file:// access
  - Check mobile data or Wi-Fi connectivity
  - Try different network (mobile data vs Wi-Fi) to isolate issues
  - Disable VPN temporarily if app doesn't load

#### Getting Mobile-Specific Help

If mobile issues persist:
1. **Check Device Compatibility:** Ensure iOS 11+ or Android 5.0+ with modern browser
2. **Test in Different Browser:** Try Chrome, Firefox, Safari, or Edge mobile
3. **Reset Browser:** Clear all browser data and restart browser app
4. **Device Restart:** Restart your mobile device to clear memory issues
5. **Update Everything:** Update browser app, device OS, and clear storage space
6. **Use Desktop Version Temporarily:** For complex todo management, use desktop browser as backup

**Mobile Browser Testing Priority:**
1. Chrome Mobile (best compatibility)
2. Safari iOS (if on iPhone/iPad) 
3. Firefox Mobile (good fallback)
4. Samsung Internet (Android Samsung devices)
5. Edge Mobile (Microsoft ecosystem)

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

> 💡 **Pro Tip**: Press **Ctrl+H**, **?**, or **F1** to see all available shortcuts in the help modal!

### Quick Actions
- **Ctrl+N** - Focus new todo input field
- **Ctrl+F** or **/** - Focus search input field  
- **Ctrl+Enter** - Add new todo (or focus input if empty)
- **Ctrl+M** - **Toggle between light and dark themes** 🌙 ☀️
- **Ctrl+H** - Show keyboard shortcuts help dialog

### Todo Management
- **Ctrl+T** - Toggle completion of first todo item
- **Ctrl+Delete** - Delete first todo item  
- **Ctrl+A** - Select all todos (visual feedback)
- **Ctrl+Shift+D** - Clear all completed todos

### Adding Todos
- **Enter** in "What needs to be done?" field - Add the new todo and automatically focus back to input field for quick consecutive additions
- **Tab** from input field - Move focus to "Add Todo" button, then **Enter** or **Space** to add

### Search and Filtering
- **Tab** to search field or click directly to focus
- Type in search field for real-time filtering
- **Enter** in search field - Apply search filter
- **Backspace** or **Delete** - Clear search characters
### Basic Navigation
- **Tab** - Navigate between todo checkboxes, Edit buttons, and Delete buttons
- **Shift+Tab** - Navigate backwards through elements
- **Enter** or **Space** on focused buttons - Activate Edit/Delete actions
- **Space** on focused checkbox - Toggle todo completion status
- **Arrow keys** - Navigate within text when editing

### Editing Mode
When editing a todo item:
- **Enter** or click "Edit" button - Enter edit mode for a todo
- **Enter** or **Ctrl+S** in edit field - Save changes and exit edit mode
- **Escape** - Cancel editing and discard changes
- **Tab** within edit mode - Move between edit input, Save, and Cancel buttons

### Text Operations
- **Ctrl+A** - Select all text in any input field
- **Ctrl+C** / **Ctrl+V** - Copy and paste text (standard browser shortcuts)
- **Home** / **End** - Move cursor to beginning/end of text
- **Ctrl+Left/Right** - Move cursor by word
- **Shift+Arrow keys** - Select text while moving cursor

### Search and Filtering
- Type in search field for real-time filtering
- **Enter** in search field - Apply search filter
- **Backspace** or **Delete** - Clear search characters

### Accessibility Features
- All interactive elements are keyboard accessible via **Tab** navigation
- Focus indicators clearly show which element is active
- Screen readers can navigate the todo list structure
- No mouse required - complete keyboard-only operation is supported

### Advanced Shortcuts
For a complete list of all available keyboard shortcuts, including advanced combinations and context-specific shortcuts, see the [detailed keyboard shortcuts documentation](KEYBOARD_SHORTCUTS.md) or press **Ctrl+H** within the application.

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
