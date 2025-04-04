import React, { useState } from "react";
import { Counter } from "./counter";
import { AsyncDataTest } from "./asyncDataTest";
import { IndexedEchoTest } from "./indexedEchoTest";
import { PrimitiveEchoTest } from "./PrimitiveEchoTest";
import { EchoStoreTest } from "./EchoStoreTest";
import { Echo } from "../src/core/Echo";

const echo = new Echo<"counter" | "asyncData" | "indexedEcho" | "primitiveEcho" | "echoStore">("counter").localStorage({
  name: "tab",
});
// 主应用组件
export function App() {
  const tab = echo.use();

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
          onClick={() => echo.set("counter")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${
              tab === "counter" ? "#2563eb" : "transparent"
            }`,
            color: tab === "counter" ? "#2563eb" : "#64748b",
            fontWeight: tab === "counter" ? "bold" : "normal",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          计数器示例
        </button>
        <button
          onClick={() => echo.set("asyncData")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${
              tab === "asyncData" ? "#2563eb" : "transparent"
            }`,
            color: tab === "asyncData" ? "#2563eb" : "#64748b",
            fontWeight: tab === "asyncData" ? "bold" : "normal",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          异步数据测试
        </button>
        <button
          onClick={() => echo.set("indexedEcho")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${
              tab === "indexedEcho" ? "#2563eb" : "transparent"
            }`,
            color: tab === "indexedEcho" ? "#2563eb" : "#64748b",
            fontWeight: tab === "indexedEcho" ? "bold" : "normal",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          IndexedEcho测试
        </button>
        <button
          onClick={() => echo.set("primitiveEcho")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${
              tab === "primitiveEcho" ? "#2563eb" : "transparent"
            }`,
            color: tab === "primitiveEcho" ? "#2563eb" : "#64748b",
            fontWeight: tab === "primitiveEcho" ? "bold" : "normal",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          原始类型测试
        </button>
        <button
          onClick={() => echo.set("echoStore")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${
              tab === "echoStore" ? "#2563eb" : "transparent"
            }`,
            color: tab === "echoStore" ? "#2563eb" : "#64748b",
            fontWeight: tab === "echoStore" ? "bold" : "normal",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          EchoStore测试
        </button>
      </div>

      {/* 内容区域 */}
      <div>
        {tab === "counter" ? (
          <Counter />
        ) : tab === "asyncData" ? (
          <AsyncDataTest />
        ) : tab === "primitiveEcho" ? (
          <PrimitiveEchoTest />
        ) : tab === "echoStore" ? (
          <EchoStoreTest />
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
