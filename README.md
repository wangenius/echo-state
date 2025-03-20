# echo-state

A lightweight React state management library that is simple, flexible, and efficient.

## Features

- 💾 **Multiple storage modes** - Supports temporary storage, `LocalStorage`, and `IndexedDB` storage modes to meet different scenario requirements
- 🔄 **Cross-window state synchronization** - Built-in cross-window state synchronization functionality, no additional configuration needed for multi-tab applications
- ⚛️ **React Hooks integration** - Provides concise and easy-to-use React Hooks API for easily using and subscribing to state in components
- 🔍 **Selector support** - Precisely subscribe to specific parts of the state through selectors, optimize performance, and avoid unnecessary re-renders
- 📦 **Lightweight with no dependencies** - Small size, no external dependencies, providing efficient state management capabilities for your application
- 🛠️ **TypeScript support** - Completely written in TypeScript, providing complete type definitions, enhancing the development experience

## Installation

```bash
npm install echo-state
```

## Basic Usage

### Creating State

```typescript
import { Echo } from "echo-state";

// Create an Echo instance
const userStore = new Echo({
  name: "",
  age: 0,
  isLoggedIn: false,
});
```

### Using in React

```tsx
function UserProfile() {
  // Use Echo's use hook to get state
  const state = userStore.use();

  return (
    <div>
      <p>Username: {state.name}</p>
      <p>Age: {state.age}</p>
      <button onClick={() => userStore.set({ name: "John" })}>
        Set Username
      </button>
    </div>
  );
}
```

### Using Selectors to Optimize Performance

```tsx
function UserName() {
  // Only subscribe to changes in the name property
  const name = userStore.use((state) => state.name);

  return <p>Username: {name}</p>;
}
```

## Best Practices

1. Create separate Echo instances for different functionalities
2. Choose appropriate storage modes based on data characteristics
3. Use selectors to avoid unnecessary re-renders
4. Use `ready()` to ensure state has been loaded from storage
5. Unsubscribe or clean up resources when components unmount

## Documentation

View complete documentation and API reference: [Echo Documentation](https://wangenius.github.io/echo-state/)

## License

MIT
