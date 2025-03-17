# Echo 状态管理库

Echo 是一个轻量级的状态管理库，专为 React 应用设计，支持多种存储模式和丰富的状态管理功能。

## 特性

- 支持多种存储模式（临时、LocalStorage、IndexedDB）
- 支持跨窗口状态同步
- 内置 React Hooks 集成
- 支持状态订阅
- 支持选择器

## 安装

```bash
npm install echo-state
```

## 基础用法

### 创建状态

```typescript
import { Echo } from "echo-state";

// 创建一个Echo实例
const userStore = new Echo({
  name: "",
  age: 0,
  isLoggedIn: false,
});
```

### 读取状态

```typescript
// 获取当前状态
const currentState = userStore.current;
console.log(currentState.name);

// 异步获取状态（推荐，特别是在使用持久化存储时）
userStore.getCurrent().then((state) => {
  console.log(state.name);
});

// 等待初始化完成
userStore.ready().then(() => {
  console.log(userStore.current);
});
```

### 更新状态

```typescript
// 部分更新
userStore.set({ name: "张三" });

// 使用函数更新（可以基于当前状态计算新状态）
userStore.set((state) => ({
  age: state.age + 1,
}));

// 完全替换状态
userStore.set({ name: "李四", age: 30, isLoggedIn: true }, { replace: true });
```

### 删除状态属性

```typescript
userStore.delete("age");
```

### 重置状态

```typescript
userStore.reset();
```

## 存储模式

Echo 支持三种存储模式：临时存储、LocalStorage 和 IndexedDB。

### 临时存储（默认）

```typescript
// 默认为临时存储，或者显式指定
userStore.temporary();
```

### LocalStorage 存储

```typescript
userStore.localStorage({
  name: "user-store", // 存储键名
  sync: true, // 是否跨窗口同步
});
```

### IndexedDB 存储

```typescript
userStore.indexed({
  name: "user-store", // 存储键名
  database: "user-database", // 数据库名称
  object: "userData", // 对象仓库名称，默认是 'echo-state'
  sync: true, // 是否跨窗口同步
});
```

## 在 React 中使用

Echo 提供了内置的 React Hook 支持。

### 基本用法

```tsx
import React from "react";
import { Echo } from "echo-state";

const counterStore = new Echo({ count: 0 });

function Counter() {
  // 使用Echo的use hook获取状态
  const state = counterStore.use();

  return (
    <div>
      <p>当前计数: {state.count}</p>
      <button onClick={() => counterStore.set((s) => ({ count: s.count + 1 }))}>
        增加
      </button>
    </div>
  );
}
```

### 使用选择器

```tsx
function CounterDisplay() {
  // 只订阅count属性的变化
  const count = counterStore.use((state) => state.count);

  return <p>当前计数: {count}</p>;
}
```

## 状态订阅

您可以直接订阅状态变化，而不使用 React Hook。

```typescript
// 添加监听器
const unsubscribe = userStore.subscribe((state) => {
  console.log("状态已更新:", state);
});

// 移除监听器
unsubscribe();

// 或者使用显式的添加/移除方法
const listener = (state) => console.log("状态已更新:", state);
userStore.addListener(listener);
userStore.removeListener(listener);
```

## 高级用法

### 等待初始化完成

```typescript
// 创建并配置存储
const settingsStore = new Echo({ theme: "light" }).indexed({
  name: "settings",
  sync: true,
});

// 等待初始化完成后再使用
settingsStore.ready().then(() => {
  // 现在可以安全地使用store了
  console.log(settingsStore.current);
});
```

### 资源清理

```typescript
// 清理资源（持久化数据不会消失）
userStore.cleanup();

// 完全销毁实例（持久化数据也会消失）
userStore.destroy();
```

### 切换存储键名

Echo 提供了 `switch` 方法，允许您在当前数据库和对象仓库下切换到不同的键名。**注意：此方法仅限于 IndexedDB 方案使用。**

```typescript
// 创建 IndexedDB 存储
const projectStore = new Echo({ title: "项目1" }).indexed({
  name: "project-1",
  database: "projects-db",
  object: "projects-store",
});

// 切换到另一个项目的数据（在同一个数据库和对象仓库下）
projectStore.switch("project-2");

// 等待切换完成后再使用
projectStore
  .switch("project-3")
  .ready()
  .then(() => {
    console.log("已切换到项目3的数据");
    console.log(projectStore.current);
  });
```

这个功能在需要管理多个项目数据的应用中特别有用。例如，您可以在同一个数据库中存储多个项目的数据，每个项目使用不同的键名。

当使用 `switch` 方法时，它会保持在同一个数据库和对象仓库下，只切换键名。这意味着您可以在同一个数据库结构中管理多个相关的数据集，而不需要创建多个数据库或对象仓库。

需要注意的是，当切换到一个新的键名时：

- 如果该键名下已经有持久化的数据，Echo 会加载这些数据
- 如果该键名下没有持久化的数据，Echo 会使用默认状态（构造函数中提供的状态）初始化，而不是使用当前状态

```typescript
// 示例：管理多个用户的设置
const settingsStore = new Echo({ theme: "light" }).indexed({
  name: "user-123", // 当前用户ID
  database: "app-settings",
  object: "user-settings",
});

// 切换到另一个用户的设置
function switchToUser(userId: string) {
  settingsStore
    .switch(userId)
    .ready()
    .then(() => {
      console.log(`已切换到用户 ${userId} 的设置`);
      // 如果 userId 下没有数据，此时状态为默认值 { theme: "light" }
    });
}

// 使用
switchToUser("user-456");
```

如果尝试在 LocalStorage 或临时存储模式下使用 `switch` 方法，将会抛出异常。

## 完整 API 参考

### Echo 类

```typescript
class Echo<T extends Record<string, any>> {
  // 构造函数
  constructor(defaultState: T);

  // 存储模式
  temporary(): this;
  localStorage(config: StorageConfig): this;
  indexed(config: IndexedDBConfig): this;

  // 状态操作
  set(
    nextState: Partial<T> | ((state: T) => Partial<T>),
    options?: SetOptions
  ): void;
  delete(key: string): void;
  reset(): void;

  // 状态获取
  get current(): T;
  getCurrent(): Promise<T>;
  ready(): Promise<void>;

  // 订阅
  subscribe(listener: (state: T) => void): () => void;
  addListener(listener: (state: T) => void): void;
  removeListener(listener: (state: T) => void): void;

  // React Hook
  use<Selected = T>(selector?: (state: T) => Selected): Selected;

  // 资源管理
  destroy(): void;

  // 键名切换（仅限于 IndexedDB 方案使用）
  switch(name: string): this;
}
```

### 配置类型

```typescript
// LocalStorage配置
interface StorageConfig {
  name: string; // 存储键名
  sync?: boolean; // 是否跨窗口同步
}

// IndexedDB配置
interface IndexedDBConfig extends StorageConfig {
  database: string; // 数据库名称
  object?: string; // 对象仓库名称，默认是 'echo-state'
}

// 设置选项
interface SetOptions {
  isFromSync?: boolean; // 是否来自同步
  replace?: boolean; // 是否替换整个状态
}
```

## 最佳实践

1. **使用模块化状态**：为不同的功能创建独立的 Echo 实例
2. **选择合适的存储模式**：
   - 临时数据使用`temporary()`
   - 小型数据使用`localStorage()`
   - 大型或复杂数据使用`indexed()`
3. **使用选择器优化性能**：只订阅需要的状态部分
4. **等待初始化完成**：使用`ready()`确保状态已从存储加载
5. **正确清理资源**：组件卸载时取消订阅

## 示例项目

### 待办事项应用

```tsx
import React, { useState } from "react";
import { Echo } from "echo-state";

// 定义待办事项类型
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// 创建待办事项存储
const todoStore = new Echo<{ todos: Todo[] }>({
  todos: [],
}).localStorage({ name: "todo-app", sync: true });

function TodoApp() {
  const { todos } = todoStore.use();
  const [newTodo, setNewTodo] = useState("");

  const addTodo = () => {
    if (!newTodo.trim()) return;

    todoStore.set((state) => ({
      todos: [
        ...state.todos,
        {
          id: Date.now(),
          text: newTodo,
          completed: false,
        },
      ],
    }));

    setNewTodo("");
  };

  const toggleTodo = (id: number) => {
    todoStore.set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    }));
  };

  const deleteTodo = (id: number) => {
    todoStore.set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    }));
  };

  return (
    <div>
      <h1>待办事项</h1>

      <div>
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="添加新待办..."
        />
        <button onClick={addTodo}>添加</button>
      </div>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span
              style={{
                textDecoration: todo.completed ? "line-through" : "none",
              }}
            >
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

## 常见问题

### Q: Echo 与 Redux 相比有什么优势？

A: Echo 更轻量，API 更简单，内置持久化和跨窗口同步，无需中间件。

### Q: 如何处理复杂的状态逻辑？

A: 可以创建自定义的状态管理类，继承 Echo 并添加业务逻辑方法。

### Q: 性能如何优化？

A: 使用选择器只订阅需要的状态部分，避免不必要的重渲染。

### Q: 是否支持 TypeScript？

A: 是的，Echo 完全用 TypeScript 编写，提供完整的类型支持。

### Q: 如何处理异步操作？

A: 可以在异步函数中调用`set`方法，例如：

```typescript
async function fetchUserData() {
  try {
    const response = await fetch("/api/user");
    const data = await response.json();
    userStore.set({ userData: data });
  } catch (error) {
    userStore.set({ error: error.message });
  }
}
```

### Q: 为什么在链式调用`indexed()`和`set()`方法时，数据库中存储的是默认状态而不是我设置的状态？

A: 这是因为`indexed()`方法是异步的，它内部调用的`hydrate()`方法需要时间来初始化数据库。当你链式调用时：

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

`set()`方法会在`hydrate()`完成之前执行，此时如果数据库中没有数据，`hydrate()`会使用默认状态初始化数据库，覆盖你设置的状态。

正确的做法是等待初始化完成后再设置状态：

```typescript
// 方法1：使用await
await echo
  .indexed({
    name: projectId,
    database: "my-database",
  })
  .ready();

echo.set(project, {
  replace: true,
});

// 方法2：使用链式Promise
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

这样可以确保在设置新状态之前，数据库已经完成了初始化。

### Q: IndexedDB 配置参数有什么变化？

A: 在最新版本中，IndexedDB 的配置参数发生了变化：

- `storeName` 改为 `database`，表示数据库名称
- `version` 参数被移除
- 新增 `object` 参数，表示对象仓库名称，默认值为 'echo-state'

旧版本配置：

```typescript
userStore.indexed({
  name: "user-store",
  storeName: "userData",
  version: 1,
  sync: true,
});
```

新版本配置：

```typescript
userStore.indexed({
  name: "user-store",
  database: "user-database",
  object: "userData", // 可选，默认为 'echo-state'
  sync: true,
});
```

请确保更新您的代码以适应这些变化。
