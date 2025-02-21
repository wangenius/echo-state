/**
 * Echo 状态管理类
 * 一个轻量级的状态管理库，支持本地存储、跨窗口同步和 React 集成。
 *
 * 特性：
 * - 支持本地存储 (LocalStorage/IndexedDB)
 * - 支持跨窗口状态同步
 * - 支持 React Hooks 集成
 * - 支持状态订阅
 * - 支持选择器
 */
import { useEffect, useState } from "react";

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
 * Echo 配置选项接口
 */
interface EchoOptions<T = any> {
  /** 状态名称，用于持久化存储，如果不提供则不会持久化 */
  name?: string;
  /** 存储类型，可选 localStorage 或 indexedDB，默认为 localStorage */
  storage?: "localStorage" | "indexedDB";
  /** 状态变化回调函数，在每次状态更新后调用 */
  onChange?: (state: T) => void;
  /** 是否启用跨窗口同步，需要提供 name 选项才能生效 */
  sync?: boolean;
}

// 存储接口
interface Storage {
  /* 获取指定键的值 */
  getItem<T>(key: string): Promise<T | null>;
  /* 设置指定键的值 */
  setItem<T>(key: string, value: T): Promise<void>;
  /* 删除指定键的值 */
  removeItem(key: string): Promise<void>;
}

// IndexedDB 存储实现
class IndexedDBStorage implements Storage {
  private db: IDBDatabase | null = null;
  private readonly storeName = "echo-store";

  constructor(private readonly dbName: string) {
    this.init();
  }

  private async init(): Promise<void> {
    if (this.db) return;

    this.db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async getItem<T>(key: string): Promise<T | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeItem(key: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// LocalStorage 存储实现
class LocalStorageAdapter implements Storage {
  async getItem<T>(key: string): Promise<T | null> {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}

/**
 * Echo 状态管理类
 * 提供了状态管理、持久化存储和状态订阅等功能
 */
class Echo<T extends Record<string, any>> {
  /** 当前状态 */
  private state: T;
  /** 监听器集合 */
  private listeners: Set<Listener<T>> = new Set();
  /** 存储实例 */
  private storage: Storage;
  /** 跨窗口同步通道 */
  private syncChannel: BroadcastChannel | null = null;
  /** 是否正在恢复状态 */
  private isHydrating = false;
  /** 用于 React Hooks 的 hook 函数 */
  private hookRef:
    | (<Selected = T>(selector?: (state: T) => Selected) => Selected)
    | null = null;

  constructor(
    private readonly defaultState: T,
    private readonly options: EchoOptions<T> = {}
  ) {
    this.state = { ...defaultState };

    // 初始化存储
    this.storage =
      options.storage === "indexedDB" && options.name
        ? new IndexedDBStorage(options.name)
        : new LocalStorageAdapter();

    // 初始化持久化
    if (options.name) {
      this.hydrate();
    }

    // 初始化同步
    if (options.sync && options.name) {
      this.initSync();
    }

    // 创建 hook 函数
    this.hookRef = this.createHook();
  }

  private async hydrate(): Promise<void> {
    if (!this.options.name) return;

    try {
      const savedState = await this.storage.getItem<T>(this.options.name);
      if (savedState) {
        this.isHydrating = true;
        this.set(savedState);
        this.isHydrating = false;
      } else {
        await this.storage.setItem(this.options.name, this.state);
      }
    } catch (error) {
      console.error("Echo: 状态恢复失败", error);
    }
  }

  private initSync(): void {
    if (!this.options.name || typeof window === "undefined") return;

    try {
      this.syncChannel = new BroadcastChannel(`echo-${this.options.name}`);
      this.syncChannel.onmessage = async (event) => {
        if (event.data?.type === "state-update") {
          // 确保使用 replace 模式来更新状态
          this.set(event.data.state, { isFromSync: true, replace: true });

          // 确保存储也被更新
          if (this.options.name) {
            await this.storage.setItem(this.options.name, event.data.state);
          }
        }
      };
    } catch (error) {
      console.warn("Echo: 跨窗口同步初始化失败", error);
    }
  }

  set(nextState: Partial<T> | StateUpdater<T>, options: SetOptions = {}): void {
    /* 如果 nextState 是函数，则执行函数并返回新状态 */
    const newState =
      typeof nextState === "function"
        ? (nextState as StateUpdater<T>)(this.state)
        : nextState;

    /* 如果 replace 为 true，则直接使用新状态，否则合并新状态 */
    const finalState = options.replace
      ? (newState as T)
      : { ...this.state, ...newState };

    /* 深度比较状态变化 */
    const hasChanged = !this.isEqual(this.state, finalState);

    /* 如果状态没有变化，则不更新 */
    if (!hasChanged) return;

    /* 更新状态 */
    this.state = finalState;

    /* 先进行持久化存储 */
    if (this.options.name && !this.isHydrating) {
      this.storage.setItem(this.options.name, this.state).catch((error) => {
        console.error("Echo: 状态保存失败", error);
      });
    }

    /* 跨窗口同步 - 确保在存储之后进行 */
    if (this.syncChannel && !options.isFromSync && !this.isHydrating) {
      this.syncChannel.postMessage({
        type: "state-update",
        state: this.state,
      });
    }

    /* 通知监听器 */
    this.listeners.forEach((listener) => listener(this.state));

    /* 触发 onChange 回调 */
    if (this.options.onChange) {
      this.options.onChange(this.state);
    }
  }

  /* 添加深度比较方法 */
  private isEqual(obj1: any, obj2: any): boolean {
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

  /**
   * 删除指定键的值，调用set方法，并传入一个函数，函数返回一个新状态，新状态中不包含指定键的值
   */
  delete(key: string): void {
    this.set(
      (state) => {
        const newState = { ...state };
        delete newState[key];
        return newState;
      },
      { replace: true }
    );
  }

  /**
   * 获取当前状态
   */
  public get current(): T {
    return this.state;
  }

  /**
   * 重置状态
   */
  public reset(): void {
    this.set(this.defaultState, { replace: true });
  }

  /**
   * 订阅状态变化
   */
  public subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.listeners.clear();
    this.syncChannel?.close();

    if (this.options.name) {
      if (this.options.storage === "indexedDB") {
        indexedDB.deleteDatabase(`echo-${this.options.name}`);
      } else {
        localStorage.removeItem(this.options.name);
      }
    }
  }

  /** 添加监听器 */
  public addListener(listener: Listener<T>): void {
    this.listeners.add(listener);
  }

  /** 移除监听器 */
  public removeListener(listener: Listener<T>): void {
    this.listeners.delete(listener);
  }

  /**
   * 创建 React Hook
   */
  private createHook() {
    const self = this;
    return function useEcho<Selected = T>(
      selector?: (state: T) => Selected
    ): Selected {
      const [, forceUpdate] = useState({});

      useEffect(() => {
        const listener = () => forceUpdate({});
        self.addListener(listener);
        return () => {
          self.removeListener(listener);
        };
      }, []);

      /* 获取当前状态 */
      const state = self.current;
      return selector ? selector(state) : (state as unknown as Selected);
    };
  }

  /**
   * 使用状态（用于 React 组件）
   */
  public use<Selected = T>(selector?: (state: T) => Selected): Selected {
    if (!this.hookRef) {
      throw new Error("Hook is not initialized");
    }
    return this.hookRef(selector);
  }
}

// 不再需要 createEcho 函数
export { Echo, type EchoOptions };
