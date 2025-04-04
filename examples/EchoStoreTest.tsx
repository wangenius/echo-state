import React, { useState } from "react";
import { EchoStore } from "../src/core/EchoStore";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

const store = new EchoStore<TodoItem>("todo-database", "todos");

export function EchoStoreTest() {
  const [newTodo, setNewTodo] = useState("");
  const todos = store.use();
  const completedCount = store.use((data) => data.filter((todo) => todo.completed).length);

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
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ color: "#1e40af", marginBottom: "1.5rem" }}>EchoStore 待办事项示例</h2>
      
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
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "0.375rem",
            }}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo)}
              style={{ width: "1.25rem", height: "1.25rem" }}
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
              onClick={() => deleteTodo(todo.id)}
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
    </div>
  );
} 