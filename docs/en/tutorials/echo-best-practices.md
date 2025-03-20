---
title: Echo Best Practices
order: 3
---

# Echo Best Practices

This document provides best practices and recommended patterns for using the Echo state management library, helping you build efficient and maintainable applications.

## State Design Principles

### 1. Modular State

Create independent Echo instances for different functional areas, rather than using a single global state:

```typescript
// ✅   Good practice: Modular state
const userStore = new Echo({
  /* User-related state */
});
const cartStore = new Echo({
  /* Cart-related state */
});
const settingsStore = new Echo({
  /* Application settings-related state */
});

// ❌ Not recommended: Single global state
const globalStore = new Echo({
  user: {
    /* User-related state */
  },
  cart: {
    /* Cart-related state */
  },
  settings: {
    /* Application settings-related state */
  },
});
```

The advantages of modular state:

- Better focus on separation
- Reduce unnecessary component re-renders
- Easier to understand and maintain
- Can choose different storage strategies for different modules

### 2. Flattened State Structure

Keep the state structure flat, avoiding deep nesting:

```typescript
// ✅ Good practice: Flattened structure
const userStore = new Echo({
  userId: null,
  userName: "",
  userEmail: "",
  userPreferences: {
    theme: "light",
    notifications: true,
  },
});

// ❌ Not recommended: Deeply nested
const userStore = new Echo({
  user: {
    id: null,
    profile: {
      name: "",
      contact: {
        email: "",
      },
    },
    preferences: {
      theme: "light",
      notifications: true,
    },
  },
});
```

The advantages of flattened structures:

- Easier to update specific fields
- Better performance (avoid deep comparisons)
- Easier to use selectors

### 3. Normalize Complex Data

For complex relational data, use normalized structures:

```typescript
// ✅ Good practice: Normalized data
const todoStore = new Echo({
  todos: {
    byId: {
      "todo-1": { id: "todo-1", text: "学习 Echo", completed: false },
      "todo-2": { id: "todo-2", text: "写文档", completed: true },
    },
    allIds: ["todo-1", "todo-2"],
  },
  lists: {
    byId: {
      "list-1": { id: "list-1", name: "工作", todoIds: ["todo-1"] },
      "list-2": { id: "list-2", name: "个人", todoIds: ["todo-2"] },
    },
    allIds: ["list-1", "list-2"],
  },
});

// ❌ Not recommended: Nested relational data
const todoStore = new Echo({
  lists: [
    {
      id: "list-1",
      name: "工作",
      todos: [{ id: "todo-1", text: "学习 Echo", completed: false }],
    },
    {
      id: "list-2",
      name: "个人",
      todos: [{ id: "todo-2", text: "写文档", completed: true }],
    },
  ],
});
```

The advantages of normalized data:

- Avoid data duplication
- Easier to update specific entities
- Better performance (especially for large data sets)

## Choosing the Right Storage Mode

Choose the appropriate storage mode based on the data characteristics:

### Temporary Storage (temporary)

Suitable for:

- Session-level temporary data
- UI state that does not need persistence
- Form intermediate states

```typescript
const uiStateStore = new Echo({
  sidebarOpen: false,
  activeTab: "home",
  modalVisible: false,
}).temporary();
```

### LocalStorage (localStorage)

Suitable for:

- User preferences
- Theme configuration
- Small data (< 5MB)
- State that needs to be retained after page refresh

```typescript
const preferencesStore = new Echo({
  theme: "light",
  fontSize: "medium",
  language: "zh-CN",
}).localStorage({
  name: "user-preferences",
  sync: true,
});
```

### IndexedDB (indexed)

Suitable for:

- Large data sets
- Complex structure data
- Data that needs high-performance queries
- Offline application data

```typescript
const documentsStore = new Echo({
  documents: {},
  currentDocumentId: null,
}).indexed({
  name: "documents",
  database: "app-data",
  object: "user-documents",
  sync: true,
});
```

## React Integration Best Practices

### Use Selectors to Optimize Performance

Always use selectors to only subscribe to the state parts that the component needs:

```typescript
function UserAvatar() {
  // ✅ Good practice: Only subscribe to the data needed
  const avatarUrl = userStore.use((state) => state.profile.avatarUrl);

  return <img src={avatarUrl} alt="User avatar" />;
}

function UserProfile() {
  // ❌ Not recommended: Subscribe to the entire state
  const state = userStore.use();

  return (
    <div>
      <img src={state.profile.avatarUrl} alt="User avatar" />
      <h2>{state.profile.name}</h2>
    </div>
  );
}
```

### Clean up subscriptions when the component unmounts

When using custom subscriptions, ensure cleanup when the component unmounts:

```typescript
function NotificationCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Add subscription
    const unsubscribe = notificationStore.subscribe((state) => {
      setCount(state.notifications.length);
    });

    // Clean up the subscription
    return () => unsubscribe();
  }, []);

  return <span>Notifications: {count}</span>;
}
```

### Use React.memo to reduce re-renders

For components using Echo, consider using React.memo to further optimize performance:

```typescript
const UserCard = React.memo(function UserCard({ userId }) {
  const user = userStore.use((state) =>
    state.users.find((u) => u.id === userId)
  );

  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
});
```

## Handling Asynchronous Operations

### Use State Flags to Track Asynchronous Operations

Include loading and error flags in the state:

```typescript
const userStore = new Echo({
  data: null,
  loading: false,
  error: null,
});

async function fetchUser(id) {
  try {
    // Set loading state
    userStore.set({ loading: true, error: null });

    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error("Failed to fetch user");

    const data = await response.json();

    // Update data and clear loading state
    userStore.set({ data, loading: false });
  } catch (error) {
    // Set error state
    userStore.set({ loading: false, error: error.message });
  }
}
```

### Create dedicated asynchronous operation functions

Encapsulate asynchronous logic in dedicated functions, rather than handling it directly in components:

```typescript
// userService.js
export const userService = {
  async fetchUser(id) {
    try {
      userStore.set({ loading: true, error: null });
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      const data = await response.json();
      userStore.set({ data, loading: false });
      return data;
    } catch (error) {
      userStore.set({ loading: false, error: error.message });
      throw error;
    }
  },

  async updateUser(id, updates) {
    // Similar implementation...
  },
};

// Use in components
function UserProfile({ userId }) {
  const { data, loading, error } = userStore.use();

  useEffect(() => {
    userService.fetchUser(userId).catch(console.error);
  }, [userId]);

  // Render logic...
}
```

## Persistence and Synchronization

### Wait for initialization to complete

Always wait for initialization to complete before accessing the state:

```typescript
async function initializeApp() {
  // Wait for all stores to initialize
  await Promise.all([
    userStore.ready(),
    settingsStore.ready(),
    dataStore.ready(),
  ]);

  // Now it is safe to access the state
  console.log("User:", userStore.current);
  console.log("Settings:", settingsStore.current);

  // Render the application
  renderApp();
}
```

### Properly handle chained calls

When using chained calls, ensure that the initialization is completed before setting the state:

```typescript
// ✅ Good practice: Wait for initialization to complete
async function loadProject(projectId, projectData) {
  const store = new Echo({
    /* Default state */
  });

  // First configure the storage
  store.indexed({
    name: projectId,
    database: "projects",
  });

  // Wait for initialization to complete
  await store.ready();

  // Then set the state
  store.set(projectData, { replace: true });

  return store;
}

// ❌ Not recommended: No waiting for initialization
function loadProject(projectId, projectData) {
  return new Echo({
    /* Default state */
  })
    .indexed({
      name: projectId,
      database: "projects",
    })
    .set(projectData, { replace: true }); // It may be overwritten!
}
```

## Organization and Extension

### Create custom Store classes

For complex applications, create extended custom Store classes:

```typescript
class TodoStore extends Echo<TodoState> {
  constructor() {
    super({
      todos: [],
      filter: "all",
      loading: false,
    });

    this.localStorage({
      name: "todos",
      sync: true,
    });
  }

  // Add business logic methods
  addTodo(text: string) {
    if (!text.trim()) return;

    this.set((state) => ({
      todos: [
        ...state.todos,
        {
          id: Date.now().toString(),
          text,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }

  toggleTodo(id: string) {
    this.set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    }));
  }

  deleteTodo(id: string) {
    this.set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    }));
  }

  setFilter(filter: "all" | "active" | "completed") {
    this.set({ filter });
  }

  // Add computed properties
  getFilteredTodos() {
    const { todos, filter } = this.current;

    switch (filter) {
      case "active":
        return todos.filter((todo) => !todo.completed);
      case "completed":
        return todos.filter((todo) => todo.completed);
      default:
        return todos;
    }
  }

  // Async methods
  async fetchTodos() {
    try {
      this.set({ loading: true });
      const response = await fetch("/api/todos");
      const todos = await response.json();
      this.set({ todos, loading: false });
    } catch (error) {
      console.error("Failed to fetch todos:", error);
      this.set({ loading: false });
    }
  }
}

// Create a singleton instance
export const todoStore = new TodoStore();
```

### Use factory functions to create Store

For stores that need to be dynamically created, use factory functions:

```typescript
function createProjectStore(projectId: string) {
  const store = new Echo({
    details: null,
    tasks: [],
    members: [],
    loading: false,
    error: null,
  });

  store.indexed({
    name: `project-${projectId}`,
    database: "projects-db",
    sync: true,
  });

  // Add project-specific methods
  const projectApi = {
    async fetchDetails() {
      store.set({ loading: true });
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        const data = await response.json();
        store.set({ details: data, loading: false });
      } catch (error) {
        store.set({ error: error.message, loading: false });
      }
    },

    // Other project-specific methods...
  };

  // Return the enhanced store
  return Object.assign(store, projectApi);
}

// Use
const projectStore = createProjectStore("project-123");
await projectStore.ready();
projectStore.fetchDetails();
```

## Debugging and Testing

### Add a debugging middleware

Create a simple debugging middleware to record state changes:

```typescript
function createDebugStore<T>(name: string, defaultState: T) {
  const store = new Echo<T>(defaultState);

  if (process.env.NODE_ENV === "development") {
    store.subscribe((state) => {
      console.group(`[Echo Store: ${name}] State Update`);
      console.log("New state:", state);
      console.groupEnd();
    });
  }

  return store;
}

// Use
const userStore = createDebugStore("User", { name: "", age: 0 });
```

### Create a resettable Store for testing

Ensure that each test case has a clean state:

```typescript
// store.js
export function createTestableStore() {
  const store = new Echo({
    count: 0,
    data: null,
  });

  // Add test helper methods
  return {
    ...store,
    resetForTest() {
      store.set({ count: 0, data: null }, { replace: true });
    },
  };
}

// Use in tests
import { createTestableStore } from "./store";

describe("Counter tests", () => {
  const store = createTestableStore();

  beforeEach(() => {
    store.resetForTest();
  });

  test("should increment counter", () => {
    store.set((state) => ({ count: state.count + 1 }));
    expect(store.current.count).toBe(1);
  });

  test("should decrement counter", () => {
    store.set({ count: 5 });
    store.set((state) => ({ count: state.count - 1 }));
    expect(store.current.count).toBe(4);
  });
});
```

## Performance Optimization

### Avoid unnecessary state updates

Ensure that state is only updated when the value actually changes:

```typescript
function updateUserPreference(key, value) {
  const currentValue = userPreferencesStore.current[key];

  // Only update when the value actually changes
  if (currentValue !== value) {
    userPreferencesStore.set({ [key]: value });
  }
}
```

### Batch update related states

Merge related state updates into a single update:

```typescript
// ✅ Good practice: Update multiple related fields at once
function updateUserProfile(updates) {
  userStore.set(updates);
}

// ❌ Not recommended: Multiple separate updates
function updateUserProfile(updates) {
  if (updates.name) userStore.set({ name: updates.name });
  if (updates.email) userStore.set({ email: updates.email });
  if (updates.avatar) userStore.set({ avatar: updates.avatar });
}
```

### Use memoized selectors

For complex selectors, use memoization to avoid unnecessary recalculations:

```typescript
import { useMemo } from "react";

function TodoList() {
  const { todos, filter } = todoStore.use();

  // Use useMemo to memoize the filtered results
  const filteredTodos = useMemo(() => {
    switch (filter) {
      case "active":
        return todos.filter((todo) => !todo.completed);
      case "completed":
        return todos.filter((todo) => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  return (
    <ul>
      {filteredTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
```

## Summary

Following these best practices will help you make the most of the Echo state management library, building efficient and maintainable applications. Key points:

1. Design good state structures (modular, flattened, normalized)
2. Choose the appropriate storage mode (temporary, LocalStorage, IndexedDB)
3. Use selectors to optimize performance
4. Properly handle asynchronous operations
5. Wait for initialization to complete
6. Extend Echo to meet specific needs
7. Implement debugging and testing strategies
8. Apply performance optimization techniques
