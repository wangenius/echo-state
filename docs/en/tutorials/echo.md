---
title: Getting Started
order: 1
---

# Echo State Management Library

Echo is a lightweight state management library designed for React applications, supporting multiple storage modes and rich state management features.

## Features

- Supports multiple storage modes (Temporary, LocalStorage, IndexedDB)
- Cross-window state synchronization
- Built-in React Hooks integration
- State subscription support
- Selector support

## Installation

```bash
npm install echo-state
```

## Basic Usage

### Creating State

```typescript
import { Echo } from "echo-state";

// Create an Echo instance
const userStore = new Echo({
  name: "",
  age: 0,
  isLoggedIn: false,
});
```

### Reading State

```typescript
// Get current state
const currentState = userStore.current;
console.log(currentState.name);

// Asynchronously get state (recommended, especially when using persistent storage)
userStore.getCurrent().then((state) => {
  console.log(state.name);
});

// Wait for initialization to complete and optionally set state
userStore.ready().then(() => {
  console.log(userStore.current);
});

// Wait for initialization and set state in one call
userStore.ready({ name: "John" }).then(() => {
  console.log(userStore.current);
});

// Use function to update state during initialization
userStore.ready((state) => ({ ...state, age: 25 })).then(() => {
  console.log(userStore.current);
});
```

### Updating State

```typescript
// Partial update
userStore.set({ name: "John" });

// Use function to update (can calculate new state based on current state)
userStore.set((state) => ({
  age: state.age + 1,
}));

// Completely replace state
userStore.set({ name: "Mike", age: 30, isLoggedIn: true }, { replace: true });
```

### Deleting State Properties

```typescript
userStore.delete("age");
```

### Resetting State

```typescript
userStore.reset();
```

## Storage Modes

Echo supports three storage modes: temporary storage, LocalStorage, and IndexedDB.

### Temporary Storage (Default)

```typescript
// Default is temporary storage, or explicitly specify
userStore.temporary();
```

### LocalStorage Storage

```typescript
userStore.localStorage({
  name: "user-store", // Storage key name
  sync: true, // Whether to sync across windows
});
```

### IndexedDB Storage

```typescript
userStore.indexed({
  name: "user-store", // Storage key name
  database: "user-database", // Database name
  object: "userData", // Object repository name, default is 'echo-state'
  sync: true, // Whether to sync across windows
});
```

## Using in React

Echo provides built-in React Hook support.

### Basic Usage

```tsx
import React from "react";
import { Echo } from "echo-state";

const counterStore = new Echo({ count: 0 });

function Counter() {
  // Use Echo's use hook to get state
  const state = counterStore.use();

  return (
    <div>
      <p>Current count: {state.count}</p>
      <button onClick={() => counterStore.set((s) => ({ count: s.count + 1 }))}>
        Increment
      </button>
    </div>
  );
}
```

### Using Selectors

```tsx
function CounterDisplay() {
  // Only subscribe to count property changes
  const count = counterStore.use((state) => state.count);

  return <p>Current count: {count}</p>;
}
```

## State Subscription

You can directly subscribe to state changes without using React Hook.

```typescript
// Add listener
const unsubscribe = userStore.subscribe((state) => {
  console.log("State updated:", state);
});

// Remove listener
unsubscribe();

// Or use explicit add/remove methods
const listener = (state) => console.log("State updated:", state);
userStore.addListener(listener);
userStore.removeListener(listener);
```

## Other Documentation

- [Advanced Usage](./echo-advanced.md) - Learn more advanced features, such as resource cleanup, switching storage key names, etc.
- [API Reference](../api/echo.md) - Complete API reference documentation
- [Best Practices](./echo-best-practices.md) - Best practices and patterns for using Echo
- [Example Projects](./echo-examples.md) - Complete example projects and use cases
- [Frequently Asked Questions](./echo-faq.md) - Answers to frequently asked questions
- [Supported Data Types](./echo-data-types.md) - Data types supported by Echo and storage limitations
