# Manual Testing Guide for Drag & Drop Functionality

## Overview
This guide provides comprehensive instructions for manually testing the drag and drop functionality in the AutoToDo application. It covers both supported and unsupported browser scenarios.

## Browser Compatibility
The drag and drop feature requires HTML5 Drag and Drop API support, which is available in:
- **Supported Browsers:**
  - Chrome 4+
  - Firefox 3.5+
  - Safari 3.1+
  - Edge (all versions)
  - Internet Explorer 9+
  - Opera 12+

- **Unsupported Browsers:**
  - Very old browsers (IE 8 and below)
  - Some mobile browsers with limited drag/drop support
  - Browsers with JavaScript disabled

## Testing Scenarios

### 1. Basic Drag and Drop Functionality

#### Prerequisites
- Open the AutoToDo application in a supported browser
- Add at least 3-4 todo items for testing

#### Test Steps
1. **Visual Verification:**
   - Verify each todo item has a "≡" drag handle visible on the left
   - Hover over the drag handle - cursor should change to indicate draggability

2. **Simple Drag Operation:**
   - Click and hold the drag handle on the first todo item
   - Drag it to the position of the third todo item
   - Release the mouse button
   - **Expected Result:** First item should now appear in the third position

3. **Reverse Drag Operation:**
   - Click and hold the drag handle on the last todo item
   - Drag it to the first position
   - Release the mouse button
   - **Expected Result:** Last item should now appear first

4. **Middle Position Drag:**
   - Drag a todo from the middle to a different middle position
   - **Expected Result:** Item should move to the new position

### 2. Visual Feedback Testing

#### Test Steps
1. **Drag Start Feedback:**
   - Start dragging a todo item
   - **Expected Result:** Item should become slightly transparent (opacity reduced)

2. **Drag Over Feedback:**
   - While dragging, hover over another todo item
   - **Expected Result:** Target item should show visual indication (e.g., border highlight)

3. **Drop Feedback:**
   - Complete a drag and drop operation
   - **Expected Result:** All visual feedback should be removed after drop

### 3. Persistence Testing

#### Test Steps
1. **Local Storage Persistence:**
   - Drag and drop several items to reorder them
   - Refresh the browser page (F5 or Ctrl+R)
   - **Expected Result:** Todo order should remain as arranged before refresh

2. **Cross-Operation Persistence:**
   - Reorder todos using drag and drop
   - Add a new todo item
   - Edit an existing todo
   - Delete a todo
   - **Expected Result:** The remaining todos should maintain their dragged order

### 4. Search Filter Integration Testing

#### Test Steps
1. **Setup:**
   - Add todos with different keywords (e.g., "buy groceries", "call mom", "grocery shopping")
   
2. **Filtered Drag and Drop:**
   - Enter "grocery" in the search box to filter todos
   - Drag and drop the filtered results to reorder them
   - Clear the search filter
   - **Expected Result:** Todos should maintain their new order in the full list

3. **Search State Preservation:**
   - Filter todos using search
   - Perform drag and drop operation
   - **Expected Result:** Search filter should remain active during and after drag operation

### 5. Edit Mode Compatibility

#### Test Steps
1. **Edit Mode Drag Handle:**
   - Click "Edit" on a todo item
   - **Expected Result:** Drag handle should be visible but dimmed (opacity 0.3)
   - **Expected Result:** Item should not be draggable while in edit mode

2. **Exit Edit and Drag:**
   - Cancel or save the edit
   - Try dragging the same item
   - **Expected Result:** Drag functionality should work normally

### 6. Browser Compatibility Testing

#### Testing in Supported Browsers
1. **Chrome/Edge/Firefox/Safari:**
   - Follow all above test scenarios
   - **Expected Result:** All functionality should work smoothly

#### Testing in Unsupported Browsers
1. **Simulating Unsupported Browser:**
   - Open browser developer tools (F12)
   - Go to Console tab
   - Enter: `delete window.DataTransfer`
   - Refresh the page

2. **Unsupported Browser Behavior:**
   - **Expected Result:** A message should appear: "Your browser does not support drag and drop functionality. You can still add, edit, delete, and search todos normally."
   - **Expected Result:** Drag handles should show "≡" but with disabled styling
   - **Expected Result:** Hovering over drag handles should show "not-allowed" cursor
   - **Expected Result:** All other functionality (add, edit, delete, search) should work normally

### 7. Edge Cases and Error Handling

#### Test Steps
1. **Same Position Drop:**
   - Drag a todo item and drop it on itself
   - **Expected Result:** No change in order, no errors

2. **Rapid Drag Operations:**
   - Perform multiple drag and drop operations quickly
   - **Expected Result:** All operations should complete successfully

3. **Drag Outside List:**
   - Start dragging a todo item
   - Move cursor outside the todo list area
   - Release mouse button
   - **Expected Result:** No change in order, item returns to original position

### 8. Mobile Device Testing

#### Test Steps
1. **Touch Device Behavior:**
   - Test on tablets and touch-enabled devices
   - **Expected Result:** Drag and drop should work with touch gestures where supported
   - **Alternative:** On devices where touch drag is not supported, the unsupported browser message should appear

### 9. Performance Testing

#### Test Steps
1. **Large List Performance:**
   - Add 20+ todo items
   - Test drag and drop operations
   - **Expected Result:** Smooth performance without lag

2. **Memory Leak Check:**
   - Perform 10+ drag and drop operations
   - Check browser memory usage (if possible)
   - **Expected Result:** No significant memory increase

## Automated Test Verification

### Running Unit Tests
```bash
npm run test:drag-drop
```
**Expected Result:** All 7 unit tests should pass

### Running Integration Tests
Open `test-drag-drop-integration.html` in browser
**Expected Result:** All 5 integration tests should pass

### Running All Tests
```bash
npm test
```
**Expected Result:** All tests (35+ total) should pass

## Reporting Issues

When reporting drag and drop issues, please include:
1. **Browser:** Name and version
2. **Operating System:** Name and version
3. **Steps to Reproduce:** Exact sequence of actions
4. **Expected Behavior:** What should happen
5. **Actual Behavior:** What actually happened
6. **Screenshots:** If applicable
7. **Console Errors:** Any JavaScript errors in browser console

## Troubleshooting Common Issues

### Issue: Drag handle not visible
- **Cause:** CSS not loading properly
- **Solution:** Refresh page, check network tab for CSS load errors

### Issue: Drag not working
- **Cause:** Browser doesn't support HTML5 drag/drop
- **Solution:** Use a modern browser, check for JavaScript errors

### Issue: Order not persisting
- **Cause:** localStorage might be disabled
- **Solution:** Check browser privacy settings, enable localStorage

### Issue: Drag works but visual feedback missing
- **Cause:** CSS drag styles not applying
- **Solution:** Check browser console for CSS errors, verify styles.css is loaded

This comprehensive guide ensures thorough testing of the drag and drop functionality across all scenarios and browser compatibility levels.