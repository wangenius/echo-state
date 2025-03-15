import React, { useState, useEffect } from "react";
import { Echo } from "../Echo";

// 定义任务类型
interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
  dueDate?: string;
  tags: string[];
}

// 定义任务管理器状态
interface TaskManagerState {
  tasks: Task[];
  filter: "all" | "active" | "completed";
  sort: "createdAt" | "dueDate" | "priority";
  sortDirection: "asc" | "desc";
  tags: string[];
  lastUpdated: string;
  settings: {
    showCompletedTasks: boolean;
    darkMode: boolean;
    autoSave: boolean;
  };
}

// 创建Echo实例 - 使用IndexedDB存储
const taskManagerEcho = new Echo<TaskManagerState>(
  {
    tasks: [],
    filter: "all",
    sort: "createdAt",
    sortDirection: "desc",
    tags: ["工作", "个人", "学习", "紧急"],
    lastUpdated: new Date().toISOString(),
    settings: {
      showCompletedTasks: true,
      darkMode: false,
      autoSave: true,
    },
  },
  {
    name: "task-manager", // 启用本地存储
    storage: "indexedDB", // 使用IndexedDB存储
    sync: true, // 启用跨窗口同步
    onChange: (newState, oldState) => {
      console.log("任务管理器状态已更新:", newState);
      // 可以在这里添加更多的逻辑，比如分析状态变化
    },
  }
);

// 生成随机ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// 主应用组件
export function TaskManager() {
  // 使用Echo的use方法获取状态
  // 注意：这里使用了新的use()方法实现，它会在IndexedDB加载完成后自动更新组件
  const tasks = taskManagerEcho.use((state) => state.tasks);
  const filter = taskManagerEcho.use((state) => state.filter);
  const sort = taskManagerEcho.use((state) => state.sort);
  const sortDirection = taskManagerEcho.use((state) => state.sortDirection);
  const tags = taskManagerEcho.use((state) => state.tags);
  const settings = taskManagerEcho.use((state) => state.settings);

  // 本地状态用于表单
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    priority: "medium",
    tags: [],
  });

  // 加载状态指示器
  const [isLoading, setIsLoading] = useState(true);

  // 检查初始化状态
  useEffect(() => {
    const checkInitialization = async () => {
      await taskManagerEcho.ready();
      setIsLoading(false);
    };

    checkInitialization();
  }, []);

  // 过滤和排序任务
  const filteredAndSortedTasks = React.useMemo(() => {
    // 首先过滤
    let result = [...tasks];
    if (filter === "active") {
      result = result.filter((task) => !task.completed);
    } else if (filter === "completed") {
      result = result.filter((task) => task.completed);
    }

    // 然后排序
    result.sort((a, b) => {
      let valueA, valueB;

      if (sort === "priority") {
        const priorityMap = { low: 1, medium: 2, high: 3 };
        valueA = priorityMap[a.priority];
        valueB = priorityMap[b.priority];
      } else if (sort === "dueDate") {
        valueA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        valueB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      } else {
        // createdAt
        valueA = new Date(a.createdAt).getTime();
        valueB = new Date(b.createdAt).getTime();
      }

      return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
    });

    return result;
  }, [tasks, filter, sort, sortDirection]);

  // 添加新任务
  const handleAddTask = () => {
    if (!newTask.title) return;

    const task: Task = {
      id: generateId(),
      title: newTask.title,
      description: newTask.description || "",
      completed: false,
      priority: newTask.priority as "low" | "medium" | "high",
      createdAt: new Date().toISOString(),
      tags: newTask.tags || [],
    };

    if (newTask.dueDate) {
      task.dueDate = newTask.dueDate;
    }

    taskManagerEcho.set((state) => ({
      tasks: [...state.tasks, task],
      lastUpdated: new Date().toISOString(),
    }));

    // 重置表单
    setNewTask({
      title: "",
      description: "",
      priority: "medium",
      tags: [],
    });
  };

  // 切换任务完成状态
  const toggleTaskCompletion = (id: string) => {
    taskManagerEcho.set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ),
      lastUpdated: new Date().toISOString(),
    }));
  };

  // 删除任务
  const deleteTask = (id: string) => {
    taskManagerEcho.set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
      lastUpdated: new Date().toISOString(),
    }));
  };

  // 更改过滤器
  const changeFilter = (newFilter: "all" | "active" | "completed") => {
    taskManagerEcho.set({ filter: newFilter });
  };

  // 更改排序
  const changeSort = (newSort: "createdAt" | "dueDate" | "priority") => {
    taskManagerEcho.set({ sort: newSort });
  };

  // 更改排序方向
  const toggleSortDirection = () => {
    taskManagerEcho.set((state) => ({
      sortDirection: state.sortDirection === "asc" ? "desc" : "asc",
    }));
  };

  // 切换设置
  const toggleSetting = (setting: keyof typeof settings) => {
    taskManagerEcho.set((state) => ({
      settings: {
        ...state.settings,
        [setting]: !state.settings[setting],
      },
    }));
  };

  // 添加新标签
  const addTag = (tag: string) => {
    if (!tag || tags.includes(tag)) return;

    taskManagerEcho.set((state) => ({
      tags: [...state.tags, tag],
    }));
  };

  // 重置所有数据
  const resetAll = () => {
    if (window.confirm("确定要重置所有数据吗？这将删除所有任务和设置。")) {
      taskManagerEcho.reset();
    }
  };

  // 如果正在加载，显示加载指示器
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.5rem",
          color: "#4b5563",
        }}
      >
        <p>正在加载任务数据...</p>
      </div>
    );
  }

  // 应用主题
  const theme = settings.darkMode ? darkTheme : lightTheme;

  return (
    <div
      style={{
        ...theme.container,
        padding: "2rem",
        maxWidth: "1000px",
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: "2rem",
          color: theme.primaryText,
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        Echo 任务管理器
      </h1>

      {/* 设置面板 */}
      <div
        style={{
          ...theme.panel,
          marginBottom: "1.5rem",
          padding: "1rem",
        }}
      >
        <h2 style={{ color: theme.secondaryText, marginBottom: "1rem" }}>
          设置
        </h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <label
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <input
              type="checkbox"
              checked={settings.showCompletedTasks}
              onChange={() => toggleSetting("showCompletedTasks")}
            />
            显示已完成任务
          </label>
          <label
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={() => toggleSetting("darkMode")}
            />
            深色模式
          </label>
          <label
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={() => toggleSetting("autoSave")}
            />
            自动保存
          </label>
          <button
            onClick={resetAll}
            style={{
              ...theme.dangerButton,
              marginLeft: "auto",
            }}
          >
            重置所有数据
          </button>
        </div>
      </div>

      {/* 新任务表单 */}
      <div
        style={{
          ...theme.panel,
          marginBottom: "1.5rem",
          padding: "1rem",
        }}
      >
        <h2 style={{ color: theme.secondaryText, marginBottom: "1rem" }}>
          添加新任务
        </h2>
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: theme.secondaryText,
              }}
            >
              标题:
            </label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              style={{
                ...theme.input,
                width: "100%",
              }}
              placeholder="任务标题"
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: theme.secondaryText,
              }}
            >
              优先级:
            </label>
            <select
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({ ...newTask, priority: e.target.value as any })
              }
              style={{
                ...theme.input,
                width: "100%",
              }}
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: theme.secondaryText,
              }}
            >
              描述:
            </label>
            <textarea
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              style={{
                ...theme.input,
                width: "100%",
                minHeight: "80px",
              }}
              placeholder="任务描述"
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: theme.secondaryText,
              }}
            >
              截止日期:
            </label>
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) =>
                setNewTask({ ...newTask, dueDate: e.target.value })
              }
              style={{
                ...theme.input,
                width: "100%",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: theme.secondaryText,
              }}
            >
              标签:
            </label>
            <select
              multiple
              value={newTask.tags}
              onChange={(e) => {
                const selectedTags = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value
                );
                setNewTask({ ...newTask, tags: selectedTags });
              }}
              style={{
                ...theme.input,
                width: "100%",
                height: "80px",
              }}
            >
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleAddTask}
          disabled={!newTask.title}
          style={{
            ...theme.primaryButton,
            width: "100%",
            marginTop: "1rem",
          }}
        >
          添加任务
        </button>
      </div>

      {/* 过滤和排序控制 */}
      <div
        style={{
          ...theme.panel,
          marginBottom: "1.5rem",
          padding: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span style={{ marginRight: "0.5rem", color: theme.secondaryText }}>
              过滤:
            </span>
            <button
              onClick={() => changeFilter("all")}
              style={{
                ...theme.button,
                ...(filter === "all" ? theme.activeButton : {}),
              }}
            >
              全部
            </button>
            <button
              onClick={() => changeFilter("active")}
              style={{
                ...theme.button,
                ...(filter === "active" ? theme.activeButton : {}),
              }}
            >
              未完成
            </button>
            <button
              onClick={() => changeFilter("completed")}
              style={{
                ...theme.button,
                ...(filter === "completed" ? theme.activeButton : {}),
              }}
            >
              已完成
            </button>
          </div>

          <div>
            <span style={{ marginRight: "0.5rem", color: theme.secondaryText }}>
              排序:
            </span>
            <button
              onClick={() => changeSort("createdAt")}
              style={{
                ...theme.button,
                ...(sort === "createdAt" ? theme.activeButton : {}),
              }}
            >
              创建时间
            </button>
            <button
              onClick={() => changeSort("dueDate")}
              style={{
                ...theme.button,
                ...(sort === "dueDate" ? theme.activeButton : {}),
              }}
            >
              截止日期
            </button>
            <button
              onClick={() => changeSort("priority")}
              style={{
                ...theme.button,
                ...(sort === "priority" ? theme.activeButton : {}),
              }}
            >
              优先级
            </button>
            <button onClick={toggleSortDirection} style={theme.button}>
              {sortDirection === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      <div
        style={{
          ...theme.panel,
          marginBottom: "1.5rem",
        }}
      >
        <h2
          style={{
            color: theme.secondaryText,
            margin: "1rem",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>任务列表 ({filteredAndSortedTasks.length})</span>
          <span style={{ fontSize: "0.8rem", fontWeight: "normal" }}>
            最后更新:{" "}
            {new Date(
              taskManagerEcho.use((s) => s.lastUpdated)
            ).toLocaleString()}
          </span>
        </h2>

        {filteredAndSortedTasks.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: theme.secondaryText,
            }}
          >
            没有找到任务。
          </div>
        ) : (
          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            {filteredAndSortedTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  ...theme.taskItem,
                  borderLeft: `4px solid ${getPriorityColor(
                    task.priority,
                    theme
                  )}`,
                  opacity: task.completed ? 0.7 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTaskCompletion(task.id)}
                    style={{ marginRight: "1rem" }}
                  />
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        margin: "0 0 0.5rem 0",
                        color: theme.primaryText,
                        textDecoration: task.completed
                          ? "line-through"
                          : "none",
                      }}
                    >
                      {task.title}
                    </h3>
                    <p
                      style={{
                        margin: "0 0 0.5rem 0",
                        color: theme.secondaryText,
                        fontSize: "0.9rem",
                      }}
                    >
                      {task.description}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            background: theme.tagBackground,
                            color: theme.tagText,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.8rem",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "0.5rem",
                    }}
                  >
                    <button
                      onClick={() => deleteTask(task.id)}
                      style={theme.iconButton}
                    >
                      ❌
                    </button>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: theme.secondaryText,
                      }}
                    >
                      {task.dueDate && (
                        <div>
                          截止: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      <div>
                        创建: {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加新标签 */}
      <div
        style={{
          ...theme.panel,
          padding: "1rem",
        }}
      >
        <h2 style={{ color: theme.secondaryText, marginBottom: "1rem" }}>
          管理标签
        </h2>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                background: theme.tagBackground,
                color: theme.tagText,
                padding: "0.3rem 0.7rem",
                borderRadius: "0.25rem",
                fontSize: "0.9rem",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            id="newTag"
            style={{
              ...theme.input,
              flex: 1,
            }}
            placeholder="新标签名称"
          />
          <button
            onClick={() => {
              const input = document.getElementById(
                "newTag"
              ) as HTMLInputElement;
              addTag(input.value);
              input.value = "";
            }}
            style={theme.primaryButton}
          >
            添加标签
          </button>
        </div>
      </div>

      {/* 底部信息 */}
      <div
        style={{
          textAlign: "center",
          marginTop: "2rem",
          color: theme.secondaryText,
          fontSize: "0.9rem",
        }}
      >
        <p>使用 Echo 状态管理库构建 | IndexedDB 存储演示</p>
        <p>
          <small>
            此示例展示了 Echo 的 IndexedDB 功能和新的 use() 方法实现， 它会在
            IndexedDB 加载完成后自动更新组件。
          </small>
        </p>
      </div>
    </div>
  );
}

// 获取优先级颜色
function getPriorityColor(priority: string, theme: any) {
  switch (priority) {
    case "high":
      return theme.highPriorityColor;
    case "medium":
      return theme.mediumPriorityColor;
    case "low":
      return theme.lowPriorityColor;
    default:
      return theme.mediumPriorityColor;
  }
}

// 浅色主题
const lightTheme = {
  container: {
    background: "#f9fafb",
    color: "#1f2937",
  },
  panel: {
    background: "#ffffff",
    borderRadius: "0.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  primaryText: "#1f2937",
  secondaryText: "#4b5563",
  input: {
    padding: "0.5rem",
    border: "1px solid #d1d5db",
    borderRadius: "0.375rem",
    background: "#ffffff",
  },
  button: {
    padding: "0.4rem 0.8rem",
    background: "#f3f4f6",
    color: "#4b5563",
    border: "1px solid #d1d5db",
    borderRadius: "0.375rem",
    cursor: "pointer",
    margin: "0 0.25rem",
  },
  primaryButton: {
    padding: "0.5rem 1rem",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "0.375rem",
    cursor: "pointer",
  },
  dangerButton: {
    padding: "0.5rem 1rem",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "0.375rem",
    cursor: "pointer",
  },
  activeButton: {
    background: "#2563eb",
    color: "white",
    border: "1px solid #2563eb",
  },
  iconButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
  },
  taskItem: {
    padding: "1rem",
    borderBottom: "1px solid #e5e7eb",
    background: "#ffffff",
  },
  tagBackground: "#e5e7eb",
  tagText: "#4b5563",
  highPriorityColor: "#ef4444",
  mediumPriorityColor: "#f59e0b",
  lowPriorityColor: "#10b981",
};

// 深色主题
const darkTheme = {
  container: {
    background: "#111827",
    color: "#f9fafb",
  },
  panel: {
    background: "#1f2937",
    borderRadius: "0.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  },
  primaryText: "#f9fafb",
  secondaryText: "#d1d5db",
  input: {
    padding: "0.5rem",
    border: "1px solid #4b5563",
    borderRadius: "0.375rem",
    background: "#374151",
    color: "#f9fafb",
  },
  button: {
    padding: "0.4rem 0.8rem",
    background: "#374151",
    color: "#d1d5db",
    border: "1px solid #4b5563",
    borderRadius: "0.375rem",
    cursor: "pointer",
    margin: "0 0.25rem",
  },
  primaryButton: {
    padding: "0.5rem 1rem",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "0.375rem",
    cursor: "pointer",
  },
  dangerButton: {
    padding: "0.5rem 1rem",
    background: "#b91c1c",
    color: "white",
    border: "none",
    borderRadius: "0.375rem",
    cursor: "pointer",
  },
  activeButton: {
    background: "#3b82f6",
    color: "white",
    border: "1px solid #3b82f6",
  },
  iconButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    color: "#d1d5db",
  },
  taskItem: {
    padding: "1rem",
    borderBottom: "1px solid #374151",
    background: "#1f2937",
  },
  tagBackground: "#4b5563",
  tagText: "#e5e7eb",
  highPriorityColor: "#ef4444",
  mediumPriorityColor: "#f59e0b",
  lowPriorityColor: "#10b981",
};

// 使用示例
export const TaskManagerExample = () => {
  return (
    <div>
      <h1>Echo 任务管理器示例</h1>
      <p>
        这个示例展示了如何使用 Echo 状态管理库的 IndexedDB 功能。
        特别是，它展示了新的 use() 方法实现，该方法在使用 IndexedDB
        时直接返回加载后的内容。
      </p>
      <p>主要特点：</p>
      <ul>
        <li>使用 IndexedDB 进行持久化存储</li>
        <li>支持跨窗口同步</li>
        <li>任务的添加、删除和状态切换</li>
        <li>任务过滤和排序</li>
        <li>标签管理</li>
        <li>深色模式支持</li>
        <li>自动保存设置</li>
      </ul>
      <p>
        <strong>技术亮点：</strong> 新的 use() 方法实现使得组件在 IndexedDB
        数据加载完成前显示默认状态， 加载完成后自动更新为最新状态，无需使用
        React Suspense 或错误边界。
      </p>

      <TaskManager />
    </div>
  );
};
