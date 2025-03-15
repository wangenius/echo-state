import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Counter } from "./counter";
import { TaskManagerExample } from "./taskManager";

// 示例选择器组件
const ExampleSelector = () => {
  const [example, setExample] = useState<"counter" | "taskManager">(
    "taskManager"
  );

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "1rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <button
          onClick={() => setExample("counter")}
          style={{
            padding: "0.5rem 1rem",
            background: example === "counter" ? "#2563eb" : "#e5e7eb",
            color: example === "counter" ? "white" : "#1f2937",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
            fontWeight: example === "counter" ? "bold" : "normal",
          }}
        >
          计数器示例
        </button>
        <button
          onClick={() => setExample("taskManager")}
          style={{
            padding: "0.5rem 1rem",
            background: example === "taskManager" ? "#2563eb" : "#e5e7eb",
            color: example === "taskManager" ? "white" : "#1f2937",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
            fontWeight: example === "taskManager" ? "bold" : "normal",
          }}
        >
          任务管理器示例 (IndexedDB)
        </button>
      </div>

      {example === "counter" ? <Counter /> : <TaskManagerExample />}
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<ExampleSelector />);
}
