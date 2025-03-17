---
title: 开始
order: 1
---

# Echo 状态管理库

Echo 是一个轻量级的状态管理库，专为 React 应用设计，支持多种存储模式和丰富的状态管理功能。

## 特性

- 支持多种存储模式（临时、LocalStorage、IndexedDB）
- 支持跨窗口状态同步
- 内置 React Hooks 集成
- 支持状态订阅
- 支持选择器

## 安装

```bash
npm install echo-state
```

## 基础用法

### 创建状态

```typescript
import { Echo } from "echo-state";

// 创建一个Echo实例
const userStore = new Echo({
  name: "",
  age: 0,
  isLoggedIn: false,
});
```

### 读取状态

```typescript
// 获取当前状态
const currentState = userStore.current;
console.log(currentState.name);

// 异步获取状态（推荐，特别是在使用持久化存储时）
userStore.getCurrent().then((state) => {
  console.log(state.name);
});

// 等待初始化完成
userStore.ready().then(() => {
  console.log(userStore.current);
});
```

### 更新状态

```typescript
// 部分更新
userStore.set({ name: "张三" });

// 使用函数更新（可以基于当前状态计算新状态）
userStore.set((state) => ({
  age: state.age + 1,
}));

// 完全替换状态
userStore.set({ name: "李四", age: 30, isLoggedIn: true }, { replace: true });
```

### 删除状态属性

```typescript
userStore.delete("age");
```

### 重置状态

```typescript
userStore.reset();
```

## 存储模式

Echo 支持三种存储模式：临时存储、LocalStorage 和 IndexedDB。

### 临时存储（默认）

```typescript
// 默认为临时存储，或者显式指定
userStore.temporary();
```

### LocalStorage 存储

```typescript
userStore.localStorage({
  name: "user-store", // 存储键名
  sync: true, // 是否跨窗口同步
});
```

### IndexedDB 存储

```typescript
userStore.indexed({
  name: "user-store", // 存储键名
  database: "user-database", // 数据库名称
  object: "userData", // 对象仓库名称，默认是 'echo-state'
  sync: true, // 是否跨窗口同步
});
```

## 在 React 中使用

Echo 提供了内置的 React Hook 支持。

### 基本用法

```tsx
import React from "react";
import { Echo } from "echo-state";

const counterStore = new Echo({ count: 0 });

function Counter() {
  // 使用Echo的use hook获取状态
  const state = counterStore.use();

  return (
    <div>
      <p>当前计数: {state.count}</p>
      <button onClick={() => counterStore.set((s) => ({ count: s.count + 1 }))}>
        增加
      </button>
    </div>
  );
}
```

### 使用选择器

```tsx
function CounterDisplay() {
  // 只订阅count属性的变化
  const count = counterStore.use((state) => state.count);

  return <p>当前计数: {count}</p>;
}
```

## 状态订阅

您可以直接订阅状态变化，而不使用 React Hook。

```typescript
// 添加监听器
const unsubscribe = userStore.subscribe((state) => {
  console.log("状态已更新:", state);
});

// 移除监听器
unsubscribe();

// 或者使用显式的添加/移除方法
const listener = (state) => console.log("状态已更新:", state);
userStore.addListener(listener);
userStore.removeListener(listener);
```

## 其他文档

- [高级用法](./echo-advanced.md) - 了解更多高级功能，如资源清理、切换存储键名等
- [API 参考](../api/echo.md) - 完整的 API 参考文档
- [最佳实践](./echo-best-practices.md) - Echo 使用的最佳实践和模式
- [示例项目](./echo-examples.md) - 完整的示例项目和用例
- [常见问题](./echo-faq.md) - 常见问题解答
- [支持的数据类型](./echo-data-types.md) - Echo 支持的数据类型和存储限制
