import { IndexedDBAdapter } from "../storage/IndexedDBAdapter";
import { useEffect, useState } from "react";

/**
 * EchoStore 类
 * 用于管理 IndexedDB 存储的简单接口
 */
export class EchoStore<T = any> {
  private adapter: IndexedDBAdapter<T>;
  /** 监听器集合 */
  private listeners: Set<(data: T[]) => void> = new Set();
  /** 用于 React Hooks 的 hook 函数 */
  private hookRef: ((selector?: (data: T[]) => any) => any) | null = null;

  constructor(database: string, objectStore: string = "echo-state") {
    this.adapter = new IndexedDBAdapter<T>({
      name: "store",
      database,
      object: objectStore,
    });
    this.hookRef = this.createHook();
  }

  /**
   * 订阅数据变化
   * @param listener 监听器函数
   * @returns 取消订阅的函数
   */
  public subscribe(listener: (data: T[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 添加监听器
   * @param listener 监听器函数
   */
  public addListener(listener: (data: T[]) => void): void {
    this.listeners.add(listener);
  }

  /**
   * 移除监听器
   * @param listener 监听器函数
   */
  public removeListener(listener: (data: T[]) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(data: T[]): void {
    this.listeners.forEach((listener) => listener(data));
  }

  /**
   * 创建 React Hook
   */
  private createHook() {
    const self = this;
    return function useEchoStore<Selected = T[]>(
      selector?: (data: T[]) => Selected
    ): Selected {
      const [data, setData] = useState<T[]>([]);

      useEffect(() => {
        let isMounted = true;

        // 立即获取数据
        self.list().then((result) => {
          if (isMounted) {
            setData(result);
          }
        });

        // 添加监听器
        const listener = (newData: T[]) => {
          if (isMounted) {
            setData(newData);
          }
        };
        self.addListener(listener);

        return () => {
          isMounted = false;
          self.removeListener(listener);
        };
      }, []);

      return selector ? selector(data) : (data as unknown as Selected);
    };
  }

  /**
   * React Hook 方法
   * @param selector 可选的选择器函数
   * @returns 选择的数据或完整数据
   */
  public use<Selected = T[]>(selector?: (data: T[]) => Selected): Selected {
    if (!this.hookRef) {
      throw new Error("Hook 未初始化");
    }
    return this.hookRef(selector);
  }

  /**
   * 获取所有存储的数据
   * @returns Promise<T[]> 所有存储的数据
   */
  async list(): Promise<T[]> {
    await this.adapter.init();
    return new Promise((resolve, reject) => {
      const db = (this.adapter as any).db;
      if (!db) {
        reject(new Error("数据库未初始化"));
        return;
      }

      const transaction = db.transaction(this.adapter.getObjectStoreName(), "readonly");
      const store = transaction.objectStore(this.adapter.getObjectStoreName());
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result;
        this.notifyListeners(result);
        resolve(result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 获取指定 key 的数据
   * @param key 存储的键名
   * @returns Promise<T | null> 存储的数据
   */
  async get(key: string): Promise<T | null> {
    await this.adapter.init();
    return new Promise((resolve, reject) => {
      const db = (this.adapter as any).db;
      if (!db) {
        reject(new Error("数据库未初始化"));
        return;
      }

      const transaction = db.transaction(this.adapter.getObjectStoreName(), "readonly");
      const store = transaction.objectStore(this.adapter.getObjectStoreName());
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 设置指定 key 的数据
   * @param key 存储的键名
   * @param value 要存储的数据
   * @returns Promise<void>
   */
  async set(key: string, value: T): Promise<void> {
    await this.adapter.init();
    return new Promise((resolve, reject) => {
      const db = (this.adapter as any).db;
      if (!db) {
        reject(new Error("数据库未初始化"));
        return;
      }

      const transaction = db.transaction(this.adapter.getObjectStoreName(), "readwrite");
      const store = transaction.objectStore(this.adapter.getObjectStoreName());
      const request = store.put(value, key);

      request.onsuccess = async () => {
        // 更新后重新获取所有数据并通知监听器
        await this.list();
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 删除指定 key 的数据
   * @param key 要删除的键名
   * @returns Promise<void>
   */
  async delete(key: string): Promise<void> {
    await this.adapter.init();
    return new Promise((resolve, reject) => {
      const db = (this.adapter as any).db;
      if (!db) {
        reject(new Error("数据库未初始化"));
        return;
      }

      const transaction = db.transaction(this.adapter.getObjectStoreName(), "readwrite");
      const store = transaction.objectStore(this.adapter.getObjectStoreName());
      const request = store.delete(key);

      request.onsuccess = async () => {
        // 删除后重新获取所有数据并通知监听器
        await this.list();
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 清空所有数据
   * @returns Promise<void>
   */
  async clear(): Promise<void> {
    await this.adapter.init();
    return new Promise((resolve, reject) => {
      const db = (this.adapter as any).db;
      if (!db) {
        reject(new Error("数据库未初始化"));
        return;
      }

      const transaction = db.transaction(this.adapter.getObjectStoreName(), "readwrite");
      const store = transaction.objectStore(this.adapter.getObjectStoreName());
      const request = store.clear();

      request.onsuccess = () => {
        this.notifyListeners([]);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.adapter.close();
  }

  /**
   * 销毁数据库
   */
  destroy(): void {
    this.adapter.destroy();
  }
} 