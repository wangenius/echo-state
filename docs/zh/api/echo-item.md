# EchoItem

`EchoItem` 是一个基于 Echo 的状态管理基类，专注于单个数据项的管理。

## 特性

- 基于 Echo 的状态管理
- 支持单个数据项的 CRUD 操作
- 支持 IndexedDB 持久化存储
- 支持数据项切换

## 构造函数

```typescript
constructor(database: string)
```

### 参数

- `database`: 数据库名称

## 方法

### use

使用 React Hook 获取状态。

```typescript
public use = this.store.use.bind(this.store);
```

### set

更新状态。

```typescript
public set = this.store.set.bind(this.store);
```

### current

获取当前状态。

```typescript
public async current(): Promise<T | null>
```

#### 返回值

- `Promise<T | null>`: 当前状态

### create

创建新数据项。

```typescript
public async create(item: T): Promise<EchoItem<T>>
```

#### 参数

- `item`: 数据项

#### 返回值

- `Promise<EchoItem<T>>`: EchoItem 实例

#### 错误

- 如果数据项没有 id 字段，将抛出错误

### switch

切换到指定 ID 的数据项。

```typescript
public async switch(id: string): Promise<EchoItem<T>>
```

#### 参数

- `id`: 数据项 ID

#### 返回值

- `Promise<EchoItem<T>>`: EchoItem 实例

#### 错误

- 如果 ID 为空，将抛出错误
- 如果切换失败，将抛出错误

### delete

删除当前数据项。

```typescript
public async delete(): Promise<void>
```

#### 错误

- 如果删除失败，将抛出错误

## 示例

```typescript
class User extends EchoItem<UserData> {
  constructor() {
    super('users');
  }
}

// 创建用户
const user = new User();
await user.create({
  id: 'user1',
  name: '张三',
  age: 25
});

// 获取当前用户
const currentUser = await user.current();

// 切换到其他用户
await user.switch('user2');

// 删除当前用户
await user.delete();
``` 