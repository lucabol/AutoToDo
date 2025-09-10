# Dark Mode Manual Testing Guide

This document provides comprehensive instructions for developers and reviewers to manually test the AutoToDo dark mode functionality across different browsers and scenarios.

## Overview

The AutoToDo application supports both automatic system-based dark mode detection and manual theme toggle functionality. This guide covers testing procedures for all supported features.

## Testing Scenarios

### 1. System-Based Dark Mode Detection

#### Safari 14.3+ Testing
1. **Prerequisites**: Safari 14.3 or later
2. **System Setup**: 
   - macOS: System Preferences → General → Appearance → Dark
   - iOS: Settings → Display & Brightness → Dark
3. **Testing Steps**:
   - Open AutoToDo in Safari
   - **Expected**: App automatically displays in dark theme
   - **Verify**: Check CSS `color-scheme: light dark` property is active
   - **Verify**: No manual theme selection stored in localStorage

#### Chrome/Firefox/Edge Testing
1. **System Setup**: Enable system dark mode (same as Safari)
2. **Testing Steps**:
   - Open AutoToDo in browser
   - **Expected**: App automatically displays in dark theme via CSS media queries
   - **Verify**: `prefers-color-scheme: dark` media query is triggered

### 2. Manual Theme Toggle Testing

#### Basic Toggle Functionality
1. **Starting State**: Any theme (light/dark)
2. **Testing Steps**:
   - Click the theme toggle button (🌙/☀️ icon)
   - **Expected**: Theme switches immediately
   - **Expected**: Button icon and text update (🌙 Dark ↔ ☀️ Light)
   - **Expected**: Theme preference saved to localStorage

#### Override System Preference
1. **Prerequisites**: System dark mode enabled
2. **Testing Steps**:
   - App loads in dark theme (automatic detection)
   - Click theme toggle to switch to light theme
   - **Expected**: App switches to light theme despite system preference
   - **Expected**: localStorage contains `todo-theme: light`
   - Refresh the page
   - **Expected**: App maintains light theme (manual preference persists)

### 3. Edge Case Testing

#### localStorage Unavailable (Private/Incognito Mode)
1. **Setup**: Open AutoToDo in private/incognito browsing
2. **Testing Steps**:
   - Try toggling theme
   - **Expected**: Theme switches work but don't persist
   - **Expected**: No JavaScript errors in console
   - Refresh page
   - **Expected**: Falls back to system preference or light theme

#### Invalid localStorage Data
1. **Setup**: 
   - Open browser developer tools
   - Execute: `localStorage.setItem('todo-theme', 'invalid-value')`
2. **Testing Steps**:
   - Refresh the page
   - **Expected**: App defaults to light theme or system preference
   - **Expected**: No JavaScript errors

#### System Theme Change During Session
1. **Setup**: AutoToDo open with no manual theme set
2. **Testing Steps**:
   - Change system theme (macOS: Control Center → Display)
   - **Expected**: App theme updates automatically (Safari 14.3+)
   - **Note**: Other browsers may require page refresh

### 4. Cross-Browser Visual Verification

#### Required Test Browsers
- **Safari 14.3+** (macOS/iOS): Native `color-scheme` support
- **Chrome 76+**: CSS media query support
- **Firefox 67+**: CSS media query support  
- **Edge 79+**: CSS media query support

#### Visual Elements to Verify

**Light Theme Checklist**:
- [ ] Background: Light gray (#f5f5f7)
- [ ] Container: White background
- [ ] Text: Dark (#1d1d1f)
- [ ] Inputs: Light background (#f8f8f8)
- [ ] Buttons: Blue accent (#007aff)
- [ ] Toggle button: Shows 🌙 Dark

**Dark Theme Checklist**:
- [ ] Background: Dark gray (#1c1c1e)
- [ ] Container: Dark container (#2c2c2e)
- [ ] Text: White (#ffffff)
- [ ] Inputs: Dark background (#48484a)
- [ ] Buttons: Bright blue (#0a84ff)
- [ ] Toggle button: Shows ☀️ Light

#### Responsive Testing
Test on multiple screen sizes:
- Desktop (1920x1080, 1366x768)
- Tablet (iPad: 1024x768)
- Mobile (iPhone: 375x667, Android: 360x640)

### 5. Performance Testing

#### Theme Transition Smoothness
1. **Testing Steps**:
   - Toggle theme rapidly (5-10 times)
   - **Expected**: Smooth 0.3s transitions
   - **Expected**: No flickering or layout shifts
   - **Expected**: No performance degradation

#### Large Todo List Testing
1. **Setup**: Create 50+ todo items
2. **Testing Steps**:
   - Toggle theme
   - **Expected**: All items transition smoothly
   - **Expected**: No rendering delays

### 6. Accessibility Testing

#### Color Contrast Verification
- **Tool**: Browser dev tools accessibility panel
- **Expected**: WCAG AA compliance in both themes
- **Check**: Text contrast ratios ≥ 4.5:1

#### Screen Reader Testing
- **Tool**: VoiceOver (macOS), NVDA (Windows)
- **Expected**: Theme toggle announced as "Dark mode button" / "Light mode button"
- **Expected**: Theme changes announced

## Automated Testing Verification

Before manual testing, run the automated test suite:

```bash
npm test
```

**Expected Results**:
- 11/11 theme tests passing
- 92/92 total tests passing
- Zero regressions

## Bug Report Template

If issues are found during testing, use this template:

```
**Browser**: [Safari 14.x / Chrome xx / Firefox xx]
**OS**: [macOS xx.x / Windows 10 / iOS xx]
**Issue**: [Brief description]
**Steps to Reproduce**: 
1. [Step 1]
2. [Step 2]
**Expected Behavior**: [What should happen]
**Actual Behavior**: [What actually happens]
**Console Errors**: [Any JavaScript errors]
**localStorage State**: [Value of 'todo-theme' key]
```

## Implementation Notes

### CSS Architecture
- **Base Layer**: `:root` with light theme defaults
- **Auto Detection**: `@media (prefers-color-scheme: dark)` overrides
- **Manual Override**: `.dark-theme` class with `!important` declarations

### Browser Compatibility Matrix
| Feature | Safari 14.3+ | Chrome 76+ | Firefox 67+ | Edge 79+ |
|---------|---------------|------------|-------------|----------|
| `color-scheme` | ✅ Native | ❌ | ❌ | ❌ |
| `prefers-color-scheme` | ✅ | ✅ | ✅ | ✅ |
| Manual toggle | ✅ | ✅ | ✅ | ✅ |

This comprehensive testing guide ensures the dark mode implementation works correctly across all supported browsers and edge cases.