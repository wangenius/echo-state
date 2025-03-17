---
title: 高级用法
order: 2
---

# Echo 高级用法

本文档介绍 Echo 状态管理库的高级功能和用法。

## 等待初始化完成

当使用持久化存储（特别是 IndexedDB）时，初始化过程是异步的。为确保在使用状态前已完成初始化，应使用 `ready()` 方法：

```typescript
// 创建并配置存储
const settingsStore = new Echo({ theme: "light" }).indexed({
  name: "settings",
  database: "app-settings",
  sync: true,
});

// 等待初始化完成后再使用
settingsStore.ready().then(() => {
  // 现在可以安全地使用store了
  console.log(settingsStore.current);
});

// 或使用 async/await
async function initSettings() {
  await settingsStore.ready();
  // 初始化完成，可以安全使用
  console.log(settingsStore.current);
}
```

## 资源清理

Echo 实例使用了一些需要手动清理的资源，如数据库连接和跨窗口通信通道。在不再需要 Echo 实例时，应该清理这些资源：

```typescript
// 清理资源（持久化数据不会消失）
userStore.destroy();
```

这在以下情况特别重要：

- 组件卸载时
- 用户登出时
- 应用关闭时

## 切换存储键名

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

## 异步操作处理

Echo 本身不提供异步操作中间件，但可以轻松地在异步函数中使用 Echo：

```typescript
async function fetchUserData(userId: string) {
  try {
    // 显示加载状态
    userStore.set({ loading: true, error: null });

    // 发起API请求
    const response = await fetch(`/api/users/${userId}`);

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    const userData = await response.json();

    // 更新状态
    userStore.set({
      loading: false,
      userData,
      error: null,
    });

    return userData;
  } catch (error) {
    // 处理错误
    userStore.set({
      loading: false,
      error: error.message,
    });
    throw error;
  }
}
```

## 自定义状态管理类

对于复杂应用，可以通过继承 Echo 类来创建自定义状态管理类，封装业务逻辑：

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

    // 使用 localStorage 存储，并启用跨窗口同步
    this.localStorage({
      name: "auth-store",
      sync: true,
    });

    // 初始化时检查本地存储的令牌
    this.checkAuth();
  }

  private checkAuth() {
    // 检查令牌是否有效
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
        throw new Error('登录失败');
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
        // 可选：通知服务器使令牌失效
        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('注销时出错:', error);
    } finally {
      // 无论服务器请求成功与否，都清除本地状态
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
        throw new Error('令牌无效');
      }

      const { user } = await response.json();

      this.set({
        user,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      // 令牌无效，清除状态
      this.set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: '会话已过期，请重新登录',
      });
    }
  }
}

// 创建单例实例
export const authStore = new AuthStore();

// 在组件中使用
function LoginStatus() {
  const { user, isAuthenticated, loading, error } = authStore.use();

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>欢迎, {user.name}!</p>
          <button onClick={() => authStore.logout()}>退出登录</button>
        </>
      ) : (
        <button onClick={() => /* 显示登录表单 */}>登录</button>
      )}
    </div>
  );
}
```

## 性能优化

### 使用选择器减少重渲染

选择器可以帮助组件只订阅它们需要的状态部分，避免不必要的重渲染：

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

### 避免频繁更新

对于频繁更新的状态（如表单输入），可以考虑使用本地状态，只在必要时更新 Echo 状态：

```tsx
function SearchForm() {
  // 使用本地状态管理输入
  const [query, setQuery] = useState("");
  // 只获取搜索结果
  const results = searchStore.use((state) => state.results);

  const handleSearch = () => {
    // 只在用户提交时更新全局状态
    searchStore.set({ query });
    performSearch(query);
  };

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={handleSearch}>搜索</button>
      <div>
        {results.map((result) => (
          <div key={result.id}>{result.title}</div>
        ))}
      </div>
    </div>
  );
}
```

## 跨窗口状态同步

Echo 支持跨窗口状态同步，这对于多标签页应用特别有用：

```typescript
// 启用跨窗口同步
const userPrefs = new Echo({
  theme: "light",
  fontSize: "medium",
  notifications: true,
}).localStorage({
  name: "user-preferences",
  sync: true, // 启用跨窗口同步
});

// 在一个窗口中更改主题
userPrefs.set({ theme: "dark" });

// 在另一个窗口中，状态会自动更新
// 并且监听器会被触发
```

这个功能在以下场景特别有用：

- 用户在多个标签页打开了同一个应用
- 需要在所有标签页中保持一致的用户设置
- 一个标签页中的登录/登出操作需要影响所有标签页

## 与其他库集成

### 与 React Context 集成

可以将 Echo 与 React Context 结合使用，提供更好的依赖注入：

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

// 在组件中使用
function TodoList() {
  const todos = useTodos((state) => state.todos);
  // ...
}
```

## 调试技巧

### 添加日志监听器

可以添加一个监听器来记录所有状态变化：

```typescript
if (process.env.NODE_ENV === "development") {
  userStore.subscribe((state) => {
    console.log("[Echo 状态更新]", state);
  });
}
```

### 创建调试工具

可以创建一个简单的调试组件来显示当前状态：

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

// 使用
function App() {
  return (
    <div>
      {/* 应用组件 */}
      <EchoDebugger store={userStore} name="用户" />
    </div>
  );
}
```
