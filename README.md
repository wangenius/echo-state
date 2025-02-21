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

## 基础使用示例

```typescript
import { Echo } from "echo-state";

interface UserState {
  name: string;
  age: number;
}

// 创建状态实例
const userStore = new Echo<UserState>(
  { name: "", age: 0 }, // 默认值
  {
    name: "userStore", // 存储名称，如果提供则启用持久化
    storage: "localStorage", // 默认使用 localStorage
    onChange: (state) => {
      console.log("状态发生变化:", state);
    },
    sync: true, // 启用跨窗口同步
  }
);

// 在 React 组件中使用
function UserComponent() {
  const user = userStore.use();
  // 或者选择部分状态
  const name = userStore.use((state) => state.name);
  return <div>{name}</div>;
}
```

## 存储选项

Echo 支持两种存储方式：

### LocalStorage (默认)

```typescript
const store = new Echo(defaultState, {
  name: "myStore",
  storage: "localStorage", // 可省略，这是默认值
});
```

### IndexedDB

```typescript
const store = new Echo(defaultState, {
  name: "myStore",
  storage: "indexedDB", // 使用 IndexedDB 存储
});
```

## 状态操作

```typescript
// 更新状态
store.set({ name: "John" }); // 部分更新
store.set((state) => ({ name: "John" })); // 使用函数更新

// 获取当前状态
console.log(store.current);
// 或者
console.log(store.getState());

// 重置状态
store.reset();

// 订阅状态变化
const unsubscribe = store.subscribe((state) => {
  console.log("状态变化:", state);
});

// 取消订阅
unsubscribe();
```

## 跨窗口同步

Echo 支持在多个浏览器窗口/标签页之间同步状态：

```typescript
const syncedStore = new Echo(defaultState, {
  name: "myStore", // 必须提供 name
  sync: true,
});

// 状态会自动在所有窗口间同步
syncedStore.set({ value: 123 });
```

## API 参考

### 构造选项

```typescript
interface EchoOptions<T> {
  name?: string; // 状态名称，用于持久化存储
  storage?: "localStorage" | "indexedDB"; // 存储类型
  onChange?: (state: T) => void; // 状态变化回调
  sync?: boolean; // 是否启用跨窗口同步
}
```

### 主要方法

- `use()`: 获取完整状态（React Hook）
- `use(selector)`: 选择性获取状态（React Hook）
- `set(partial)`: 更新状态
- `set(updater)`: 使用函数更新状态
- `reset()`: 重置为默认状态
- `current`: 获取当前状态
- `subscribe(listener)`: 订阅状态变化
- `destroy()`: 销毁实例，清理资源

## License

MIT
