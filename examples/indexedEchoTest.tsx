import React, { useState } from "react";
import { Echo } from "../src/core/Echo";

// 创建一个 Echo 实例
const echo = new Echo({
  count: 0,
  text: "默认文本",
  items: [] as string[],
}).indexed({
  name: "test-db",
  sync: true,
});

export function IndexedEchoTest() {
  const state = echo.use();
  const [dbName, setDbName] = useState("test-db");
  const [newDbName, setNewDbName] = useState("");
  const [newStoreName, setNewStoreName] = useState("");
  const [newItem, setNewItem] = useState("");

  // 切换数据库
  const handleSwitchDB = async () => {
    if (newDbName) {
      // 直接使用 indexed 方法切换数据库
      echo.indexed({
        name: newDbName,
        sync: true,
      });

      // 等待数据库初始化完成
      await echo.ready();

      setDbName(newDbName);
      setNewDbName("");
    }
  };

  // 更新计数
  const handleIncrement = () => {
    echo.set((state) => ({ count: state.count + 1 }));
  };

  // 重置状态
  const handleReset = () => {
    echo.reset();
  };

  const inputStyle = {
    padding: "0.5rem",
    border: "1px solid #e2e8f0",
    borderRadius: "0.25rem",
    marginRight: "0.5rem",
    outline: "none",
    width: "200px",
  };

  const buttonStyle = {
    padding: "0.5rem 1rem",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "0.25rem",
    cursor: "pointer",
    marginRight: "0.5rem",
  };

  const sectionStyle = {
    marginBottom: "2rem",
    padding: "1.5rem",
    backgroundColor: "#f8fafc",
    borderRadius: "0.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <div style={sectionStyle}>
        <h2 style={{ color: "#1e40af", marginBottom: "1rem" }}>数据库信息</h2>
        <div style={{ marginBottom: "1rem" }}>
          <p>当前数据库：{dbName}</p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "0.5rem",
            }}
          >
            <input
              type="text"
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
              placeholder="输入新的数据库名称"
              style={inputStyle}
            />
            <button onClick={handleSwitchDB} style={buttonStyle}>
              切换数据库
            </button>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={{ color: "#1e40af", marginBottom: "1rem" }}>状态操作</h2>
        <div style={{ marginBottom: "1.5rem" }}>
          <p>计数：{state.count}</p>
          <button onClick={handleIncrement} style={buttonStyle}>
            增加计数
          </button>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <p>文本：{state.text}</p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "0.5rem",
            }}
          >
            <input
              type="text"
              value={state.text}
              onChange={(e) => {
                echo.set({ text: e.target.value });
              }}
              placeholder="输入新的文本"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <p>项目列表：</p>
          <ul
            style={{
              marginBottom: "0.5rem",
              listStyleType: "disc",
              paddingLeft: "1.5rem",
            }}
          >
            {state.items.map((item, index) => (
              <li key={index} style={{ marginBottom: "0.25rem" }}>
                {item}
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newItem) {
                  echo.set((state) => ({
                    items: [...state.items, newItem],
                  }));
                  setNewItem("");
                }
              }}
              placeholder="输入新的项目并按回车"
              style={inputStyle}
            />
            <button
              onClick={() => {
                if (newItem) {
                  echo.set((state) => ({
                    items: [...state.items, newItem],
                  }));
                  setNewItem("");
                }
              }}
              style={buttonStyle}
            >
              添加项目
            </button>
          </div>
        </div>

        <button
          onClick={handleReset}
          style={{
            ...buttonStyle,
            backgroundColor: "#ef4444",
          }}
        >
          重置状态
        </button>
      </div>

      <div style={sectionStyle}>
        <h2 style={{ color: "#1e40af", marginBottom: "1rem" }}>说明</h2>
        <ul
          style={{
            color: "#475569",
            lineHeight: "1.6",
            paddingLeft: "1.5rem",
            listStyleType: "disc",
          }}
        >
          <li>所有状态变更都会自动保存到 IndexedDB</li>
          <li>切换数据库或存储空间后，会加载对应空间的数据</li>
          <li>如果打开多个窗口，状态会自动同步</li>
          <li>刷新页面后，状态会自动恢复</li>
        </ul>
      </div>
    </div>
  );
}
