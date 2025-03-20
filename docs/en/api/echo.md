---
title: Echo API Reference
order: 1
---

# Echo API Reference

This document provides a complete API reference for the Echo state management library.

## Core Classes

### Echo\<T\>

`Echo<T>` is the core class of the state management library, used to create and manage state.

```typescript
class Echo<T> {
  constructor(defaultState: T);

  // Methods
  set(nextState: Partial<T> | StateUpdater<T>, options?: SetOptions): void;
  delete(key: string): void;
  reset(): void;
  get current(): T;
  getCurrent(): Promise<T>;
  ready(): Promise<void>;
  subscribe(listener: Listener<T>): () => void;
  addListener(listener: Listener<T>): void;
  removeListener(listener: Listener<T>): void;
  use<Selected = T>(selector?: (state: T) => Selected): Selected;
  temporary(): this;
  localStorage(config: StorageConfig): this;
  indexed(config: IndexedDBConfig): this;
  destroy(): void;
  switch(name: string): this;
}
```

#### Constructor

```typescript
constructor(defaultState: T)
```

Creates a new Echo instance, initialized with the provided default state.

**Parameters:**

- `defaultState: T` - The initial value of the state

**Example:**

```typescript
const counterStore = new Echo({ count: 0 });
const userStore = new Echo({
  name: "",
  age: 0,
  isLoggedIn: false,
});
```

#### State Manipulation Methods

##### set

```typescript
set(nextState: Partial<T> | StateUpdater<T>, options?: SetOptions): void
```

Updates the state by merging the provided partial state with the current state, or by applying the provided state updater function.

**Parameters:**

- `nextState: Partial<T> | StateUpdater<T>` - The partial state to merge, or a function that returns a partial state based on the current state
- `options?: SetOptions` - Optional settings for the update operation
  - `replace?: boolean` - If true, replaces the entire state instead of merging

**Examples:**

```typescript
// Partial update
userStore.set({ name: "John" });

// Using a function updater
counterStore.set((state) => ({ count: state.count + 1 }));

// Completely replace state
userStore.set({ name: "Mike", age: 30, isLoggedIn: true }, { replace: true });
```

##### delete

```typescript
delete(key: string): void
```

Deletes a specific property from the state.

**Parameters:**

- `key: string` - The name of the property to delete

**Example:**

```typescript
userStore.delete("age");
```

##### reset

```typescript
reset(): void
```

Resets the state to its initial default value.

**Example:**

```typescript
counterStore.reset(); // Resets to { count: 0 }
```

#### State Access Methods

##### current

```typescript
get current(): T
```

A getter property that returns the current state. For synchronous access to the state.

**Example:**

```typescript
const currentState = counterStore.current;
console.log(currentState.count);
```

##### getCurrent

```typescript
getCurrent(): Promise<T>
```

Returns a Promise that resolves to the current state. This is useful for asynchronous storage modes like IndexedDB.

**Example:**

```typescript
counterStore.getCurrent().then((state) => {
  console.log(state.count);
});
```

##### ready

```typescript
ready(): Promise<void>
```

Returns a Promise that resolves when the state is fully initialized and ready for use. This is especially important when using persistent storage modes.

**Example:**

```typescript
counterStore.ready().then(() => {
  console.log("State is ready:", counterStore.current);
});
```

#### Subscription Methods

##### subscribe

```typescript
subscribe(listener: Listener<T>): () => void
```

Adds a listener function that will be called whenever the state changes. Returns an unsubscribe function.

**Parameters:**

- `listener: Listener<T>` - A function that will be called with the new state whenever it changes

**Returns:**

- `() => void` - A function that when called will unsubscribe the listener

**Example:**

```typescript
const unsubscribe = counterStore.subscribe((state) => {
  console.log("Counter changed:", state.count);
});

// Later, to stop listening:
unsubscribe();
```

##### addListener

```typescript
addListener(listener: Listener<T>): void
```

Adds a listener function that will be called whenever the state changes.

**Parameters:**

- `listener: Listener<T>` - A function that will be called with the new state whenever it changes

**Example:**

```typescript
const handleChange = (state) => {
  console.log("State changed:", state);
};

counterStore.addListener(handleChange);
```

##### removeListener

```typescript
removeListener(listener: Listener<T>): void
```

Removes a previously added listener function.

**Parameters:**

- `listener: Listener<T>` - The listener function to remove

**Example:**

```typescript
counterStore.removeListener(handleChange);
```

#### React Integration

##### use

```typescript
use<Selected = T>(selector?: (state: T) => Selected): Selected
```

A React Hook that subscribes the component to the state or a derived value from the state.

**Parameters:**

- `selector?: (state: T) => Selected` - Optional selector function that derives a value from the state

**Returns:**

- `Selected` - The selected portion of the state, or the entire state if no selector is provided

**Examples:**

```tsx
// Using the entire state
function Counter() {
  const state = counterStore.use();
  return <div>{state.count}</div>;
}

// Using a selector
function CountDisplay() {
  const count = counterStore.use((state) => state.count);
  return <div>{count}</div>;
}
```

#### Storage Mode Methods

##### temporary

```typescript
temporary(): this
```

Sets the storage mode to temporary (in-memory only). This is the default mode.

**Example:**

```typescript
counterStore.temporary();
```

##### localStorage

```typescript
localStorage(config: StorageConfig): this
```

Sets the storage mode to use LocalStorage for persistence.

**Parameters:**

- `config: StorageConfig` - Configuration for LocalStorage
  - `name: string` - The key name to use in LocalStorage
  - `sync?: boolean` - Whether to sync state across browser tabs/windows

**Example:**

```typescript
userStore.localStorage({
  name: "user-data",
  sync: true,
});
```

##### indexed

```typescript
indexed(config: IndexedDBConfig): this
```

Sets the storage mode to use IndexedDB for persistence.

**Parameters:**

- `config: IndexedDBConfig` - Configuration for IndexedDB
  - `name: string` - The key name to use in the object store
  - `database?: string` - The name of the database
  - `object?: string` - The name of the object store
  - `sync?: boolean` - Whether to sync state across browser tabs/windows

**Example:**

```typescript
userStore.indexed({
  name: "user-data",
  database: "app-db",
  object: "users",
  sync: true,
});
```

#### Utility Methods

##### destroy

```typescript
destroy(): void
```

Cleans up all resources used by the Echo instance, including listeners and storage connections.

**Example:**

```typescript
// When you're done with the store:
userStore.destroy();
```

##### switch

```typescript
switch(name: string): this
```

Switches to a different named storage key, allowing multiple distinct states to be managed by the same Echo instance.

**Parameters:**

- `name: string` - The new storage key name to use

**Example:**

```typescript
// Switch to a different user's data
userStore.switch("user-123");
```

## Types

### StateUpdater\<T\>

```typescript
type StateUpdater<T> = (state: T) => Partial<T>;
```

A function that takes the current state and returns a partial state to be merged.

### Listener\<T\>

```typescript
type Listener<T> = (state: T) => void;
```

A function that is called with the new state whenever it changes.

### SetOptions

```typescript
interface SetOptions {
  replace?: boolean;
}
```

Options for the `set` method.

### StorageConfig

```typescript
interface StorageConfig {
  name: string;
  sync?: boolean;
}
```

Configuration for LocalStorage mode.

### IndexedDBConfig

```typescript
interface IndexedDBConfig extends StorageConfig {
  database?: string;
  object?: string;
}
```

Configuration for IndexedDB mode, extends the StorageConfig interface.
