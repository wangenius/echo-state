# Question

## 使用 indexed 切换还是使用 switch 切换

问题的根本原因在于 Echo 类的`indexed`方法实现方式和实例使用方式：

1. **每次调用`indexed`方法会创建新的存储适配器**：
   从您提供的代码可以看出，每次调用`indexed`方法都会先清理现有资源（通过`cleanup`方法），然后创建一个新的 IndexedDBAdapter。这个过程会重置`isInitialized`状态，并触发新的`hydrate`操作。

2. **在 KnowledgeTab.tsx 中的链式调用问题**：

   ```typescript
   await instance
     .indexed({
       database: Knowledge.database,
       name: doc.name,
     })
     .ready();
   ```

   如果在 React 组件中使用，这段代码中，`.indexed()`返回了`this`，也就是同一个 Echo 实例，然后链式调用了`.ready()`。但是，这个操作并不会直接影响到已经通过`instance.use()`获取的 knowledge 值。

3. **React 的 Hook 机制**：
   在组件中使用的`const knowledge = instance.use()`是通过 Echo 类中的`createHook`方法创建的 React Hook。这个 Hook 在组件渲染时被调用，并建立了对状态的订阅。

当您执行：

```typescript
onClick: async () => {
  setSelectedDoc(doc);
  await instance
    .indexed({
      database: Knowledge.database,
      name: doc.name,
    })
    .ready();
},
```

这个过程中发生了：

1. `setSelectedDoc(doc)`更新了 React 组件的状态，导致界面重新渲染。
2. `instance.indexed()`重新配置了 IndexedDB 存储适配器，指向了一个新的存储键。
3. 调用`.ready()`等待数据加载完成。

**但这个过程存在的问题是**：

- 虽然 Echo 实例的内部状态已经更改，但 React Hook（`instance.use()`）没有立即感知到这个变化。
- Echo 类的实现中，`indexed`方法确实会在 hydrate 完成后触发监听器，但这可能发生在 React 组件渲染周期之外。

正确的做法应该是：

1. 确保在调用完`indexed`和`ready`后，确认数据已加载，然后可能需要手动触发 React 状态更新。

2. 更合理的方式是使用像`switch`这样的方法，它专门用于在已初始化的索引数据库中切换存储键：

```typescript
onClick: async () => {
  setSelectedDoc(doc);
  await instance.switch(doc.id).ready(); // 注意这里使用id而不是name
},
```

3. 如果坚持使用现有代码结构，可能需要在`indexed`调用后添加一些状态更新逻辑或等待下一个渲染周期。

>

1. **异步执行的时机问题**：
   `hydratePromise.then()`是异步执行的。当`indexed`方法被调用时，它会返回`this`，并且在后台启动数据加载过程。通知监听器的操作是在数据加载完成后才执行的，这是一个异步的过程。

2. **React 的渲染周期**：
   在 React 组件中，当你调用`onClick`函数执行以下代码时：

   ```typescript
   onClick: async () => {
     setSelectedDoc(doc);
     await instance
       .indexed({
         database: Knowledge.database,
         name: doc.name,
       })
       .ready();
   },
   ```

   这里的执行顺序是：

   - 首先调用`setSelectedDoc(doc)`，这会触发 React 组件的重新渲染
   - 然后执行`indexed`方法，该方法启动异步数据加载，并返回实例本身
   - 接着调用`.ready()`等待数据加载完成
   - 当数据加载完成后，监听器才会被通知

3. **问题在哪里**：
   当你在组件中使用`const knowledge = instance.use()`时，这个 Hook 会在组件渲染时建立状态订阅。如果组件在`hydrate`完成之前就已经完成了渲染，那么这个 Hook 可能还是使用了旧的状态。

4. **监听器通知与 React 状态更新的不同步**：
   虽然`indexed`方法在`hydrate`完成后会通知所有监听器，但这个通知是在异步任务（Promise）中发生的。React 组件可能已经完成了渲染，而`use` Hook 在组件渲染时可能使用的是尚未更新的状态。

5. **检查具体实现**：
   在`indexed`方法中，确实有通知监听器的逻辑，但这个通知是在`hydratePromise.then()`中执行的，这意味着它是在异步任务队列中执行的。

   而在`use` Hook 中，它是这样工作的：

   ```typescript
   useEffect(() => {
     const listener = () => {
       setState(self.state);
       forceUpdate({});
     };
     self.addListener(listener);
     return () => {
       self.removeListener(listener);
     };
   }, []);
   ```

   这个 Hook 确实添加了监听器，但如果组件在监听器被通知之前就已经渲染完成，那么状态更新可能不会立即反映。

6. **可能的解决方案**：
   如果监听器系统确实正常工作，但你仍然看到了状态不同步，可能的原因包括：

   - 监听器添加晚了：确保在使用`indexed`方法之前，组件已经完成了初始渲染和监听器的添加
   - 监听器未被正确触发：检查`isInitialized`标志是否在`hydrate`完成后正确设置为 true
   - 监听器被触发但状态未更新：确保监听器的回调函数正确地更新了 React 状态

由于你提到监听器应该被通知，但状态似乎没有更新，建议查看 KnowledgeTab.tsx 中 onClick 函数的具体实现，确保它确实等待了`ready()`的完成，并且组件在数据加载完成后能够正确地获取最新状态。

具体的解决方案可能是：

1. 修改应用代码确保完整的异步流程：

```typescript
onClick: async () => {
  setSelectedDoc(doc);
  // 等待索引操作和数据加载完成
  await instance.indexed({
    database: Knowledge.database,
    name: doc.id, // 使用id而不是name
  }).ready();

  // 可能需要手动更新某些状态或强制重新渲染
  // 例如使用：
  // forceUpdate({});
},
```

2. 或者使用`switch`方法代替`indexed`，因为它专门为切换存储键而设计：

```typescript
onClick: async () => {
  setSelectedDoc(doc);
  await instance.switch(doc.id).ready();
},
```

希望这个更详细的分析能帮助理解问题所在！
