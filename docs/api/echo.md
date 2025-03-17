# Echo API 参考

本文档提供了 Echo 状态管理库的完整 API 参考。

## 核心类

### Echo\<T\>

`Echo<T>` 是状态管理库的核心类，用于创建和管理状态。

```typescript
class Echo<T extends Record<string, any>> {
  constructor(defaultState: T);

  // 方法
  set(nextState: Partial<T> | StateUpdater<T>, options?: SetOptions): void;
  delete(key: string): void;
  reset(): void;
  get current(): T;
  getCurrent(): Promise<T>;
  ready(): Promise<void>;
  subscribe(listener: Listener<T>): () => void;
  addListener(listener: Listener<T>): void;
  removeListener(listener: Listener<T>): void;
  use<Selected = T>(selector?: (state: T) => Selected): Selected;
  temporary(): this;
  localStorage(config: StorageConfig): this;
  indexed(config: IndexedDBConfig): this;
  destroy(): void;
  switch(name: string): this;
}
```

#### 构造函数

```typescript
constructor(defaultState: T)
```

创建一个新的 Echo 实例，使用提供的默认状态初始化。

**参数:**

- `defaultState: T` - 状态的初始值

**示例:**

```typescript
const userStore = new Echo({
  name: "",
  age: 0,
  isLoggedIn: false,
});
```

#### 状态操作方法

##### set()

```typescript
set(nextState: Partial<T> | StateUpdater<T>, options?: SetOptions): void
```

更新状态。可以提供部分状态对象或更新函数。

**参数:**

- `nextState: Partial<T> | StateUpdater<T>` - 新的部分状态或状态更新函数
- `options?: SetOptions` - 可选的设置选项
  - `isFromSync?: boolean` - 是否来自同步操作
  - `replace?: boolean` - 是否完全替换状态而不是合并

**示例:**

```typescript
// 使用对象更新
userStore.set({ name: "张三" });

// 使用函数更新
userStore.set((state) => ({ age: state.age + 1 }));

// 完全替换状态
userStore.set({ name: "李四", age: 30 }, { replace: true });
```

##### delete()

```typescript
delete(key: string): void
```

从状态中删除指定的键。

**参数:**

- `key: string` - 要删除的状态键

**示例:**

```typescript
userStore.delete("age");
```

##### reset()

```typescript
reset(): void
```

将状态重置为初始默认值。

**示例:**

```typescript
userStore.reset();
```

#### 状态获取方法

##### current

```typescript
get current(): T
```

获取当前状态的同步访问器。只有在确定状态已初始化后才应使用。

**返回:**

- `T` - 当前状态

**示例:**

```typescript
const state = userStore.current;
console.log(state.name);
```

##### getCurrent()

```typescript
getCurrent(): Promise<T>
```

异步获取当前状态，等待初始化完成。

**返回:**

- `Promise<T>` - 解析为当前状态的 Promise

**示例:**

```typescript
userStore.getCurrent().then((state) => {
  console.log(state.name);
});
```

##### ready()

```typescript
ready(): Promise<void>
```

返回一个 Promise，在状态初始化完成后解析。

**返回:**

- `Promise<void>` - 在初始化完成后解析的 Promise

**示例:**

```typescript
userStore.ready().then(() => {
  console.log("状态已初始化");
  console.log(userStore.current);
});
```

#### 订阅方法

##### subscribe()

```typescript
subscribe(listener: Listener<T>): () => void
```

订阅状态变化。

**参数:**

- `listener: Listener<T>` - 状态变化时调用的监听函数

**返回:**

- `() => void` - 取消订阅的函数

**示例:**

```typescript
const unsubscribe = userStore.subscribe((state) => {
  console.log("状态已更新:", state);
});

// 取消订阅
unsubscribe();
```

##### addListener()

```typescript
addListener(listener: Listener<T>): void
```

添加状态变化监听器。

**参数:**

- `listener: Listener<T>` - 状态变化时调用的监听函数

**示例:**

```typescript
const listener = (state) => console.log("状态已更新:", state);
userStore.addListener(listener);
```

##### removeListener()

```typescript
removeListener(listener: Listener<T>): void
```

移除状态变化监听器。

**参数:**

- `listener: Listener<T>` - 要移除的监听函数

**示例:**

```typescript
userStore.removeListener(listener);
```

#### React Hook

##### use()

```typescript
use<Selected = T>(selector?: (state: T) => Selected): Selected
```

React Hook，用于在组件中使用和订阅状态。

**参数:**

- `selector?: (state: T) => Selected` - 可选的选择器函数，用于选择状态的特定部分

**返回:**

- `Selected` - 选择的状态部分或完整状态

**示例:**

```tsx
function UserProfile() {
  // 使用完整状态
  const state = userStore.use();

  return <div>用户名: {state.name}</div>;
}

function UserName() {
  // 只使用name属性
  const name = userStore.use((state) => state.name);

  return <div>用户名: {name}</div>;
}
```

##### switch()

```typescript
switch(name: string): this
```

切换存储键名，用于在当前数据库和对象仓库下切换到不同的键名。**仅限于 IndexedDB 方案使用**。

**参数:**

- `name: string` - 新的存储键名

**返回:**

- `this` - 当前实例，用于链式调用

**行为:**

- 如果新键名下有持久化的数据，将加载该数据
- 如果新键名下没有持久化的数据，将使用默认状态（构造函数中提供的状态）初始化

**示例:**

```typescript
// 创建 IndexedDB 存储
const userStore = new Echo({ name: "张三" }).indexed({
  name: "user-1",
  database: "user-db",
});

// 切换到新的键名
userStore.switch("user-2");

// 链式调用
userStore
  .switch("user-3")
  .ready()
  .then(() => {
    console.log("切换完成");
  });
```

**注意:** 如果尝试在非 IndexedDB 方案中使用此方法，将抛出异常。

#### 存储模式方法

##### temporary()

```typescript
temporary(): this
```

使用临时存储模式（不持久化）。

**返回:**

- `this` - 当前实例，用于链式调用

**示例:**

```typescript
userStore.temporary();
```

##### localStorage()

```typescript
localStorage(config: StorageConfig): this
```

使用 LocalStorage 存储模式。

**参数:**

- `config: StorageConfig` - LocalStorage 配置
  - `name: string` - 存储键名
  - `sync?: boolean` - 是否跨窗口同步

**返回:**

- `this` - 当前实例，用于链式调用

**示例:**

```typescript
userStore.localStorage({
  name: "user-store",
  sync: true,
});
```

##### indexed()

```typescript
indexed(config: IndexedDBConfig): this
```

使用 IndexedDB 存储模式。

**参数:**

- `config: IndexedDBConfig` - IndexedDB 配置
  - `name: string` - 存储键名
  - `database: string` - 数据库名称
  - `object?: string` - 对象仓库名称，默认为 'echo-state'
  - `sync?: boolean` - 是否跨窗口同步

**返回:**

- `this` - 当前实例，用于链式调用

**示例:**

```typescript
userStore.indexed({
  name: "user-store",
  database: "user-database",
  object: "userData",
  sync: true,
});
```

#### 资源管理方法

##### destroy()

```typescript
destroy(): void
```

销毁 Echo 实例，清理所有资源并删除持久化数据。

**示例:**

```typescript
userStore.destroy();
```

## 类型定义

### StorageConfig

```typescript
interface StorageConfig {
  name: string; // 存储键名
  sync?: boolean; // 是否跨窗口同步
}
```

### IndexedDBConfig

```typescript
interface IndexedDBConfig extends StorageConfig {
  database: string; // 数据库名称
  object?: string; // 对象仓库名称，默认是 'echo-state'
}
```

### SetOptions

```typescript
interface SetOptions {
  isFromSync?: boolean; // 是否来自同步
  replace?: boolean; // 是否替换整个状态
}
```

### Listener\<T\>

```typescript
type Listener<T> = (state: T) => void;
```

### StateUpdater\<T\>

```typescript
type StateUpdater<T> = (state: T) => Partial<T>;
```

## 存储适配器

Echo 内部使用存储适配器来实现不同的存储模式。这些适配器实现了`StorageAdapter`接口。

### StorageAdapter

```typescript
interface StorageAdapter {
  readonly name: string;
  init(): Promise<void>;
  getItem<T>(): Promise<T | null>;
  setItem<T>(value: T): Promise<void>;
  removeItem(): Promise<void>;
  close(): void;
  destroy(): void;
}
```

实现了`StorageAdapter`接口的适配器：

### LocalStorageAdapter

实现了`StorageAdapter`接口，使用浏览器的 LocalStorage API。

### IndexedDBAdapter

实现了`StorageAdapter`接口，使用浏览器的 IndexedDB API。
