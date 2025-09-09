/**
 * AutoToDo Application - Enhanced with Search Functionality
 * A complete todo app with CRUD operations, search, and persistent storage
 */
class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.editingId = null;
        this.searchTerm = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        const form = document.getElementById('addTodoForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.setSearchTerm(e.target.value);
        });
    }

    loadTodos() {
        const saved = localStorage.getItem('todos');
        return saved ? JSON.parse(saved) : [];
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();
        
        if (!text) return;

        const todo = {
            id: this.generateId(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        input.value = '';
        this.render();
        console.log('Todo added successfully:', todo);
    }

    deleteTodo(id) {
        if (confirm('Are you sure you want to delete this todo?')) {
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.saveTodos();
            this.render();
            console.log(`Todo with id ${id} deleted successfully`);
        }
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
            console.log(`Todo ${id} toggled to ${todo.completed ? 'completed' : 'incomplete'}`);
        }
    }

    startEdit(id) {
        this.editingId = id;
        this.render();
        
        // Focus on the edit input after rendering
        setTimeout(() => {
            const editInput = document.querySelector('.edit-input');
            if (editInput) {
                editInput.focus();
                editInput.select();
            }
        }, 0);
    }

    saveEdit(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim()) {
            todo.text = newText.trim();
            this.editingId = null;
            this.saveTodos();
            this.render();
            console.log(`Todo ${id} updated to: "${newText}"`);
        }
    }

    cancelEdit() {
        this.editingId = null;
        this.render();
    }

    setSearchTerm(term) {
        this.searchTerm = term.toLowerCase();
        this.render();
    }

    filterTodos() {
        if (!this.searchTerm) {
            return this.todos;
        }
        return this.todos.filter(todo => 
            todo.text.toLowerCase().includes(this.searchTerm)
        );
    }

    render() {
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        const filteredTodos = this.filterTodos();

        if (filteredTodos.length === 0) {
            todoList.style.display = 'none';
            if (this.todos.length === 0) {
                emptyState.textContent = 'No todos yet. Add one above to get started!';
            } else {
                emptyState.textContent = 'No todos match your search.';
            }
            emptyState.style.display = 'block';
            return;
        }

        todoList.style.display = 'block';
        emptyState.style.display = 'none';

        todoList.innerHTML = filteredTodos.map(todo => {
            if (this.editingId === todo.id) {
                return this.renderEditForm(todo);
            }
            return this.renderTodoItem(todo);
        }).join('');

        // Bind event listeners for the newly rendered elements
        this.bindTodoEvents();
    }

    renderTodoItem(todo) {
        return `
            <li class="todo-item" data-id="${todo.id}">
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''}
                    onchange="app.toggleTodo('${todo.id}')"
                >
                <span class="todo-text ${todo.completed ? 'completed' : ''}">${this.escapeHtml(todo.text)}</span>
                <div class="todo-actions">
                    <button class="edit-btn" onclick="app.startEdit('${todo.id}')">Edit</button>
                    <button class="delete-btn" onclick="app.deleteTodo('${todo.id}')">Delete</button>
                </div>
            </li>
        `;
    }

    renderEditForm(todo) {
        return `
            <li class="todo-item" data-id="${todo.id}">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} disabled>
                <form class="edit-form" onsubmit="event.preventDefault(); app.saveEdit('${todo.id}', this.querySelector('.edit-input').value)">
                    <input 
                        type="text" 
                        class="edit-input" 
                        value="${this.escapeHtml(todo.text)}"
                        autofocus
                        onkeydown="if(event.key==='Escape') app.cancelEdit()"
                    >
                    <button type="submit" class="save-btn">Save</button>
                    <button type="button" class="cancel-btn" onclick="app.cancelEdit()">Cancel</button>
                </form>
            </li>
        `;
    }

    bindTodoEvents() {
        // Events are bound using inline handlers in the HTML for simplicity
        // This ensures they work correctly when the DOM is updated
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Utility method for debugging
    getStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;
        
        return {
            total,
            completed,
            pending,
            todos: this.todos
        };
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TodoApp();
    console.log('AutoToDo app initialized successfully');
});