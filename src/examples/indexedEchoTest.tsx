import React, { useState } from "react";
import { IDBE } from "../IDBE";

// 创建一个 IDBE 实例
const echo = new IDBE(
  {
    count: 0,
    text: "默认文本",
    items: [] as string[],
  },
  {
    database: "test-db",
    object: "test-store",
    sync: true,
  }
);

export function IndexedEchoTest() {
  const state = echo.use();
  const [dbName, setDbName] = useState("test-db");
  const [storeName, setStoreName] = useState("test-store");

  // 切换数据库
  const handleSwitchDB = async () => {
    const newName = prompt("请输入新的数据库名称：", dbName);
    if (newName) {
      await echo.switchDB(newName);
      setDbName(newName);
    }
  };

  // 切换对象存储
  const handleSwitchStore = async () => {
    const newName = prompt("请输入新的存储空间名称：", storeName);
    if (newName) {
      await echo.switchObject(newName);
      setStoreName(newName);
    }
  };

  // 更新计数
  const handleIncrement = () => {
    echo.set((state) => ({ count: state.count + 1 }));
  };

  // 更新文本
  const handleUpdateText = () => {
    const newText = prompt("请输入新的文本：", state.text);
    if (newText) {
      echo.set({ text: newText });
    }
  };

  // 添加项目
  const handleAddItem = () => {
    const newItem = prompt("请输入新的项目：");
    if (newItem) {
      echo.set((state) => ({
        items: [...state.items, newItem],
      }));
    }
  };

  // 重置状态
  const handleReset = () => {
    echo.reset();
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "#1e40af", marginBottom: "1rem" }}>数据库信息</h2>
        <p>当前数据库：{dbName}</p>
        <p>当前存储空间：{storeName}</p>
        <div style={{ marginTop: "1rem" }}>
          <button
            onClick={handleSwitchDB}
            style={{
              marginRight: "1rem",
              padding: "0.5rem 1rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
            }}
          >
            切换数据库
          </button>
          <button
            onClick={handleSwitchStore}
            style={{
              padding: "0.5rem 1rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
            }}
          >
            切换存储空间
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "#1e40af", marginBottom: "1rem" }}>状态操作</h2>
        <div style={{ marginBottom: "1rem" }}>
          <p>计数：{state.count}</p>
          <button
            onClick={handleIncrement}
            style={{
              padding: "0.5rem 1rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
            }}
          >
            增加计数
          </button>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <p>文本：{state.text}</p>
          <button
            onClick={handleUpdateText}
            style={{
              padding: "0.5rem 1rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
            }}
          >
            更新文本
          </button>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <p>项目列表：</p>
          <ul style={{ marginBottom: "0.5rem" }}>
            {state.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <button
            onClick={handleAddItem}
            style={{
              padding: "0.5rem 1rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
            }}
          >
            添加项目
          </button>
        </div>

        <button
          onClick={handleReset}
          style={{
            padding: "0.5rem 1rem",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "0.25rem",
            cursor: "pointer",
          }}
        >
          重置状态
        </button>
      </div>

      <div>
        <h2 style={{ color: "#1e40af", marginBottom: "1rem" }}>说明</h2>
        <ul style={{ color: "#475569", lineHeight: "1.6" }}>
          <li>所有状态变更都会自动保存到 IndexedDB</li>
          <li>切换数据库或存储空间后，会加载对应空间的数据</li>
          <li>如果打开多个窗口，状态会自动同步</li>
          <li>刷新页面后，状态会自动恢复</li>
        </ul>
      </div>
    </div>
  );
}
