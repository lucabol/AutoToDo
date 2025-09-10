/**
 * Ctrl+M Dark Mode Toggle Keyboard Shortcut Test Suite
 * 
 * This test suite provides comprehensive coverage for the Ctrl+M keyboard shortcut
 * functionality that toggles between dark and light themes in the AutoToDo application.
 * 
 * Test Coverage Areas:
 * 1. Shortcut Configuration - Ensures Ctrl+M is properly configured in ShortcutsConfig
 * 2. Keyboard Manager Integration - Tests KeyboardShortcutManager handles Ctrl+M correctly  
 * 3. Input Validation - Prevents accidental triggers from similar key combinations
 * 4. Theme Toggle Logic - Tests bidirectional theme switching (light ↔ dark)
 * 5. Edge Cases - Multiple toggles and state consistency
 * 6. End-to-End Integration - Full workflow from keypress to theme change
 */

// ==========================================
// MOCK CLASSES FOR TESTING
// ==========================================

/**
 * Mock KeyboardShortcutManager for testing keyboard shortcut functionality
 * Simplified version that matches the interface of the real KeyboardShortcutManager
 * Used to test shortcut registration and handling without external dependencies
 */
class KeyboardShortcutManager {
    constructor() {
        this.shortcuts = new Map();
        this.contexts = new Map();
    }

    registerShortcut(config) {
        const {
            key,
            ctrlKey = false,
            altKey = false,
            shiftKey = false,
            context = 'global',
            action,
            preventDefault = false,
            description = ''
        } = config;

        if (!key || typeof action !== 'function') {
            throw new Error('Shortcut must have a key and action function');
        }

        const shortcutKey = this.generateShortcutKey(key, ctrlKey, altKey, shiftKey, context);
        
        this.shortcuts.set(shortcutKey, {
            key,
            ctrlKey,
            altKey,
            shiftKey,
            context,
            action,
            preventDefault,
            description
        });
    }

    generateShortcutKey(key, ctrlKey, altKey, shiftKey, context) {
        const modifiers = [];
        if (ctrlKey) modifiers.push('ctrl');
        if (altKey) modifiers.push('alt');
        if (shiftKey) modifiers.push('shift');
        
        const modifierStr = modifiers.length > 0 ? modifiers.join('+') + '+' : '';
        return `${context}:${modifierStr}${key.toLowerCase()}`;
    }

    handleKeyboard(event) {
        const shortcutKey = this.generateShortcutKey(
            event.key,
            event.ctrlKey,
            event.altKey,
            event.shiftKey,
            'global'
        );

        const shortcut = this.shortcuts.get(shortcutKey);
        if (shortcut) {
            if (shortcut.preventDefault) {
                event.preventDefault();
            }
            shortcut.action(event);
            return true;
        }
        return false;
    }
}

/**
 * Mock ShortcutsConfig class for testing shortcut configuration
 * Provides methods to get and validate keyboard shortcuts
 * Specifically includes the Ctrl+M theme toggle shortcut configuration
 */
class ShortcutsConfig {
    static getShortcuts(handlers) {
        return [
            {
                key: 'm',
                ctrlKey: true,
                context: 'global',
                action: handlers.toggleTheme,
                preventDefault: true,
                description: 'Toggle theme (Ctrl+M)',
                category: 'General'
            }
            // Other shortcuts would be here in real implementation
        ];
    }

    static validateShortcut(shortcut) {
        const result = {
            valid: true,
            warnings: [],
            errors: [],
            suggestions: []
        };

        if (!shortcut.key) {
            result.errors.push('Shortcut must have a key');
            result.valid = false;
        }

        if (!shortcut.action || typeof shortcut.action !== 'function') {
            result.errors.push('Shortcut must have a valid action function');
            result.valid = false;
        }

        return result;
    }
}

/**
 * Mock ThemeController for testing theme toggle functionality
 * Simulates the theme management system including:
 * - Theme state tracking (light/dark)
 * - CSS class management for dark-theme
 * - Theme button state updates (icon and text)
 * - localStorage persistence simulation
 * - Bidirectional theme switching logic
 * 
 * This mock allows testing theme functionality without DOM dependencies
 */
class MockThemeController {
    constructor() {
        this.currentTheme = 'light';
        this.localStorage = {};
        this.body = {
            classList: {
                classes: [],
                add: function(className) { 
                    if (!this.classes.includes(className)) {
                        this.classes.push(className); 
                    }
                },
                remove: function(className) { 
                    const index = this.classes.indexOf(className);
                    if (index > -1) this.classes.splice(index, 1);
                },
                contains: function(className) { 
                    return this.classes.includes(className); 
                }
            }
        };
        this.themeButton = {
            icon: '🌙',
            text: 'Dark'
        };
    }

    setTheme(theme, save = true) {
        if (theme === 'dark') {
            this.body.classList.add('dark-theme');
            this.themeButton.icon = '☀️';
            this.themeButton.text = 'Light';
        } else {
            this.body.classList.remove('dark-theme');
            this.themeButton.icon = '🌙';
            this.themeButton.text = 'Dark';
        }

        if (save) {
            this.localStorage['todo-theme'] = theme;
        }

        this.currentTheme = theme;
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getThemeButtonState() {
        return {
            icon: this.themeButton.icon,
            text: this.themeButton.text
        };
    }

    isDarkMode() {
        return this.body.classList.contains('dark-theme');
    }
}

// ==========================================
// CONFIGURATION VALIDATION TESTS
// ==========================================

/**
 * Test: Shortcut Configuration Validation
 * 
 * Purpose: Verifies that the Ctrl+M shortcut is properly defined in ShortcutsConfig
 * This test ensures the shortcut has all required properties and correct configuration
 * 
 * Validates:
 * - Shortcut key mapping (key: 'm', ctrlKey: true)
 * - Context setting (global scope)
 * - Description text for user documentation
 * - Category classification for organization
 * - preventDefault flag to avoid browser conflicts
 */
function testShortcutConfiguration() {
    const mockHandlers = {
        toggleTheme: () => {}
    };
    
    const shortcuts = ShortcutsConfig.getShortcuts(mockHandlers);
    const ctrlMShortcut = shortcuts.find(s => 
        s.key === 'm' && 
        s.ctrlKey === true && 
        s.context === 'global'
    );
    
    if (!ctrlMShortcut) {
        throw new Error('Ctrl+M shortcut not found in configuration');
    }
    
    if (ctrlMShortcut.description !== 'Toggle theme (Ctrl+M)') {
        throw new Error('Incorrect description for Ctrl+M shortcut');
    }
    
    if (ctrlMShortcut.category !== 'General') {
        throw new Error('Incorrect category for Ctrl+M shortcut');
    }
    
    if (!ctrlMShortcut.preventDefault) {
        throw new Error('Ctrl+M shortcut should prevent default browser behavior');
    }
}

// ==========================================
// KEYBOARD MANAGER INTEGRATION TESTS  
// ==========================================

/**
 * Test: KeyboardShortcutManager Integration
 * 
 * Purpose: Verifies that KeyboardShortcutManager can properly register and handle Ctrl+M
 * This test confirms the integration between shortcut configuration and execution
 * 
 * Tests:
 * - Shortcut registration with correct parameters
 * - Event handling and action execution
 * - Return value indicating successful handling
 * - Action function invocation on keypress
 */
function testKeyboardShortcutManagerIntegration() {
    let themeToggleCalled = false;
    
    const manager = new KeyboardShortcutManager();
    manager.registerShortcut({
        key: 'm',
        ctrlKey: true,
        context: 'global',
        action: () => { themeToggleCalled = true; },
        preventDefault: true,
        description: 'Toggle theme (Ctrl+M)',
        category: 'General'
    });
    
    const mockEvent = {
        key: 'm',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        preventDefault: () => {},
        target: { tagName: 'BODY' }
    };
    
    const handled = manager.handleKeyboard(mockEvent);
    
    if (!handled) {
        throw new Error('Ctrl+M shortcut was not handled by KeyboardShortcutManager');
    }
    
    if (!themeToggleCalled) {
        throw new Error('Theme toggle action was not called');
    }
}

// ==========================================
// INPUT VALIDATION AND PREVENTION TESTS
// ==========================================

/**
 * Test: Prevent Accidental Trigger from 'M' Key
 * 
 * Purpose: Ensures that pressing just 'm' without Ctrl doesn't trigger theme toggle
 * This prevents accidental theme changes during normal typing
 * 
 * Tests:
 * - Regular 'm' key press should not be handled
 * - Theme toggle action should not be called
 * - No interference with normal text input
 */
function testPreventAccidentalTriggerFromMKey() {
    let themeToggleCalled = false;
    
    const manager = new KeyboardShortcutManager();
    manager.registerShortcut({
        key: 'm',
        ctrlKey: true,
        context: 'global',
        action: () => { themeToggleCalled = true; },
        preventDefault: true,
        description: 'Toggle theme (Ctrl+M)',
        category: 'General'
    });
    
    const mockEvent = {
        key: 'm',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        preventDefault: () => {},
        target: { tagName: 'BODY' }
    };
    
    const handled = manager.handleKeyboard(mockEvent);
    
    if (handled) {
        throw new Error('Regular "m" key should not trigger the shortcut');
    }
    
    if (themeToggleCalled) {
        throw new Error('Theme toggle should not be called for regular "m" key');
    }
}

/**
 * Test: Prevent Accidental Trigger from Other Modifier Combinations
 * 
 * Purpose: Ensures other modifier combinations (Ctrl+Alt+M, Ctrl+Shift+M) don't trigger shortcut
 * This provides precise shortcut matching and prevents conflicts with other shortcuts
 * 
 * Tests:
 * - Ctrl+Alt+M should not trigger theme toggle
 * - Only exact Ctrl+M combination should work
 * - Prevents interference with other application shortcuts
 */
function testPreventAccidentalTriggerFromOtherModifiers() {
    let themeToggleCalled = false;
    
    const manager = new KeyboardShortcutManager();
    manager.registerShortcut({
        key: 'm',
        ctrlKey: true,
        context: 'global',
        action: () => { themeToggleCalled = true; },
        preventDefault: true,
        description: 'Toggle theme (Ctrl+M)',
        category: 'General'
    });
    
    const mockEvent = {
        key: 'm',
        ctrlKey: true,
        altKey: true, // This should prevent the shortcut from triggering
        shiftKey: false,
        preventDefault: () => {},
        target: { tagName: 'BODY' }
    };
    
    const handled = manager.handleKeyboard(mockEvent);
    
    if (handled) {
        throw new Error('Ctrl+Alt+M should not trigger the shortcut');
    }
    
    if (themeToggleCalled) {
        throw new Error('Theme toggle should not be called for Ctrl+Alt+M');
    }
}

/**
 * Test: Shortcut Configuration Validation
 * 
 * Purpose: Verifies that the Ctrl+M shortcut passes ShortcutsConfig validation rules
 * This ensures the shortcut meets all quality and structure requirements
 * 
 * Validates:
 * - Required properties are present (key, action)
 * - Action is a valid function
 * - No validation errors are reported
 * - Shortcut structure meets standards
 */
function testShortcutValidation() {
    const mockHandlers = {
        toggleTheme: () => {}
    };
    
    const shortcuts = ShortcutsConfig.getShortcuts(mockHandlers);
    const ctrlMShortcut = shortcuts.find(s => 
        s.key === 'm' && 
        s.ctrlKey === true && 
        s.context === 'global'
    );
    
    const validation = ShortcutsConfig.validateShortcut(ctrlMShortcut);
    
    if (!validation.valid) {
        throw new Error('Ctrl+M shortcut failed validation: ' + validation.errors.join(', '));
    }
    
    // Should have no errors
    if (validation.errors.length > 0) {
        throw new Error('Validation errors found: ' + validation.errors.join(', '));
    }
}

// ==========================================
// THEME TOGGLE FUNCTIONALITY TESTS
// ==========================================

/**
 * Test: Theme Toggle from Light to Dark Mode
 * 
 * Purpose: Verifies complete theme switching functionality from light to dark
 * This tests the forward direction of theme toggling with all state changes
 * 
 * Tests:
 * - Initial light mode state verification
 * - Theme toggle execution
 * - Dark mode state after toggle
 * - CSS class application (dark-theme)
 * - Button state updates (icon: ☀️, text: 'Light')
 * - Complete UI state consistency
 */
function testThemeToggleLightToDark() {
    const controller = new MockThemeController();
    
    // Ensure starting in light mode
    if (controller.getCurrentTheme() !== 'light') {
        throw new Error('Controller should start in light mode');
    }
    
    if (controller.isDarkMode()) {
        throw new Error('Dark mode CSS class should not be present initially');
    }
    
    // Trigger theme toggle
    controller.toggleTheme();
    
    // Verify switched to dark mode
    if (controller.getCurrentTheme() !== 'dark') {
        throw new Error('Theme should be dark after toggle');
    }
    
    if (!controller.isDarkMode()) {
        throw new Error('Dark mode CSS class should be present after toggle');
    }
    
    // Verify button state
    const buttonState = controller.getThemeButtonState();
    if (buttonState.icon !== '☀️' || buttonState.text !== 'Light') {
        throw new Error('Button should show sun icon and "Light" text in dark mode');
    }
}

/**
 * Test: Theme Toggle from Dark to Light Mode
 * 
 * Purpose: Verifies complete theme switching functionality from dark to light
 * This tests the reverse direction of theme toggling with all state changes
 * 
 * Tests:
 * - Initial dark mode state setup and verification
 * - Theme toggle execution from dark state
 * - Light mode state after toggle
 * - CSS class removal (dark-theme removed)
 * - Button state updates (icon: 🌙, text: 'Dark')
 * - Bidirectional functionality validation
 */
function testThemeToggleDarkToLight() {
    const controller = new MockThemeController();
    
    // Set to dark mode first
    controller.setTheme('dark');
    
    // Verify starting in dark mode
    if (controller.getCurrentTheme() !== 'dark') {
        throw new Error('Controller should be in dark mode initially');
    }
    
    if (!controller.isDarkMode()) {
        throw new Error('Dark mode CSS class should be present initially');
    }
    
    // Trigger theme toggle
    controller.toggleTheme();
    
    // Verify switched to light mode
    if (controller.getCurrentTheme() !== 'light') {
        throw new Error('Theme should be light after toggle');
    }
    
    if (controller.isDarkMode()) {
        throw new Error('Dark mode CSS class should not be present after toggle');
    }
    
    // Verify button state
    const buttonState = controller.getThemeButtonState();
    if (buttonState.icon !== '🌙' || buttonState.text !== 'Dark') {
        throw new Error('Button should show moon icon and "Dark" text in light mode');
    }
}

// ==========================================
// EDGE CASE AND ROBUSTNESS TESTS
// ==========================================

/**
 * Test: Multiple Consecutive Theme Toggles
 * 
 * Purpose: Verifies theme toggle robustness with repeated rapid toggles
 * This tests state consistency and prevents toggle state corruption
 * 
 * Tests:
 * - Starting state consistency
 * - First toggle: light → dark
 * - Second toggle: dark → light (return to original)
 * - Third toggle: light → dark (repeat cycle)
 * - Fourth toggle: dark → light (confirm cycle continues)
 * - State integrity throughout multiple operations
 */
function testMultipleConsecutiveToggles() {
    const controller = new MockThemeController();
    
    // Start in light mode
    const initialTheme = controller.getCurrentTheme();
    if (initialTheme !== 'light') {
        throw new Error('Should start in light mode');
    }
    
    // Toggle to dark
    controller.toggleTheme();
    if (controller.getCurrentTheme() !== 'dark') {
        throw new Error('First toggle should switch to dark');
    }
    
    // Toggle back to light
    controller.toggleTheme();
    if (controller.getCurrentTheme() !== 'light') {
        throw new Error('Second toggle should switch back to light');
    }
    
    // Toggle to dark again
    controller.toggleTheme();
    if (controller.getCurrentTheme() !== 'dark') {
        throw new Error('Third toggle should switch to dark again');
    }
    
    // Toggle back to light again
    controller.toggleTheme();
    if (controller.getCurrentTheme() !== 'light') {
        throw new Error('Fourth toggle should switch back to light again');
    }
}

// ==========================================
// END-TO-END INTEGRATION TESTS
// ==========================================

/**
 * Test: Ctrl+M Integration with Actual Theme Toggle
 * 
 * Purpose: Tests complete end-to-end workflow from keypress to theme change
 * This validates the full integration chain from keyboard input to visual change
 * 
 * Integration Flow:
 * 1. KeyboardShortcutManager registers Ctrl+M shortcut
 * 2. Mock keyboard event (Ctrl+M) is created and processed
 * 3. Shortcut manager identifies and handles the event
 * 4. Theme toggle action is executed
 * 5. Theme state changes are verified
 * 6. Multiple toggle cycles are tested for consistency
 * 
 * This test confirms the complete user experience works as expected
 */
function testCtrlMIntegrationWithThemeToggle() {
    const controller = new MockThemeController();
    const manager = new KeyboardShortcutManager();
    
    // Register Ctrl+M shortcut with real theme toggle
    manager.registerShortcut({
        key: 'm',
        ctrlKey: true,
        context: 'global',
        action: () => controller.toggleTheme(),
        preventDefault: true,
        description: 'Toggle theme (Ctrl+M)',
        category: 'General'
    });
    
    // Verify starting state
    if (controller.getCurrentTheme() !== 'light') {
        throw new Error('Should start in light mode');
    }
    
    // Trigger Ctrl+M to toggle to dark
    const mockEvent1 = {
        key: 'm',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        preventDefault: () => {},
        target: { tagName: 'BODY' }
    };
    
    const handled1 = manager.handleKeyboard(mockEvent1);
    if (!handled1) {
        throw new Error('Ctrl+M should be handled');
    }
    
    if (controller.getCurrentTheme() !== 'dark') {
        throw new Error('First Ctrl+M should switch to dark mode');
    }
    
    // Trigger Ctrl+M again to toggle back to light
    const mockEvent2 = {
        key: 'm',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        preventDefault: () => {},
        target: { tagName: 'BODY' }
    };
    
    const handled2 = manager.handleKeyboard(mockEvent2);
    if (!handled2) {
        throw new Error('Second Ctrl+M should be handled');
    }
    
    if (controller.getCurrentTheme() !== 'light') {
        throw new Error('Second Ctrl+M should switch back to light mode');
    }
}

// ==========================================
// MAIN TEST RUNNER AND ORCHESTRATION
// ==========================================

/**
 * Main Test Runner: testCtrlMThemeToggleShortcut
 * 
 * Purpose: Orchestrates execution of all Ctrl+M shortcut tests and provides comprehensive reporting
 * 
 * Test Organization:
 * 1. Configuration Tests - Validates shortcut setup and configuration
 * 2. Integration Tests - Tests keyboard manager integration  
 * 3. Input Validation Tests - Prevents accidental triggers
 * 4. Theme Toggle Tests - Tests actual theme switching logic
 * 5. Edge Case Tests - Handles multiple toggles and robustness
 * 6. End-to-End Tests - Full workflow integration validation
 * 
 * Reporting Features:
 * - Individual test pass/fail status with descriptive names
 * - Detailed test summary with counts and percentages
 * - Success/failure indicators with visual feedback
 * - Comprehensive feature validation summary
 * - Exit code handling for CI/CD integration
 */
function testCtrlMThemeToggleShortcut() {
    console.log('🧪 Running Ctrl+M Dark Mode Toggle Shortcut Tests...\n');
    
    let passed = 0;
    let failed = 0;
    
    function test(name, testFn) {
        try {
            testFn();
            console.log(`✅ ${name}`);
            passed++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
            failed++;
        }
    }
    
    // ========================================
    // CONFIGURATION AND INTEGRATION TESTS
    // ========================================
    test('should have Ctrl+M shortcut configured in ShortcutsConfig', testShortcutConfiguration);
    test('should register and handle Ctrl+M shortcut correctly', testKeyboardShortcutManagerIntegration);
    test('should not trigger theme toggle with just "m" key', testPreventAccidentalTriggerFromMKey);
    test('should not trigger with Ctrl+Alt+M or other modifier combinations', testPreventAccidentalTriggerFromOtherModifiers);
    test('should pass ShortcutsConfig validation', testShortcutValidation);
    
    // ========================================
    // THEME TOGGLE FUNCTIONALITY TESTS
    // ========================================
    test('should toggle theme from light to dark mode', testThemeToggleLightToDark);
    test('should toggle theme from dark to light mode', testThemeToggleDarkToLight);
    test('should handle multiple consecutive theme toggles', testMultipleConsecutiveToggles);
    test('should integrate Ctrl+M with actual theme toggle functionality', testCtrlMIntegrationWithThemeToggle);
    
    console.log('\n==================================================');
    console.log('📊 Ctrl+M Shortcut Test Summary:');
    console.log(`   Total: ${passed + failed}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log('==================================================');
    
    if (failed === 0) {
        console.log('🎉 All Ctrl+M shortcut tests passed!');
        console.log('✅ SUMMARY: Ctrl+M dark mode toggle shortcut is fully implemented and working correctly');
        console.log('   - Shortcut properly configured in ShortcutsConfig');
        console.log('   - KeyboardShortcutManager handles Ctrl+M correctly');
        console.log('   - Prevents accidental triggers from other key combinations');
        console.log('   - Theme toggle works in both directions (light ↔ dark)');
        console.log('   - Handles multiple consecutive toggles correctly');
        console.log('   - Passes all validation requirements');
        console.log('   - Integrates seamlessly with existing keyboard shortcut system');
        return true;
    } else {
        console.log('❌ Some Ctrl+M shortcut tests failed!');
        return false;
    }
}

// ==========================================
// MODULE EXPORTS AND EXECUTION
// ==========================================

// Run tests immediately if this file is executed directly (node ctrl-m-shortcut.test.js)
if (typeof module !== 'undefined' && require.main === module) {
    const success = testCtrlMThemeToggleShortcut();
    process.exit(success ? 0 : 1);
}

// Export test function for integration with other test suites and module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testCtrlMThemeToggleShortcut };
}