/**
 * HelpModalBuilder - Builds keyboard shortcuts help modal
 * 
 * This class handles the creation and styling of the keyboard shortcuts help modal,
 * separating this UI logic from the main application controller.
 */
class HelpModalBuilder {
    /**
     * Create the keyboard shortcuts help modal
     * @param {KeyboardShortcutManager} keyboardManager - The keyboard shortcut manager instance
     * @returns {HTMLElement} The created modal element
     */
    static createKeyboardHelpModal(keyboardManager) {
        const modal = document.createElement('div');
        modal.id = 'keyboardHelpModal';
        modal.className = 'help-modal';
        
        // Get all shortcuts and group by category
        const allShortcuts = keyboardManager.getAllShortcuts();
        const groupedShortcuts = ShortcutsConfig.groupByCategory(allShortcuts);
        
        modal.innerHTML = this.generateHelpModalContent(groupedShortcuts);
        
        // Add event listeners
        this.addHelpModalEventListeners(modal);
        
        return modal;
    }

    /**
     * Generate the HTML content for the help modal
     * @param {Object} groupedShortcuts - Shortcuts grouped by category
     * @returns {string} HTML content string
     */
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

    /**
     * Generate the modal header
     * @returns {string} Header HTML
     */
    static generateModalHeader() {
        return `
            <div class="help-header">
                <h2>Keyboard Shortcuts</h2>
                <button class="help-close-btn" onclick="this.closest('.help-modal').style.display='none'">
                    <span aria-hidden="true">&times;</span>
                    <span class="sr-only">Close</span>
                </button>
            </div>
        `;
    }

    /**
     * Generate the modal body with categorized shortcuts
     * @param {Object} groupedShortcuts - Shortcuts grouped by category
     * @returns {string} Body HTML
     */
    static generateModalBody(groupedShortcuts) {
        let bodyContent = '<div class="help-body">';
        
        // Define category order for consistent display
        const categoryOrder = ['Navigation', 'Todo Management', 'Editing', 'General'];
        
        categoryOrder.forEach(categoryName => {
            if (groupedShortcuts[categoryName]) {
                bodyContent += this.generateCategorySection(categoryName, groupedShortcuts[categoryName]);
            }
        });
        
        bodyContent += '</div>';
        return bodyContent;
    }

    /**
     * Generate a category section
     * @param {string} categoryName - Name of the category
     * @param {Array} shortcuts - Array of shortcuts in this category
     * @returns {string} Category section HTML
     */
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

    /**
     * Generate a single shortcut item
     * @param {Object} shortcut - Shortcut configuration
     * @returns {string} Shortcut item HTML
     */
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

    /**
     * Clean shortcut description by removing key combinations in parentheses
     * @param {string} description - Original description
     * @returns {string} Cleaned description
     */
    static cleanDescription(description) {
        return description.replace(/\s*\([^)]*\)\s*$/, '');
    }

    /**
     * Generate the modal footer
     * @returns {string} Footer HTML
     */
    static generateModalFooter() {
        return `
            <div class="help-footer">
                <p>Press <kbd>Escape</kbd> or click outside to close this help dialog.</p>
            </div>
        `;
    }

    /**
     * Add event listeners to the help modal
     * @param {HTMLElement} modal - The modal element
     */
    static addHelpModalEventListeners(modal) {
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Escape key to close
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.style.display = 'none';
            }
        });
    }

    /**
     * Show existing help modal or create and show new one
     * @param {KeyboardShortcutManager} keyboardManager - The keyboard shortcut manager instance
     */
    static showHelpModal(keyboardManager) {
        let helpModal = document.getElementById('keyboardHelpModal');
        
        if (!helpModal) {
            helpModal = this.createKeyboardHelpModal(keyboardManager);
            document.body.appendChild(helpModal);
        }
        
        helpModal.style.display = 'flex';
        
        // Focus the close button for accessibility
        const closeButton = helpModal.querySelector('.help-close-btn');
        if (closeButton) {
            closeButton.focus();
        }
    }

    /**
     * Hide the help modal
     */
    static hideHelpModal() {
        const helpModal = document.getElementById('keyboardHelpModal');
        if (helpModal) {
            helpModal.style.display = 'none';
        }
    }

    /**
     * Update help modal content (useful when shortcuts change)
     * @param {KeyboardShortcutManager} keyboardManager - The keyboard shortcut manager instance
     */
    static updateHelpModal(keyboardManager) {
        const helpModal = document.getElementById('keyboardHelpModal');
        if (helpModal) {
            const allShortcuts = keyboardManager.getAllShortcuts();
            const groupedShortcuts = ShortcutsConfig.groupByCategory(allShortcuts);
            helpModal.innerHTML = this.generateHelpModalContent(groupedShortcuts);
            this.addHelpModalEventListeners(helpModal);
        }
    }
}