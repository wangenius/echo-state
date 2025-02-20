# 文档用例

```typescript
import { IndexedDBStorage } from "echo";
// 创建一个新的存储实例
const storage = new IndexedDBStorage("my-app-storage");
```

### 基本操作

```typescript
// 存储数据
await storage.setItem("user", { id: 1, name: "Alice" });
// 获取数据
const user = await storage.getItem("user");
console.log(user); // { id: 1, name: 'Alice' }
// 删除数据
await storage.removeItem("user");
// 清理/销毁数据库
storage.destroy();
```

## 最佳实践

1. **初始化时机**：

   ```typescript
   // 在应用启动时初始化存储
   const storage = new IndexedDBStorage("app-storage");

   // 等待数据库就绪
   await storage.waitForDB();
   ```

2. **资源清理**：

   ```typescript
   // 在不再需要存储时清理资源
   window.addEventListener("unload", () => {
     storage.destroy();
   });
   ```

3. **批量操作**：
   ```typescript
   // 处理多个操作
   async function batchUpdate() {
     try {
       await Promise.all([
         storage.setItem("key1", value1),
         storage.setItem("key2", value2),
         storage.setItem("key3", value3),
       ]);
     } catch (error) {
       console.error("批量更新失败:", error);
     }
   }
   ```

## 调试

当遇到问题时，可以在浏览器开发者工具的 Application 标签页中查看 IndexedDB 存储的内容：

1. 打开浏览器开发者工具
2. 切换到 Application 标签
3. 展开左侧的 IndexedDB 部分
4. 查找以 "echo-" 开头的数据库

这样可以直接检查存储的数据，有助于调试和问题排查。
