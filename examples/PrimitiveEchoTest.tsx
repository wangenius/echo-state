import React, { useState, useEffect } from "react";
import { Echo } from "../src/core/Echo";

// 创建字符串类型的Echo实例
const stringEcho = new Echo<string>("初始字符串");

// 创建数字类型的Echo实例
const numberEcho = new Echo<number>(1000);

// 初始化存储
stringEcho.localStorage({ name: "string-echo" });
numberEcho.localStorage({ name: "number-echo" });

export function PrimitiveEchoTest() {
  // 使用useState来本地管理输入框的值
  const [stringInput, setStringInput] = useState("");
  const [numberInput, setNumberInput] = useState("");

  // 使用Echo实例的状态
  const currentString = stringEcho.use();
  const currentNumber = numberEcho.use();

  // 更新状态的处理函数
  const updateString = () => {
    if (stringInput) {
      stringEcho.set(stringInput);
      setStringInput("");
    }
  };

  const updateNumber = () => {
    if (numberInput && !isNaN(Number(numberInput))) {
      numberEcho.set(Number(numberInput));
      setNumberInput("");
    }
  };

  // 重置状态的处理函数
  const resetString = () => {
    stringEcho.reset();
  };

  const resetNumber = () => {
    numberEcho.reset();
  };

  return (
    <div>
      <h2 style={{ color: "#334155", marginBottom: "1.5rem" }}>
        原始类型的Echo测试
      </h2>

      {/* 字符串类型测试 */}
      <div
        style={{
          marginBottom: "2rem",
          padding: "1.5rem",
          backgroundColor: "#f8fafc",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ color: "#334155", marginBottom: "1rem" }}>
          字符串类型 Echo
        </h3>

        <div style={{ display: "flex", marginBottom: "1rem" }}>
          <input
            type="text"
            value={stringInput}
            onChange={(e) => setStringInput(e.target.value)}
            placeholder="输入新的字符串值"
            style={{
              padding: "0.5rem",
              border: "1px solid #cbd5e1",
              borderRadius: "0.25rem",
              flexGrow: 1,
              marginRight: "0.5rem",
            }}
          />
          <button
            onClick={updateString}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
              marginRight: "0.5rem",
            }}
          >
            更新
          </button>
          <button
            onClick={resetString}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
            }}
          >
            重置
          </button>
        </div>

        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "white",
            borderRadius: "0.25rem",
            border: "1px solid #e2e8f0",
          }}
        >
          <p style={{ margin: 0, fontWeight: "bold" }}>当前字符串值:</p>
          <p
            style={{
              margin: "0.5rem 0 0 0",
              color: "#334155",
              wordBreak: "break-all",
            }}
          >
            {currentString}
          </p>
        </div>
      </div>

      {/* 数字类型测试 */}
      <div
        style={{
          marginBottom: "2rem",
          padding: "1.5rem",
          backgroundColor: "#f8fafc",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ color: "#334155", marginBottom: "1rem" }}>
          数字类型 Echo
        </h3>

        <div style={{ display: "flex", marginBottom: "1rem" }}>
          <input
            type="number"
            value={numberInput}
            onChange={(e) => setNumberInput(e.target.value)}
            placeholder="输入新的数字值"
            style={{
              padding: "0.5rem",
              border: "1px solid #cbd5e1",
              borderRadius: "0.25rem",
              flexGrow: 1,
              marginRight: "0.5rem",
            }}
          />
          <button
            onClick={updateNumber}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
              marginRight: "0.5rem",
            }}
          >
            更新
          </button>
          <button
            onClick={resetNumber}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
            }}
          >
            重置
          </button>
        </div>

        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "white",
            borderRadius: "0.25rem",
            border: "1px solid #e2e8f0",
          }}
        >
          <p style={{ margin: 0, fontWeight: "bold" }}>当前数字值:</p>
          <p style={{ margin: "0.5rem 0 0 0", color: "#334155" }}>
            {currentNumber}
          </p>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#ecfdf5",
          padding: "1rem",
          borderRadius: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <h3 style={{ color: "#065f46", marginBottom: "0.5rem" }}>使用说明</h3>
        <ul style={{ color: "#065f46", margin: 0, paddingLeft: "1.5rem" }}>
          <li>在输入框中输入新的值，然后点击"更新"按钮来修改Echo的状态</li>
          <li>点击"重置"按钮可以将状态恢复到初始值</li>
          <li>所有状态变更都使用LocalStorage持久化，刷新页面后仍然保留</li>
        </ul>
      </div>
    </div>
  );
}
