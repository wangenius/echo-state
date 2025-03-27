---
title: example
order: 4
---

# Echo Examples

This document provides complete example projects and use cases for using the Echo state management library, helping you understand how to use Echo in actual applications.

## Todo List Application

This is a complete todo list application example that demonstrates the basic usage of Echo:

```tsx
import React, { useState } from "react";
import { Echo } from "echo-state";

// Define the todo item type
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// Create the todo list storage
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
      <h1>Todo List</h1>

      <div>
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
        />
        <button onClick={addTodo}>Add</button>
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
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoApp;
```

## Shopping Cart Application

This example demonstrates how to use Echo to manage shopping cart state:

```tsx
import React from "react";
import { Echo } from "echo-state";

// Define the product and cart types
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

// Create the shopping cart storage
const cartStore = new Echo<CartState>({
  items: [],
  loading: false,
}).localStorage({ name: "shopping-cart", sync: true });

// Simulate product data
const products: Product[] = [
  {
    id: "p1",
    name: "Smartphone",
    price: 2999,
    image: "phone.jpg",
  },
  {
    id: "p2",
    name: "Wireless Earphones",
    price: 799,
    image: "headphones.jpg",
  },
  {
    id: "p3",
    name: "Tablet",
    price: 3499,
    image: "tablet.jpg",
  },
];

// Product list component
function ProductList() {
  const addToCart = (product: Product) => {
    cartStore.set((state) => {
      const existingItem = state.items.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        // If the product is already in the cart, increase the quantity
        return {
          items: state.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      } else {
        // Otherwise, add a new item
        return {
          items: [...state.items, { product, quantity: 1 }],
        };
      }
    });
  };

  return (
    <div className="product-list">
      <h2>Product List</h2>
      <div className="products">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p>¥{product.price}</p>
            <button onClick={() => addToCart(product)}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Cart component
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
      <h2>Shopping Cart</h2>
      {items.length === 0 ? (
        <p>The cart is empty</p>
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
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <div className="cart-summary">
            <p>Total: ¥{totalPrice}</p>
            <button className="checkout-button">Checkout</button>
          </div>
        </>
      )}
    </div>
  );
}

// Main application component
function ShoppingApp() {
  return (
    <div className="shopping-app">
      <header>
        <h1>Echo Shopping App</h1>
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

## User Authentication Application

This example demonstrates how to use Echo to manage user authentication state:

```tsx
import React, { useState, useEffect } from "react";
import { Echo } from "echo-state";

// Define the authentication state type
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

// Create the authentication state storage
const authStore = new Echo<AuthState>({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}).localStorage({ name: "auth-store", sync: true });

// Simulate API calls
const api = {
  login: async (email: string, password: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate validation
    if (email === "user@example.com" && password === "password") {
      return {
        user: {
          id: "user-1",
          name: "Test User",
          email: "user@example.com",
        },
        token: "fake-jwt-token",
      };
    } else {
      throw new Error("Invalid email or password");
    }
  },
  logout: async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true };
  },
};

// Login form component
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
      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
      <p className="hint">Hint: Use user@example.com / password to login</p>
    </form>
  );
}

// User information component
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
      <h2>User Information</h2>
      <div className="profile-details">
        <p>
          <strong>Name:</strong> {user.name}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
      </div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

// Protected content component
function ProtectedContent() {
  return (
    <div className="protected-content">
      <h2>Protected Content</h2>
      <p>This is only visible to logged-in users.</p>
    </div>
  );
}

// Main application component
function AuthApp() {
  const { isAuthenticated, loading } = authStore.use();

  // Check the token in local storage
  useEffect(() => {
    const checkAuth = async () => {
      await authStore.ready();
      // You can add token validation logic here
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="auth-app">
      <header>
        <h1>Echo Authentication Example</h1>
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

## Multi-Project Management Application

This example demonstrates how to use Echo's `switch` method to switch between multiple projects:

```tsx
import React, { useState, useEffect } from "react";
import { Echo } from "echo-state";

// Define the project type
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

// Create the project storage
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

// Simulate project data
const projectsData: Project[] = [
  {
    id: "project-1",
    name: "Website Redesign",
    description: "Redesigning and developing the company website",
    tasks: [
      {
        id: "task-1-1",
        title: "Design the homepage prototype",
        completed: true,
      },
      { id: "task-1-2", title: "Develop the homepage", completed: false },
      { id: "task-1-3", title: "Test the responsive layout", completed: false },
    ],
  },
  {
    id: "project-2",
    name: "Mobile App Development",
    description: "Developing iOS and Android client applications",
    tasks: [
      { id: "task-2-1", title: "Design the user interface", completed: true },
      {
        id: "task-2-2",
        title: "Implement user authentication",
        completed: true,
      },
      { id: "task-2-3", title: "Develop core features", completed: false },
      { id: "task-2-4", title: "Apply testing", completed: false },
    ],
  },
  {
    id: "project-3",
    name: "Marketing Campaign",
    description: "Quarterly marketing campaign planning and execution",
    tasks: [
      { id: "task-3-1", title: "Market research", completed: true },
      { id: "task-3-2", title: "Develop marketing strategy", completed: false },
      {
        id: "task-3-3",
        title: "Prepare promotional materials",
        completed: false,
      },
      { id: "task-3-4", title: "Social media promotion", completed: false },
    ],
  },
];

// Project selector component
function ProjectSelector() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const currentProject = projectStore.use();

  // Simulate fetching project list from API
  useEffect(() => {
    const fetchProjects = async () => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProjects(projectsData);
      setLoading(false);

      // If there is no current project, load the first project
      if (!currentProject.id && projectsData.length > 0) {
        switchProject(projectsData[0].id);
      }
    };

    fetchProjects();
  }, []);

  const switchProject = async (projectId: string) => {
    setLoading(true);
    try {
      // Use the switch method to switch to different projects
      await projectStore.switch(projectId).ready();

      // Check if you need to load project data from the "server"
      if (!projectStore.current.id) {
        const project = projectsData.find((p) => p.id === projectId);
        if (project) {
          projectStore.set(project, { replace: true });
        }
      }
    } catch (error) {
      console.error("Failed to switch project:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !currentProject.id) {
    return <div className="loading">Loading project...</div>;
  }

  return (
    <div className="project-selector">
      <h2>Project</h2>
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

// Task list component
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
    return <div className="no-project">Please select a project</div>;
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
          placeholder="Add a new task..."
        />
        <button onClick={addTask}>Add</button>
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
          Completed: {tasks.filter((t) => t.completed).length} / {tasks.length}
        </p>
      </div>
    </div>
  );
}

// Main application component
function ProjectApp() {
  useEffect(() => {
    // Ensure resources are cleaned up when the component is unmounted
    return () => {
      projectStore.destroy();
    };
  }, []);

  return (
    <div className="project-app">
      <header>
        <h1>Echo Project Management</h1>
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

## Theme Switching Application

This example demonstrates how to use Echo to implement theme switching functionality:

```tsx
import React, { useEffect } from "react";
import { Echo } from "echo-state";

// Define the theme type
interface ThemeState {
  mode: "light" | "dark";
  primaryColor: string;
  fontSize: "small" | "medium" | "large";
}

// Create the theme storage
const themeStore = new Echo<ThemeState>({
  mode: "light",
  primaryColor: "#1890ff",
  fontSize: "medium",
}).localStorage({ name: "theme-settings", sync: true });

// Color options
const colorOptions = [
  { name: "Blue", value: "#1890ff" },
  { name: "Green", value: "#52c41a" },
  { name: "Purple", value: "#722ed1" },
  { name: "Red", value: "#f5222d" },
  { name: "Orange", value: "#fa8c16" },
];

// Font size options
const fontSizeOptions = [
  { name: "Small", value: "small" },
  { name: "Medium", value: "medium" },
  { name: "Large", value: "large" },
];

// Theme settings component
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
      <h2>Theme Settings</h2>

      <div className="setting-group">
        <h3>Theme Mode</h3>
        <button onClick={toggleThemeMode}>
          Switch to {theme.mode === "light" ? "Dark" : "Light"} mode
        </button>
      </div>

      <div className="setting-group">
        <h3>Theme Color</h3>
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
        <h3>Font Size</h3>
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

// Theme preview component
function ThemePreview() {
  const theme = themeStore.use();

  return (
    <div className="theme-preview">
      <h2>Theme Preview</h2>
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
        <h3>Title Text</h3>
        <p>
          This is an example text for displaying the current theme settings.
        </p>
        <button className="primary-button">Primary Button</button>
        <button className="secondary-button">Secondary Button</button>
        <div className="card">
          <h4>Card Title</h4>
          <p>
            This is an example text for displaying the current theme settings.
          </p>
        </div>
      </div>
    </div>
  );
}

// Apply theme to the document
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = themeStore.use();

  useEffect(() => {
    // Apply theme to the document root element
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

// Main application component
function ThemeApp() {
  return (
    <ThemeProvider>
      <div className="theme-app">
        <header>
          <h1>Echo Theme Settings</h1>
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

## User Data Management with IndexedDB

This example demonstrates how to use Echo with IndexedDB storage mode and the `discard` method to manage user data:

```tsx
import React from "react";
import { Echo } from "echo-state";

// Define user data type
interface UserData {
  id: string;
  name: string;
  email: string;
  preferences: {
    theme: "light" | "dark";
    notifications: boolean;
  };
}

// Create the user data storage with IndexedDB
const userStore = new Echo<UserData>({
  id: "",
  name: "",
  email: "",
  preferences: {
    theme: "light",
    notifications: true,
  },
}).indexed({
  name: "user-data",
  database: "app-db",
  object: "users",
  sync: true,
});

// User management component
function UserManager() {
  const userData = userStore.use();

  const updateUser = async (userId: string, data: Partial<UserData>) => {
    // Switch to the specific user's data
    userStore.switch(userId);

    // Update user data
    userStore.set(data);
  };

  return (
    <div>
      <h2>User Data Management</h2>
      <div>
        <h3>Current User Data</h3>
        <pre>{JSON.stringify(userData, null, 2)}</pre>

        <div>
          <h4>Actions</h4>
          <button
            onClick={() =>
              updateUser("user-123", {
                name: "John Doe",
                email: "john@example.com",
              })
            }
          >
            Update User
          </button>
          <button
            onClick={() => userStore.discard()}
            style={{ marginLeft: "10px" }}
          >
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserManager;
```

This example shows:

1. How to use IndexedDB storage mode for user data
2. How to switch between different user data using the `switch` method
3. How to delete user data using the `discard` method
4. Error handling for IndexedDB operations
5. Cross-window synchronization of user data

The `discard` method is particularly useful when you need to:

- Delete specific user data without affecting other users
- Clean up old or unused data
- Implement user account deletion functionality
- Manage multiple independent data sets in the same database

## Summary

These examples demonstrate the application of the Echo state management library in different scenarios:

1. **Todo List Application** - Basic state management and LocalStorage persistence
2. **Shopping Cart Application** - Complex state operations and calculations
3. **User Authentication Application** - Authentication state management and cross-window synchronization
4. **Multi-Project Management Application** - Using the `switch` method to switch between multiple data sets
5. **Theme Switching Application** - Theme state management and application to UI
6. **User Data Management with IndexedDB** - Using Echo with IndexedDB storage mode and the `discard` method to manage user data

These examples can be used as a starting point for developing your own applications, and modified and extended as needed.
