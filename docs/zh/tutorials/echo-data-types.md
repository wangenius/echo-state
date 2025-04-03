---
title: 数据类型
order: 6
---

# Echo 支持的数据类型

本文档详细说明了 Echo 状态管理库支持的数据类型和存储限制。

## 基本数据类型支持

Echo 支持以下基本数据类型作为状态：

### 对象类型 (Record)

```typescript
// 对象类型状态
const userStore = new Echo<{
  name: string;
  age: number;
  preferences: {
    theme: string;
    notifications: boolean;
  };
}>({
  name: "未登录用户",
  age: 0,
  preferences: {
    theme: "light",
    notifications: true,
  },
});
```

对象类型是最常用的状态类型，可以包含嵌套的属性和复杂的数据结构。

### 字符串类型 (String)

```typescript
// 字符串类型状态
const messageStore = new Echo<string>("欢迎使用 Echo!");

// 更新字符串
messageStore.set("新消息内容");

// 函数式更新
messageStore.set((prevMessage) => prevMessage + " 附加内容");
```

### 数字类型 (Number)

```typescript
// 数字类型状态
const counterStore = new Echo<number>(0);

// 更新数字
counterStore.set(5);

// 函数式更新
counterStore.set((prevCount) => prevCount + 1);
```

### 空值 (Null)

```typescript
// 空值状态
const nullableStore = new Echo<null>(null);

// 更新为其他值
nullableStore.set(null);
```

需要注意的是，当状态为 `null` 时：
- 在使用持久化存储（LocalStorage 或 IndexedDB）时，`null` 状态不会被存储
- 当状态变为 `null` 时，会删除已存储的数据
- 当状态从 `null` 变为其他值时，会重新开始存储

### 数组类型 (Array)

```typescript
// 数组类型状态
const listStore = new Echo<string[]>(["项目1", "项目2"]);

// 添加项目
listStore.set((prevList) => [...prevList, "项目3"]);

// 移除项目
listStore.set((prevList) => prevList.filter((item) => item !== "项目2"));
```

### 布尔类型 (Boolean)

```typescript
// 布尔类型状态
const flagStore = new Echo<boolean>(false);

// 切换布尔值
flagStore.set((prevFlag) => !prevFlag);
```

## 复杂数据类型支持

### Map 和 Set

Echo 可以在内存中存储 Map 和 Set 类型的数据，但**这些类型不支持持久化**。当使用 LocalStorage 或 IndexedDB 存储模式时，Map 和 Set 会在序列化过程中丢失其特殊结构。

```typescript
// Map 类型 - 仅支持临时存储
const mapStore = new Echo<Map<string, any>>(
  new Map([
    ["key1", "value1"],
    ["key2", { nested: true }],
  ])
);

// 必须使用临时存储模式
mapStore.temporary();

// 更新 Map
mapStore.set((prevMap) => {
  const newMap = new Map(prevMap);
  newMap.set("key3", "value3");
  return newMap;
});
```

```typescript
// Set 类型 - 仅支持临时存储
const setStore = new Echo<Set<string>>(new Set(["item1", "item2"]));

// 必须使用临时存储模式
setStore.temporary();

// 更新 Set
setStore.set((prevSet) => {
  const newSet = new Set(prevSet);
  newSet.add("item3");
  return newSet;
});
```

### 类实例 (Class Instances)

Echo 可以在内存中存储类实例，但**类实例不支持完整持久化**。当使用 LocalStorage 或 IndexedDB 存储模式时，类实例会被序列化为普通对象，丢失其方法和原型链。

```typescript
// 定义一个类
class User {
  constructor(public name: string, public age: number) {}

  getDescription() {
    return `${this.name}, ${this.age}岁`;
  }
}

// 创建类实例状态 - 仅支持临时存储
const userInstanceStore = new Echo<User>(new User("张三", 30));

// 必须使用临时存储模式
userInstanceStore.temporary();

// 更新类实例
userInstanceStore.set(new User("李四", 25));

// 或者更新特定属性
userInstanceStore.set((prevUser) => {
  const newUser = new User(prevUser.name, prevUser.age + 1);
  return newUser;
});
```

如果需要持久化包含类实例的状态，建议将类实例转换为普通对象进行存储，并在需要时重新创建类实例：

```typescript
// 存储普通对象
const userStore = new Echo<{
  name: string;
  age: number;
}>({
  name: "张三",
  age: 30,
});

// 使用持久化存储
userStore.localStorage({ name: "user-data" });

// 在需要时创建类实例
function getUserInstance() {
  const userData = userStore.current;
  return new User(userData.name, userData.age);
}
```

### 函数 (Functions)

Echo **不支持**存储函数作为状态的一部分。函数在序列化过程中会丢失，因此不应该将函数包含在状态中。

```typescript
// ❌ 不要这样做
const badStore = new Echo({
  data: "some data",
  process: (data) => data.toUpperCase(), // 函数会在序列化时丢失
});
```

如果需要与状态关联的功能，应该将函数定义在状态外部：

```typescript
// ✅ 正确做法
const dataStore = new Echo({
  data: "some data",
});

// 在外部定义函数
function processData(data: string) {
  return data.toUpperCase();
}

// 使用
const processedData = processData(dataStore.current.data);
```

## 存储模式与数据类型的兼容性

不同的存储模式对数据类型有不同的限制：

### 临时存储 (Temporary)

临时存储模式支持所有 JavaScript 数据类型，包括复杂类型如 Map、Set 和类实例。

```typescript
// 临时存储可以存储任何类型
const complexStore = new Echo({
  map: new Map(),
  set: new Set(),
  instance: new SomeClass(),
  date: new Date(),
}).temporary();
```

### LocalStorage 存储

LocalStorage 存储模式只支持可以被 JSON 序列化的数据类型：

- 对象 (Object)
- 数组 (Array)
- 字符串 (String)
- 数字 (Number)
- 布尔值 (Boolean)
- null

不支持：

- Map
- Set
- 类实例（会丢失方法）
- 函数
- Symbol
- undefined（会被转换为 null）
- 循环引用的对象

```typescript
// LocalStorage 存储只支持 JSON 可序列化的数据
const storableStore = new Echo({
  name: "张三",
  age: 30,
  isActive: true,
  tags: ["用户", "管理员"],
  settings: {
    theme: "dark",
    notifications: true,
  },
}).localStorage({ name: "user-data" });
```

### IndexedDB 存储

IndexedDB 存储模式支持 LocalStorage 支持的所有类型，以及一些额外的类型：

- Blob
- File
- ArrayBuffer
- TypedArray (如 Uint8Array)
- DataView

但仍然不支持：

- Map
- Set
- 类实例（会丢失方法）
- 函数
- Symbol
- 循环引用的对象

```typescript
// IndexedDB 存储支持二进制数据
const binaryDataStore = new Echo({
  text: "文本内容",
  binary: new Uint8Array([1, 2, 3, 4]),
  file: null as File | null,
}).indexed({
  name: "binary-data",
  database: "app-data",
});

// 稍后更新文件
fetch("some-url")
  .then((response) => response.blob())
  .then((blob) => {
    const file = new File([blob], "filename.png");
    binaryDataStore.set({ file });
  });
```

## 最佳实践

### 1. 使用可序列化的数据类型

为了确保状态可以正确持久化，尽量使用可序列化的数据类型：

```typescript
// ✅ 好的做法：使用可序列化的数据
const goodStore = new Echo({
  user: {
    id: 1,
    name: "张三",
  },
  preferences: {
    theme: "dark",
  },
});
```

### 2. 避免在状态中存储函数或类方法

```typescript
// ❌ 不好的做法：在状态中存储函数
const badStore = new Echo({
  formatter: (value: string) => value.toUpperCase(),
});

// ✅ 好的做法：将函数保持在状态外部
const dataStore = new Echo({
  value: "some text",
});

function formatValue(value: string) {
  return value.toUpperCase();
}
```

### 3. 对于需要类实例的情况，存储原始数据并在需要时创建实例

```typescript
// ✅ 好的做法：存储原始数据
const userDataStore = new Echo({
  name: "张三",
  age: 30,
  roles: ["admin", "editor"],
});

// 在需要时创建类实例
function createUserModel() {
  const data = userDataStore.current;
  return new UserModel(data.name, data.age, data.roles);
}
```

### 4. 对于复杂数据结构，考虑规范化存储

```typescript
// ✅ 好的做法：规范化数据结构
const normalizedStore = new Echo({
  entities: {
    users: {
      "user-1": { id: "user-1", name: "张三" },
      "user-2": { id: "user-2", name: "李四" },
    },
    posts: {
      "post-1": { id: "post-1", title: "文章1", authorId: "user-1" },
      "post-2": { id: "post-2", title: "文章2", authorId: "user-2" },
    },
  },
  ids: {
    users: ["user-1", "user-2"],
    posts: ["post-1", "post-2"],
  },
});
```

## 总结

Echo 支持多种数据类型，但在选择持久化存储模式时需要注意数据类型的限制：

1. **临时存储**：支持所有 JavaScript 数据类型
2. **LocalStorage 存储**：仅支持 JSON 可序列化的数据类型
3. **IndexedDB 存储**：支持 JSON 可序列化的数据类型和二进制数据

为了获得最佳体验，建议使用可序列化的数据类型，避免在状态中存储函数或类方法，并为复杂数据结构采用规范化存储模式。
