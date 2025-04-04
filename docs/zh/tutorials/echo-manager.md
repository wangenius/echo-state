# EchoManager 教程

EchoManager 是 Echo 框架中用于管理数据订阅和通知的核心组件。本教程将帮助你理解如何使用 EchoManager 来管理数据状态和实现跨窗口同步。

## 基础概念

### 什么是 EchoManager？

EchoManager 是一个静态类，提供了以下核心功能：
- 数据订阅和通知机制
- 跨窗口数据同步
- React Hooks 集成
- 高效的数据缓存

### 核心组件

1. **监听器系统**
```typescript
// 创建监听器
const unsubscribe = EchoManager.subscribe("my-db", "my-store", (data) => {
  console.log("数据更新:", data);
});
```

2. **通知系统**
```typescript
// 发送通知
EchoManager.notify("my-db", "my-store", newData);
```

3. **React Hooks**
```typescript
// 在组件中使用
function MyComponent() {
  const data = EchoManager.use("my-db", "my-store");
  return <div>{/* 渲染数据 */}</div>;
}
```

## 使用场景

### 1. 基础数据订阅

```typescript
// 创建数据订阅
const echo = new Echo({ count: 0 })
  .indexed({ name: "counter", database: "my-app" });

// 订阅数据变化
EchoManager.subscribe("my-app", "counter", (data) => {
  console.log("计数器更新:", data);
});

// 更新数据
echo.set({ count: 1 });
```

### 2. React 组件集成

```typescript
function Counter() {
  // 使用 Hook 订阅数据
  const count = EchoManager.use(
    "my-app",
    "counter",
    (data) => data[0]?.count || 0
  );

  return (
    <div>
      <p>当前计数: {count}</p>
      <button onClick={() => echo.set({ count: count + 1 })}>
        增加
      </button>
    </div>
  );
}
```

### 3. 跨窗口同步

```typescript
// 窗口 A
const echo = new Echo({ theme: "light" })
  .indexed({ name: "settings", database: "my-app", sync: true });

// 窗口 B
function ThemeSwitcher() {
  const theme = EchoManager.use(
    "my-app",
    "settings",
    (data) => data[0]?.theme || "light"
  );

  return (
    <button onClick={() => echo.set({ theme: "dark" })}>
      切换主题
    </button>
  );
}
```

## 高级用法

### 1. 使用选择器优化性能

```typescript
function UserList() {
  // 只订阅活跃用户
  const activeUsers = EchoManager.use(
    "my-app",
    "users",
    (data) => data.filter(user => user.active)
  );

  return (
    <ul>
      {activeUsers.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 2. 多对象仓库管理

```typescript
function Dashboard() {
  // 订阅不同类型的数据
  const users = EchoManager.use("my-app", "users");
  const settings = EchoManager.use("my-app", "settings");
  const analytics = EchoManager.use("my-app", "analytics");

  return (
    <div>
      <UserList users={users} />
      <SettingsPanel settings={settings} />
      <AnalyticsChart data={analytics} />
    </div>
  );
}
```

### 3. 自定义数据转换

```typescript
function Statistics() {
  // 使用选择器进行数据转换
  const stats = EchoManager.use(
    "my-app",
    "analytics",
    (data) => ({
      total: data.length,
      active: data.filter(item => item.active).length,
      average: data.reduce((sum, item) => sum + item.value, 0) / data.length
    })
  );

  return (
    <div>
      <p>总数: {stats.total}</p>
      <p>活跃: {stats.active}</p>
      <p>平均值: {stats.average}</p>
    </div>
  );
}
```

## 性能优化

### 1. 合理使用选择器

```typescript
// 不推荐：订阅所有数据
const allData = EchoManager.use("my-app", "users");

// 推荐：只订阅需要的数据
const activeUsers = EchoManager.use(
  "my-app",
  "users",
  (data) => data.filter(user => user.active)
);
```

### 2. 及时取消订阅

```typescript
function DataMonitor() {
  useEffect(() => {
    const unsubscribe = EchoManager.subscribe(
      "my-app",
      "monitor",
      handleDataChange
    );
    return () => unsubscribe();
  }, []);
}
```

### 3. 使用对象仓库分离数据

```typescript
// 按功能分离数据
const userStore = new Echo({})
  .indexed({ name: "users", database: "my-app" });

const settingsStore = new Echo({})
  .indexed({ name: "settings", database: "my-app" });
```

## 常见问题

### 1. 数据更新不及时

确保在数据更新后调用 `notify`：

```typescript
async function updateData() {
  await echo.set(newData);
  EchoManager.notify("my-app", "my-store", newData);
}
```

### 2. 内存泄漏

记得在组件卸载时取消订阅：

```typescript
useEffect(() => {
  const unsubscribe = EchoManager.subscribe(
    "my-app",
    "my-store",
    handleDataChange
  );
  return () => unsubscribe();
}, []);
```

### 3. 性能问题

使用选择器优化数据订阅：

```typescript
// 优化前
const allData = EchoManager.use("my-app", "users");

// 优化后
const filteredData = EchoManager.use(
  "my-app",
  "users",
  (data) => data.filter(user => user.active)
);
```

## 最佳实践

1. **合理组织数据**
   - 按功能分离对象仓库
   - 使用有意义的数据结构
   - 避免过深的数据嵌套

2. **优化性能**
   - 使用选择器过滤数据
   - 及时取消不需要的订阅
   - 避免频繁的数据更新

3. **错误处理**
   - 添加适当的错误处理
   - 提供默认值
   - 记录关键操作日志

4. **代码组织**
   - 将数据逻辑封装在自定义 hooks 中
   - 使用 TypeScript 类型定义
   - 保持代码结构清晰 