# EchoItem

`EchoItem` is a state management base class based on Echo, focusing on managing individual data items.

## Features

- State management based on Echo
- Support for CRUD operations on individual data items
- Support for IndexedDB persistent storage
- Support for data item switching

## Constructor

```typescript
constructor(database: string)
```

### Parameters

- `database`: Database name

## Methods

### use

Get state using React Hook.

```typescript
public use = this.store.use.bind(this.store);
```

### set

Update state.

```typescript
public set = this.store.set.bind(this.store);
```

### current

Get current state.

```typescript
public async current(): Promise<T | null>
```

#### Returns

- `Promise<T | null>`: Current state

### create

Create a new data item.

```typescript
public async create(item: T): Promise<EchoItem<T>>
```

#### Parameters

- `item`: Data item

#### Returns

- `Promise<EchoItem<T>>`: EchoItem instance

#### Errors

- Throws an error if the data item does not have an id field

### switch

Switch to a data item with the specified ID.

```typescript
public async switch(id: string): Promise<EchoItem<T>>
```

#### Parameters

- `id`: Data item ID

#### Returns

- `Promise<EchoItem<T>>`: EchoItem instance

#### Errors

- Throws an error if ID is empty
- Throws an error if switching fails

### delete

Delete the current data item.

```typescript
public async delete(): Promise<void>
```

#### Errors

- Throws an error if deletion fails

## Example

```typescript
class User extends EchoItem<UserData> {
  constructor() {
    super('users');
  }
}

// Create user
const user = new User();
await user.create({
  id: 'user1',
  name: 'John Doe',
  age: 25
});

// Get current user
const currentUser = await user.current();

// Switch to another user
await user.switch('user2');

// Delete current user
await user.delete();
``` 