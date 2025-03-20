---
title: Advanced Usage
order: 2
---

# Advanced Usage

This document introduces the advanced features and usage of the Echo state management library.

## Waiting for Initialization to Complete

When using persistent storage (especially IndexedDB), the initialization process is asynchronous. To ensure that the state is ready before use, the `ready()` method should be used:

```typescript
// Create and configure the storage
const settingsStore = new Echo({ theme: "light" }).indexed({
  name: "settings",
  database: "app-settings",
  sync: true,
});

// Wait for initialization to complete before using
settingsStore.ready().then(() => {
  // Now it is safe to use the store
  console.log(settingsStore.current);
});

// Or use async/await
async function initSettings() {
  await settingsStore.ready();
  // Initialization complete, safe to use
  console.log(settingsStore.current);
}
```

## Resource Cleanup

Echo instances use some resources that need to be manually cleaned up, such as database connections and cross-window communication channels. When an Echo instance is no longer needed, these resources should be cleaned up:

```typescript
// Clean up resources (persistent data will not be lost)
userStore.destroy();
```

This is particularly important in the following situations:

- When a component is unloaded
- When a user logs out
- When the application is closed

## Switching Storage Key Names

Echo provides the `switch` method, allowing you to switch to different key names under the current database and object repository. **Note: This method is only available for the IndexedDB scheme.**

```typescript
// Create IndexedDB storage
const projectStore = new Echo({ title: "项目1" }).indexed({
  name: "project-1",
  database: "projects-db",
  object: "projects-store",
});

// Switch to another project's data (under the same database and object repository)
projectStore.switch("project-2");

// Wait for the switch to complete before using
projectStore
  .switch("project-3")
  .ready()
  .then(() => {
    console.log("Switched to project 3's data");
    console.log(projectStore.current);
  });
```

This feature is particularly useful in applications that need to manage multiple project data. For example, you can store data for multiple projects in the same database, each using a different key name.

When using the `switch` method, it remains in the same database and object repository, only switching the key name. This means you can manage multiple related data sets within the same database structure without creating multiple databases or object repositories.

Note that when switching to a new key name:

- If there is persistent data under the new key name, Echo will load this data
- If there is no persistent data under the new key name, Echo will initialize with the default state (the state provided in the constructor), rather than using the current state

```typescript
// Example: Managing settings for multiple users
const settingsStore = new Echo({ theme: "light" }).indexed({
  name: "user-123", // Current user ID
  database: "app-settings",
  object: "user-settings",
});

// Switch to another user's settings
function switchToUser(userId: string) {
  settingsStore
    .switch(userId)
    .ready()
    .then(() => {
      console.log(`Switched to user ${userId}'s settings`);
      // If there is no data under userId, the state will be the default value { theme: "light" }
    });
}

// Use
switchToUser("user-456");
```

If you try to use the `switch` method in LocalStorage or temporary storage mode, an exception will be thrown.

## Handling Asynchronous Operations

Echo itself does not provide an asynchronous operation middleware, but it can be easily used in asynchronous functions:

```typescript
async function fetchUserData(userId: string) {
  try {
    // Show loading status
    userStore.set({ loading: true, error: null });

    // Make API request
    const response = await fetch(`/api/users/${userId}`);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const userData = await response.json();

    // Update state
    userStore.set({
      loading: false,
      userData,
      error: null,
    });

    return userData;
  } catch (error) {
    // Handle errors
    userStore.set({
      loading: false,
      error: error.message,
    });
    throw error;
  }
}
```

## Custom State Management Classes

For complex applications, you can create custom state management classes by inheriting the Echo class to encapsulate business logic:

```typescript
interface AuthState {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

class AuthStore extends Echo<AuthState> {
  constructor() {
    super({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });

    // Use localStorage storage and enable cross-window synchronization
    this.localStorage({
      name: "auth-store",
      sync: true,
    });

    // Check local storage token when initializing
    this.checkAuth();
  }

  private checkAuth() {
      // Check if the token is valid
    const { token } = this.current;
    if (token) {
      this.validateToken(token);
    }
  }

  async login(email: string, password: string) {
    try {
      this.set({ loading: true, error: null });

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const { user, token } = await response.json();

      this.set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return user;
    } catch (error) {
      this.set({ loading: false, error: error.message });
      throw error;
    }
  }

  async logout() {
    try {
      const { token } = this.current;

      if (token) {
        // Optional: Notify the server to invalidate the token
        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      // Regardless of whether the server request is successful or not, clear the local state
      this.set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      }, { replace: true });
    }
  }

  private async validateToken(token: string) {
    try {
      this.set({ loading: true });

      const response = await fetch('/api/validate-token', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Token is invalid');
      }

      const { user } = await response.json();

      this.set({
        user,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      // Token is invalid, clear state
      this.set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: 'Session expired, please log in again',
      });
    }
  }
}

// Create a singleton instance
export const authStore = new AuthStore();

// Use in components
function LoginStatus() {
  const { user, isAuthenticated, loading, error } = authStore.use();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user.name}!</p>
          <button onClick={() => authStore.logout()}>Logout</button>
        </>
      ) : (
        <button onClick={() => /* Show login form */}>Login</button>
      )}
    </div>
  );
}
```

## Performance Optimization

### Use Selectors to Reduce Re-renders

Selectors help components only subscribe to the state parts they need, avoiding unnecessary re-renders:

```tsx
// Bad practice: Subscribing to the entire state
function UserProfile() {
  // Re-renders whenever any field in the state changes
  const state = userStore.use();

  return <div>{state.user.name}</div>;
}

// Good practice: Use selectors
function UserProfile() {
  // Re-renders only when the user name changes
  const userName = userStore.use((state) => state.user.name);

  return <div>{userName}</div>;
}
```

### Avoid Frequent Updates

For frequently updated states (such as form inputs), consider using local state, updating the Echo state only when necessary:

```tsx
function SearchForm() {
  // Use local state management for input
  const [query, setQuery] = useState("");
  // Only get search results
  const results = searchStore.use((state) => state.results);

  const handleSearch = () => {
    // Update the global state only when the user submits
    searchStore.set({ query });
    performSearch(query);
  };

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={handleSearch}>Search</button>
      <div>
        {results.map((result) => (
          <div key={result.id}>{result.title}</div>
        ))}
      </div>
    </div>
  );
}
```

## Cross-window State Synchronization

Echo supports cross-window state synchronization, which is particularly useful for multi-tab applications:

```typescript
// Enable cross-window synchronization
const userPrefs = new Echo({
  theme: "light",
  fontSize: "medium",
  notifications: true,
}).localStorage({
  name: "user-preferences",
  sync: true, // Enable cross-window synchronization
});

// Change the theme in one window
userPrefs.set({ theme: "dark" });

// In another window, the state will be automatically updated
// and the listener will be triggered
```

This feature is particularly useful in the following scenarios:

- Users have opened the same application in multiple tabs
- Need to keep consistent user settings across all tabs
- A login/logout operation in one tab needs to affect all tabs

## Integration with Other Libraries

### Integrate with React Context

You can combine Echo with React Context to provide better dependency injection:

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

  // Ensure resources are cleaned up when the component is unmounted
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

// Use in components
function TodoList() {
  const todos = useTodos((state) => state.todos);
  // ...
}
```

## Debugging Techniques

### Add a Logger Listener

You can add a listener to record all state changes:

```typescript
if (process.env.NODE_ENV === "development") {
  userStore.subscribe((state) => {
    console.log("[Echo 状态更新]", state);
  });
}
```

### Create a Debugging Tool

You can create a simple debugging component to display the current state:

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
      <h3>{name} State</h3>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}

// Use
function App() {
  return (
    <div>
      {/* Application components */}
      <EchoDebugger store={userStore} name="User" />
    </div>
  );
}
```
