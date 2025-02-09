/**
 * Echo 状态管理类
 * 一个轻量级的状态管理库，支持本地存储和 IndexedDB。基于 zustand 的状态管理解决方案。
 *
 * @packageDocumentation
 * @module echo-state
 * @version 1.2.3
 *
 * @example
 * ```typescript
 * import { Echo } from 'echo-state';
 *
 * // 创建状态实例
 * const userStore = new Echo<UserState>(
 *   { name: "", age: 0 },
 *   {
 *     config: {
 *       name: "userStore",
 *       driver: LocalForage.LOCALSTORAGE,
 *     }
 *   }
 * );
 *
 * // 在 React 组件中使用
 * function UserComponent() {
 *   const user = userStore.use();
 *   return <div>{user.name}</div>;
 * }
 * ```
 */

import localforage from "localforage";
import { create, StateCreator, StoreApi, UseBoundStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Echo 配置选项接口
 * @interface EchoOptions
 * @template T - 状态类型
 */
interface EchoOptions<T = any> {
  /**
   * LocalForage 配置选项
   * 如果提供此配置，状态将被持久化存储
   */
  config?: LocalForageOptions;

  /**
   * 状态变化回调函数
   * @param newState - 新状态
   * @param oldState - 旧状态
   */
  onChange?: (newState: T, oldState: T) => void;
}

/**
 * Echo 状态管理类
 *
 * 提供了状态管理、持久化存储和状态订阅等功能
 *
 * 文档链接:
 * @link https://github.com/wangenius/echo-state#readme
 */
class Echo<T = Record<string, any>> {
  /* 状态管理器, 用于管理状态 */
  private readonly store: UseBoundStore<StoreApi<T>>;
  private forage: LocalForage | undefined;

  /**
   * 构造函数
   * @param defaultValue - 默认状态值
   * @param options - Echo 配置选项
   * @param options.config - LocalForage 配置，用于持久化存储
   * @param options.onChange - 状态变化回调函数
   *
   * @example
   * ```typescript
   * const store = new Echo({ count: 0 }, {
   *   config: {
   *     name: 'myStore',
   *     driver: LocalForage.LOCALSTORAGE
   *   },
   *   onChange: (newState, oldState) => {
   *     console.log('State changed:', newState, oldState);
   *   }
   * });
   * ```
   */
  constructor(
    private readonly defaultValue: T,
    private options: EchoOptions<T> = {}
  ) {
    if (options.config) {
      const config: LocalForageOptions = {
        name: options.config.name,
        storeName: options.config.storeName,
        driver: options.config.driver || localforage.LOCALSTORAGE,
        version: options.config.version || 1.0,
      };
      this.forage = localforage.createInstance(config);
    }
    this.store = this.initialize();
  }

  /**
   * 获取当前状态
   * @returns 当前状态值
   */
  public get current(): T {
    return this.store.getState();
  }

  /**
   * 设置状态
   * @param partial - 新的状态值或更新函数
   * @param replace - 是否完全替换状态，默认为 false
   *
   * @example
   * ```typescript
   * // 部分更新
   * store.set({ name: 'John' });
   *
   * // 使用函数更新
   * store.set(state => ({ count: state.count + 1 }));
   *
   * // 完全替换状态
   * store.set({ name: 'John', age: 30 }, true);
   * ```
   */
  public set(
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace: boolean = false
  ) {
    const oldState = this.current;
    if (replace) {
      this.store.setState(partial as T, true);
    } else {
      this.store.setState(partial);
    }
    const newState = this.current;
    if (this.options.onChange) {
      this.options.onChange(newState, oldState);
    }
  }

  /**
   * 删除状态中的指定键
   * @param key - 要删除的状态键
   */
  public delete(key: keyof T) {
    this.store.setState((state: T) => {
      const newState = { ...state };
      delete newState[key];
      return newState;
    }, true);
  }

  /**
   * 重置状态为默认值
   */
  public reset(): void {
    const oldState = this.current;
    this.store.setState(this.defaultValue, true);
    if (this.options.onChange) {
      this.options.onChange(this.defaultValue, oldState);
    }
  }

  /**
   * 使用状态或选择性使用状态的部分值
   * @param selector - 可选的状态选择器函数
   * @returns 完整状态或选择的部分状态
   *
   * @example
   * ```typescript
   * // 使用完整状态
   * const state = store.use();
   *
   * // 选择部分状态
   * const name = store.use(state => state.name);
   * ```
   */
  public use(): T;
  public use<Selected>(selector: (state: T) => Selected): Selected;
  public use<Selected>(selector?: (state: T) => Selected) {
    return selector ? this.store(selector) : this.store();
  }

  /** 初始化状态 */
  private initialize() {
    if (!this.forage) {
      const creator: StateCreator<T> = () => ({
        ...this.defaultValue,
      });
      return create<T>(creator);
    } else {
      const storage = this.forage;
      return create<T>()(
        persist(() => this.defaultValue, {
          name: this.forage.config.name,
          storage: createJSONStorage(() => storage),
          skipHydration: true,
          onRehydrateStorage: (state) => {
            return (hydrationState, error) => {
              if (error) {
                console.error("Error during hydration:", error);
                return;
              }
              if (hydrationState && this.options.onChange) {
                this.options.onChange(hydrationState, state as T);
              }
            };
          },
        })
      );
    }
  }

  /**
   * 订阅状态变化
   * @param listener - 状态变化监听函数
   * @returns 取消订阅函数
   *
   * @example
   * ```typescript
   * const unsubscribe = store.subscribe((state, oldState) => {
   *   console.log('State changed:', state, oldState);
   * });
   *
   * // 取消订阅
   * unsubscribe();
   * ```
   */
  public subscribe(listener: (state: T, oldState: T) => void) {
    return this.store.subscribe(listener);
  }

  /**
   * 配置存储选项
   * @param config - LocalForage 配置选项
   */
  public storage(config: LocalForageOptions) {
    localforage.config(config);
  }
}

export { Echo, type EchoOptions };
