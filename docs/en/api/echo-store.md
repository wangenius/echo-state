# EchoStore

EchoStore is a simple interface specifically designed for managing IndexedDB storage, providing React Hook support similar to Echo.

## Basic Usage

```typescript
import { EchoStore } from "echo-core";

// Create instance
const store = new EchoStore<YourDataType>("your-database-name", "your-store-name", 1);

// Use in React components
function YourComponent() {
  // Get all data
  const data = store.use();
  
  // Use selector to get specific data
  const filteredData = store.use(data => data.filter(item => item.someCondition));
}
```

## API

### Constructor

```typescript
constructor(database: string, objectStore?: string, version?: number)
```

- `database`: Database name
- `objectStore`: Object store name, defaults to "echo-state"
- `version`: Database version number, defaults to 1

### Core Methods

#### list()

Get all stored data.

```typescript
async list(): Promise<T[]>
```

**Returns:**
- `Promise<T[]>` - All stored data

#### get(key)

Get data for a specific key.

```typescript
async get(key: string): Promise<T | null>
```

**Parameters:**
- `key`: Storage key name

**Returns:**
- `Promise<T | null>` - Stored data, returns null if not found

#### set(key, value)

Set data for a specific key.

```typescript
async set(key: string, value: T): Promise<void>
```

**Parameters:**
- `key`: Storage key name
- `value`: Data to store

#### delete(key)

Delete data for a specific key.

```typescript
async delete(key: string): Promise<void>
```

**Parameters:**
- `key`: Key to delete

#### clear()

Clear all data.

```typescript
async clear(): Promise<void>
```

### React Hook Support

#### use()

React Hook for getting data.

```typescript
use<Selected = T[]>(selector?: (data: T[]) => Selected): Selected
```

**Parameters:**
- `selector`: Optional selector function to transform data

**Returns:**
- Selected data or complete data

### Subscription Support

#### subscribe()

Subscribe to data changes.

```typescript
subscribe(listener: (data: T[]) => void): () => void
```

**Parameters:**
- `listener`: Listener function

**Returns:**
- Function to unsubscribe

## Examples

### Todo List Example

```typescript
import React, { useState } from "react";
import { EchoStore } from "echo-core";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

const store = new EchoStore<TodoItem>("todo-database", "todos");

function TodoList() {
  const [newTodo, setNewTodo] = useState("");
  const todos = store.use();
  const completedCount = store.use(
    (data) => data.filter((todo) => todo.completed).length
  );

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    const todo: TodoItem = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false,
    };
    await store.set(todo.id, todo);
    setNewTodo("");
  };

  const toggleTodo = async (todo: TodoItem) => {
    await store.set(todo.id, {
      ...todo,
      completed: !todo.completed,
    });
  };

  const deleteTodo = async (id: string) => {
    await store.delete(id);
  };

  return (
    <div>
      {/* Add todo */}
      <input
        value={newTodo}
        onChange={(e) => setNewTodo(e.target.value)}
        placeholder="Enter new todo"
      />
      <button onClick={addTodo}>Add</button>

      {/* Statistics */}
      <div>Completed: {completedCount} / {todos.length}</div>

      {/* Todo list */}
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo)}
            />
            <span style={{ textDecoration: todo.completed ? "line-through" : "none" }}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Notes

1. EchoStore is specifically designed for managing IndexedDB storage and does not support other storage modes
2. All data operations are asynchronous and return Promises
3. When using React Hooks, components automatically subscribe to data changes
4. Data changes automatically notify all listeners and Hooks
5. Supports data selectors to get only the needed data 