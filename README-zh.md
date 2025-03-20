# echo-state

一个轻量级的 React 状态管理库，简单、灵活、高效。

## 特性

- 💾 **多种存储模式** - 支持临时存储、LocalStorage 和 IndexedDB 三种存储模式，满足不同场景需求
- 🔄 **跨窗口状态同步** - 内置跨窗口状态同步功能，多标签页应用无需额外配置
- ⚛️ **React Hooks 集成** - 提供简洁易用的 React Hooks API，轻松在组件中使用和订阅状态
- 🔍 **选择器支持** - 通过选择器精确订阅状态的特定部分，优化性能，避免不必要的重渲染
- 📦 **轻量无依赖** - 体积小巧，无外部依赖，为您的应用提供高效的状态管理能力
- 🛠️ **TypeScript 支持** - 完全使用 TypeScript 编写，提供完整的类型定义，增强开发体验

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

### 在 React 中使用

```tsx
function UserProfile() {
  // 使用Echo的use hook获取状态
  const state = userStore.use();

  return (
    <div>
      <p>用户名: {state.name}</p>
      <p>年龄: {state.age}</p>
      <button onClick={() => userStore.set({ name: "张三" })}>
        设置用户名
      </button>
    </div>
  );
}
```

### 使用选择器优化性能

```tsx
function UserName() {
  // 只订阅name属性的变化
  const name = userStore.use((state) => state.name);

  return <p>用户名: {name}</p>;
}
```

## 最佳实践

1. 为不同功能创建独立的 Echo 实例
2. 根据数据特性选择合适的存储模式
3. 使用选择器避免不必要的重渲染
4. 使用`ready()`确保状态已从存储加载
5. 组件卸载时取消订阅或清理资源

## 文档

查看完整文档和 API 参考：[Echo 文档](https://wangenius.github.io/echo-state/)

## License

MIT
