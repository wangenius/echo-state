import React, { useState } from "react";
import { Counter } from "./counter";
import { AsyncDataTest } from "./asyncDataTest";
import { IndexedEchoTest } from "./indexedEchoTest";
import { PrimitiveEchoTest } from "./PrimitiveEchoTest";

// 主应用组件
export function App() {
  const [activeTab, setActiveTab] = useState<
    "counter" | "asyncData" | "indexedEcho" | "primitiveEcho"
  >("indexedEcho");

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
      <h1
        style={{
          textAlign: "center",
          color: "#1e40af",
          fontSize: "2rem",
          marginBottom: "2rem",
        }}
      >
        Echo 状态管理库测试
      </h1>

      {/* 标签切换 */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "2rem",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 1rem",
        }}
      >
        <button
          onClick={() => setActiveTab("counter")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${
              activeTab === "counter" ? "#2563eb" : "transparent"
            }`,
            color: activeTab === "counter" ? "#2563eb" : "#64748b",
            fontWeight: activeTab === "counter" ? "bold" : "normal",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          计数器示例
        </button>
        <button
          onClick={() => setActiveTab("asyncData")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${
              activeTab === "asyncData" ? "#2563eb" : "transparent"
            }`,
            color: activeTab === "asyncData" ? "#2563eb" : "#64748b",
            fontWeight: activeTab === "asyncData" ? "bold" : "normal",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          异步数据测试
        </button>
        <button
          onClick={() => setActiveTab("indexedEcho")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${
              activeTab === "indexedEcho" ? "#2563eb" : "transparent"
            }`,
            color: activeTab === "indexedEcho" ? "#2563eb" : "#64748b",
            fontWeight: activeTab === "indexedEcho" ? "bold" : "normal",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          IndexedEcho测试
        </button>
        <button
          onClick={() => setActiveTab("primitiveEcho")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${
              activeTab === "primitiveEcho" ? "#2563eb" : "transparent"
            }`,
            color: activeTab === "primitiveEcho" ? "#2563eb" : "#64748b",
            fontWeight: activeTab === "primitiveEcho" ? "bold" : "normal",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          原始类型测试
        </button>
      </div>

      {/* 内容区域 */}
      <div>
        {activeTab === "counter" ? (
          <Counter />
        ) : activeTab === "asyncData" ? (
          <AsyncDataTest />
        ) : activeTab === "primitiveEcho" ? (
          <PrimitiveEchoTest />
        ) : (
          <IndexedEchoTest />
        )}
      </div>

      {/* 页脚 */}
      <footer
        style={{
          marginTop: "3rem",
          textAlign: "center",
          color: "#94a3b8",
          fontSize: "0.875rem",
          padding: "1rem",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <p>Echo 状态管理库 - 轻量级、高性能的状态管理解决方案</p>
        <p>支持本地存储、跨窗口同步和 React 集成</p>
      </footer>
    </div>
  );
}
