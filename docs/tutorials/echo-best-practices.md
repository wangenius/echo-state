---
title: 最佳实践
order: 3
---

# Echo 最佳实践

本文档提供了使用 Echo 状态管理库的最佳实践和推荐模式，帮助您构建高效、可维护的应用。

## 状态设计原则

### 1. 模块化状态

为不同的功能领域创建独立的 Echo 实例，而不是使用单一的全局状态：

```typescript
// ✅ 好的做法：模块化状态
const userStore = new Echo({
  /* 用户相关状态 */
});
const cartStore = new Echo({
  /* 购物车相关状态 */
});
const settingsStore = new Echo({
  /* 应用设置相关状态 */
});

// ❌ 不好的做法：单一全局状态
const globalStore = new Echo({
  user: {
    /* 用户相关状态 */
  },
  cart: {
    /* 购物车相关状态 */
  },
  settings: {
    /* 应用设置相关状态 */
  },
});
```

模块化状态的优势：

- 更好的关注点分离
- 减少不必要的组件重渲染
- 更容易理解和维护
- 可以为不同模块选择不同的存储策略

### 2. 扁平化状态结构

尽量保持状态结构扁平，避免深层嵌套：

```typescript
// ✅ 好的做法：扁平化结构
const userStore = new Echo({
  userId: null,
  userName: "",
  userEmail: "",
  userPreferences: {
    theme: "light",
    notifications: true,
  },
});

// ❌ 不好的做法：深层嵌套
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

扁平化结构的优势：

- 更容易更新特定字段
- 更好的性能（避免深层比较）
- 更容易使用选择器

### 3. 规范化复杂数据

对于复杂的关系数据，使用规范化结构：

```typescript
// ✅ 好的做法：规范化数据
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

// ❌ 不好的做法：嵌套关系数据
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

规范化数据的优势：

- 避免数据重复
- 更容易更新特定实体
- 更好的性能（特别是对于大型数据集）

## 存储模式选择

根据数据特性选择合适的存储模式：

### 临时存储 (temporary)

适用于：

- 会话级临时数据
- 不需要持久化的 UI 状态
- 表单中间状态

```typescript
const uiStateStore = new Echo({
  sidebarOpen: false,
  activeTab: "home",
  modalVisible: false,
}).temporary();
```

### LocalStorage (localStorage)

适用于：

- 用户偏好设置
- 主题配置
- 小型数据（< 5MB）
- 需要在页面刷新后保留的状态

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

适用于：

- 大型数据集
- 复杂结构数据
- 需要高性能查询的数据
- 离线应用数据

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

## React 集成最佳实践

### 使用选择器优化性能

始终使用选择器来只订阅组件需要的状态部分：

```typescript
function UserAvatar() {
  // ✅ 好的做法：只订阅需要的数据
  const avatarUrl = userStore.use((state) => state.profile.avatarUrl);

  return <img src={avatarUrl} alt="用户头像" />;
}

function UserProfile() {
  // ❌ 不好的做法：订阅整个状态
  const state = userStore.use();

  return (
    <div>
      <img src={state.profile.avatarUrl} alt="用户头像" />
      <h2>{state.profile.name}</h2>
    </div>
  );
}
```

### 在组件卸载时清理订阅

当使用自定义订阅时，确保在组件卸载时清理：

```typescript
function NotificationCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // 添加订阅
    const unsubscribe = notificationStore.subscribe((state) => {
      setCount(state.notifications.length);
    });

    // 清理订阅
    return () => unsubscribe();
  }, []);

  return <span>通知: {count}</span>;
}
```

### 使用 React.memo 减少重渲染

对于使用 Echo 的组件，考虑使用 React.memo 进一步优化性能：

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

## 异步操作处理

### 使用状态标志跟踪异步操作

在状态中包含加载和错误标志：

```typescript
const userStore = new Echo({
  data: null,
  loading: false,
  error: null,
});

async function fetchUser(id) {
  try {
    // 设置加载状态
    userStore.set({ loading: true, error: null });

    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error("获取用户失败");

    const data = await response.json();

    // 更新数据并清除加载状态
    userStore.set({ data, loading: false });
  } catch (error) {
    // 设置错误状态
    userStore.set({ loading: false, error: error.message });
  }
}
```

### 创建专用的异步操作函数

将异步逻辑封装在专用函数中，而不是直接在组件中处理：

```typescript
// userService.js
export const userService = {
  async fetchUser(id) {
    try {
      userStore.set({ loading: true, error: null });
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) throw new Error("获取用户失败");
      const data = await response.json();
      userStore.set({ data, loading: false });
      return data;
    } catch (error) {
      userStore.set({ loading: false, error: error.message });
      throw error;
    }
  },

  async updateUser(id, updates) {
    // 类似的实现...
  },
};

// 在组件中使用
function UserProfile({ userId }) {
  const { data, loading, error } = userStore.use();

  useEffect(() => {
    userService.fetchUser(userId).catch(console.error);
  }, [userId]);

  // 渲染逻辑...
}
```

## 持久化和同步

### 等待初始化完成

在访问状态之前，始终等待初始化完成：

```typescript
async function initializeApp() {
  // 等待所有存储初始化
  await Promise.all([
    userStore.ready(),
    settingsStore.ready(),
    dataStore.ready(),
  ]);

  // 现在可以安全地访问状态
  console.log("用户:", userStore.current);
  console.log("设置:", settingsStore.current);

  // 渲染应用
  renderApp();
}
```

### 正确处理链式调用

当使用链式调用时，确保在设置状态前等待初始化完成：

```typescript
// ✅ 好的做法：等待初始化完成
async function loadProject(projectId, projectData) {
  const store = new Echo({
    /* 默认状态 */
  });

  // 先配置存储
  store.indexed({
    name: projectId,
    database: "projects",
  });

  // 等待初始化完成
  await store.ready();

  // 然后设置状态
  store.set(projectData, { replace: true });

  return store;
}

// ❌ 不好的做法：没有等待初始化
function loadProject(projectId, projectData) {
  return new Echo({
    /* 默认状态 */
  })
    .indexed({
      name: projectId,
      database: "projects",
    })
    .set(projectData, { replace: true }); // 可能会被覆盖！
}
```

## 组织和扩展

### 创建自定义 Store 类

对于复杂应用，创建扩展 Echo 的自定义 Store 类：

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

  // 添加业务逻辑方法
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

  // 添加计算属性
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

  // 异步方法
  async fetchTodos() {
    try {
      this.set({ loading: true });
      const response = await fetch("/api/todos");
      const todos = await response.json();
      this.set({ todos, loading: false });
    } catch (error) {
      console.error("获取待办事项失败:", error);
      this.set({ loading: false });
    }
  }
}

// 创建单例实例
export const todoStore = new TodoStore();
```

### 使用工厂函数创建 Store

对于需要动态创建的 Store，使用工厂函数：

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

  // 添加项目特定的方法
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

    // 其他项目特定方法...
  };

  // 返回增强的 store
  return Object.assign(store, projectApi);
}

// 使用
const projectStore = createProjectStore("project-123");
await projectStore.ready();
projectStore.fetchDetails();
```

## 调试和测试

### 添加调试中间件

创建一个简单的调试中间件来记录状态变化：

```typescript
function createDebugStore<T>(name: string, defaultState: T) {
  const store = new Echo<T>(defaultState);

  if (process.env.NODE_ENV === "development") {
    store.subscribe((state) => {
      console.group(`[Echo Store: ${name}] 状态更新`);
      console.log("新状态:", state);
      console.groupEnd();
    });
  }

  return store;
}

// 使用
const userStore = createDebugStore("User", { name: "", age: 0 });
```

### 为测试创建可重置的 Store

在测试中，确保每个测试用例都有干净的状态：

```typescript
// store.js
export function createTestableStore() {
  const store = new Echo({
    count: 0,
    data: null,
  });

  // 添加测试辅助方法
  return {
    ...store,
    resetForTest() {
      store.set({ count: 0, data: null }, { replace: true });
    },
  };
}

// 在测试中使用
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

## 性能优化

### 避免不必要的状态更新

确保只在值实际变化时才更新状态：

```typescript
function updateUserPreference(key, value) {
  const currentValue = userPreferencesStore.current[key];

  // 只有当值实际变化时才更新
  if (currentValue !== value) {
    userPreferencesStore.set({ [key]: value });
  }
}
```

### 批量更新相关状态

将相关的状态更新合并为一次更新：

```typescript
// ✅ 好的做法：一次更新多个相关字段
function updateUserProfile(updates) {
  userStore.set(updates);
}

// ❌ 不好的做法：多次单独更新
function updateUserProfile(updates) {
  if (updates.name) userStore.set({ name: updates.name });
  if (updates.email) userStore.set({ email: updates.email });
  if (updates.avatar) userStore.set({ avatar: updates.avatar });
}
```

### 使用记忆化选择器

对于复杂的选择器，使用记忆化来避免不必要的重计算：

```typescript
import { useMemo } from "react";

function TodoList() {
  const { todos, filter } = todoStore.use();

  // 使用 useMemo 记忆化过滤结果
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

## 总结

遵循这些最佳实践将帮助您充分利用 Echo 状态管理库的优势，构建高效、可维护的应用。关键要点：

1. 设计良好的状态结构（模块化、扁平化、规范化）
2. 选择合适的存储模式（临时、LocalStorage、IndexedDB）
3. 使用选择器优化性能
4. 正确处理异步操作
5. 等待初始化完成
6. 扩展 Echo 以满足特定需求
7. 实施调试和测试策略
8. 应用性能优化技术
