# EchoStore

EchoStore 是一个专门用于管理 IndexedDB 存储的简单接口，提供了类似 Echo 的 React Hook 支持。

## 基本用法

```typescript
import { EchoStore } from "echo-core";

// 创建实例
const store = new EchoStore<YourDataType>("your-database-name", "your-store-name");

// 在 React 组件中使用
function YourComponent() {
  // 获取所有数据
  const data = store.use();
  
  // 使用选择器获取特定数据
  const filteredData = store.use(data => data.filter(item => item.someCondition));
}
```

## API

### 构造函数

```typescript
constructor(database: string, objectStore?: string)
```

- `database`: 数据库名称
- `objectStore`: 对象存储名称，默认为 "echo-state"

### 核心方法

#### list()

获取所有存储的数据。

```typescript
async list(): Promise<T[]>
```

**返回:**
- `Promise<T[]>` - 所有存储的数据

#### get(key)

获取指定 key 的数据。

```typescript
async get(key: string): Promise<T | null>
```

**参数:**
- `key`: 存储的键名

**返回:**
- `Promise<T | null>` - 存储的数据，如果不存在则返回 null

#### set(key, value)

设置指定 key 的数据。

```typescript
async set(key: string, value: T): Promise<void>
```

**参数:**
- `key`: 存储的键名
- `value`: 要存储的数据

#### delete(key)

删除指定 key 的数据。

```typescript
async delete(key: string): Promise<void>
```

**参数:**
- `key`: 要删除的键名

#### clear()

清空所有数据。

```typescript
async clear(): Promise<void>
```

### React Hook 支持

#### use()

获取数据的 React Hook。

```typescript
use<Selected = T[]>(selector?: (data: T[]) => Selected): Selected
```

**参数:**
- `selector`: 可选的选择器函数，用于转换数据

**返回:**
- 选择的数据或完整数据

### 订阅支持

#### subscribe()

订阅数据变化。

```typescript
subscribe(listener: (data: T[]) => void): () => void
```

**参数:**
- `listener`: 监听器函数

**返回:**
- 取消订阅的函数

## 示例

### 待办事项示例

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
      {/* 添加待办事项 */}
      <input
        value={newTodo}
        onChange={(e) => setNewTodo(e.target.value)}
        placeholder="输入新的待办事项"
      />
      <button onClick={addTodo}>添加</button>

      {/* 统计信息 */}
      <div>已完成: {completedCount} / {todos.length}</div>

      {/* 待办事项列表 */}
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
            <button onClick={() => deleteTodo(todo.id)}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 注意事项

1. EchoStore 专门用于管理 IndexedDB 存储，不支持其他存储模式
2. 所有数据操作都是异步的，返回 Promise
3. 使用 React Hook 时，组件会自动订阅数据变化
4. 数据变化会自动通知所有监听器和 Hook
5. 支持数据选择器，可以只获取需要的数据 