/**
 * Echo 状态管理类
 * 一个轻量级的状态管理库，支持多种存储模式和状态管理功能
 *
 * 特性：
 * - 支持多种存储模式（临时、LocalStorage、IndexedDB）
 * - 支持跨窗口状态同步
 * - 支持 React Hooks 集成
 * - 支持状态订阅
 * - 支持选择器
 */
import { useEffect, useState } from "react";
import { StorageAdapter, StorageConfig, IndexedDBConfig } from "./types";
import { IndexedDBAdapter } from "../storage/IndexedDBAdapter";
import { LocalStorageAdapter } from "../storage/LocalStorageAdapter";

/* 监听器类型 */
type Listener<T> = (state: T) => void;
/* 状态更新器类型 */
type StateUpdater<T> = (state: T) => Partial<T>;
/* 设置选项类型 */
type SetOptions = {
  isFromSync?: boolean;
  replace?: boolean;
};

/**
 * Echo 状态管理类
 * 一个轻量级的状态管理库，支持多种存储模式和状态管理功能
 *
 * 特性：
 * - 支持多种存储模式（临时、LocalStorage、IndexedDB）
 * - 支持跨窗口状态同步
 * - 支持 React Hooks 集成
 * - 支持状态订阅
 * - 支持选择器
 */
export class Echo<T extends Record<string, any>> {
  /** 当前状态 */
  protected state: T;
  /** 初始化完成的Promise */
  protected readyPromise: Promise<void>;
  /** 是否已经完成初始化 */
  protected isInitialized = false;
  /** 监听器集合 */
  protected listeners: Set<Listener<T>> = new Set();
  /** 存储适配器 */
  protected storageAdapter: StorageAdapter | null = null;
  /** 跨窗口同步通道 */
  protected syncChannel: BroadcastChannel | null = null;
  /** 是否正在恢复状态 */
  protected isHydrating = false;
  /** 用于 React Hooks 的 hook 函数 */
  private hookRef:
    | (<Selected = T>(selector?: (state: T) => Selected) => Selected)
    | null = null;

  constructor(protected readonly defaultState: T) {
    this.state = { ...defaultState };
    this.readyPromise = Promise.resolve();
    this.hookRef = this.createHook();
  }

  protected async hydrate(): Promise<void> {
    if (!this.storageAdapter) return;

    try {
      const savedState = await this.storageAdapter.getItem<T>();
      if (savedState) {
        this.isHydrating = true;
        this.set(savedState);
        this.isHydrating = false;
      } else {
        this.state = { ...this.defaultState };
        await this.storageAdapter.setItem(this.state);
      }
      this.isInitialized = true;
    } catch (error) {
      console.error("Echo Core: 状态恢复失败", error);
    }
  }

  protected initSync(name: string): void {
    try {
      this.syncChannel = new BroadcastChannel(`echo-${name}`);
      this.syncChannel.onmessage = async (event) => {
        if (event.data?.type === "state-update") {
          this.set(event.data.state, { isFromSync: true, replace: true });
          if (this.storageAdapter) {
            await this.storageAdapter.setItem(event.data.state);
          }
        } else if (event.data?.type === "state-delete") {
          this.set(
            (state) => {
              const newState = { ...state };
              delete newState[event.data.key];
              return newState;
            },
            { isFromSync: true, replace: true }
          );
          if (this.storageAdapter) {
            await this.storageAdapter.setItem(this.state);
          }
        }
      };
    } catch (error) {
      console.warn("Echo Core: 跨窗口同步初始化失败", error);
    }
  }

  public set(
    nextState: Partial<T> | StateUpdater<T>,
    options: SetOptions = {}
  ): void {
    const oldState = this.state;
    const newState =
      typeof nextState === "function"
        ? (nextState as StateUpdater<T>)(this.state)
        : nextState;

    const finalState = options.replace
      ? (newState as T)
      : { ...this.state, ...newState };

    const hasChanged = !this.isEqual(oldState, finalState);
    if (!hasChanged) return;

    this.state = finalState;

    if (!this.isHydrating && this.storageAdapter) {
      this.storageAdapter.setItem(this.state).catch((error) => {
        console.error("Echo Core: 状态保存失败", error);
      });
    }

    if (this.syncChannel && !options.isFromSync && !this.isHydrating) {
      this.syncChannel.postMessage({
        type: "state-update",
        state: this.state,
      });
    }

    this.listeners.forEach((listener) => listener(this.state));
  }

  protected isEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (
      typeof obj1 !== "object" ||
      typeof obj2 !== "object" ||
      obj1 === null ||
      obj2 === null
    )
      return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    return keys1.every(
      (key) => keys2.includes(key) && this.isEqual(obj1[key], obj2[key])
    );
  }

  public delete(key: string): void {
    const oldState = this.state;
    const newState = { ...this.state };
    delete newState[key];

    const hasChanged = !this.isEqual(oldState, newState);
    if (!hasChanged) return;

    this.state = newState;

    if (!this.isHydrating && this.storageAdapter) {
      this.storageAdapter.setItem(this.state).catch((error) => {
        console.error("Echo Core: 状态保存失败", error);
      });
    }

    if (this.syncChannel && !this.isHydrating) {
      this.syncChannel.postMessage({
        type: "state-delete",
        key: key,
      });
    }

    this.listeners.forEach((listener) => listener(this.state));
  }

  public async ready(): Promise<void> {
    return this.readyPromise;
  }

  public async getCurrent(): Promise<T> {
    await this.ready();
    return this.state;
  }

  public get current(): T {
    if (!this.isInitialized) {
      throw new Error(
        "Echo Core: 请使用 getCurrent() 方法或等待 ready() Promise 完成"
      );
    }
    return this.state;
  }

  public reset(): void {
    this.set(this.defaultState, { replace: true });
  }

  public subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public addListener(listener: Listener<T>): void {
    this.listeners.add(listener);
  }

  public removeListener(listener: Listener<T>): void {
    this.listeners.delete(listener);
  }

  private createHook() {
    const self = this;
    return function useEchoCore<Selected = T>(
      selector?: (state: T) => Selected
    ): Selected {
      const [state, setState] = useState<T | null>(
        self.isInitialized ? self.state : null
      );

      const [, forceUpdate] = useState({});

      useEffect(() => {
        // 每次组件挂载或重新渲染时，检查初始化状态
        let isMounted = true;

        // 立即设置当前状态（如果已初始化）
        if (self.isInitialized) {
          setState(self.state);
        }

        // 无论如何都等待ready完成，以处理可能的存储模式切换
        self.ready().then(() => {
          if (isMounted) {
            setState(self.state);
            forceUpdate({});
          }
        });

        return () => {
          isMounted = false;
        };
      }, []);

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

      if (state === null) {
        return selector
          ? selector(self.defaultState)
          : (self.defaultState as unknown as Selected);
      }

      return selector ? selector(state) : (state as unknown as Selected);
    };
  }

  public use<Selected = T>(selector?: (state: T) => Selected): Selected {
    if (!this.hookRef) {
      throw new Error("Hook 未初始化");
    }
    return this.hookRef(selector);
  }

  /**
   * 使用 LocalStorage 模式
   * @param config 存储配置
   */
  public localStorage(config: StorageConfig): this {
    this.cleanup();
    this.storageAdapter = new LocalStorageAdapter(config);
    this.readyPromise = this.hydrate();

    if (config.sync) {
      this.initSync(config.name);
    }

    return this;
  }

  /**
   * 使用 IndexedDB 模式
   * @param config IndexedDB 配置
   */
  public indexed(config: IndexedDBConfig): this {
    this.cleanup();
    this.storageAdapter = new IndexedDBAdapter(config);

    // 保存当前Promise以便可以等待它完成
    const hydratePromise = this.hydrate();
    this.readyPromise = hydratePromise;

    if (config.sync) {
      this.initSync(config.name);
    }

    // 确保在hydrate完成后通知所有监听器
    hydratePromise
      .then(() => {
        // 只有在初始化完成后才通知监听器
        if (this.isInitialized) {
          this.listeners.forEach((listener) => listener(this.state));
        }
      })
      .catch((error) => {
        console.error("Echo Core: 数据库初始化失败", error);
      });

    return this;
  }

  /**
   * 使用临时存储模式（不持久化）
   */
  public temporary(): this {
    this.cleanup();
    this.readyPromise = Promise.resolve();
    return this;
  }

  /**
   * 清理资源，
   * 持久化数据不会消失
   */
  private cleanup(): void {
    this.syncChannel?.close();
    this.syncChannel = null;
    this.storageAdapter?.close();
    this.storageAdapter = null;
    this.isInitialized = false;
  }

  /**
   * 销毁实例,
   * 持久化数据也会消失
   */
  public destroy(): void {
    this.cleanup();
    this.storageAdapter?.destroy();
  }
}

// 导出类型
export type { StorageConfig, IndexedDBConfig };
