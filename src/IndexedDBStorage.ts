import { StateCreator, StoreApi } from "zustand";
/**
 * IndexedDBStorage 类提供了一个简化的 IndexedDB 存储适配器
 * 用于在浏览器的 IndexedDB 中持久化存储数据
 *
 * @remarks
 * 该类仅负责数据的本地存储，不处理多标签页或设备间的数据同步
 * 每个存储实例对应一个独立的 IndexedDB 数据库
 */
export class IndexedDBStorage {
  /** 数据库版本号 */
  private version = 1;
  /** 对象存储空间名称 */
  private storeName = "state";
  /** IndexedDB 数据库实例 */
  private db: IDBDatabase | null = null;

  /**
   * 创建一个新的 IndexedDBStorage 实例
   * @param storageKey - 存储标识符，用于生成唯一的数据库名称
   */
  constructor(private readonly storageKey: string) {
    this.initDB();
  }

  /**
   * 获取数据库名称
   * @returns 格式化的数据库名称，格式为 `echo-{storageKey}`
   */
  private get dbName() {
    return `echo-${this.storageKey}`;
  }

  /**
   * 初始化 IndexedDB 数据库
   * 如果数据库不存在则创建新数据库，如果存在则打开现有数据库
   * @returns Promise<void> 数据库初始化完成的 Promise
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }

  /**
   * 等待数据库准备就绪
   * 如果数据库未初始化，则进行初始化
   * @returns Promise<void> 数据库就绪的 Promise
   */
  async waitForDB(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }
  }

  /**
   * 从数据库中获取指定键的数据
   * @param key - 要获取的数据的键
   * @returns Promise<T | null> 返回存储的数据，如果不存在则返回 null
   * @throws 如果数据库操作失败则抛出错误
   */
  async getItem<T>(key: string): Promise<T | null> {
    await this.waitForDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const data = request.result;
        if (!data) {
          resolve(null);
        } else {
          // 直接返回存储的值，不进行解析
          resolve(data.value as T);
        }
      };
    });
  }

  /**
   * 将数据存储到数据库中
   * @param key - 要存储的数据的键
   * @param value - 要存储的数据值
   * @returns Promise<void> 存储操作完成的 Promise
   * @throws 如果数据库操作失败则抛出错误
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    await this.waitForDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      // 直接存储值，不进行额外的序列化
      const request = store.put({ id: key, value: value });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * 从数据库中删除指定键的数据
   * @param key - 要删除的数据的键
   * @returns Promise<void> 删除操作完成的 Promise
   * @throws 如果数据库操作失败则抛出错误
   */
  async removeItem(key: string): Promise<void> {
    await this.waitForDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * 销毁数据库实例
   * 关闭数据库连接并删除数据库
   */
  destroy() {
    this.db?.close();
    try {
      indexedDB.deleteDatabase(this.dbName);
    } catch (error) {
      console.error(`Echo: 删除数据库 ${this.dbName} 失败:`, error);
    }
  }
}

/**
 * IndexedDB 配置接口
 * @template S - 存储的状态类型
 */
export interface IndexedDBConfig<S> {
  /** 存储键名 */
  name: string;
  /**
   * 状态恢复完成时的回调函数
   * @param state - 恢复的状态，如果恢复失败则为 null
   */
  onRehydrateStorage?: (state: S | null) => void;
}

/**
 * 创建 IndexedDB 中间件
 * 用于将 Zustand store 的状态持久化到 IndexedDB
 *
 * @template S - store 的状态类型
 * @param storage - IndexedDBStorage 实例
 * @returns 返回一个 Zustand 中间件函数
 *
 * @example
 * ```typescript
 * const storage = new IndexedDBStorage('my-store');
 * const usePersistStore = create(
 *   createIndexedDBMiddleware(storage)({
 *     name: 'store-state',
 *     onRehydrateStorage: (state) => {
 *       console.log('状态已恢复', state);
 *     }
 *   })(
 *     (set) => ({
 *       // your store implementation
 *     })
 *   )
 * );
 * ```
 */
export const createIndexedDBMiddleware =
  <S>(storage: IndexedDBStorage) =>
  (config: IndexedDBConfig<S>) =>
  (next: StateCreator<S>) =>
  (
    set: StoreApi<S>["setState"],
    get: StoreApi<S>["getState"],
    api: StoreApi<S>
  ) => {
    const initialState = next(set, get, api);

    // 初始化时加载数据
    (async () => {
      try {
        const savedState = await storage.getItem<S>(config.name);
        if (savedState !== null) {
          set(savedState as S, true);
          config.onRehydrateStorage?.(savedState);
        } else {
          config.onRehydrateStorage?.(null);
        }
      } catch (error) {
        console.error(`Echo: 加载状态失败:`, error);
        config.onRehydrateStorage?.(null);
      }
    })();

    // 订阅状态变化
    api.subscribe((state: S) => {
      storage.setItem(config.name, state).catch((error) => {
        console.error(`Echo: 保存状态失败:`, error);
      });
    });

    return initialState;
  };
