// Todo Application JavaScript
class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.nextId = parseInt(localStorage.getItem('nextId')) || 1;
        this.editingId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
    }

    initializeElements() {
        this.todoForm = document.getElementById('todo-form');
        this.todoInput = document.getElementById('todo-input');
        this.todoList = document.getElementById('todo-list');
        this.emptyState = document.getElementById('empty-state');
    }

    bindEvents() {
        this.todoForm.addEventListener('submit', (e) => this.handleAddTodo(e));
    }

    handleAddTodo(e) {
        e.preventDefault();
        const text = this.todoInput.value.trim();
        
        if (text) {
            this.addTodo(text);
            this.todoInput.value = '';
        }
    }

    addTodo(text) {
        const todo = {
            id: this.nextId++,
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.todos.push(todo);
        this.saveTodos();
        this.render();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
        }
    }

    deleteTodo(id) {
        // Show confirmation dialog before deleting
        if (confirm('Are you sure you want to delete this todo?')) {
            const index = this.todos.findIndex(t => t.id === id);
            if (index !== -1) {
                this.todos.splice(index, 1);
                this.saveTodos();
                this.render();
                console.log(`Todo with id ${id} deleted successfully`);
            }
        }
    }

    startEdit(id) {
        this.editingId = id;
        this.render();
    }

    cancelEdit() {
        this.editingId = null;
        this.render();
    }

    saveEdit(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim()) {
            todo.text = newText.trim();
            this.editingId = null;
            this.saveTodos();
            this.render();
        }
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
        localStorage.setItem('nextId', this.nextId.toString());
    }

    render() {
        // Clear the todo list
        this.todoList.innerHTML = '';
        
        // Show/hide empty state
        if (this.todos.length === 0) {
            this.emptyState.style.display = 'block';
            return;
        } else {
            this.emptyState.style.display = 'none';
        }

        // Render each todo
        this.todos.forEach(todo => {
            const todoElement = this.createTodoElement(todo);
            this.todoList.appendChild(todoElement);
        });
    }

    createTodoElement(todo) {
        const div = document.createElement('div');
        div.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        div.dataset.id = todo.id;

        if (this.editingId === todo.id) {
            // Render edit mode
            div.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <input type="text" class="todo-text" value="${this.escapeHtml(todo.text)}" autofocus>
                <div class="todo-actions">
                    <button class="save-btn">Save</button>
                    <button class="cancel-btn">Cancel</button>
                </div>
            `;

            // Bind edit mode events
            const checkbox = div.querySelector('.todo-checkbox');
            const textInput = div.querySelector('.todo-text');
            const saveBtn = div.querySelector('.save-btn');
            const cancelBtn = div.querySelector('.cancel-btn');

            checkbox.addEventListener('change', () => this.toggleTodo(todo.id));
            
            saveBtn.addEventListener('click', () => {
                this.saveEdit(todo.id, textInput.value);
            });
            
            cancelBtn.addEventListener('click', () => this.cancelEdit());
            
            textInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.saveEdit(todo.id, textInput.value);
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            });

        } else {
            // Render view mode
            div.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                <div class="todo-actions">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </div>
            `;

            // Bind view mode events
            const checkbox = div.querySelector('.todo-checkbox');
            const editBtn = div.querySelector('.edit-btn');
            const deleteBtn = div.querySelector('.delete-btn');

            checkbox.addEventListener('change', () => this.toggleTodo(todo.id));
            editBtn.addEventListener('click', () => this.startEdit(todo.id));
            deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));
        }

        return div;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
    console.log('AutoToDo app initialized successfully');
});