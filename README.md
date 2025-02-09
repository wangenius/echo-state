# echo-state

一个轻量级的状态管理库，支持本地存储和 IndexedDB。基于 zustand 的状态管理解决方案。

## 特性

- 🚀 轻量级，易于使用
- 💾 支持 localStorage 和 IndexedDB 持久化
- 🔄 支持状态变更订阅
- 📦 完整的 TypeScript 支持
- 🎯 支持选择性状态订阅
- 🔄 支持跨标签页状态同步

## 安装

```bash
npm install echo-state zustand localforage
```

## 使用示例

```typescript
import { Echo } from "echo-state";

interface UserState {
  name: string;
  age: number;
}

// 创建状态实例
/**
 * @param defaultState 默认值
 * @param options 配置选项,可选， 如果没有config，表示非持久化
 */
const userStore = new Echo<UserState>(
  { name: "", age: 0 }, // 默认值
  {
    config: {
      name: "userStore", // 存储名称
      storeName: "user", // 存储键名
      driver: LocalForage.LOCALSTORAGE, // 存储方式，支持 LOCALSTORAGE 和 INDEXEDDB
    },
    onChange: (newState, oldState) => {
      console.log("状态发生变化:", newState, oldState);
    },
  }
);

// 在 React 组件中使用
function UserComponent() {
  const user = userStore.use();
  // 或者选择部分状态
  const name = userStore.use((state) => state.name);

  return <div>{name}</div>;
}

// 状态操作
userStore.set({ name: "John" }); // 部分更新
userStore.set({ name: "John" }, true); // 完全替换
userStore.delete("age"); // 删除某个键
userStore.reset(); // 重置为默认值

// 获取当前状态
console.log(userStore.current);

// 订阅状态变化
const unsubscribe = userStore.subscribe((state, oldState) => {
  console.log("状态变化:", state, oldState);
});

// 取消订阅
unsubscribe();
```

### 持久化和跨标签页同步

当配置了 `config` 选项时，状态会自动持久化到存储中（默认使用 localStorage）。状态变更会自动在不同标签页之间同步。

```typescript
// 创建带持久化的状态实例
const persistedStore = new Echo(defaultState, {
  config: {
    name: "myStore",
    driver: LocalForage.LOCALSTORAGE, // 或 INDEXEDDB
  },
});

// 状态会自动在标签页间同步
// 在标签页 A 中更新状态
persistedStore.set({ value: 123 });

// 在标签页 B 中会自动收到更新
// 并触发 onChange 回调
```

## API

### 构造函数

```typescript
new Echo<T>(defaultValue: T, options?: EchoOptions<T>)
```

### 配置选项

```typescript
interface EchoOptions<T> {
  config?: {
    name: string; // 存储名称
    storeName?: string; // 存储键名
    driver?: string; // 存储驱动（默认 localStorage）
    version?: number; // 版本号
  };
  onChange?: (newState: T, oldState: T) => void; // 状态变化回调
}
```

### 主要方法

- `use()`: 获取完整状态
- `use(selector)`: 选择性获取状态
- `set(partial, replace?)`: 更新状态
- `delete(key)`: 删除指定键的状态
- `reset()`: 重置为默认状态
- `current`: 获取当前状态
- `subscribe(listener)`: 订阅状态变化
- `storage(config)`: 配置存储选项

## License

MIT
