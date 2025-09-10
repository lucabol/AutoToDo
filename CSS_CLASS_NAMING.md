# CSS Class Naming Conventions

This document outlines the consistent CSS class naming conventions used in AutoToDo, particularly for the dark mode theme implementation.

## Naming Convention: kebab-case

All CSS classes follow the kebab-case convention (lowercase with hyphens).

## Theme-Related Classes

### Core Theme Classes
- `.dark-theme` - Applied to `<body>` when dark mode is active
- `.light-theme` - Applied to `<body>` when light mode is active (explicit class for better specificity)

### Theme Toggle Elements
- `.theme-toggle` - The theme toggle button
- `.theme-toggle:hover` - Hover state for theme toggle
- `.theme-icon` - Icon element within the theme toggle (🌙/☀️)
- `.theme-text` - Text element within the theme toggle ("Dark"/"Light")

## CSS Variable Naming

Theme-related CSS variables follow a semantic naming pattern:

### Background Colors
- `--bg-primary` - Main background color
- `--bg-secondary` - Secondary background (cards, inputs)
- `--bg-tertiary` - Tertiary background (modals, overlays)
- `--bg-quaternary` - Additional background level
- `--bg-hover` - Hover state backgrounds

### Text Colors
- `--text-primary` - Main text color
- `--text-secondary` - Secondary text color (muted)
- `--text-tertiary` - Tertiary text color (disabled)

### Border Colors
- `--border-primary` - Main border color
- `--border-secondary` - Secondary border color
- `--border-hover` - Hover state borders

### Accent Colors
- `--accent-primary` - Main accent color (buttons, links)
- `--accent-hover` - Hover state for accent elements
- `--success` - Success state color
- `--success-hover` - Success hover state
- `--danger` - Error/danger state color
- `--danger-hover` - Danger hover state

## Consistent Patterns

### State Classes
- `.completed` - For completed todo items
- `.selected` - For selected elements
- `.dragging` - For elements being dragged
- `.drag-over` - For drop target elements

### Component Classes
- `.todo-item` - Individual todo items
- `.todo-list` - Container for todo items
- `.todo-input` - Input field for new todos
- `.todo-text` - Text content of todos
- `.todo-actions` - Action buttons container

### Button Classes
- `.add-btn` - Add/create buttons
- `.edit-btn` - Edit buttons
- `.delete-btn` - Delete buttons
- `.save-btn` - Save buttons
- `.clear-search-btn` - Clear search button

### Form Classes
- `.search-input` - Search input field
- `.edit-input` - Edit mode input field

## Safari 14.3+ Specific Enhancements

### Color Scheme Integration
- `:root` selector includes `color-scheme: light`
- `.dark-theme` selector includes `color-scheme: dark`
- Media queries use `prefers-color-scheme` for system theme detection

### Performance Optimizations
- Transition properties include `-webkit-transition` for Safari compatibility
- `prefers-reduced-motion` media query respects accessibility preferences

## Validation

To ensure consistency, all class names should:
1. Use lowercase letters only
2. Use hyphens to separate words (kebab-case)
3. Be semantic and descriptive
4. Follow the established patterns above
5. Avoid abbreviations unless commonly understood

## Example Usage

```css
/* Good - follows naming convention */
.theme-toggle {
    background: var(--bg-tertiary);
    border: 2px solid var(--border-primary);
}

.theme-toggle:hover {
    background: var(--bg-hover);
}

/* Bad - inconsistent naming */
.themeToggle { /* camelCase */ }
.theme_toggle { /* snake_case */ }
.THEME-TOGGLE { /* uppercase */ }
```

This consistent naming approach ensures maintainability and makes the codebase easier to understand and extend.