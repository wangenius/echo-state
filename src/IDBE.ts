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
 * IndexedEcho 配置选项接口
 */
export interface IDBEOptions<T = any> {
  /** 状态名称，用于持久化存储 */
  database: string;
  /** 对象存储空间名称 */
  object?: string;
  /** 状态变化回调函数，在每次状态更新后调用 */
  onChange?: (newState: T, oldState: T) => void;
  /** 是否启用跨窗口同步 */
  sync?: boolean;
}

/**
 * IndexedEcho 状态管理类
 * 专门使用 IndexedDB 实现的轻量级状态管理库
 *
 * 特性：
 * - 使用 IndexedDB 进行持久化存储
 * - 支持跨窗口状态同步
 * - 支持 React Hooks 集成
 * - 支持状态订阅
 * - 支持选择器
 */
export class IDBE<T extends Record<string, any>> {
  /** 当前状态 */
  private state: T;
  /** 初始化完成的Promise */
  private readyPromise: Promise<void>;
  /** 是否已经完成初始化 */
  private isInitialized = false;
  /** 监听器集合 */
  private listeners: Set<Listener<T>> = new Set();
  /** 数据库实例 */
  private database: IDBDatabase | null = null;
  /** 数据库名称 */
  private dbName: string;
  /** 存储对象名称 */
  private storeName: string;
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
    private readonly options: IDBEOptions<T>
  ) {
    this.state = { ...defaultState };
    this.dbName = options.database;
    this.storeName = options.object || "ECHO-STORE";

    // 初始化ready Promise
    this.readyPromise = this.initialize();

    // 创建 hook 函数
    this.hookRef = this.createHook();
  }

  private async initialize(): Promise<void> {
    try {
      // 如果 database 为空字符串，跳过数据库初始化
      if (this.dbName !== "") {
        await this.initDB();
        await this.hydrate();

        // 初始化同步
        if (this.options.sync) {
          this.initSync();
        }
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("IndexedEcho: 初始化失败", error);
      throw error;
    }
  }

  private async initDB(): Promise<void> {
    if (this.database) return;

    this.database = await new Promise((resolve, reject) => {
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

  private async hydrate(): Promise<void> {
    try {
      const savedState = await this.getItem<T>(this.options.database);
      if (savedState) {
        this.isHydrating = true;
        this.set(savedState);
        this.isHydrating = false;
      } else {
        await this.setItem(this.options.database, this.state);
      }
    } catch (error) {
      console.error("IndexedEcho: 状态恢复失败", error);
    }
  }

  private initSync(): void {
    if (typeof window === "undefined") return;

    try {
      this.syncChannel = new BroadcastChannel(this.options.database);
      this.syncChannel.onmessage = async (event) => {
        if (event.data?.type === "state-update") {
          this.set(event.data.state, { isFromSync: true, replace: true });
          await this.setItem(this.options.database, event.data.state);
        } else if (event.data?.type === "state-delete") {
          this.set(
            (state) => {
              const newState = { ...state };
              delete newState[event.data.key];
              return newState;
            },
            { isFromSync: true, replace: true }
          );
          await this.setItem(this.options.database, this.state);
        }
      };
    } catch (error) {
      console.warn("IndexedEcho: 跨窗口同步初始化失败", error);
    }
  }

  private async getItem<T>(key: string): Promise<T | null> {
    if (this.dbName === "") return null;
    await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = this.database!.transaction(
        this.storeName,
        "readonly"
      );
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async setItem<T>(key: string, value: T): Promise<void> {
    if (this.dbName === "") return;
    await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = this.database!.transaction(
        this.storeName,
        "readwrite"
      );
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async removeItem(key: string): Promise<void> {
    if (this.dbName === "") return;
    await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = this.database!.transaction(
        this.storeName,
        "readwrite"
      );
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  set(nextState: Partial<T> | StateUpdater<T>, options: SetOptions = {}): void {
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

    if (!this.isHydrating && this.dbName !== "") {
      this.setItem(this.options.database, this.state).catch((error) => {
        console.error("IndexedEcho: 状态保存失败", error);
      });
    }

    if (this.syncChannel && !options.isFromSync && !this.isHydrating) {
      this.syncChannel.postMessage({
        type: "state-update",
        state: this.state,
      });
    }

    this.listeners.forEach((listener) => listener(this.state));

    if (this.options.onChange) {
      this.options.onChange(this.state, oldState);
    }
  }

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

  delete(key: string): void {
    const oldState = this.state;
    const newState = { ...this.state };
    delete newState[key];

    const hasChanged = !this.isEqual(oldState, newState);

    if (!hasChanged) return;

    this.state = newState;

    if (!this.isHydrating && this.dbName !== "") {
      this.setItem(this.options.database, this.state).catch((error) => {
        console.error("IndexedEcho: 状态保存失败", error);
      });
    }

    if (this.syncChannel && !this.isHydrating) {
      this.syncChannel.postMessage({
        type: "state-delete",
        key: key,
      });
    }

    this.listeners.forEach((listener) => listener(this.state));

    if (this.options.onChange) {
      this.options.onChange(this.state, oldState);
    }
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
        "IndexedEcho: 请使用 getCurrent() 方法或等待 ready() Promise 完成"
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

  public destroy(): void {
    this.listeners.clear();
    this.syncChannel?.close();
    indexedDB.deleteDatabase(this.dbName);
  }

  public addListener(listener: Listener<T>): void {
    this.listeners.add(listener);
  }

  public removeListener(listener: Listener<T>): void {
    this.listeners.delete(listener);
  }

  private createHook() {
    const self = this;
    return function useIndexedEcho<Selected = T>(
      selector?: (state: T) => Selected
    ): Selected {
      const [state, setState] = useState<T | null>(
        self.isInitialized ? self.state : null
      );

      const [, forceUpdate] = useState({});

      useEffect(() => {
        if (self.isInitialized) {
          setState(self.state);
          return;
        }

        let isMounted = true;
        self.ready().then(() => {
          if (isMounted) {
            setState(self.state);
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
   * 切换数据库
   * @param name 新的数据库名称
   */
  public async switchDB(name: string): Promise<void> {
    const oldName = this.dbName;

    // 如果当前数据库不为空，需要关闭连接并清理
    if (oldName !== "") {
      this.database?.close();
      this.database = null;
    }

    // 更新数据库名称
    this.dbName = name;

    // 重新初始化
    this.isInitialized = false;
    // 重置状态为默认值
    this.state = { ...this.defaultState };
    this.readyPromise = this.initialize();

    // 更新同步通道
    if (this.syncChannel) {
      this.syncChannel.close();
      // 只有在新数据库名不为空时才重新初始化同步
      if (name !== "") {
        this.initSync();
      } else {
        this.syncChannel = null;
      }
    }

    // 通知所有监听器
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * 切换对象存储空间
   * @param name 新的对象存储空间名称
   */
  public async switchObject(name: string): Promise<void> {
    // 更新存储对象名称
    this.storeName = name;

    // 关闭当前数据库连接
    this.database?.close();
    this.database = null;

    // 重新初始化
    this.isInitialized = false;
    // 重置状态为默认值
    this.state = { ...this.defaultState };
    this.readyPromise = this.initialize();

    // 通知所有监听器
    this.listeners.forEach((listener) => listener(this.state));
  }
}
