# EchoManager

EchoManager is a core class for managing data subscriptions and notifications. It provides cross-window data synchronization and React Hooks integration capabilities.

## Class Definition

```typescript
export class EchoManager {
  // Static methods
  public static subscribe<T>(database: string, objectStore?: string, listener: (data: T[]) => void): () => void;
  public static notify<T>(database: string, objectStore?: string, data: T[]): void;
  public static use<T, Selected = T[]>(database: string, objectStore?: string, selector?: (data: T[]) => Selected): Selected;
}
```

## Methods

### subscribe

Subscribe to data changes.

```typescript
public static subscribe<T>(
  database: string,
  objectStore?: string,
  listener: (data: T[]) => void
): () => void
```

**Parameters:**
- `database`: Database name
- `objectStore`: Object store name (optional, defaults to "echo-state")
- `listener`: Callback function for data changes

**Returns:**
- A function to unsubscribe from data changes

**Example:**
```typescript
const unsubscribe = EchoManager.subscribe("my-db", "my-store", (data) => {
  console.log("Data updated:", data);
});

// Unsubscribe
unsubscribe();
```

### notify

Notify all listeners that data has been updated.

```typescript
public static notify<T>(
  database: string,
  objectStore?: string,
  data: T[]
): void
```

**Parameters:**
- `database`: Database name
- `objectStore`: Object store name (optional, defaults to "echo-state")
- `data`: New data to notify

**Example:**
```typescript
EchoManager.notify("my-db", "my-store", newData);
```

### use

React Hook method for subscribing to data changes in components.

```typescript
public static use<T, Selected = T[]>(
  database: string,
  objectStore?: string,
  selector?: (data: T[]) => Selected
): Selected
```

**Parameters:**
- `database`: Database name
- `objectStore`: Object store name (optional, defaults to "echo-state")
- `selector`: Data selector function (optional)

**Returns:**
- Returns selected data or complete data

**Example:**
```typescript
function MyComponent() {
  // Get all data
  const allData = EchoManager.use("my-db", "my-store");
  
  // Use selector to get specific data
  const filteredData = EchoManager.use(
    "my-db",
    "my-store",
    (data) => data.filter(item => item.active)
  );
  
  return <div>{/* Render data */}</div>;
}
```

## Performance Considerations

EchoManager internally uses Map structures to cache listeners and hooks, which ensures:

1. Efficient listener management
2. Avoids duplicate hook creation
3. Automatic cleanup of unused resources

## Best Practices

1. Unsubscribe when component unmounts:
```typescript
useEffect(() => {
  const unsubscribe = EchoManager.subscribe("my-db", "my-store", handleDataChange);
  return () => unsubscribe();
}, []);
```

2. Use selectors for performance optimization:
```typescript
// Only subscribe to needed data
const activeItems = EchoManager.use(
  "my-db",
  "my-store",
  (data) => data.filter(item => item.active)
);
```

3. Use object stores appropriately:
```typescript
// Separate object stores by data type
const userData = EchoManager.use("my-db", "users");
const settingsData = EchoManager.use("my-db", "settings");
``` 