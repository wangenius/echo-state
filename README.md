# echo-state

一个轻量级的状态管理库，支持本地存储、跨窗口同步和 React 集成。

## 特性

- 🚀 轻量级，易于使用
- 💾 支持多种存储方式 (localStorage/indexedDB)
- 🔄 支持状态变更订阅
- 📦 完整的 TypeScript 支持
- 🎯 支持选择性状态订阅
- 🔄 支持跨窗口状态同步
- ⚛️ 原生支持 React Hooks

## 安装

```bash
npm install echo-state
```

## 快速开始

### 基础使用

```typescript
import { Echo } from "echo-state";

// 定义状态类型
interface CounterState {
  count: number;
}

// 创建状态实例
const counter = new Echo<CounterState>(
  { count: 0 }, // 初始状态
  { name: "counter" } // 配置选项
);

// 更新状态
counter.set({ count: 1 });

// 使用函数更新状态
counter.set((state) => ({ count: state.count + 1 }));

// 获取当前状态
console.log(counter.current); // { count: 2 }
```

### 在 React 中使用

```typescript
function Counter() {
  // 使用完整状态
  const state = counter.use();

  // 或者只订阅部分状态
  const count = counter.use((state) => state.count);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => counter.set((s) => ({ count: s.count + 1 }))}>
        增加
      </button>
    </div>
  );
}
```

### 复杂状态示例

```typescript
interface UserState {
  profile: {
    name: string;
    age: number;
  };
  preferences: {
    theme: "light" | "dark";
    language: string;
  };
  notifications: {
    enabled: boolean;
    items: Array<{ id: string; message: string }>;
  };
}

const userStore = new Echo<UserState>(
  {
    profile: { name: "", age: 0 },
    preferences: { theme: "light", language: "zh" },
    notifications: { enabled: true, items: [] },
  },
  {
    name: "userStore",
    storage: "indexedDB",
    sync: true,
    onChange: (state) => {
      console.log("用户状态更新:", state);
    },
  }
);

// 在组件中选择性使用状态
function UserProfile() {
  const name = userStore.use((state) => state.profile.name);
  const theme = userStore.use((state) => state.preferences.theme);

  return (
    <div>
      <h1>Welcome, {name}</h1>
      <p>Current theme: {theme}</p>
    </div>
  );
}
```

## 高级用法

### 状态持久化

Echo 支持两种存储方式，可以根据需求选择：

```typescript
// 使用 LocalStorage (默认)
const localStore = new Echo(defaultState, {
  name: "myStore",
  storage: "localStorage",
});

// 使用 IndexedDB
const dbStore = new Echo(defaultState, {
  name: "myStore",
  storage: "indexedDB",
});
```

### 跨窗口同步

启用跨窗口同步后，状态会在不同标签页之间自动同步：

```typescript
const syncedStore = new Echo(defaultState, {
  name: "syncedStore",
  sync: true,
});

// 在任意窗口更新状态，其他窗口都会同步更新
syncedStore.set({ value: "新值" });
```

### 状态订阅

```typescript
// 订阅状态变化
const unsubscribe = store.subscribe((state) => {
  console.log("状态已更新:", state);
});

// 取消订阅
unsubscribe();
```

### 完整的状态重置

```typescript
// 重置为初始状态
store.reset();
```

### 资源清理

```typescript
// 清理订阅、存储和同步
store.destroy();
```

## API 参考

### Echo 构造选项

```typescript
interface EchoOptions<T> {
  name?: string; // 状态名称，用于持久化存储
  storage?: "localStorage" | "indexedDB"; // 存储类型
  onChange?: (state: T) => void; // 状态变化回调
  sync?: boolean; // 是否启用跨窗口同步
}
```

### 主要方法

| 方法                  | 描述                       |
| --------------------- | -------------------------- |
| `use()`               | React Hook，获取完整状态   |
| `use(selector)`       | React Hook，选择性获取状态 |
| `set(partial)`        | 更新部分状态               |
| `set(updater)`        | 使用函数更新状态           |
| `reset()`             | 重置为默认状态             |
| `current`             | 获取当前状态               |
| `subscribe(listener)` | 订阅状态变化               |
| `destroy()`           | 销毁实例，清理资源         |

## 最佳实践

1. 为状态定义明确的类型接口
2. 使用选择器来优化性能
3. 适当使用持久化存储
4. 及时清理不再使用的订阅
5. 在组件卸载时调用 destroy 方法

## License

MIT
