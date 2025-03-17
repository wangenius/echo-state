import React, { useEffect, useState } from "react";
import { Echo } from "../src/core/Echo";

// 定义一个包含异步加载数据的状态
interface AsyncDataState {
  users: {
    id: number;
    name: string;
    email: string;
  }[];
  loading: boolean;
  lastFetched: string | null;
  filter: string;
}

// 创建Echo实例，使用IndexedDB存储
const asyncDataEcho = new Echo<AsyncDataState>({
  users: [],
  loading: false,
  lastFetched: null,
  filter: "",
}).indexed({
  name: "async-data-test",
  sync: true,
});

// 模拟API调用
const fetchUsers = async () => {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 模拟API响应
  return Array.from({ length: 10000 }, (_, i) => ({
    id: i + 1,
    name: `用户${i + 1}`,
    email: `user${i + 1}@example.com`,
  }));
};

// 异步数据测试组件
export function AsyncDataTest() {
  // 使用Echo的use方法获取状态
  const users = asyncDataEcho.use((state) => state.users);
  const loading = asyncDataEcho.use((state) => state.loading);
  const lastFetched = asyncDataEcho.use((state) => state.lastFetched);
  const filter = asyncDataEcho.use((state) => state.filter);

  // 本地状态，用于跟踪组件渲染次数
  const [renderCount, setRenderCount] = useState(0);

  // 每次渲染时增加计数
  useEffect(() => {
    setRenderCount((prev) => prev + 1);
  }, []);

  // 加载数据
  const loadData = async () => {
    // 设置加载状态
    asyncDataEcho.set({ loading: true });

    try {
      // 获取数据
      const data = await fetchUsers();

      // 更新状态
      asyncDataEcho.set({
        users: data,
        loading: false,
        lastFetched: new Date().toISOString(),
      });
    } catch (error) {
      console.error("加载数据失败:", error);
      asyncDataEcho.set({ loading: false });
    }
  };

  // 过滤用户
  const filteredUsers = users.filter(
    (user) => user.name.includes(filter) || user.email.includes(filter)
  );

  // 清除数据
  const clearData = () => {
    asyncDataEcho.set({
      users: [],
      lastFetched: null,
    });
  };

  // 设置过滤器
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    asyncDataEcho.set({ filter: e.target.value });
  };

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h2
        style={{
          fontSize: "1.8rem",
          color: "#2563eb",
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        异步数据加载测试
      </h2>

      {/* 渲染计数和状态信息 */}
      <div
        style={{
          background: "#f8fafc",
          padding: "1rem",
          borderRadius: "0.5rem",
          marginBottom: "1.5rem",
          fontSize: "0.875rem",
          color: "#64748b",
        }}
      >
        <p>
          组件渲染次数: <strong>{renderCount}</strong>
        </p>
        <p>
          IndexedDB 状态:{" "}
          <strong>{users.length > 0 ? "已加载数据" : "无数据"}</strong>
        </p>
        <p>
          最后获取时间:{" "}
          <strong>
            {lastFetched ? new Date(lastFetched).toLocaleString() : "从未"}
          </strong>
        </p>
      </div>

      {/* 控制面板 */}
      <div
        style={{
          background: "#f1f5f9",
          padding: "1.5rem",
          borderRadius: "0.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "center",
          }}
        >
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              padding: "0.5rem 1rem",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "加载中..." : "加载数据"}
          </button>
          <button
            onClick={clearData}
            disabled={loading || users.length === 0}
            style={{
              padding: "0.5rem 1rem",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: loading || users.length === 0 ? "not-allowed" : "pointer",
              opacity: loading || users.length === 0 ? 0.7 : 1,
            }}
          >
            清除数据
          </button>
        </div>

        <div>
          <input
            type="text"
            placeholder="过滤用户..."
            value={filter}
            onChange={handleFilterChange}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
            }}
          />
        </div>
      </div>

      {/* 用户列表 */}
      <div
        style={{
          background: "#f8fafc",
          padding: "1.5rem",
          borderRadius: "0.5rem",
        }}
      >
        <h3 style={{ marginBottom: "1rem", color: "#334155" }}>用户列表</h3>

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>加载中...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: "0.75rem",
            }}
          >
            {filteredUsers.map((user) => (
              <li
                key={user.id}
                style={{
                  padding: "1rem",
                  background: "white",
                  borderRadius: "0.375rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <h4 style={{ margin: "0 0 0.5rem 0", color: "#1e40af" }}>
                  {user.name}
                </h4>
                <p style={{ margin: 0, color: "#64748b" }}>{user.email}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div
            style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}
          >
            <p>
              {users.length === 0
                ? '暂无数据，请点击"加载数据"按钮'
                : "没有匹配的用户"}
            </p>
          </div>
        )}
      </div>

      {/* 功能说明 */}
      <div
        style={{
          background: "#f8fafc",
          padding: "1.5rem",
          borderRadius: "0.5rem",
          marginTop: "1.5rem",
        }}
      >
        <h3 style={{ marginBottom: "1rem", color: "#334155" }}>测试说明</h3>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {[
            "测试IndexedDB异步加载 - 验证use方法的改进",
            "初始渲染 - 显示默认状态而不是加载状态",
            "数据持久化 - 刷新页面后数据保留",
            "跨窗口同步 - 在新标签页打开可以看到相同数据",
            "状态更新 - 加载和过滤操作正确更新UI",
          ].map((item, index) => (
            <li
              key={index}
              style={{
                padding: "0.5rem 0",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#2563eb",
                  display: "inline-block",
                }}
              ></span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// 在组件外部使用示例
export const testAsyncDataOutsideComponent = async () => {
  // 等待初始化完成
  await asyncDataEcho.ready();

  // 获取当前状态
  const currentState = await asyncDataEcho.getCurrent();
  console.log("当前状态:", currentState);

  // 设置加载状态
  asyncDataEcho.set({ loading: true });

  // 模拟异步操作
  const users = await fetchUsers();

  // 更新状态
  asyncDataEcho.set({
    users,
    loading: false,
    lastFetched: new Date().toISOString(),
  });

  // 订阅状态变化
  const unsubscribe = asyncDataEcho.subscribe((state) => {
    console.log("状态已更新:", state);
  });

  // 稍后取消订阅
  setTimeout(() => {
    unsubscribe();
  }, 5000);
};
