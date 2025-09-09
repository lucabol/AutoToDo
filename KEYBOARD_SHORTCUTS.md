# Keyboard Shortcuts

AutoToDo supports keyboard shortcuts for efficient task management. The shortcuts are managed by a modular `KeyboardShortcutManager` system that makes it easy to add new shortcuts in the future.

## Available Shortcuts

### Editing Mode
These shortcuts are available when editing a todo item:

- **Escape** - Cancel editing and discard changes
- **Ctrl+S** - Save changes and exit edit mode

## Implementation

The keyboard shortcuts are implemented using a modular approach:

- **KeyboardShortcutManager** - Main class that handles shortcut registration and execution
- **Context-aware** - Shortcuts can be specific to certain contexts (e.g., editing mode)
- **Configuration-driven** - Easy to add new shortcuts without modifying core logic
- **Extensible** - Supports complex key combinations and conditional activation

## Adding New Shortcuts

To add a new keyboard shortcut:

1. Register the shortcut in `TodoController.setupKeyboardShortcuts()`:

```javascript
this.keyboardManager.registerShortcut({
    key: 'n',
    ctrlKey: true,
    context: 'global',
    action: () => this.focusNewTodoInput(),
    preventDefault: true,
    description: 'Focus new todo input'
});
```

2. Implement the action method if needed
3. Add tests for the new functionality

## Technical Details

The `KeyboardShortcutManager` provides:
- Context registration with condition checkers
- Shortcut registration with modifiers and descriptions
- Event handling with proper context resolution
- Error handling and debugging capabilities
- Easy removal and management of shortcuts

This modular approach ensures that keyboard shortcuts are:
- Easy to maintain and extend
- Well-tested and reliable
- Context-aware and non-conflicting
- Properly documented and discoverable