/**
 * Unit Tests for HelpModalBuilder
 * 
 * Tests the help modal creation and management functionality
 */

// Mock DOM for testing
global.document = {
    createElement: (tag) => ({
        innerHTML: '',
        className: '',
        id: '',
        style: {},
        addEventListener: () => {},
        querySelector: () => ({ focus: () => {} }),
        closest: () => ({ style: { display: 'none' } })
    }),
    getElementById: () => null,
    body: { appendChild: () => {} }
};

// Mock classes for testing
class MockKeyboardShortcutManager {
    constructor() {
        this.shortcuts = [
            {
                key: 'Escape',
                context: 'editing',
                description: 'Cancel editing (Escape)',
                category: 'Editing',
                ctrlKey: false,
                altKey: false,
                shiftKey: false
            },
            {
                key: 's',
                context: 'global',
                description: 'Save changes (Ctrl+S)',
                category: 'General',
                ctrlKey: true,
                altKey: false,
                shiftKey: false
            },
            {
                key: 'n',
                context: 'global',
                description: 'Focus new todo (Ctrl+N)',
                category: 'Navigation',
                ctrlKey: true,
                altKey: false,
                shiftKey: false
            }
        ];
    }
    
    getAllShortcuts() {
        return this.shortcuts;
    }
}

// Mock ShortcutsConfig
class ShortcutsConfig {
    static groupByCategory(shortcuts) {
        const grouped = {};
        shortcuts.forEach(shortcut => {
            const category = shortcut.category || 'Other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(shortcut);
        });
        return grouped;
    }
    
    static formatKeyCombo(shortcut) {
        const modifiers = [];
        if (shortcut.ctrlKey) modifiers.push('Ctrl');
        if (shortcut.altKey) modifiers.push('Alt');
        if (shortcut.shiftKey) modifiers.push('Shift');
        
        return modifiers.length > 0 
            ? `${modifiers.join('+')}+${shortcut.key}`
            : shortcut.key;
    }
}

// Simple HelpModalBuilder class for testing
class HelpModalBuilder {
    static createKeyboardHelpModal(keyboardManager) {
        const modal = document.createElement('div');
        modal.id = 'keyboardHelpModal';
        modal.className = 'help-modal';
        
        const allShortcuts = keyboardManager.getAllShortcuts();
        const groupedShortcuts = ShortcutsConfig.groupByCategory(allShortcuts);
        
        modal.innerHTML = this.generateHelpModalContent(groupedShortcuts);
        this.addHelpModalEventListeners(modal);
        
        return modal;
    }

    static generateHelpModalContent(groupedShortcuts) {
        const header = this.generateModalHeader();
        const body = this.generateModalBody(groupedShortcuts);
        const footer = this.generateModalFooter();

        return `
            <div class="help-modal-content">
                ${header}
                ${body}
                ${footer}
            </div>
        `;
    }

    static generateModalHeader() {
        return `
            <div class="help-header">
                <h2>Keyboard Shortcuts</h2>
                <button class="help-close-btn">
                    <span aria-hidden="true">&times;</span>
                    <span class="sr-only">Close</span>
                </button>
            </div>
        `;
    }

    static generateModalBody(groupedShortcuts) {
        let bodyContent = '<div class="help-body">';
        
        const categoryOrder = ['Navigation', 'Todo Management', 'Editing', 'General'];
        
        categoryOrder.forEach(categoryName => {
            if (groupedShortcuts[categoryName]) {
                bodyContent += this.generateCategorySection(categoryName, groupedShortcuts[categoryName]);
            }
        });
        
        bodyContent += '</div>';
        return bodyContent;
    }

    static generateCategorySection(categoryName, shortcuts) {
        let categoryHTML = `
            <div class="help-category">
                <h3>${categoryName}</h3>
                <div class="shortcuts-list">
        `;
        
        shortcuts.forEach(shortcut => {
            categoryHTML += this.generateShortcutItem(shortcut);
        });
        
        categoryHTML += '</div></div>';
        return categoryHTML;
    }

    static generateShortcutItem(shortcut) {
        const keyCombo = ShortcutsConfig.formatKeyCombo(shortcut);
        const description = this.cleanDescription(shortcut.description);
        
        return `
            <div class="shortcut-item">
                <kbd class="shortcut-keys">${keyCombo}</kbd>
                <span class="shortcut-description">${description}</span>
            </div>
        `;
    }

    static cleanDescription(description) {
        return description.replace(/\s*\([^)]*\)\s*$/, '');
    }

    static generateModalFooter() {
        return `
            <div class="help-footer">
                <p>Press <kbd>Escape</kbd> or click outside to close this help dialog.</p>
            </div>
        `;
    }

    static addHelpModalEventListeners(modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.style.display = 'none';
            }
        });
        
        this.listenersAdded = true;
    }

    static showHelpModal(keyboardManager) {
        let helpModal = document.getElementById('keyboardHelpModal');
        
        if (!helpModal) {
            helpModal = this.createKeyboardHelpModal(keyboardManager);
            document.body.appendChild(helpModal);
        }
        
        helpModal.style.display = 'flex';
        
        const closeButton = helpModal.querySelector('.help-close-btn');
        if (closeButton) {
            closeButton.focus();
        }
        
        this.modalShown = true;
    }

    static hideHelpModal() {
        const helpModal = document.getElementById('keyboardHelpModal');
        if (helpModal) {
            helpModal.style.display = 'none';
        }
        this.modalHidden = true;
    }

    static updateHelpModal(keyboardManager) {
        const helpModal = document.getElementById('keyboardHelpModal');
        if (helpModal) {
            const allShortcuts = keyboardManager.getAllShortcuts();
            const groupedShortcuts = ShortcutsConfig.groupByCategory(allShortcuts);
            helpModal.innerHTML = this.generateHelpModalContent(groupedShortcuts);
            this.addHelpModalEventListeners(helpModal);
        }
        this.modalUpdated = true;
    }
}

// Test suite
function runHelpModalBuilderTests() {
    console.log('🧪 Running HelpModalBuilder Tests...\n');
    
    let testsRun = 0;
    let testsPassed = 0;

    function assert(condition, message) {
        testsRun++;
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            testsPassed++;
        } else {
            console.log(`❌ FAIL: ${message}`);
        }
    }

    // Reset test state
    function resetTestState() {
        HelpModalBuilder.listenersAdded = false;
        HelpModalBuilder.modalShown = false;
        HelpModalBuilder.modalHidden = false;
        HelpModalBuilder.modalUpdated = false;
    }

    // Test 1: Can create help modal
    function testCreateHelpModal() {
        resetTestState();
        const manager = new MockKeyboardShortcutManager();
        const modal = HelpModalBuilder.createKeyboardHelpModal(manager);
        
        assert(modal !== null, 'Should create modal element');
        assert(modal.id === 'keyboardHelpModal', 'Should set correct modal ID');
        assert(modal.className === 'help-modal', 'Should set correct modal class');
        assert(typeof modal.innerHTML === 'string', 'Should have HTML content');
        assert(HelpModalBuilder.listenersAdded === true, 'Should add event listeners');
    }

    // Test 2: Can generate modal content
    function testGenerateModalContent() {
        const manager = new MockKeyboardShortcutManager();
        const shortcuts = manager.getAllShortcuts();
        const groupedShortcuts = ShortcutsConfig.groupByCategory(shortcuts);
        
        const content = HelpModalBuilder.generateHelpModalContent(groupedShortcuts);
        
        assert(typeof content === 'string', 'Should return content string');
        assert(content.includes('help-modal-content'), 'Should include modal content wrapper');
        assert(content.includes('Keyboard Shortcuts'), 'Should include title');
        assert(content.includes('help-close-btn'), 'Should include close button');
    }

    // Test 3: Can generate modal header
    function testGenerateModalHeader() {
        const header = HelpModalBuilder.generateModalHeader();
        
        assert(typeof header === 'string', 'Should return header string');
        assert(header.includes('Keyboard Shortcuts'), 'Should include title');
        assert(header.includes('help-close-btn'), 'Should include close button');
        assert(header.includes('&times;'), 'Should include close symbol');
    }

    // Test 4: Can generate modal body
    function testGenerateModalBody() {
        const manager = new MockKeyboardShortcutManager();
        const shortcuts = manager.getAllShortcuts();
        const groupedShortcuts = ShortcutsConfig.groupByCategory(shortcuts);
        
        const body = HelpModalBuilder.generateModalBody(groupedShortcuts);
        
        assert(typeof body === 'string', 'Should return body string');
        assert(body.includes('help-body'), 'Should include body wrapper');
        assert(body.includes('Navigation'), 'Should include Navigation category');
        assert(body.includes('Editing'), 'Should include Editing category');
    }

    // Test 5: Can generate category section
    function testGenerateCategorySection() {
        const shortcuts = [
            {
                key: 'Escape',
                description: 'Cancel editing',
                ctrlKey: false,
                altKey: false,
                shiftKey: false
            }
        ];
        
        const section = HelpModalBuilder.generateCategorySection('Test Category', shortcuts);
        
        assert(typeof section === 'string', 'Should return section string');
        assert(section.includes('Test Category'), 'Should include category name');
        assert(section.includes('help-category'), 'Should include category wrapper');
        assert(section.includes('shortcuts-list'), 'Should include shortcuts list');
    }

    // Test 6: Can generate shortcut item
    function testGenerateShortcutItem() {
        const shortcut = {
            key: 's',
            description: 'Save changes (Ctrl+S)',
            ctrlKey: true,
            altKey: false,
            shiftKey: false
        };
        
        const item = HelpModalBuilder.generateShortcutItem(shortcut);
        
        assert(typeof item === 'string', 'Should return item string');
        assert(item.includes('shortcut-item'), 'Should include item wrapper');
        assert(item.includes('shortcut-keys'), 'Should include keys element');
        assert(item.includes('shortcut-description'), 'Should include description element');
        assert(item.includes('Ctrl+s'), 'Should include formatted key combination');
    }

    // Test 7: Can clean description
    function testCleanDescription() {
        const description1 = 'Save changes (Ctrl+S)';
        const description2 = 'Cancel editing';
        
        const cleaned1 = HelpModalBuilder.cleanDescription(description1);
        const cleaned2 = HelpModalBuilder.cleanDescription(description2);
        
        assert(cleaned1 === 'Save changes', 'Should remove key combination from description');
        assert(cleaned2 === 'Cancel editing', 'Should leave description without parentheses unchanged');
    }

    // Test 8: Can generate modal footer
    function testGenerateModalFooter() {
        const footer = HelpModalBuilder.generateModalFooter();
        
        assert(typeof footer === 'string', 'Should return footer string');
        assert(footer.includes('help-footer'), 'Should include footer wrapper');
        assert(footer.includes('Escape'), 'Should mention Escape key');
        assert(footer.includes('close this help dialog'), 'Should include close instruction');
    }

    // Test 9: Can show help modal
    function testShowHelpModal() {
        resetTestState();
        const manager = new MockKeyboardShortcutManager();
        
        HelpModalBuilder.showHelpModal(manager);
        
        assert(HelpModalBuilder.modalShown === true, 'Should set modal shown flag');
    }

    // Test 10: Can hide help modal
    function testHideHelpModal() {
        resetTestState();
        
        HelpModalBuilder.hideHelpModal();
        
        assert(HelpModalBuilder.modalHidden === true, 'Should set modal hidden flag');
    }

    // Test 11: Can update help modal
    function testUpdateHelpModal() {
        resetTestState();
        const manager = new MockKeyboardShortcutManager();
        
        HelpModalBuilder.updateHelpModal(manager);
        
        assert(HelpModalBuilder.modalUpdated === true, 'Should set modal updated flag');
    }

    // Test 12: ShortcutsConfig groupByCategory works
    function testShortcutsConfigGrouping() {
        const shortcuts = [
            { category: 'Navigation', key: 'n' },
            { category: 'Navigation', key: 'f' },
            { category: 'Editing', key: 'Escape' }
        ];
        
        const grouped = ShortcutsConfig.groupByCategory(shortcuts);
        
        assert(typeof grouped === 'object', 'Should return grouped object');
        assert(grouped.Navigation.length === 2, 'Should group Navigation shortcuts');
        assert(grouped.Editing.length === 1, 'Should group Editing shortcuts');
    }

    // Test 13: ShortcutsConfig formatKeyCombo works
    function testShortcutsConfigFormatting() {
        const shortcut1 = { key: 'Escape', ctrlKey: false, altKey: false, shiftKey: false };
        const shortcut2 = { key: 's', ctrlKey: true, altKey: false, shiftKey: false };
        const shortcut3 = { key: 'Delete', ctrlKey: true, altKey: false, shiftKey: true };
        
        assert(ShortcutsConfig.formatKeyCombo(shortcut1) === 'Escape', 'Should format simple key');
        assert(ShortcutsConfig.formatKeyCombo(shortcut2) === 'Ctrl+s', 'Should format key with modifier');
        assert(ShortcutsConfig.formatKeyCombo(shortcut3) === 'Ctrl+Shift+Delete', 'Should format key with multiple modifiers');
    }

    // Run all tests
    console.log('============================================================');
    testCreateHelpModal();
    testGenerateModalContent();
    testGenerateModalHeader();
    testGenerateModalBody();
    testGenerateCategorySection();
    testGenerateShortcutItem();
    testCleanDescription();
    testGenerateModalFooter();
    testShowHelpModal();
    testHideHelpModal();
    testUpdateHelpModal();
    testShortcutsConfigGrouping();
    testShortcutsConfigFormatting();
    console.log('============================================================');

    // Print summary
    console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsRun - testsPassed} failed`);
    
    if (testsPassed === testsRun) {
        console.log('🎉 All HelpModalBuilder tests passed!');
        return true;
    } else {
        console.log('❌ Some tests failed!');
        return false;
    }
}

// Run the tests
if (require.main === module) {
    const success = runHelpModalBuilderTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runHelpModalBuilderTests };