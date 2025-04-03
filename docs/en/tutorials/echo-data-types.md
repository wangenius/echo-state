---
title: Data Types
order: 6
---

# Data Types Supported by Echo

This document details the data types supported by the Echo state management library and its storage limitations.

## Basic Data Type Support

Echo supports the following basic data types as state:

### Object Type (Record)

```typescript
// Object type state
const userStore = new Echo<{
  name: string;
  age: number;
  preferences: {
    theme: string;
    notifications: boolean;
  };
}>({
  name: "user",
  age: 0,
  preferences: {
    theme: "light",
    notifications: true,
  },
});
```

Object type is the most commonly used state type, and can contain nested properties and complex data structures.

### String Type (String)

```typescript
// String type state
const messageStore = new Echo<string>("Welcome to Echo!");

// Update string
messageStore.set("New message content");

// Functional update
messageStore.set((prevMessage) => prevMessage + " Additional content");
```

### Number Type (Number)

```typescript
// Number type state
const counterStore = new Echo<number>(0);

// Update number
counterStore.set(5);

// Functional update
counterStore.set((prevCount) => prevCount + 1);
```

### Null Type (Null)

```typescript
// Null type state
const nullableStore = new Echo<null>(null);

// Update to other value
nullableStore.set(null);
```

Note that when the state is `null`:
- When using persistent storage (LocalStorage or IndexedDB), `null` state will not be stored
- When the state becomes `null`, stored data will be deleted
- When the state changes from `null` to other values, storage will resume

### Array Type (Array)

```typescript
// Array type state
const listStore = new Echo<string[]>(["Project 1", "Project 2"]);

// Add project
listStore.set((prevList) => [...prevList, "Project 3"]);

// Remove project
listStore.set((prevList) => prevList.filter((item) => item !== "Project 2"));
```

### Boolean Type (Boolean)

```typescript
// Boolean type state
const flagStore = new Echo<boolean>(false);

// Toggle boolean value
flagStore.set((prevFlag) => !prevFlag);
```

## Complex Data Type Support

### Map and Set

Echo can store Map and Set types in memory, but **these types do not support persistence**. When using LocalStorage or IndexedDB storage modes, Map and Set will be lost in the serialization process.

```typescript
// Map type - only supports temporary storage
const mapStore = new Echo<Map<string, any>>(
  new Map([
    ["key1", "value1"],
    ["key2", { nested: true }],
  ])
);

// Must use temporary storage mode
mapStore.temporary();

// Update Map
mapStore.set((prevMap) => {
  const newMap = new Map(prevMap);
  newMap.set("key3", "value3");
  return newMap;
});
```

```typescript
// Set type - only supports temporary storage
const setStore = new Echo<Set<string>>(new Set(["item1", "item2"]));

// Must use temporary storage mode
setStore.temporary();

// Update Set
setStore.set((prevSet) => {
  const newSet = new Set(prevSet);
  newSet.add("item3");
  return newSet;
});
```

### Class Instances

Echo can store class instances in memory, but **class instances do not support full persistence**. When using LocalStorage or IndexedDB storage modes, class instances will be serialized into plain objects, losing their methods and prototype chain.

```typescript
// Define a class
class User {
  constructor(public name: string, public age: number) {}

  getDescription() {
    return `${this.name}, ${this.age}岁`;
  }
}

// Create class instance state - only supports temporary storage
const userInstanceStore = new Echo<User>(new User("Zhang San", 30));

// Must use temporary storage mode
userInstanceStore.temporary();

// Update class instance
userInstanceStore.set(new User("Li Si", 25));

// Or update specific properties
userInstanceStore.set((prevUser) => {
  const newUser = new User(prevUser.name, prevUser.age + 1);
  return newUser;
});
```

If you need to persist state containing class instances, it is recommended to convert the class instance to a plain object for storage, and then recreate the class instance when needed:

```typescript
// Store plain objects
const userStore = new Echo<{
  name: string;
  age: number;
}>({
  name: "Zhang San",
  age: 30,
});

// Use persistent storage
userStore.localStorage({ name: "user-data" });

// Create class instance when needed
function getUserInstance() {
  const userData = userStore.current;
  return new User(userData.name, userData.age);
}
```

### Functions

Echo **does not support** storing functions as part of state. Functions will be lost during serialization, so they should not be included in state.

```typescript
// ❌ Don't do this
const badStore = new Echo({
  data: "some data",
  process: (data) => data.toUpperCase(), // Function will be lost during serialization
});
```

If you need to associate functionality with state, define the function outside the state:

```typescript
// ✅ Good practice
const dataStore = new Echo({
  data: "some data",
});

// Define function outside
function processData(data: string) {
  return data.toUpperCase();
}

// Use
const processedData = processData(dataStore.current.data);
```

## Compatibility of Storage Modes and Data Types

Different storage modes have different limitations on data types:

### Temporary Storage (Temporary)

Temporary storage mode supports all JavaScript data types, including complex types like Map, Set, and class instances.

```typescript
// Temporary storage can store any type
const complexStore = new Echo({
  map: new Map(),
  set: new Set(),
  instance: new SomeClass(),
  date: new Date(),
}).temporary();
```

### LocalStorage Storage

LocalStorage storage mode only supports data types that can be serialized to JSON:

- Object (Object)
- Array (Array)
- String (String)
- Number (Number)
- Boolean (Boolean)
- null

Does not support:

- Map
- Set
- Class instances (methods will be lost)
- Functions
- Symbol
- undefined (will be converted to null)
- Circularly referenced objects

```typescript
// LocalStorage storage only supports JSON serializable data
const storableStore = new Echo({
  name: "Zhang San",
  age: 30,
  isActive: true,
  tags: ["user", "admin"],
  settings: {
    theme: "dark",
    notifications: true,
  },
}).localStorage({ name: "user-data" });
```

### IndexedDB Storage

IndexedDB storage mode supports all types supported by LocalStorage, as well as some additional types:

- Blob
- File
- ArrayBuffer
- TypedArray (such as Uint8Array)
- DataView

Still does not support:

- Map
- Set
- Class instances (methods will be lost)
- Functions
- Symbol
- Circularly referenced objects

```typescript
// IndexedDB 存储支持二进制数据
const binaryDataStore = new Echo({
  text: "Text content",
  binary: new Uint8Array([1, 2, 3, 4]),
  file: null as File | null,
}).indexed({
  name: "binary-data",
  database: "app-data",
});

// Later update file
fetch("some-url")
  .then((response) => response.blob())
  .then((blob) => {
    const file = new File([blob], "filename.png");
    binaryDataStore.set({ file });
  });
```

## Best Practices

### 1. Use serializable data types

```typescript
// ✅ Good practice: Use serializable data types
const goodStore = new Echo({
  user: {
    id: 1,
    name: "Zhang San",
  },
  preferences: {
    theme: "dark",
  },
});
```

### 2. Avoid storing functions or class methods in state

```typescript
// ❌ Bad practice: Store functions in state
const badStore = new Echo({
  formatter: (value: string) => value.toUpperCase(),
});

// ✅ Good practice: Keep functions outside state
const dataStore = new Echo({
  value: "some text",
});

function formatValue(value: string) {
  return value.toUpperCase();
}
```

### 3. For cases where you need class instances, store the original data and create an instance when needed

```typescript
// ✅ Good practice: Store original data
const userDataStore = new Echo({
  name: "Zhang San",
  age: 30,
  roles: ["admin", "editor"],
});

// Create class instance when needed
function createUserModel() {
  const data = userDataStore.current;
  return new UserModel(data.name, data.age, data.roles);
}
```

### 4. For complex data structures, consider normalizing storage

```typescript
// ✅ Good practice: Normalize data structure
const normalizedStore = new Echo({
  entities: {
    users: {
      "user-1": { id: "user-1", name: "张三" },
      "user-2": { id: "user-2", name: "李四" },
    },
    posts: {
      "post-1": { id: "post-1", title: "文章1", authorId: "user-1" },
      "post-2": { id: "post-2", title: "文章2", authorId: "user-2" },
    },
  },
  ids: {
    users: ["user-1", "user-2"],
    posts: ["post-1", "post-2"],
  },
});
```

## Summary

Echo supports multiple data types, but you need to pay attention to the data type restrictions:

1. **Temporary storage**：Supports all JavaScript data types
2. **LocalStorage storage**：Only supports JSON serializable data types
3. **IndexedDB storage**：Supports JSON serializable data types and binary data

To get the best experience, it is recommended to use serializable data types, avoid storing functions or class methods in state, and use normalized storage for complex data structures.
