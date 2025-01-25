# echo-state

一个轻量级的状态管理库，支持本地存储和 IndexedDB。 zustand 语法糖。

## 特性

- 🚀 轻量级，易于使用
- 💾 支持 localStorage 和 IndexedDB 持久化
- 🔄 支持状态变更订阅
- 📦 支持 TypeScript

## 安装

```bash
npm install echo-state zustand
```

## 使用示例

```typescript
import { Echo } from "echo-state";

interface UserState {
  name: string;
  age: number;
}

const userStore = new Echo<UserState>("user", {
  name: "",
  age: 0,
});

// 使用 Hook
function UserComponent() {
  const user = userStore.use();
  // 或者选择部分状态
  const name = userStore.use((state) => state.name);

  return <div>{name}</div>;
}

// 直接操作
userStore.set({ name: "John" });
userStore.delete("age");
userStore.reset();
```

## API

### 构造函数

```typescript
new Echo<T>(name: string, defaultValue: T, options?: Partial<EchoOptions>)
```

### 配置选项

```typescript
interface EchoOptions<T> {
  storage: "localStorage" | "indexedDB";
  persist: boolean;
  onChange?: (newState: T, oldState: T) => void;
}
```

## License

MIT
