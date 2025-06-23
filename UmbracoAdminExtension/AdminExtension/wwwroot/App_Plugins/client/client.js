import { LitElement as p, html as r, css as h, state as c, customElement as m } from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin as g } from "@umbraco-cms/backoffice/element-api";
import { UMB_NOTIFICATION_CONTEXT as w } from "@umbraco-cms/backoffice/notification";
var v = Object.defineProperty, b = Object.getOwnPropertyDescriptor, n = (t, e, o, i) => {
  for (var s = i > 1 ? void 0 : i ? b(e, o) : e, a = t.length - 1, d; a >= 0; a--)
    (d = t[a]) && (s = (i ? d(e, o, s) : d(s)) || s);
  return i && s && v(e, o, s), s;
};
let l = class extends g(p) {
  constructor() {
    super(), this.todoLists = [], this.newTodoListName = "", this.newItemsForNewList = [""], this.availableUsers = [], this.selectedAllowedUserIds = [], this.loading = !1, this.error = null, this.userDropdownOpen = !1, this.onNewTodoListNameInput = (t) => {
      const e = t.target;
      this.newTodoListName = e.value;
    }, this.onNewItemForNewListInput = (t, e) => {
      const o = e.target, i = [...this.newItemsForNewList];
      i[t] = o.value, this.newItemsForNewList = i;
    }, this.onAllowedUsersSelectChange = (t) => {
      const o = t.target.value;
      Array.isArray(o) ? (this.selectedAllowedUserIds = [...o], console.log("Selected Allowed User IDs:", this.selectedAllowedUserIds)) : typeof o == "string" && o !== "" ? (this.selectedAllowedUserIds = [o], console.log("Selected Allowed User IDs (single item):", this.selectedAllowedUserIds)) : (this.selectedAllowedUserIds = [], console.log("Selected Allowed User IDs: (Cleared/Invalid Selection) []"));
    }, this.toggleUserDropdown = () => {
      this.userDropdownOpen = !this.userDropdownOpen;
    }, this.onUserCheckboxChange = (t, e) => {
      e ? this.selectedAllowedUserIds.includes(t) || (this.selectedAllowedUserIds = [...this.selectedAllowedUserIds, t]) : this.selectedAllowedUserIds = this.selectedAllowedUserIds.filter((o) => o !== t), console.log("Updated selectedAllowedUserIds:", this.selectedAllowedUserIds);
    }, this.removeSelectedUser = (t) => {
      this.selectedAllowedUserIds = this.selectedAllowedUserIds.filter((e) => e !== t), console.log("Removed user, updated selectedAllowedUserIds:", this.selectedAllowedUserIds);
    }, this.consumeContext(w, (t) => {
      this.notificationContext = t;
    });
  }
  // Lifecycle method called after the first update, good for initial data fetching
  firstUpdated() {
    this.fetchTodoLists(), this.fetchAvailableUsers();
  }
  /**
   * Fetches all todo lists from the backend API.
   */
  async fetchTodoLists() {
    var t;
    this.loading = !0, this.error = null;
    try {
      const e = await fetch("/api/todos/all", {
        credentials: "include"
        // Crucial for sending cookies
      });
      if (!e.ok) {
        const i = await e.text();
        throw new Error(`Failed to fetch todo lists: ${e.statusText} - ${i}`);
      }
      const o = await e.json();
      this.todoLists = o, console.log("Fetched Todo Lists:", this.todoLists);
    } catch (e) {
      this.error = e.message, (t = this.notificationContext) == null || t.peek("danger", {
        data: { message: `Error fetching todo lists: ${e.message}` }
      }), console.error("Error fetching todo lists:", e);
    } finally {
      this.loading = !1;
    }
  }
  /**
   * Fetches all available users from the backend API.
   */
  async fetchAvailableUsers() {
    var t;
    this.loading = !0, this.error = null;
    try {
      const e = await fetch("/api/users", {
        // New endpoint
        credentials: "include"
      });
      if (!e.ok) {
        const i = await e.text();
        throw new Error(`Failed to fetch users: ${e.statusText} - ${i}`);
      }
      const o = await e.json();
      this.availableUsers = o, console.log("Fetched Available Users:", this.availableUsers);
    } catch (e) {
      this.error = e.message, (t = this.notificationContext) == null || t.peek("danger", {
        data: { message: `Error fetching users: ${e.message}` }
      }), console.error("Error fetching users:", e);
    } finally {
      this.loading = !1;
    }
  }
  /**
   * Adds a new empty input field for a todo item when creating a new list.
   */
  addTodoItemField() {
    this.newItemsForNewList = [...this.newItemsForNewList, ""];
  }
  /**
   * Removes a todo item input field from the new list creation form.
   * @param index The index of the item to remove.
   */
  removeTodoItemField(t) {
    if (this.newItemsForNewList.length > 1) {
      const e = this.newItemsForNewList.filter((o, i) => i !== t);
      this.newItemsForNewList = e;
    } else
      this.newItemsForNewList = [""];
  }
  /**
   * Handles the creation of a new todo list including its initial items and allowed users.
   */
  async createTodoList() {
    var e, o, i;
    if (!this.newTodoListName.trim()) {
      (e = this.notificationContext) == null || e.peek("warning", {
        data: { message: "Todo list name cannot be empty." }
      });
      return;
    }
    const t = this.newItemsForNewList.map((s) => s.trim()).filter((s) => s.length > 0);
    this.loading = !0, this.error = null;
    try {
      const s = {
        name: this.newTodoListName,
        todoItemDescriptions: t,
        allowedUserIds: this.selectedAllowedUserIds
      };
      console.log("Payload for Create Todo List:", s);
      const a = await fetch("/api/todos/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(s)
      });
      if (!a.ok) {
        const d = await a.text();
        throw new Error(`Failed to create todo list: ${a.statusText} - ${d}`);
      }
      (o = this.notificationContext) == null || o.peek("positive", {
        data: { message: `Todo list "${this.newTodoListName}" created successfully!` }
      }), this.newTodoListName = "", this.newItemsForNewList = [""], this.selectedAllowedUserIds = [], this.userDropdownOpen = !1, await this.fetchTodoLists();
    } catch (s) {
      this.error = s.message, (i = this.notificationContext) == null || i.peek("danger", {
        data: { message: `Error creating todo list: ${s.message}` }
      }), console.error("Error creating todo list:", s);
    } finally {
      this.loading = !1;
    }
  }
  /**
   * Toggles the completion status of a specific TodoItem.
   * @param todoListId The ID of the parent TodoList.
   * @param todoItemId The ID of the TodoItem to update.
   * @param currentStatus The current completion status of the TodoItem.
   */
  async toggleTodoItemCompletion(t, e, o) {
    var i, s;
    this.loading = !0, this.error = null;
    try {
      const d = await fetch("/api/todos/toggle-completion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          id: e,
          todoListId: t,
          isCompleted: !o
        })
      });
      if (!d.ok) {
        const u = await d.text();
        throw new Error(`Failed to update todo item: ${d.statusText} - ${u}`);
      }
      (i = this.notificationContext) == null || i.peek("positive", {
        data: { message: "Todo item status updated!" }
      }), await this.fetchTodoLists();
    } catch (a) {
      this.error = a.message, (s = this.notificationContext) == null || s.peek("danger", {
        data: { message: `Error updating todo item: ${a.message}` }
      }), console.error("Error updating todo item:", a);
    } finally {
      this.loading = !1;
    }
  }
  render() {
    return console.log("Rendering with selectedAllowedUserIds:", this.selectedAllowedUserIds), r`
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
                                        ${this.selectedAllowedUserIds.length === 0 ? "Select users to allow access" : `${this.selectedAllowedUserIds.length} user${this.selectedAllowedUserIds.length !== 1 ? "s" : ""} selected`}
                                    </span>
                                    <uui-icon name="icon-chevron-down" class="dropdown-icon ${this.userDropdownOpen ? "open" : ""}"></uui-icon>
                                </button>
                                
                                ${this.userDropdownOpen ? r`
                                    <div class="multiselect-dropdown">
                                        ${this.availableUsers.length === 0 ? r`
                                            <div class="no-users">No users available</div>
                                        ` : this.availableUsers.map((t) => r`
                                            <label class="user-option">
                                                <uui-checkbox
                                                    .checked=${this.selectedAllowedUserIds.includes(t.id)}
                                                    @change=${(e) => this.onUserCheckboxChange(t.id, e.target.checked)}
                                                    .disabled=${this.loading}
                                                ></uui-checkbox>
                                                <span class="user-name">${t.name}</span>
                                            </label>
                                        `)}
                                    </div>
                                ` : ""}
                            </div>
                            
                            <!-- Show selected users -->
                            ${this.selectedAllowedUserIds.length > 0 ? r`
                                <div class="selected-users-display">
                                    <small>Selected users:</small>
                                    <div class="selected-users-tags">
                                        ${this.selectedAllowedUserIds.map((t) => {
      const e = this.availableUsers.find((o) => o.id === t);
      return e ? r`
                                                <span class="user-tag">
                                                    ${e.name}
                                                    <button 
                                                        type="button" 
                                                        class="remove-user"
                                                        @click=${() => this.removeSelectedUser(t)}
                                                        .disabled=${this.loading}
                                                    >
                                                        <uui-icon name="icon-remove"></uui-icon>
                                                    </button>
                                                </span>
                                            ` : "";
    })}
                                    </div>
                                </div>
                            ` : ""}
                        </div>

                        <div class="new-todo-items-section">
                            <h4>Initial Todo Items (Optional)</h4>
                            ${this.newItemsForNewList.map((t, e) => r`
                                <div class="new-todo-item-input-group">
                                    <uui-input
                                        label=${`Item ${e + 1}`}
                                        placeholder="e.g., Buy milk"
                                        .value=${t}
                                        @input=${(o) => this.onNewItemForNewListInput(e, o)}
                                        .disabled=${this.loading}
                                    ></uui-input>
                                    ${this.newItemsForNewList.length > 1 ? r`
                                        <uui-button
                                            compact
                                            look="secondary"
                                            label="Remove"
                                            @click=${() => this.removeTodoItemField(e)}
                                            .disabled=${this.loading}
                                        >
                                            <uui-icon name="icon-trash"></uui-icon>
                                        </uui-button>
                                    ` : ""}
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
                    ${this.error ? r`<p style="color: var(--uui-color-danger-standalone);">${this.error}</p>` : ""}
                </div>

                <div class="todo-section">
                    <h3>Your Todo Lists</h3>
                    ${this.loading && this.todoLists.length === 0 ? r`<uui-loader-circle></uui-loader-circle><p>Loading todo lists...</p>` : this.todoLists.length > 0 ? r`
                                <uui-card-list>
                                    ${this.todoLists.map((t) => r`
                                        <uui-card>
                                            <div class="todo-list-item-header">
                                                <strong>${t.name}</strong>
                                                <small>${t.todoItems.filter((e) => e.isCompleted).length} / ${t.todoItems.length} items completed</small>
                                            </div>
                                            <div class="todo-items-container">
                                                ${t.todoItems.length > 0 ? t.todoItems.map((e) => r`
                                                        <div class="todo-item ${e.isCompleted ? "completed" : ""}">
                                                            <uui-checkbox
                                                                .checked=${e.isCompleted}
                                                                @change=${() => this.toggleTodoItemCompletion(t.id, e.id, e.isCompleted)}
                                                                .disabled=${this.loading}
                                                            ></uui-checkbox>
                                                            <span class="description">${e.description}</span>
                                                        </div>
                                                    `) : r`<p class="no-todos">No items in this list yet.</p>`}
                                            </div>
                                        </uui-card>
                                    `)}
                                </uui-card-list>
                            ` : r`<p class="no-todos">No todo lists found. Create one above!</p>`}
                </div>
            </uui-box>
        `;
  }
};
l.styles = [
  h`
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
        `
];
n([
  c()
], l.prototype, "todoLists", 2);
n([
  c()
], l.prototype, "newTodoListName", 2);
n([
  c()
], l.prototype, "newItemsForNewList", 2);
n([
  c()
], l.prototype, "availableUsers", 2);
n([
  c()
], l.prototype, "selectedAllowedUserIds", 2);
n([
  c()
], l.prototype, "loading", 2);
n([
  c()
], l.prototype, "error", 2);
n([
  c()
], l.prototype, "userDropdownOpen", 2);
l = n([
  m("my-typescript-element")
], l);
export {
  l as default
};
//# sourceMappingURL=client.js.map
