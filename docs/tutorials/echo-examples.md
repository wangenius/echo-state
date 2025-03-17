---
title: 示例项目
order: 4
---

# Echo 示例项目

本文档提供了使用 Echo 状态管理库的完整示例项目和用例，帮助您理解如何在实际应用中使用 Echo。

## 待办事项应用

这是一个完整的待办事项应用示例，展示了 Echo 的基本用法：

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

export default TodoApp;
```

## 购物车应用

这个示例展示了如何使用 Echo 管理购物车状态：

```tsx
import React from "react";
import { Echo } from "echo-state";

// 定义产品和购物车类型
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
}

// 创建购物车存储
const cartStore = new Echo<CartState>({
  items: [],
  loading: false,
}).localStorage({ name: "shopping-cart", sync: true });

// 模拟产品数据
const products: Product[] = [
  {
    id: "p1",
    name: "智能手机",
    price: 2999,
    image: "phone.jpg",
  },
  {
    id: "p2",
    name: "无线耳机",
    price: 799,
    image: "headphones.jpg",
  },
  {
    id: "p3",
    name: "平板电脑",
    price: 3499,
    image: "tablet.jpg",
  },
];

// 产品列表组件
function ProductList() {
  const addToCart = (product: Product) => {
    cartStore.set((state) => {
      const existingItem = state.items.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        // 如果产品已在购物车中，增加数量
        return {
          items: state.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      } else {
        // 否则添加新项目
        return {
          items: [...state.items, { product, quantity: 1 }],
        };
      }
    });
  };

  return (
    <div className="product-list">
      <h2>产品列表</h2>
      <div className="products">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p>¥{product.price}</p>
            <button onClick={() => addToCart(product)}>加入购物车</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// 购物车组件
function Cart() {
  const { items } = cartStore.use();

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    cartStore.set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    }));
  };

  const removeFromCart = (productId: string) => {
    cartStore.set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
  };

  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="cart">
      <h2>购物车</h2>
      {items.length === 0 ? (
        <p>购物车为空</p>
      ) : (
        <>
          <ul>
            {items.map((item) => (
              <li key={item.product.id} className="cart-item">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="cart-item-image"
                />
                <div className="cart-item-details">
                  <h4>{item.product.name}</h4>
                  <p>¥{item.product.price}</p>
                </div>
                <div className="cart-item-actions">
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity - 1)
                    }
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>
                <button
                  className="remove-button"
                  onClick={() => removeFromCart(item.product.id)}
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
          <div className="cart-summary">
            <p>总计: ¥{totalPrice}</p>
            <button className="checkout-button">结算</button>
          </div>
        </>
      )}
    </div>
  );
}

// 主应用组件
function ShoppingApp() {
  return (
    <div className="shopping-app">
      <header>
        <h1>Echo 购物应用</h1>
      </header>
      <main>
        <ProductList />
        <Cart />
      </main>
    </div>
  );
}

export default ShoppingApp;
```

## 用户认证应用

这个示例展示了如何使用 Echo 管理用户认证状态：

```tsx
import React, { useState, useEffect } from "react";
import { Echo } from "echo-state";

// 定义认证状态类型
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

// 创建认证状态存储
const authStore = new Echo<AuthState>({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}).localStorage({ name: "auth-store", sync: true });

// 模拟API调用
const api = {
  login: async (email: string, password: string) => {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 模拟验证
    if (email === "user@example.com" && password === "password") {
      return {
        user: {
          id: "user-1",
          name: "测试用户",
          email: "user@example.com",
        },
        token: "fake-jwt-token",
      };
    } else {
      throw new Error("邮箱或密码不正确");
    }
  },
  logout: async () => {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true };
  },
};

// 登录表单组件
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loading, error } = authStore.use();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      authStore.set({ loading: true, error: null });
      const { user, token } = await api.login(email, password);
      authStore.set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
      });
    } catch (err) {
      authStore.set({
        loading: false,
        error: err.message,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>登录</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <label htmlFor="email">邮箱</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">密码</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "登录中..." : "登录"}
      </button>
      <p className="hint">提示: 使用 user@example.com / password 登录</p>
    </form>
  );
}

// 用户信息组件
function UserProfile() {
  const { user } = authStore.use();

  const handleLogout = async () => {
    try {
      authStore.set({ loading: true });
      await api.logout();
      authStore.set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
    } catch (err) {
      authStore.set({
        loading: false,
        error: err.message,
      });
    }
  };

  if (!user) return null;

  return (
    <div className="user-profile">
      <h2>用户信息</h2>
      <div className="profile-details">
        <p>
          <strong>姓名:</strong> {user.name}
        </p>
        <p>
          <strong>邮箱:</strong> {user.email}
        </p>
      </div>
      <button onClick={handleLogout}>退出登录</button>
    </div>
  );
}

// 受保护的内容组件
function ProtectedContent() {
  return (
    <div className="protected-content">
      <h2>受保护的内容</h2>
      <p>这是只有登录用户才能看到的内容。</p>
    </div>
  );
}

// 主应用组件
function AuthApp() {
  const { isAuthenticated, loading } = authStore.use();

  // 检查本地存储中的令牌
  useEffect(() => {
    const checkAuth = async () => {
      await authStore.ready();
      // 这里可以添加令牌验证逻辑
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="auth-app">
      <header>
        <h1>Echo 认证示例</h1>
      </header>
      <main>
        {isAuthenticated ? (
          <>
            <UserProfile />
            <ProtectedContent />
          </>
        ) : (
          <LoginForm />
        )}
      </main>
    </div>
  );
}

export default AuthApp;
```

## 多项目管理应用

这个示例展示了如何使用 Echo 的 `switch` 方法在多个项目之间切换：

```tsx
import React, { useState, useEffect } from "react";
import { Echo } from "echo-state";

// 定义项目类型
interface Project {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

// 创建项目存储
const projectStore = new Echo<Project>({
  id: "",
  name: "",
  description: "",
  tasks: [],
}).indexed({
  name: "current-project",
  database: "projects-db",
  object: "projects",
});

// 模拟项目数据
const projectsData: Project[] = [
  {
    id: "project-1",
    name: "网站重设计",
    description: "公司网站的重新设计和开发",
    tasks: [
      { id: "task-1-1", title: "设计首页原型", completed: true },
      { id: "task-1-2", title: "开发首页", completed: false },
      { id: "task-1-3", title: "测试响应式布局", completed: false },
    ],
  },
  {
    id: "project-2",
    name: "移动应用开发",
    description: "iOS 和 Android 客户端开发",
    tasks: [
      { id: "task-2-1", title: "设计用户界面", completed: true },
      { id: "task-2-2", title: "实现用户认证", completed: true },
      { id: "task-2-3", title: "开发核心功能", completed: false },
      { id: "task-2-4", title: "应用测试", completed: false },
    ],
  },
  {
    id: "project-3",
    name: "营销活动",
    description: "季度营销活动策划和执行",
    tasks: [
      { id: "task-3-1", title: "市场调研", completed: true },
      { id: "task-3-2", title: "制定营销策略", completed: false },
      { id: "task-3-3", title: "准备宣传材料", completed: false },
      { id: "task-3-4", title: "社交媒体推广", completed: false },
    ],
  },
];

// 项目选择器组件
function ProjectSelector() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const currentProject = projectStore.use();

  // 模拟从API获取项目列表
  useEffect(() => {
    const fetchProjects = async () => {
      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProjects(projectsData);
      setLoading(false);

      // 如果没有当前项目，加载第一个项目
      if (!currentProject.id && projectsData.length > 0) {
        switchProject(projectsData[0].id);
      }
    };

    fetchProjects();
  }, []);

  const switchProject = async (projectId: string) => {
    setLoading(true);
    try {
      // 使用 switch 方法切换到不同的项目
      await projectStore.switch(projectId).ready();

      // 检查是否需要从"服务器"加载项目数据
      if (!projectStore.current.id) {
        const project = projectsData.find((p) => p.id === projectId);
        if (project) {
          projectStore.set(project, { replace: true });
        }
      }
    } catch (error) {
      console.error("切换项目失败:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !currentProject.id) {
    return <div className="loading">加载项目...</div>;
  }

  return (
    <div className="project-selector">
      <h2>项目</h2>
      <ul>
        {projects.map((project) => (
          <li
            key={project.id}
            className={project.id === currentProject.id ? "active" : ""}
            onClick={() => switchProject(project.id)}
          >
            {project.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

// 任务列表组件
function TaskList() {
  const { id, name, description, tasks } = projectStore.use();

  const toggleTask = (taskId: string) => {
    projectStore.set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    }));
  };

  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (!newTask.trim()) return;

    projectStore.set((state) => ({
      tasks: [
        ...state.tasks,
        {
          id: `task-${Date.now()}`,
          title: newTask,
          completed: false,
        },
      ],
    }));

    setNewTask("");
  };

  if (!id) {
    return <div className="no-project">请选择一个项目</div>;
  }

  return (
    <div className="task-list">
      <div className="project-header">
        <h2>{name}</h2>
        <p>{description}</p>
      </div>

      <div className="add-task">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="添加新任务..."
        />
        <button onClick={addTask}>添加</button>
      </div>

      <ul>
        {tasks.map((task) => (
          <li key={task.id} className={task.completed ? "completed" : ""}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
            />
            <span>{task.title}</span>
          </li>
        ))}
      </ul>

      <div className="task-summary">
        <p>
          完成: {tasks.filter((t) => t.completed).length} / {tasks.length}
        </p>
      </div>
    </div>
  );
}

// 主应用组件
function ProjectApp() {
  useEffect(() => {
    // 确保在组件卸载时清理资源
    return () => {
      projectStore.destroy();
    };
  }, []);

  return (
    <div className="project-app">
      <header>
        <h1>Echo 项目管理</h1>
      </header>
      <main>
        <ProjectSelector />
        <TaskList />
      </main>
    </div>
  );
}

export default ProjectApp;
```

## 主题切换应用

这个示例展示了如何使用 Echo 实现主题切换功能：

```tsx
import React, { useEffect } from "react";
import { Echo } from "echo-state";

// 定义主题类型
interface ThemeState {
  mode: "light" | "dark";
  primaryColor: string;
  fontSize: "small" | "medium" | "large";
}

// 创建主题存储
const themeStore = new Echo<ThemeState>({
  mode: "light",
  primaryColor: "#1890ff",
  fontSize: "medium",
}).localStorage({ name: "theme-settings", sync: true });

// 颜色选项
const colorOptions = [
  { name: "蓝色", value: "#1890ff" },
  { name: "绿色", value: "#52c41a" },
  { name: "紫色", value: "#722ed1" },
  { name: "红色", value: "#f5222d" },
  { name: "橙色", value: "#fa8c16" },
];

// 字体大小选项
const fontSizeOptions = [
  { name: "小", value: "small" },
  { name: "中", value: "medium" },
  { name: "大", value: "large" },
];

// 主题设置组件
function ThemeSettings() {
  const theme = themeStore.use();

  const toggleThemeMode = () => {
    themeStore.set((state) => ({
      mode: state.mode === "light" ? "dark" : "light",
    }));
  };

  const changeColor = (color: string) => {
    themeStore.set({ primaryColor: color });
  };

  const changeFontSize = (size: "small" | "medium" | "large") => {
    themeStore.set({ fontSize: size });
  };

  return (
    <div className="theme-settings">
      <h2>主题设置</h2>

      <div className="setting-group">
        <h3>主题模式</h3>
        <button onClick={toggleThemeMode}>
          切换到{theme.mode === "light" ? "暗色" : "亮色"}模式
        </button>
      </div>

      <div className="setting-group">
        <h3>主题颜色</h3>
        <div className="color-options">
          {colorOptions.map((option) => (
            <div
              key={option.value}
              className={`color-option ${
                theme.primaryColor === option.value ? "active" : ""
              }`}
              style={{ backgroundColor: option.value }}
              onClick={() => changeColor(option.value)}
              title={option.name}
            ></div>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <h3>字体大小</h3>
        <div className="font-size-options">
          {fontSizeOptions.map((option) => (
            <button
              key={option.value}
              className={theme.fontSize === option.value ? "active" : ""}
              onClick={() => changeFontSize(option.value as any)}
            >
              {option.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// 主题预览组件
function ThemePreview() {
  const theme = themeStore.use();

  return (
    <div className="theme-preview">
      <h2>主题预览</h2>
      <div
        className={`preview-content ${theme.mode}`}
        style={
          {
            "--primary-color": theme.primaryColor,
            fontSize:
              theme.fontSize === "small"
                ? "14px"
                : theme.fontSize === "medium"
                ? "16px"
                : "18px",
          } as React.CSSProperties
        }
      >
        <h3>标题文本</h3>
        <p>这是一段示例文本，用于展示当前主题设置的效果。</p>
        <button className="primary-button">主要按钮</button>
        <button className="secondary-button">次要按钮</button>
        <div className="card">
          <h4>卡片标题</h4>
          <p>卡片内容示例，展示不同背景下的文本显示效果。</p>
        </div>
      </div>
    </div>
  );
}

// 应用主题到文档
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = themeStore.use();

  useEffect(() => {
    // 应用主题到文档根元素
    document.documentElement.setAttribute("data-theme", theme.mode);
    document.documentElement.style.setProperty(
      "--primary-color",
      theme.primaryColor
    );
    document.documentElement.style.setProperty(
      "--font-size",
      theme.fontSize === "small"
        ? "14px"
        : theme.fontSize === "medium"
        ? "16px"
        : "18px"
    );
  }, [theme]);

  return <>{children}</>;
}

// 主应用组件
function ThemeApp() {
  return (
    <ThemeProvider>
      <div className="theme-app">
        <header>
          <h1>Echo 主题设置</h1>
        </header>
        <main>
          <ThemeSettings />
          <ThemePreview />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default ThemeApp;
```

## 总结

这些示例展示了 Echo 状态管理库在不同场景下的应用：

1. **待办事项应用** - 基本的状态管理和 LocalStorage 持久化
2. **购物车应用** - 复杂状态操作和计算
3. **用户认证应用** - 认证状态管理和跨窗口同步
4. **多项目管理应用** - 使用 `switch` 方法在多个数据集之间切换
5. **主题切换应用** - 主题状态管理和应用到 UI

这些示例可以作为您开发自己的应用的起点，根据需要进行修改和扩展。
