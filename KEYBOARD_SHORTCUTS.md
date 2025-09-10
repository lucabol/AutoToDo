# Keyboard Shortcuts

AutoToDo supports an extensive set of keyboard shortcuts for efficient task management. The shortcuts are managed by a modular `KeyboardShortcutManager` system with centralized configuration that makes it easy to add new shortcuts in the future.

## Available Shortcuts

### Navigation
Shortcuts for moving around the application:

- **Ctrl+N** - Focus new todo input field
- **Ctrl+F** - Focus search input field  
- **/** - Focus search input field (alternative)

### Todo Management
Shortcuts for managing your todos:

- **Ctrl+Enter** - Add new todo (or focus input if empty)
- **Ctrl+T** - Toggle completion of first todo item
- **Ctrl+Delete** - Delete first todo item  
- **Ctrl+A** - Select all todos (visual feedback)
- **Ctrl+Shift+D** - Clear all completed todos

### Editing Mode
These shortcuts are available when editing a todo item:

- **Escape** - Cancel editing and discard changes
- **Ctrl+S** - Save changes and exit edit mode
- **Enter** - Save changes and exit edit mode (alternative)

### General
Application-wide shortcuts:

- **Ctrl+H** - Show keyboard shortcuts help dialog
- **?** - Show keyboard shortcuts help dialog (alternative)
- **F1** - Show keyboard shortcuts help dialog (alternative)
- **Ctrl+M** - Toggle between light and dark themes

## Implementation

The keyboard shortcuts are implemented using a highly modular and extensible approach:

### Core Components

- **KeyboardShortcutManager** - Main class that handles shortcut registration and execution
- **ShortcutsConfig** - Centralized configuration for all shortcuts with categories
- **Context-aware** - Shortcuts can be specific to certain contexts (e.g., editing mode)
- **Configuration-driven** - Easy to add new shortcuts without modifying core logic
- **Extensible** - Supports complex key combinations and conditional activation

### Key Features

- **Centralized Configuration**: All shortcuts are defined in one place (`ShortcutsConfig.js`)
- **Categorized Organization**: Shortcuts are organized by category (Navigation, Todo Management, etc.)
- **Visual Feedback**: Actions provide user feedback through messages and animations
- **Help System**: Built-in help dialog accessible via multiple shortcuts
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Responsive**: Help dialog adapts to different screen sizes

## Adding New Shortcuts

To add a new keyboard shortcut:

1. **Add to ShortcutsConfig**: Update the `getShortcuts()` method in `js/ShortcutsConfig.js`:

```javascript
{
    key: 'r',
    ctrlKey: true,
    context: 'global',
    action: refreshTodos,
    preventDefault: true,
    description: 'Refresh todos (Ctrl+R)',
    category: 'Todo Management'
}
```

2. **Implement the handler**: Add the handler function to `TodoController`:

```javascript
refreshTodos() {
    this.render();
    this.view.showMessage('Todos refreshed', 'success');
}
```

3. **Add to handler mapping**: Include the handler in the `setupKeyboardShortcuts()` method:

```javascript
const handlers = {
    // ... existing handlers
    refreshTodos: () => this.refreshTodos()
};
```

4. **Add tests**: Create tests for the new functionality
5. **Update documentation**: Add the shortcut to this documentation

## Technical Details

The `KeyboardShortcutManager` provides:
- Context registration with condition checkers
- Shortcut registration with modifiers and descriptions  
- Event handling with proper context resolution
- Error handling and debugging capabilities
- Easy removal and management of shortcuts

The `ShortcutsConfig` provides:
- Centralized shortcut definitions
- Category-based organization
- Key combination formatting utilities
- Validation rules for preventing conflicts
- Extensible configuration structure

## Help System

The application includes a built-in help system accessible via:
- **Ctrl+H** - Standard help shortcut
- **?** - Quick help access
- **F1** - Traditional help key

The help dialog features:
- Categorized shortcut listings
- Properly formatted key combinations
- Responsive design for mobile devices
- Accessible keyboard navigation
- Click-outside-to-close functionality

## Best Practices

This modular approach ensures that keyboard shortcuts are:
- **Easy to maintain and extend** - Centralized configuration
- **Well-tested and reliable** - Comprehensive test coverage
- **Context-aware and non-conflicting** - Smart context management
- **Properly documented and discoverable** - Built-in help system
- **Accessible and user-friendly** - Consistent behavior and feedback

## Browser Compatibility

The keyboard shortcuts work in all modern browsers and gracefully handle:
- Different operating systems (Windows, Mac, Linux)
- Browser-specific key behaviors
- Conflict prevention with system shortcuts
- Accessibility requirements