import React, { useState } from "react";
import { EchoManager } from "../src/core/EchoManager";
import { Echo } from "../src/core/Echo";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

// 创建 Echo 实例并配置为 IndexedDB 模式
const echo = new Echo<TodoItem | null>(null).indexed({
  name: "todos",
  database: "todo-database",
});

export function EchoStoreTest() {
  const [newTodo, setNewTodo] = useState("");
  // 使用 Echo 实例获取当前编辑的待办事项
  const currentTodo = echo.use();
  // 使用 EchoManager 获取所有待办事项
  const todos = EchoManager.use<TodoItem>("todo-database");
  const completedCount = todos.filter((todo) => todo.completed).length;

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    const todo: TodoItem = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false,
    };
    // 使用 Echo 存储新的待办事项，使用 todo.id 作为 name
    
     echo.switch(todo.id).set(todo);
    setNewTodo("");
  };

  const toggleTodo = async (todo: TodoItem) => {
    // 直接使用 ready 方法更新状态
    echo.ready({ ...todo, completed: !todo.completed }, { replace: true });
  };

  const deleteTodo = async (id: string) => {
    // 使用 Echo 删除待办事项，使用 id 作为 name
  const echoItem = new Echo<TodoItem | null>(null).indexed({
    name: id,
    database: "todo-database",
  });
  echoItem.discard();
  };

  const selectTodo = async (todo: TodoItem) => {
    // 使用 Echo 切换到选中的待办事项，使用 todo.id 作为 name
     echo.switch(todo.id);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ color: "#1e40af", marginBottom: "1.5rem" }}>Echo + EchoManager 待办事项示例</h2>
      
      {/* 添加待办事项 */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="输入新的待办事项"
          style={{
            flex: 1,
            padding: "0.5rem",
            border: "1px solid #e2e8f0",
            borderRadius: "0.375rem",
            fontSize: "1rem",
          }}
          onKeyPress={(e) => e.key === "Enter" && addTodo()}
        />
        <button
          onClick={addTodo}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          添加
        </button>
      </div>

      {/* 统计信息 */}
      <div style={{ marginBottom: "1rem", color: "#64748b" }}>
        已完成: {completedCount} / {todos.length}
      </div>

      {/* 待办事项列表 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {todos.map((todo) => (
          <div
            key={todo.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem",
              backgroundColor: currentTodo?.id === todo.id ? "#f0f9ff" : "white",
              border: "1px solid #e2e8f0",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
            onClick={() => selectTodo(todo)}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo)}
              style={{ width: "1.25rem", height: "1.25rem" }}
              onClick={(e) => e.stopPropagation()}
            />
            <span
              style={{
                flex: 1,
                textDecoration: todo.completed ? "line-through" : "none",
                color: todo.completed ? "#94a3b8" : "#1e293b",
              }}
            >
              {todo.text}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteTodo(todo.id);
              }}
              style={{
                padding: "0.25rem 0.5rem",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "0.25rem",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              删除
            </button>
          </div>
        ))}
      </div>

      {/* 显示当前编辑项 */}
      {currentTodo && (
        <div key={currentTodo.id} style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#f0f9ff", borderRadius: "0.375rem" }}>
          <h3 style={{ color: "#1e40af", marginBottom: "0.5rem" }}>当前编辑项</h3>
          <p>ID: {currentTodo.id}</p>
          <p>内容: <input type="text" defaultValue={currentTodo.text} onChange={(e) => echo.set({ text: e.target.value })} /></p>
          <p>状态: <input type="checkbox" defaultChecked={currentTodo.completed} onChange={(e) => echo.set({ completed: e.target.checked })} /></p>
        </div>
      )}
    </div>
  );
} 