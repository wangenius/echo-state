# EchoManager Tutorial

EchoManager is a core component in the Echo framework for managing data subscriptions and notifications. This tutorial will help you understand how to use EchoManager to manage data state and implement cross-window synchronization.

## Basic Concepts

### What is EchoManager?

EchoManager is a static class that provides the following core features:
- Data subscription and notification mechanism
- Cross-window data synchronization
- React Hooks integration
- Efficient data caching

### Core Components

1. **Listener System**
```typescript
// Create a listener
const unsubscribe = EchoManager.subscribe("my-db", "my-store", (data) => {
  console.log("Data updated:", data);
});
```

2. **Notification System**
```typescript
// Send notification
EchoManager.notify("my-db", "my-store", newData);
```

3. **React Hooks**
```typescript
// Use in components
function MyComponent() {
  const data = EchoManager.use("my-db", "my-store");
  return <div>{/* Render data */}</div>;
}
```

## Usage Scenarios

### 1. Basic Data Subscription

```typescript
// Create data subscription
const echo = new Echo({ count: 0 })
  .indexed({ name: "counter", database: "my-app" });

// Subscribe to data changes
EchoManager.subscribe("my-app", "counter", (data) => {
  console.log("Counter updated:", data);
});

// Update data
echo.set({ count: 1 });
```

### 2. React Component Integration

```typescript
function Counter() {
  // Use Hook to subscribe to data
  const count = EchoManager.use(
    "my-app",
    "counter",
    (data) => data[0]?.count || 0
  );

  return (
    <div>
      <p>Current count: {count}</p>
      <button onClick={() => echo.set({ count: count + 1 })}>
        Increment
      </button>
    </div>
  );
}
```

### 3. Cross-Window Synchronization

```typescript
// Window A
const echo = new Echo({ theme: "light" })
  .indexed({ name: "settings", database: "my-app", sync: true });

// Window B
function ThemeSwitcher() {
  const theme = EchoManager.use(
    "my-app",
    "settings",
    (data) => data[0]?.theme || "light"
  );

  return (
    <button onClick={() => echo.set({ theme: "dark" })}>
      Toggle Theme
    </button>
  );
}
```

## Advanced Usage

### 1. Using Selectors for Performance

```typescript
function UserList() {
  // Subscribe only to active users
  const activeUsers = EchoManager.use(
    "my-app",
    "users",
    (data) => data.filter(user => user.active)
  );

  return (
    <ul>
      {activeUsers.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 2. Multiple Object Store Management

```typescript
function Dashboard() {
  // Subscribe to different types of data
  const users = EchoManager.use("my-app", "users");
  const settings = EchoManager.use("my-app", "settings");
  const analytics = EchoManager.use("my-app", "analytics");

  return (
    <div>
      <UserList users={users} />
      <SettingsPanel settings={settings} />
      <AnalyticsChart data={analytics} />
    </div>
  );
}
```

### 3. Custom Data Transformation

```typescript
function Statistics() {
  // Use selector for data transformation
  const stats = EchoManager.use(
    "my-app",
    "analytics",
    (data) => ({
      total: data.length,
      active: data.filter(item => item.active).length,
      average: data.reduce((sum, item) => sum + item.value, 0) / data.length
    })
  );

  return (
    <div>
      <p>Total: {stats.total}</p>
      <p>Active: {stats.active}</p>
      <p>Average: {stats.average}</p>
    </div>
  );
}
```

## Performance Optimization

### 1. Using Selectors Wisely

```typescript
// Not recommended: Subscribe to all data
const allData = EchoManager.use("my-app", "users");

// Recommended: Subscribe only to needed data
const activeUsers = EchoManager.use(
  "my-app",
  "users",
  (data) => data.filter(user => user.active)
);
```

### 2. Timely Unsubscription

```typescript
function DataMonitor() {
  useEffect(() => {
    const unsubscribe = EchoManager.subscribe(
      "my-app",
      "monitor",
      handleDataChange
    );
    return () => unsubscribe();
  }, []);
}
```

### 3. Separating Data with Object Stores

```typescript
// Separate data by functionality
const userStore = new Echo({})
  .indexed({ name: "users", database: "my-app" });

const settingsStore = new Echo({})
  .indexed({ name: "settings", database: "my-app" });
```

## Common Issues

### 1. Delayed Data Updates

Ensure to call `notify` after data updates:

```typescript
async function updateData() {
  await echo.set(newData);
  EchoManager.notify("my-app", "my-store", newData);
}
```

### 2. Memory Leaks

Remember to unsubscribe when components unmount:

```typescript
useEffect(() => {
  const unsubscribe = EchoManager.subscribe(
    "my-app",
    "my-store",
    handleDataChange
  );
  return () => unsubscribe();
}, []);
```

### 3. Performance Issues

Use selectors to optimize data subscriptions:

```typescript
// Before optimization
const allData = EchoManager.use("my-app", "users");

// After optimization
const filteredData = EchoManager.use(
  "my-app",
  "users",
  (data) => data.filter(user => user.active)
);
```

## Best Practices

1. **Organize Data Properly**
   - Separate object stores by functionality
   - Use meaningful data structures
   - Avoid deep data nesting

2. **Optimize Performance**
   - Use selectors to filter data
   - Unsubscribe when not needed
   - Avoid frequent data updates

3. **Error Handling**
   - Add appropriate error handling
   - Provide default values
   - Log critical operations

4. **Code Organization**
   - Encapsulate data logic in custom hooks
   - Use TypeScript type definitions
   - Maintain clear code structure 