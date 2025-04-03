---
title: FAQ
order: 5
---

# Echo FAQ

This document answers common questions about using the Echo state management library.

## Basic Questions

### Q: What are the advantages of Echo compared to Redux?

A: Echo has the following advantages compared to Redux:

- **Lighter weight**：The core code is smaller, and the API is more concise
- **Built-in persistence**：No additional middleware is needed to support LocalStorage and IndexedDB storage
- **Cross-window synchronization**：Built-in support for state synchronization between multiple tabs/windows
- **Simpler API**：No concepts of actions, reducers, middleware, etc.
- **TypeScript friendly**：Fully written in TypeScript, providing excellent type inference
- **React Hooks integration**：Built-in React Hooks support, no additional wrapping required

### Q: What data types does Echo support?

A: Echo supports various data types, but the level of support depends on the selected storage mode:

- **Basic data types**: Objects (Record), arrays, strings, numbers, booleans, null
- **Complex data types**:
  - Map and Set: Can be used in memory but do not support persistence
  - Class instances: Can be used in memory but lose methods and prototype chain when persisted
  - Functions: Not supported for storage

Note that when the state is `null`:
- When using persistent storage (LocalStorage or IndexedDB), `null` state will not be stored
- When the state becomes `null`, stored data will be deleted
- When the state changes from `null` to other values, storage will resume

For more details, please refer to the [Echo Data Types](./echo-data-types.md) documentation.

### Q: Does Echo support TypeScript?

A: Yes, Echo is fully written in TypeScript, providing complete type support. All APIs have detailed type definitions, providing good editor hints and type checking.

### Q: Can Echo be used in non-React projects?

A: Yes. Although Echo provides React Hooks integration, the core functionality does not depend on React. You can use the `subscribe` method to subscribe to state changes in any JavaScript environment.

```typescript
// Use in non-React environments
const counterStore = new Echo({ count: 0 });

// Subscribe to state changes
counterStore.subscribe((state) => {
  document.getElementById("counter").textContent = state.count;
});

// Update state
document.getElementById("increment").addEventListener("click", () => {
  counterStore.set((state) => ({ count: state.count + 1 }));
});
```

## Storage-related questions

### Q: How to choose the appropriate storage mode?

A: Choose the storage mode based on the data characteristics:

- **Temporary storage (temporary)**：Used for temporary UI state, session-level data, no need for persistence
- **LocalStorage (localStorage)**：Used for small data (< 5MB), user preferences, theme configuration, etc.
- **IndexedDB (indexed)**：Used for large data sets, complex structured data, offline application data

### Q: Why does the database store the default state instead of the state I set when chaining the `indexed()` and `set()` methods?

A: This is because the `indexed()` method is asynchronous, and the `hydrate()` method it internally calls needs time to initialize the database. When you chain the calls:

```typescript
echo
  .indexed({
    name: projectId,
    database: "my-database",
  })
  .set(project, {
    replace: true,
  });
```

The `set()` method will execute before `hydrate()` completes, so if the database is empty, `hydrate()` will use the default state to initialize the database, overwriting the state you set.

The correct approach is to wait for initialization to complete before setting the state:

```typescript
// Method 1: Use await
await echo
  .indexed({
    name: projectId,
    database: "my-database",
  })
  .ready();

echo.set(project, {
  replace: true,
});

// Method 2: Use chained Promise
echo
  .indexed({
    name: projectId,
    database: "my-database",
  })
  .ready()
  .then(() => {
    echo.set(project, {
      replace: true,
    });
  });
```

### Q: What changes have been made to the IndexedDB configuration parameters?

A: In the latest version, the configuration parameters for IndexedDB have changed:

- `storeName` is renamed to `database`, representing the database name
- The `version` parameter has been removed
- A new `object` parameter is added, representing the object repository name, with a default value of 'echo-state'

Old version configuration:

```typescript
userStore.indexed({
  name: "user-store",
  storeName: "userData",
  version: 1,
  sync: true,
});
```

New version configuration:

```typescript
userStore.indexed({
  name: "user-store",
  database: "user-database",
  object: "userData", // Optional, default is 'echo-state'
  sync: true,
});
```

### Q: How to clean up resources when a component is unloaded?

A: When a component is unloaded, you should clean up the resources used by the Echo instance, especially when using IndexedDB or cross-window synchronization:

```tsx
function MyComponent() {
  useEffect(() => {
    // Logic when the component is mounted...

    // Clean up resources when the component is unloaded
    return () => {
      myStore.destroy();
    };
  }, []);

  // Component rendering logic...
}
```

### Q: How to handle performance issues with large data sets?

A: For large data sets, it is recommended to:

1. Use the IndexedDB storage mode
2. Consider paginated loading of data, rather than loading all data at once
3. Use selectors to subscribe to only the data you need
4. For data that is frequently updated, consider using local state, updating Echo state only when necessary

```typescript
// Paginated loading example
const dataStore = new Echo({
  items: [],
  page: 1,
  hasMore: true,
  loading: false,
}).indexed({
  name: "large-dataset",
  database: "app-data",
});

async function loadNextPage() {
  const { page, loading, hasMore } = dataStore.current;

  if (loading || !hasMore) return;

  dataStore.set({ loading: true });

  try {
    const newItems = await fetchItems(page);

    dataStore.set((state) => ({
      items: [...state.items, ...newItems],
      page: state.page + 1,
      hasMore: newItems.length > 0,
      loading: false,
    }));
  } catch (error) {
    dataStore.set({ loading: false });
    console.error("Failed to load data:", error);
  }
}
```

## React integration issues

### Q: How to avoid unnecessary component re-renders?

A: Use selectors to subscribe to only the state parts that the component needs:

```tsx
// Bad practice: Subscribe to the entire state
function UserProfile() {
  // Re-renders whenever any field in the state changes
  const state = userStore.use();

  return <div>{state.user.name}</div>;
}

// Good practice: Use selectors
function UserProfile() {
  // Only re-renders when the username changes
  const userName = userStore.use((state) => state.user.name);

  return <div>{userName}</div>;
}
```

### Q: How to access Echo state outside a React component?

A: Outside a React component, you can use the `current` property or the `getCurrent()` method to access the state:

```typescript
// In a service or utility function
export async function saveUserData() {
  const userData = userStore.current;
  // Or use the asynchronous method (recommended, especially when using IndexedDB)
  const userData = await userStore.getCurrent();

  // Use the data...
}
```

### Q: How to use Echo in a React Context?

A: You can provide the Echo instance to the component tree through the Context:

```tsx
// Create context
const TodoContext = React.createContext<Echo<TodoState> | null>(null);

// Provider component
function TodoProvider({ children }) {
  // Create Echo instance
  const todoStore = useMemo(() => {
    return new Echo<TodoState>({ todos: [] }).localStorage({
      name: "todos",
      sync: true,
    });
  }, []);

  // Ensure resources are cleaned up when the component is unloaded
  useEffect(() => {
    return () => todoStore.destroy();
  }, [todoStore]);

  return (
    <TodoContext.Provider value={todoStore}>{children}</TodoContext.Provider>
  );
}

// Custom Hook simplifies usage
function useTodos<Selected = TodoState>(
  selector?: (state: TodoState) => Selected
) {
  const store = useContext(TodoContext);
  if (!store) {
    throw new Error("useTodos must be used inside TodoProvider");
  }
  return store.use(selector);
}
```

## Asynchronous operation issues

### Q: Does Echo support asynchronous operation middleware (such as Redux Thunk or Redux Saga)?

A: Echo does not have built-in asynchronous operation middleware, but it is easy to use Echo in asynchronous functions:

```typescript
async function fetchUserData(userId) {
  try {
    // Set loading state
    userStore.set({ loading: true, error: null });

    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) throw new Error("获取用户失败");

    const data = await response.json();

    // Update data and clear loading state
    userStore.set({ data, loading: false });

    return data;
  } catch (error) {
    // Set error state
    userStore.set({ loading: false, error: error.message });
    throw error;
  }
}
```

### Q: How to handle loading and error states for asynchronous operations?

A: Include loading and error flags in the state:

```typescript
// State definition
interface UserState {
  data: User | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const userStore = new Echo<UserState>({
  data: null,
  loading: false,
  error: null,
});

// Use in a component
function UserProfile({ userId }) {
  const { data, loading, error } = userStore.use();

  useEffect(() => {
    fetchUserData(userId);
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div>
      <h2>{data.name}</h2>
      <p>{data.email}</p>
    </div>
  );
}
```

## Advanced usage issues

### Q: How to create a custom state management class?

A: You can create a custom state management class by inheriting the Echo class:

```typescript
class TodoStore extends Echo<TodoState> {
  constructor() {
    super({
      todos: [],
      filter: "all",
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
}

// Create a singleton instance
export const todoStore = new TodoStore();
```

### Q: How to switch data between multiple projects?

A: Use the `switch` method to switch to different key names under the same database and object repository:

```typescript
// Create project store
const projectStore = new Echo<Project>({
  id: "",
  name: "",
  tasks: [],
}).indexed({
  name: "current-project", // Initial key name
  database: "projects-db",
  object: "projects",
});

// Switch to another project
async function switchToProject(projectId) {
  // Save current project (if needed)
  if (projectStore.current.id) {
    await saveCurrentProject();
  }

  // Switch to the new project
  await projectStore.switch(projectId).ready();

  // If the new project has no data, load it from the server
  if (!projectStore.current.id) {
    const project = await fetchProject(projectId);
    projectStore.set(project, { replace: true });
  }
}
```

### Q: How to implement undo/redo functionality?

A: You can implement undo/redo functionality by maintaining an array of historical state:

```typescript
interface EditorState {
  content: string;
  selection: { start: number; end: number } | null;
}

interface EditorStoreState {
  current: EditorState;
  history: EditorState[];
  historyIndex: number;
}

const editorStore = new Echo<EditorStoreState>({
  current: {
    content: "",
    selection: null,
  },
  history: [],
  historyIndex: -1,
});

// Update editor content
function updateContent(
  content: string,
  selection: { start: number; end: number } | null
) {
  editorStore.set((state) => {
    // Create new state
    const newState = {
      current: { content, selection },
      // Delete the history after the current index
      history: [
        ...state.history.slice(0, state.historyIndex + 1),
        state.current, // Add the current state to the history
      ],
      historyIndex: state.historyIndex + 1,
    };
    return newState;
  });
}

// Undo
function undo() {
  editorStore.set((state) => {
    if (state.historyIndex < 0) return state; // No history to undo

    return {
      current: state.history[state.historyIndex],
      history: state.history,
      historyIndex: state.historyIndex - 1,
    };
  });
}

// Redo
function redo() {
  editorStore.set((state) => {
    if (state.historyIndex >= state.history.length - 1) return state; // No operation to redo

    return {
      current: state.history[state.historyIndex + 1],
      history: state.history,
      historyIndex: state.historyIndex + 1,
    };
  });
}
```

## Debugging and testing issues

### Q: How to debug Echo state changes?

A: You can add a listener to record all state changes:

```typescript
if (process.env.NODE_ENV === "development") {
  userStore.subscribe((state) => {
    console.log("[Echo state update]", state);
  });
}
```

You can also create a debugging component:

```tsx
function EchoDebugger({ store, name = "Store" }) {
  const state = store.use();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        right: 10,
        background: "#f0f0f0",
        padding: 10,
        borderRadius: 4,
        maxWidth: 300,
        maxHeight: 400,
        overflow: "auto",
      }}
    >
      <h3>{name} 状态</h3>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}
```

### Q: How to test components using Echo?

A: In tests, you can create a test-specific Echo instance:

```typescript
// Create a test-specific store
function createTestStore(initialState = {}) {
  return new Echo({
    ...defaultState,
    ...initialState,
  }).temporary(); // Use temporary storage mode
}

// Use in tests
describe("Counter component", () => {
  let counterStore;

  beforeEach(() => {
    // Create a new store for each test
    counterStore = createTestStore({ count: 0 });
  });

  test("increments counter when button is clicked", () => {
    render(<Counter store={counterStore} />);

    expect(screen.getByText("0")).toBeInTheDocument();

    fireEvent.click(screen.getByText("增加"));

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(counterStore.current.count).toBe(1);
  });
});
```

## Performance and optimization issues

### Q: Is Echo suitable for large applications?

A: Yes, Echo is suitable for large applications, especially when you:

1. Use modular state (create independent Echo instances for different features)
2. Use selectors to optimize component re-renders
3. Use IndexedDB for large data sets
4. Follow best practices, such as flattening state structures and normalizing data

### Q: How to optimize the performance of Echo?

A: The key strategies to optimize Echo performance:

1. **Use selectors**：Only subscribe to the state parts that the component needs
2. **Avoid deep nesting**：Keep the state structure flat
3. **Normalize data**：Avoid data duplication
4. **Batch updates**：Combine multiple related updates into one update
5. **Use memoization**：For complex selectors, use `useMemo` to memoize results
6. **Avoid unnecessary updates**：Only update the state when the value actually changes

### Q: How to handle form state?

A: For forms, it is generally recommended to:

1. For simple forms, use React's `useState` to manage local state
2. For complex forms, use Echo to manage state, but avoid frequent updates:

```tsx
function ComplexForm() {
  // Use local state to manage input values during the process
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    // ...other fields
  });

  // Get initial values and submission status from Echo
  const { initialValues, submitting, error } = formStore.use();

  // 初始化表单
  useEffect(() => {
    if (initialValues) {
      setFormValues(initialValues);
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // 提交时才更新 Echo 状态
    formStore.set({ submitting: true });

    submitForm(formValues)
      .then(() => {
        formStore.set({
          submitting: false,
          initialValues: formValues, // 更新初始值
        });
      })
      .catch((err) => {
        formStore.set({
          submitting: false,
          error: err.message,
        });
      });
  };

  // 渲染表单...
}
```

## Migration and compatibility issues

### Q: How to migrate from Redux to Echo?

A: The basic steps to migrate from Redux to Echo:

1. Split the Redux store into multiple Echo instances
2. Convert reducers to `set` method calls
3. Convert action creators to regular functions
4. Replace `useSelector` with Echo's `use` method
5. Replace `useDispatch` with direct function calls

```typescript
// Redux code
const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
  },
});

export const { increment, decrement } = counterSlice.actions;

// Use in a component
function Counter() {
  const count = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();

  return (
    <div>
      <button onClick={() => dispatch(decrement())}>-</button>
      <span>{count}</span>
      <button onClick={() => dispatch(increment())}>+</button>
    </div>
  );
}

// Echo code
const counterStore = new Echo({ value: 0 });

function increment() {
  counterStore.set((state) => ({ value: state.value + 1 }));
}

function decrement() {
  counterStore.set((state) => ({ value: state.value - 1 }));
}

// Use in a component
function Counter() {
  const count = counterStore.use((state) => state.value);

  return (
    <div>
      <button onClick={decrement}>-</button>
      <span>{count}</span>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

### Q: Does Echo support server-side rendering (SSR)?

A: Echo can be used in server-side rendering environments, but 需要注意以下几点：

1. In the server-side, use the temporary storage mode (`temporary()`)
2. Avoid using browser-specific APIs (such as LocalStorage or IndexedDB) on the server side
3. Consider using conditional checks in components:

```tsx
function MyComponent() {
  // In the server-side, use the default value
  const isClient = typeof window !== "undefined";
  const store = useMemo(() => {
    const store = new Echo({ count: 0 });

    // Only use persistent storage on the client
    if (isClient) {
      store.localStorage({ name: "counter" });
    }

    return store;
  }, [isClient]);

  // Component logic...
}
```

## Other issues

### Q: Does Echo support middleware?

A: Echo currently does not support middleware systems. If you need similar middleware functionality, you can:

1. Use a custom state management class, inherit Echo, and add the required functionality
2. Use the decorator pattern to wrap the Echo instance
3. Use higher-order functions to encapsulate state update logic

```typescript
// 装饰器模式示例
function createLoggedStore<T>(store: Echo<T>, name: string) {
  // Save the original set method
  const originalSet = store.set.bind(store);

  // Override the set method
  store.set = ((nextState, options) => {
    console.log(`[${name}] Before update:`, store.current);

    // Call the original method
    originalSet(nextState, options);

    console.log(`[${name}] After update:`, store.current);
  }) as typeof store.set;

  return store;
}

// Use
const userStore = createLoggedStore(
  new Echo({ name: "", age: 0 }),
  "UserStore"
);
```

### Q: How to handle circular dependencies between stores?

A: Avoid circular dependencies between stores. If necessary, you can:

1. Re-design the state structure to eliminate circular dependencies
2. Use the event publishing/subscription pattern for communication
3. Create a coordinator to manage mutually dependent stores

```typescript
// Event publishing/subscription example
const eventBus = {
  listeners: {},

  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    return () => {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    };
  },

  publish(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((callback) => callback(data));
  },
};

// Use in stores
const userStore = new Echo({
  /* ... */
});
const cartStore = new Echo({
  /* ... */
});

// Update the shopping cart after the user logs in
userStore.subscribe((state) => {
  if (state.isLoggedIn) {
    eventBus.publish("user:login", state.user);
  }
});

// Shopping cart listens for user login events
eventBus.subscribe("user:login", (user) => {
  fetchUserCart(user.id).then((cart) => {
    cartStore.set({ items: cart.items });
  });
});
```

### Q: What is the future development direction of Echo?

A: The future development plan of Echo includes:

1. Providing more storage adapters (such as SessionStorage, WebSQL, etc.)
2. Improving performance, especially for large data sets
3. Enhancing cross-window synchronization functionality
4. Providing more debugging tools and developer experience improvements
5. Supporting more frameworks (such as Vue, Svelte, etc.)

Please follow the project repository for the latest updates and roadmap.
