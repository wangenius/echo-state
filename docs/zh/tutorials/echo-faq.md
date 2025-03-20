---
title: 常见问题
order: 5
---

# Echo 常见问题

本文档回答了使用 Echo 状态管理库时的常见问题。

## 基础问题

### Q: Echo 与 Redux 相比有什么优势？

A: Echo 相比 Redux 有以下优势：

- **更轻量级**：核心代码更小，API 更简洁
- **内置持久化**：无需额外中间件即可支持 LocalStorage 和 IndexedDB 存储
- **跨窗口同步**：内置支持多标签页/窗口之间的状态同步
- **更简单的 API**：无需 actions、reducers、middleware 等概念
- **TypeScript 友好**：完全使用 TypeScript 编写，提供出色的类型推断
- **React Hooks 集成**：内置 React Hooks 支持，无需额外包装

### Q: Echo 支持哪些数据类型？

A: Echo 支持多种数据类型，但支持程度取决于所选的存储模式：

- **基本数据类型**：对象(Record)、数组、字符串、数字、布尔值、null
- **复杂数据类型**：
  - Map 和 Set：可以在内存中使用，但不支持持久化
  - 类实例：可以在内存中使用，但持久化时会丢失方法和原型链
  - 函数：不支持存储

详细信息请参考 [Echo 支持的数据类型](./echo-data-types.md) 文档。

### Q: Echo 是否支持 TypeScript？

A: 是的，Echo 完全用 TypeScript 编写，提供完整的类型支持。所有的 API 都有详细的类型定义，可以获得良好的编辑器提示和类型检查。

### Q: Echo 是否可以在非 React 项目中使用？

A: 可以。虽然 Echo 提供了 React Hooks 集成，但核心功能不依赖于 React。您可以使用 `subscribe` 方法在任何 JavaScript 环境中订阅状态变化。

```typescript
// 在非 React 环境中使用
const counterStore = new Echo({ count: 0 });

// 订阅状态变化
counterStore.subscribe((state) => {
  document.getElementById("counter").textContent = state.count;
});

// 更新状态
document.getElementById("increment").addEventListener("click", () => {
  counterStore.set((state) => ({ count: state.count + 1 }));
});
```

## 存储相关问题

### Q: 如何选择合适的存储模式？

A: 根据数据特性选择存储模式：

- **临时存储 (temporary)**：用于临时 UI 状态、会话级数据，不需要持久化
- **LocalStorage (localStorage)**：用于小型数据（< 5MB）、用户偏好设置、主题配置等
- **IndexedDB (indexed)**：用于大型数据集、复杂结构数据、离线应用数据

### Q: 为什么在链式调用 `indexed()` 和 `set()` 方法时，数据库中存储的是默认状态而不是我设置的状态？

A: 这是因为 `indexed()` 方法是异步的，它内部调用的 `hydrate()` 方法需要时间来初始化数据库。当你链式调用时：

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

`set()` 方法会在 `hydrate()` 完成之前执行，此时如果数据库中没有数据，`hydrate()` 会使用默认状态初始化数据库，覆盖你设置的状态。

正确的做法是等待初始化完成后再设置状态：

```typescript
// 方法1：使用 await
await echo
  .indexed({
    name: projectId,
    database: "my-database",
  })
  .ready();

echo.set(project, {
  replace: true,
});

// 方法2：使用链式 Promise
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

### Q: 如何在组件卸载时清理资源？

A: 在组件卸载时，应该清理 Echo 实例使用的资源，特别是当使用 IndexedDB 或启用了跨窗口同步时：

```tsx
function MyComponent() {
  useEffect(() => {
    // 组件挂载时的逻辑...

    // 组件卸载时清理资源
    return () => {
      myStore.destroy();
    };
  }, []);

  // 组件渲染逻辑...
}
```

### Q: 如何处理大型数据集的性能问题？

A: 对于大型数据集，建议：

1. 使用 IndexedDB 存储模式
2. 考虑分页加载数据，而不是一次性加载全部数据
3. 使用选择器只订阅需要的数据部分
4. 对于频繁更新的数据，考虑使用本地状态，只在必要时更新 Echo 状态

```typescript
// 分页加载示例
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
    console.error("加载数据失败:", error);
  }
}
```

## React 集成问题

### Q: 如何避免不必要的组件重渲染？

A: 使用选择器只订阅组件需要的状态部分：

```tsx
// 不好的做法：订阅整个状态
function UserProfile() {
  // 每当状态中的任何字段变化时都会重渲染
  const state = userStore.use();

  return <div>{state.user.name}</div>;
}

// 好的做法：使用选择器
function UserProfile() {
  // 只有当用户名变化时才会重渲染
  const userName = userStore.use((state) => state.user.name);

  return <div>{userName}</div>;
}
```

### Q: 如何在 React 组件外部访问 Echo 状态？

A: 在 React 组件外部，可以使用 `current` 属性或 `getCurrent()` 方法访问状态：

```typescript
// 在服务或工具函数中
export async function saveUserData() {
  const userData = userStore.current;
  // 或者使用异步方法（推荐，特别是在使用 IndexedDB 时）
  const userData = await userStore.getCurrent();

  // 使用数据...
}
```

### Q: 如何在 React Context 中使用 Echo？

A: 可以将 Echo 实例通过 Context 提供给组件树：

```tsx
// 创建上下文
const TodoContext = React.createContext<Echo<TodoState> | null>(null);

// 提供者组件
function TodoProvider({ children }) {
  // 创建 Echo 实例
  const todoStore = useMemo(() => {
    return new Echo<TodoState>({ todos: [] }).localStorage({
      name: "todos",
      sync: true,
    });
  }, []);

  // 确保在组件卸载时清理资源
  useEffect(() => {
    return () => todoStore.destroy();
  }, [todoStore]);

  return (
    <TodoContext.Provider value={todoStore}>{children}</TodoContext.Provider>
  );
}

// 自定义 Hook 简化使用
function useTodos<Selected = TodoState>(
  selector?: (state: TodoState) => Selected
) {
  const store = useContext(TodoContext);
  if (!store) {
    throw new Error("useTodos 必须在 TodoProvider 内部使用");
  }
  return store.use(selector);
}
```

## 异步操作问题

### Q: Echo 是否支持异步操作中间件（如 Redux Thunk 或 Redux Saga）？

A: Echo 没有内置异步操作中间件，但可以轻松地在异步函数中使用 Echo：

```typescript
async function fetchUserData(userId) {
  try {
    // 设置加载状态
    userStore.set({ loading: true, error: null });

    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) throw new Error("获取用户失败");

    const data = await response.json();

    // 更新数据并清除加载状态
    userStore.set({ data, loading: false });

    return data;
  } catch (error) {
    // 设置错误状态
    userStore.set({ loading: false, error: error.message });
    throw error;
  }
}
```

### Q: 如何处理异步操作的加载和错误状态？

A: 在状态中包含加载和错误标志：

```typescript
// 状态定义
interface UserState {
  data: User | null;
  loading: boolean;
  error: string | null;
}

// 初始状态
const userStore = new Echo<UserState>({
  data: null,
  loading: false,
  error: null,
});

// 在组件中使用
function UserProfile({ userId }) {
  const { data, loading, error } = userStore.use();

  useEffect(() => {
    fetchUserData(userId);
  }, [userId]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (!data) return <div>无数据</div>;

  return (
    <div>
      <h2>{data.name}</h2>
      <p>{data.email}</p>
    </div>
  );
}
```

## 高级用法问题

### Q: 如何创建自定义状态管理类？

A: 可以通过继承 Echo 类来创建自定义状态管理类：

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
}

// 创建单例实例
export const todoStore = new TodoStore();
```

### Q: 如何在多个项目之间切换数据？

A: 使用 `switch` 方法在同一个数据库和对象仓库下切换到不同的键名：

```typescript
// 创建项目存储
const projectStore = new Echo<Project>({
  id: "",
  name: "",
  tasks: [],
}).indexed({
  name: "current-project", // 初始键名
  database: "projects-db",
  object: "projects",
});

// 切换到另一个项目
async function switchToProject(projectId) {
  // 保存当前项目（如果需要）
  if (projectStore.current.id) {
    await saveCurrentProject();
  }

  // 切换到新项目
  await projectStore.switch(projectId).ready();

  // 如果新项目没有数据，可以从服务器加载
  if (!projectStore.current.id) {
    const project = await fetchProject(projectId);
    projectStore.set(project, { replace: true });
  }
}
```

### Q: 如何实现撤销/重做功能？

A: 可以通过维护历史状态数组来实现撤销/重做功能：

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

// 更新编辑器内容
function updateContent(
  content: string,
  selection: { start: number; end: number } | null
) {
  editorStore.set((state) => {
    // 创建新状态
    const newState = {
      current: { content, selection },
      // 删除当前索引之后的历史记录
      history: [
        ...state.history.slice(0, state.historyIndex + 1),
        state.current, // 将当前状态添加到历史记录
      ],
      historyIndex: state.historyIndex + 1,
    };
    return newState;
  });
}

// 撤销
function undo() {
  editorStore.set((state) => {
    if (state.historyIndex < 0) return state; // 没有历史记录可撤销

    return {
      current: state.history[state.historyIndex],
      history: state.history,
      historyIndex: state.historyIndex - 1,
    };
  });
}

// 重做
function redo() {
  editorStore.set((state) => {
    if (state.historyIndex >= state.history.length - 1) return state; // 没有操作可重做

    return {
      current: state.history[state.historyIndex + 1],
      history: state.history,
      historyIndex: state.historyIndex + 1,
    };
  });
}
```

## 调试和测试问题

### Q: 如何调试 Echo 状态变化？

A: 可以添加一个监听器来记录所有状态变化：

```typescript
if (process.env.NODE_ENV === "development") {
  userStore.subscribe((state) => {
    console.log("[Echo 状态更新]", state);
  });
}
```

也可以创建一个调试组件：

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

### Q: 如何测试使用 Echo 的组件？

A: 在测试中，可以创建一个测试专用的 Echo 实例：

```typescript
// 创建测试专用的 store
function createTestStore(initialState = {}) {
  return new Echo({
    ...defaultState,
    ...initialState,
  }).temporary(); // 使用临时存储模式
}

// 在测试中使用
describe("Counter component", () => {
  let counterStore;

  beforeEach(() => {
    // 为每个测试创建新的 store
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

## 性能和优化问题

### Q: Echo 是否适合大型应用？

A: 是的，Echo 适合大型应用，特别是当您：

1. 使用模块化状态（为不同功能创建独立的 Echo 实例）
2. 使用选择器优化组件重渲染
3. 为大型数据集使用 IndexedDB 存储
4. 遵循最佳实践，如扁平化状态结构和规范化数据

### Q: 如何优化 Echo 的性能？

A: 优化 Echo 性能的关键策略：

1. **使用选择器**：只订阅组件需要的状态部分
2. **避免深层嵌套**：保持状态结构扁平
3. **规范化数据**：避免数据重复
4. **批量更新**：将多个相关更新合并为一次更新
5. **使用记忆化**：对于复杂的选择器，使用 `useMemo` 记忆化结果
6. **避免不必要的更新**：只在值实际变化时才更新状态

### Q: 如何处理表单状态？

A: 对于表单，通常建议：

1. 对于简单表单，使用 React 的 `useState` 管理本地状态
2. 对于复杂表单，使用 Echo 管理状态，但避免频繁更新：

```tsx
function ComplexForm() {
  // 使用本地状态管理输入过程中的值
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    // ...其他字段
  });

  // 从 Echo 获取初始值和提交状态
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

## 迁移和兼容性问题

### Q: 如何从 Redux 迁移到 Echo？

A: 从 Redux 迁移到 Echo 的基本步骤：

1. 将 Redux store 拆分为多个 Echo 实例
2. 将 reducers 转换为 `set` 方法调用
3. 将 action creators 转换为普通函数
4. 将 `useSelector` 替换为 Echo 的 `use` 方法
5. 将 `useDispatch` 替换为直接调用函数

```typescript
// Redux 代码
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

// 组件中使用
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

// Echo 代码
const counterStore = new Echo({ value: 0 });

function increment() {
  counterStore.set((state) => ({ value: state.value + 1 }));
}

function decrement() {
  counterStore.set((state) => ({ value: state.value - 1 }));
}

// 组件中使用
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

### Q: Echo 是否支持服务器端渲染 (SSR)？

A: Echo 可以在服务器端渲染环境中使用，但需要注意以下几点：

1. 在服务器端，应该使用临时存储模式 (`temporary()`)
2. 避免在服务器端使用浏览器特定的 API（如 LocalStorage 或 IndexedDB）
3. 考虑在组件中使用条件检查：

```tsx
function MyComponent() {
  // 在服务器端，使用默认值
  const isClient = typeof window !== "undefined";
  const store = useMemo(() => {
    const store = new Echo({ count: 0 });

    // 只在客户端使用持久化存储
    if (isClient) {
      store.localStorage({ name: "counter" });
    }

    return store;
  }, [isClient]);

  // 组件逻辑...
}
```

## 其他问题

### Q: Echo 是否支持中间件？

A: Echo 目前不支持中间件系统。如果需要类似中间件的功能，可以：

1. 使用自定义状态管理类，继承 Echo 并添加所需功能
2. 使用装饰器模式包装 Echo 实例
3. 使用高阶函数封装状态更新逻辑

```typescript
// 装饰器模式示例
function createLoggedStore<T>(store: Echo<T>, name: string) {
  // 保存原始的 set 方法
  const originalSet = store.set.bind(store);

  // 重写 set 方法
  store.set = ((nextState, options) => {
    console.log(`[${name}] 更新前:`, store.current);

    // 调用原始方法
    originalSet(nextState, options);

    console.log(`[${name}] 更新后:`, store.current);
  }) as typeof store.set;

  return store;
}

// 使用
const userStore = createLoggedStore(
  new Echo({ name: "", age: 0 }),
  "UserStore"
);
```

### Q: 如何处理循环依赖的 stores？

A: 避免 stores 之间的循环依赖。如果确实需要，可以：

1. 重新设计状态结构，消除循环依赖
2. 使用事件发布/订阅模式进行通信
3. 创建一个协调器来管理相互依赖的 stores

```typescript
// 事件发布/订阅示例
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

// 在 stores 中使用
const userStore = new Echo({
  /* ... */
});
const cartStore = new Echo({
  /* ... */
});

// 用户登录后更新购物车
userStore.subscribe((state) => {
  if (state.isLoggedIn) {
    eventBus.publish("user:login", state.user);
  }
});

// 购物车监听用户登录事件
eventBus.subscribe("user:login", (user) => {
  fetchUserCart(user.id).then((cart) => {
    cartStore.set({ items: cart.items });
  });
});
```

### Q: Echo 的未来发展方向是什么？

A: Echo 的未来发展计划包括：

1. 提供更多存储适配器（如 SessionStorage、WebSQL 等）
2. 改进性能，特别是对大型数据集的处理
3. 增强跨窗口同步功能
4. 提供更多调试工具和开发者体验改进
5. 支持更多框架（如 Vue、Svelte 等）

请关注项目仓库获取最新更新和路线图。
