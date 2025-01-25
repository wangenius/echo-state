# echo-state

一个轻量级的状态管理库，支持本地存储和 IndexedDB。

## 特性

- 🚀 轻量级，易于使用
- 💾 支持 localStorage 和 IndexedDB 持久化
- 🔄 支持状态变更订阅
- 📦 支持 TypeScript

## 安装

```bash
npm install echo-state
# 或
yarn add echo-state
```

## 使用示例

```typescript
import { Echo } from "echo-state";

// 创建一个状态实例
const counter = new Echo("counter", { count: 0 });

// 使用状态
const count = counter.use((state) => state.count);

// 更新状态
counter.set({ count: count + 1 });

// 订阅状态变化
counter.subscribe((state) => {
  console.log("状态已更新:", state);
});
```

## API

### 创建实例

```typescript
const echo = new Echo(name: string, defaultValue: T, options?: EchoOptions);
```

### 配置选项

```typescript
interface EchoOptions<T = any> {
  storage: "localStorage" | "indexedDB";
  persist: boolean;
  onChange?: (newState: T, oldState: T) => void;
}
```

## License

MIT
