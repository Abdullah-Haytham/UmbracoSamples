import {
    LitElement,
    html,
    customElement,
    state,
    css,
} from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import {
    UmbNotificationContext,
    UMB_NOTIFICATION_CONTEXT,
} from "@umbraco-cms/backoffice/notification";

// Define TypeScript interfaces to match your C# models
interface ITodoList {
    id: string; // Guid maps to string in TypeScript
    name: string;
    allowedUsers: ITodoListAllowedUser[]; // Navigation property for the linking table
    todoItems: ITodoItem[]; // Navigation property for todo items
}

interface ITodoListAllowedUser {
    todoListId: string;
    userGuid: string;
}

interface ITodoItem {
    id: string;
    description: string;
    isCompleted: boolean;
    completedByUserId?: string | null; // Nullable Guid
    todoListId: string;
}

// Frontend DTO for simplified user data
interface ISimpleUserDto {
    id: string; // User GUID
    name: string; // User name
}

@customElement('my-typescript-element')
export default class MyTypeScriptElement extends UmbElementMixin(LitElement) {
    // Inject the notification context for displaying messages
    private notificationContext?: UmbNotificationContext;

    // State to hold the list of todo lists fetched from the API
    @state()
    private todoLists: ITodoList[] = [];

    // State for the input field when creating a new todo list
    @state()
    private newTodoListName: string = '';

    // State: Array to hold descriptions for new todo items to be added with the new list
    @state()
    private newItemsForNewList: string[] = ['']; // Start with one empty input field

    // NEW STATE: List of all available users fetched from the backend
    @state()
    private availableUsers: ISimpleUserDto[] = [];

    // NEW STATE: List of selected user GUIDs for the new todo list
    @state()
    private selectedAllowedUserIds: string[] = [];

    // State to indicate loading status for UI feedback
    @state()
    private loading: boolean = false;

    // State to hold any error messages
    @state()
    private error: string | null = null;

    @state()
    private userDropdownOpen: boolean = false;

    constructor() {
        super();
        // Consume the notification context to show success/error messages
        this.consumeContext(UMB_NOTIFICATION_CONTEXT, (_instance) => {
            this.notificationContext = _instance;
        });
    }

    // Lifecycle method called after the first update, good for initial data fetching
    firstUpdated() {
        this.fetchTodoLists();
        this.fetchAvailableUsers(); // Fetch users when the component starts
    }

    // Styles for the component
    static styles = [
        css`
            :host {
                display: block;
                padding: var(--uui-size-layout-1);
            }

            .todo-section {
                margin-bottom: var(--uui-size-layout-1);
                padding: var(--uui-size-space-5);
                border: 1px solid var(--uui-color-border);
                border-radius: var(--uui-border-radius);
                background-color: var(--uui-color-surface);
            }

            .todo-section:not(:last-child) {
                margin-bottom: var(--uui-size-layout-1);
            }

            .add-todo-list-form { /* Changed class name for clarity */
                display: flex;
                flex-direction: column; /* Stack elements vertically */
                gap: var(--uui-size-space-3);
                margin-top: var(--uui-size-space-5);
            }

            .add-todo-list-form uui-input,
            .add-todo-list-form uui-select { /* Added uui-select */
                width: 100%;
            }

            .todo-list-item-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--uui-size-3) var(--uui-size-4);
                background-color: var(--uui-color-background-alt);
                border-bottom: 1px solid var(--uui-color-border);
                border-radius: var(--uui-border-radius) var(--uui-border-radius) 0 0;
            }

            .todo-items-container {
                padding: var(--uui-size-4);
            }

            .todo-item {
                display: flex;
                align-items: center;
                gap: var(--uui-size-3);
                padding: var(--uui-size-2) 0;
                border-bottom: 1px dashed var(--uui-color-border-alt);
            }

            .todo-item:last-child {
                border-bottom: none;
            }

            .todo-item.completed .description {
                text-decoration: line-through;
                color: var(--uui-color-text-alt);
            }

            .no-todos {
                padding: var(--uui-size-5);
                text-align: center;
                color: var(--uui-color-text-alt);
            }

            h3 {
                margin-top: 0;
                margin-bottom: var(--uui-size-3);
            }

            .new-todo-items-section, .allowed-users-section {
                border-top: 1px solid var(--uui-color-border-alt);
                padding-top: var(--uui-size-space-4);
                margin-top: var(--uui-size-space-4);
            }
            .new-todo-items-section h4, .allowed-users-section h4 {
                margin-top: 0;
                margin-bottom: var(--uui-size-space-3);
            }

            .new-todo-item-input-group {
                display: flex;
                gap: var(--uui-size-space-3);
                margin-bottom: var(--uui-size-space-2);
                align-items: center;
            }
            .new-todo-item-input-group uui-input {
                flex-grow: 1;
            }

            .form-actions {
                display: flex;
                justify-content: flex-end;
                gap: var(--uui-size-space-3);
                margin-top: var(--uui-size-space-5);
            }

            .custom-multiselect {
                position: relative;
                width: 100%;
            }

            .multiselect-trigger {
                width: 100%;
                padding: var(--uui-size-space-3) var(--uui-size-space-4);
                border: 1px solid var(--uui-color-border);
                border-radius: var(--uui-border-radius);
                background-color: var(--uui-color-surface);
                color: var(--uui-color-text);
                text-align: left;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-family: inherit;
                font-size: inherit;
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            .multiselect-trigger:hover:not(:disabled) {
                border-color: var(--uui-color-border-emphasis);
            }

            .multiselect-trigger:focus {
                outline: none;
                border-color: var(--uui-color-focus);
                box-shadow: 0 0 0 2px var(--uui-color-focus-standalone);
            }

            .multiselect-trigger:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .selected-display {
                flex-grow: 1;
                color: var(--uui-color-text);
            }

            .multiselect-trigger:disabled .selected-display {
                color: var(--uui-color-text-alt);
            }

            .dropdown-icon {
                transition: transform 0.2s;
                color: var(--uui-color-text-alt);
            }

            .dropdown-icon.open {
                transform: rotate(180deg);
            }

            .multiselect-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                z-index: 1000;
                background-color: var(--uui-color-surface);
                border: 1px solid var(--uui-color-border);
                border-radius: var(--uui-border-radius);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                max-height: 200px;
                overflow-y: auto;
                margin-top: 2px;
            }

            .user-option {
                display: flex;
                align-items: center;
                gap: var(--uui-size-space-3);
                padding: var(--uui-size-space-3) var(--uui-size-space-4);
                cursor: pointer;
                transition: background-color 0.2s;
                border-bottom: 1px solid var(--uui-color-border-alt);
            }

            .user-option:last-child {
                border-bottom: none;
            }

            .user-option:hover {
                background-color: var(--uui-color-surface-alt);
            }

            .user-name {
                flex-grow: 1;
                color: var(--uui-color-text);
            }

            .no-users {
                padding: var(--uui-size-space-4);
                text-align: center;
                color: var(--uui-color-text-alt);
                font-style: italic;
            }

            .selected-users-display {
                margin-top: var(--uui-size-space-3);
            }

            .selected-users-display small {
                color: var(--uui-color-text-alt);
                margin-bottom: var(--uui-size-space-2);
                display: block;
            }

            .selected-users-tags {
                display: flex;
                flex-wrap: wrap;
                gap: var(--uui-size-space-2);
            }

            .user-tag {
                display: inline-flex;
                align-items: center;
                gap: var(--uui-size-space-2);
                padding: var(--uui-size-space-1) var(--uui-size-space-3);
                background-color: var(--uui-color-selected);
                color: var(--uui-color-selected-contrast);
                border-radius: calc(var(--uui-border-radius) / 2);
                font-size: 0.875em;
            }

            .remove-user {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 2px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }

            .remove-user:hover:not(:disabled) {
                background-color: rgba(255, 255, 255, 0.2);
            }

            .remove-user:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        `,
    ];

    /**
     * Fetches all todo lists from the backend API.
     */
    async fetchTodoLists() {
        this.loading = true;
        this.error = null;
        try {
            const response = await fetch('/api/todos/all', {
                credentials: 'include' // Crucial for sending cookies
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch todo lists: ${response.statusText} - ${errorText}`);
            }
            const data: ITodoList[] = await response.json();
            this.todoLists = data;
            console.log('Fetched Todo Lists:', this.todoLists);
        } catch (err: any) {
            this.error = err.message;
            this.notificationContext?.peek("danger", {
                data: { message: `Error fetching todo lists: ${err.message}` },
            });
            console.error('Error fetching todo lists:', err);
        } finally {
            this.loading = false;
        }
    }

    /**
     * Fetches all available users from the backend API.
     */
    async fetchAvailableUsers() {
        this.loading = true;
        this.error = null;
        try {
            const response = await fetch('/api/users', { // New endpoint
                credentials: 'include'
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch users: ${response.statusText} - ${errorText}`);
            }
            const data: ISimpleUserDto[] = await response.json();
            this.availableUsers = data;
            console.log('Fetched Available Users:', this.availableUsers);
        } catch (err: any) {
            this.error = err.message;
            this.notificationContext?.peek("danger", {
                data: { message: `Error fetching users: ${err.message}` },
            });
            console.error('Error fetching users:', err);
        } finally {
            this.loading = false;
        }
    }

    /**
     * Handles the input change event for the new todo list name.
     * @param event The input event.
     */
    onNewTodoListNameInput = (event: Event) => {
        const input = event.target as HTMLInputElement;
        this.newTodoListName = input.value;
    };

    /**
     * Handles input changes for dynamic new todo item fields.
     * @param index The index of the item in the array.
     * @param event The input event.
     */
    onNewItemForNewListInput = (index: number, event: Event) => {
        const input = event.target as HTMLInputElement;
        const newArray = [...this.newItemsForNewList];
        newArray[index] = input.value;
        this.newItemsForNewList = newArray;
    };

    /**
     * Adds a new empty input field for a todo item when creating a new list.
     */
    addTodoItemField() {
        this.newItemsForNewList = [...this.newItemsForNewList, ''];
    }

    /**
     * Removes a todo item input field from the new list creation form.
     * @param index The index of the item to remove.
     */
    removeTodoItemField(index: number) {
        if (this.newItemsForNewList.length > 1) {
            const newArray = this.newItemsForNewList.filter((_, i) => i !== index);
            this.newItemsForNewList = newArray;
        } else {
            this.newItemsForNewList = [''];
        }
    }

    /**
     * Handles changes in the allowed users multi-select.
     * @param event The change event from uui-select.
     */
    onAllowedUsersSelectChange = (event: CustomEvent) => {
        const selectElement = event.target as HTMLSelectElement; // Cast to HTMLSelectElement

        // For uui-select with multiple="true", the 'value' property on the actual UUI component
        // should contain the array of selected values. event.detail.selection is also an option,
        // but let's try direct .value access for reliability.
        const selection = selectElement.value; // Get the value directly from the element

        // Ensure selection is treated as an array of strings
        if (Array.isArray(selection)) {
            this.selectedAllowedUserIds = [...selection]; // Create a new array instance for reactivity
            console.log('Selected Allowed User IDs:', this.selectedAllowedUserIds);
        } else if (typeof selection === 'string' && selection !== '') {
             // If only a single item is selected (and multiple is true), it might come as a string
             // Ensure it's always an array for selectedAllowedUserIds
             this.selectedAllowedUserIds = [selection];
             console.log('Selected Allowed User IDs (single item):', this.selectedAllowedUserIds);
        }
        else {
            this.selectedAllowedUserIds = []; // Reset if no valid selection
            console.log('Selected Allowed User IDs: (Cleared/Invalid Selection) []');
        }
    };


    /**
     * Handles the creation of a new todo list including its initial items and allowed users.
     */
    async createTodoList() {
        if (!this.newTodoListName.trim()) {
            this.notificationContext?.peek("warning", {
                data: { message: "Todo list name cannot be empty." },
            });
            return;
        }

        const itemsToCreate = this.newItemsForNewList.map(item => item.trim()).filter(item => item.length > 0);

        this.loading = true;
        this.error = null;
        try {
            const payload = {
                name: this.newTodoListName,
                todoItemDescriptions: itemsToCreate,
                allowedUserIds: this.selectedAllowedUserIds,
            };
            console.log('Payload for Create Todo List:', payload);

            const response = await fetch('/api/todos/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create todo list: ${response.statusText} - ${errorText}`);
            }

            this.notificationContext?.peek("positive", {
                data: { message: `Todo list "${this.newTodoListName}" created successfully!` },
            });

            // Reset form state
            this.newTodoListName = '';
            this.newItemsForNewList = [''];
            this.selectedAllowedUserIds = [];
            this.userDropdownOpen = false; // Close the dropdown
            
            await this.fetchTodoLists();
        } catch (err: any) {
            this.error = err.message;
            this.notificationContext?.peek("danger", {
                data: { message: `Error creating todo list: ${err.message}` },
            });
            console.error('Error creating todo list:', err);
        } finally {
            this.loading = false;
        }
    }

    /**
     * Toggles the completion status of a specific TodoItem.
     * @param todoListId The ID of the parent TodoList.
     * @param todoItemId The ID of the TodoItem to update.
     * @param currentStatus The current completion status of the TodoItem.
     */
    async toggleTodoItemCompletion(todoListId: string, todoItemId: string, currentStatus: boolean) {
        this.loading = true;
        this.error = null;
        try {
            const newStatus = !currentStatus;
            const response = await fetch('/api/todos/toggle-completion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    id: todoItemId,
                    todoListId: todoListId,
                    isCompleted: newStatus,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update todo item: ${response.statusText} - ${errorText}`);
            }

            this.notificationContext?.peek("positive", {
                data: { message: `Todo item status updated!` },
            });

            await this.fetchTodoLists();
        } catch (err: any) {
            this.error = err.message;
            this.notificationContext?.peek("danger", {
                data: { message: `Error updating todo item: ${err.message}` },
            });
            console.error('Error updating todo item:', err);
        } finally {
            this.loading = false;
        }
    }

    toggleUserDropdown = () => {
        this.userDropdownOpen = !this.userDropdownOpen;
    };

    /**
     * Handles checkbox changes for user selection
     */
    onUserCheckboxChange = (userId: string, isChecked: boolean) => {
        if (isChecked) {
            if (!this.selectedAllowedUserIds.includes(userId)) {
                this.selectedAllowedUserIds = [...this.selectedAllowedUserIds, userId];
            }
        } else {
            this.selectedAllowedUserIds = this.selectedAllowedUserIds.filter(id => id !== userId);
        }
        console.log('Updated selectedAllowedUserIds:', this.selectedAllowedUserIds);
    };

    /**
     * Removes a selected user from the selection
     */
    removeSelectedUser = (userId: string) => {
        this.selectedAllowedUserIds = this.selectedAllowedUserIds.filter(id => id !== userId);
        console.log('Removed user, updated selectedAllowedUserIds:', this.selectedAllowedUserIds);
    };


    render() {
        // Console log here to check value before rendering
        console.log('Rendering with selectedAllowedUserIds:', this.selectedAllowedUserIds);

        return html`
            <uui-box headline="Todo Lists Dashboard">
                <p>Manage your personal todo lists.</p>

                <div class="todo-section">
                    <h3>Create New Todo List</h3>
                    <div class="add-todo-list-form">
                        <uui-input
                            label="Todo List Name"
                            placeholder="e.g., Groceries, Work Tasks"
                            .value=${this.newTodoListName}
                            @input=${this.onNewTodoListNameInput}
                            .disabled=${this.loading}
                        ></uui-input>

                        <div class="allowed-users-section">
                            <h4>Allowed Users</h4>
                            <div class="custom-multiselect">
                                <button 
                                    class="multiselect-trigger"
                                    type="button"
                                    @click=${this.toggleUserDropdown}
                                    .disabled=${this.loading || this.availableUsers.length === 0}
                                >
                                    <span class="selected-display">
                                        ${this.selectedAllowedUserIds.length === 0 
                                            ? 'Select users to allow access'
                                            : `${this.selectedAllowedUserIds.length} user${this.selectedAllowedUserIds.length !== 1 ? 's' : ''} selected`
                                        }
                                    </span>
                                    <uui-icon name="icon-chevron-down" class="dropdown-icon ${this.userDropdownOpen ? 'open' : ''}"></uui-icon>
                                </button>
                                
                                ${this.userDropdownOpen ? html`
                                    <div class="multiselect-dropdown">
                                        ${this.availableUsers.length === 0 ? html`
                                            <div class="no-users">No users available</div>
                                        ` : this.availableUsers.map(user => html`
                                            <label class="user-option">
                                                <uui-checkbox
                                                    .checked=${this.selectedAllowedUserIds.includes(user.id)}
                                                    @change=${(e: Event) => this.onUserCheckboxChange(user.id, (e.target as any).checked)}
                                                    .disabled=${this.loading}
                                                ></uui-checkbox>
                                                <span class="user-name">${user.name}</span>
                                            </label>
                                        `)}
                                    </div>
                                ` : ''}
                            </div>
                            
                            <!-- Show selected users -->
                            ${this.selectedAllowedUserIds.length > 0 ? html`
                                <div class="selected-users-display">
                                    <small>Selected users:</small>
                                    <div class="selected-users-tags">
                                        ${this.selectedAllowedUserIds.map(userId => {
                                            const user = this.availableUsers.find(u => u.id === userId);
                                            return user ? html`
                                                <span class="user-tag">
                                                    ${user.name}
                                                    <button 
                                                        type="button" 
                                                        class="remove-user"
                                                        @click=${() => this.removeSelectedUser(userId)}
                                                        .disabled=${this.loading}
                                                    >
                                                        <uui-icon name="icon-remove"></uui-icon>
                                                    </button>
                                                </span>
                                            ` : '';
                                        })}
                                    </div>
                                </div>
                            ` : ''}
                        </div>

                        <div class="new-todo-items-section">
                            <h4>Initial Todo Items (Optional)</h4>
                            ${this.newItemsForNewList.map((item, index) => html`
                                <div class="new-todo-item-input-group">
                                    <uui-input
                                        label=${`Item ${index + 1}`}
                                        placeholder="e.g., Buy milk"
                                        .value=${item}
                                        @input=${(e: Event) => this.onNewItemForNewListInput(index, e)}
                                        .disabled=${this.loading}
                                    ></uui-input>
                                    ${this.newItemsForNewList.length > 1 ? html`
                                        <uui-button
                                            compact
                                            look="secondary"
                                            label="Remove"
                                            @click=${() => this.removeTodoItemField(index)}
                                            .disabled=${this.loading}
                                        >
                                            <uui-icon name="icon-trash"></uui-icon>
                                        </uui-button>
                                    ` : ''}
                                </div>
                            `)}
                            <uui-button
                                compact
                                look="outline"
                                label="Add another item"
                                @click=${this.addTodoItemField}
                                .disabled=${this.loading}
                                style="margin-top: var(--uui-size-space-3);"
                            >
                                <uui-icon name="icon-add"></uui-icon>
                            </uui-button>
                        </div>

                        <div class="form-actions">
                            <uui-button
                                look="primary"
                                label="Create List"
                                @click=${this.createTodoList}
                                .loading=${this.loading}
                                .disabled=${!this.newTodoListName.trim() || this.loading}
                            ></uui-button>
                        </div>
                    </div>
                    ${this.error ? html`<p style="color: var(--uui-color-danger-standalone);">${this.error}</p>` : ''}
                </div>

                <div class="todo-section">
                    <h3>Your Todo Lists</h3>
                    ${this.loading && this.todoLists.length === 0
                        ? html`<uui-loader-circle></uui-loader-circle><p>Loading todo lists...</p>`
                        : this.todoLists.length > 0
                            ? html`
                                <uui-card-list>
                                    ${this.todoLists.map((list) => html`
                                        <uui-card>
                                            <div class="todo-list-item-header">
                                                <strong>${list.name}</strong>
                                                <small>${list.todoItems.filter(item => item.isCompleted).length} / ${list.todoItems.length} items completed</small>
                                            </div>
                                            <div class="todo-items-container">
                                                ${list.todoItems.length > 0
                                                    ? list.todoItems.map(item => html`
                                                        <div class="todo-item ${item.isCompleted ? 'completed' : ''}">
                                                            <uui-checkbox
                                                                .checked=${item.isCompleted}
                                                                @change=${() => this.toggleTodoItemCompletion(list.id, item.id, item.isCompleted)}
                                                                .disabled=${this.loading}
                                                            ></uui-checkbox>
                                                            <span class="description">${item.description}</span>
                                                        </div>
                                                    `)
                                                    : html`<p class="no-todos">No items in this list yet.</p>`
                                                }
                                            </div>
                                        </uui-card>
                                    `)}
                                </uui-card-list>
                            `
                            : html`<p class="no-todos">No todo lists found. Create one above!</p>`
                    }
                </div>
            </uui-box>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'my-typescript-element': MyTypeScriptElement;
    }
}
