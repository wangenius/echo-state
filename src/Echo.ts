/**
 * Echo 状态管理类
 * 用于管理全局状态，支持持久化
 */

import localforage from "localforage";
import { create, StateCreator, StoreApi, UseBoundStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
/* 存储类型 */
type StorageType = "localStorage" | "indexedDB";

/* Echo 配置 */
interface EchoOptions<T = any> {
  /* 存储类型 */
  storage: StorageType;
  /* 是否持久化 */
  persist: boolean;
  /* 状态变化回调 */
  onChange?: (newState: T, oldState: T) => void;
}

/* 默认配置

*/
const DEFAULT_OPTIONS: EchoOptions = {
  persist: true,
  storage: "localStorage",
};

/**
 * Echo 状态管理类
 */
class Echo<T = Record<string, any>> {
  private readonly store: UseBoundStore<StoreApi<T>>;
  private readonly options: EchoOptions<T>;

  constructor(
    private readonly name: string,
    private readonly defaultValue: T,
    options: Partial<EchoOptions<T>> = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.store = this.initialize();
  }

  /** 获取当前状态 */
  public get current(): T {
    return this.store.getState();
  }

  /** 设置状态 */
  public set(
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace: boolean = false
  ) {
    const oldState = this.current;
    if (replace) {
      this.store.setState(partial as T, true);
    } else {
      this.store.setState(partial as any);
    }
    const newState = this.current;
    if (this.options.onChange) {
      this.options.onChange(newState, oldState);
    }
  }

  public delete(key: keyof T) {
    this.store.setState((state: T) => {
      const newState = { ...state };
      delete (newState as any)[key];
      return newState;
    }, true);
  }

  /** 重置状态 */
  public reset(): void {
    const oldState = this.current;
    this.store.setState(this.defaultValue, true);
    if (this.options.onChange) {
      this.options.onChange(this.defaultValue, oldState);
    }
  }

  /** 使用状态 */
  public use(): T;
  public use<Selected>(selector: (state: T) => Selected): Selected;
  public use<Selected>(selector?: (state: T) => Selected) {
    return selector ? this.store(selector) : this.store();
  }

  /** 初始化状态 */
  private initialize() {
    if (!this.options.persist) {
      const creator: StateCreator<T> = () => ({
        ...this.defaultValue,
      });
      return create<T>(creator);
    }

    return create<T>()(
      persist(() => this.defaultValue, {
        name: this.name,
        storage: createJSONStorage(() =>
          this.options.storage === "localStorage" ? localStorage : localforage
        ),
        merge: (persistedState: any) => {
          return persistedState && Object.keys(persistedState).length > 0
            ? (persistedState as T)
            : this.defaultValue;
        },
      })
    );
  }

  /** 订阅状态变化 */
  public get subscribe() {
    return this.store.subscribe.bind(this.store);
  }
}

export { Echo, type EchoOptions };
