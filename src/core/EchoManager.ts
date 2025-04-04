import { useEffect, useState } from "react";

/**
 * EchoManager 类
 * 用于管理数据订阅和通知
 */
export class EchoManager {
  /** 静态监听器集合，用于存储所有数据库的监听器 */
  private static listeners = new Map<string, Set<(data: any[]) => void>>();
  /** 静态 Hook 函数缓存 */
  private static hooks = new Map<string, ((selector?: (data: any[]) => any) => any) | null>();

  /**
   * 获取数据库的唯一标识
   */
  private static getKey(database: string, objectStore: string = "echo-state"): string {
    return `${database}:${objectStore}`;
  }

  /**
   * 获取或创建监听器集合
   */
  private static getListeners<T>(database: string, objectStore: string = "echo-state"): Set<(data: T[]) => void> {
    const key = this.getKey(database, objectStore);
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    return this.listeners.get(key)!;
  }

  /**
   * 订阅数据变化
   */
  public static subscribe<T>(
    database: string,
    objectStore: string = "echo-state",
    listener: (data: T[]) => void
  ): () => void {
    const listeners = this.getListeners<T>(database, objectStore);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(this.getKey(database, objectStore));
      }
    };
  }

  /**
   * 通知所有监听器
   */
  public static notify<T>(database: string, objectStore: string = "echo-state", data: T[]): void {
    const listeners = this.getListeners<T>(database, objectStore);
    listeners.forEach(listener => listener(data));
  }

  /**
   * 创建 React Hook
   */
  private static createHook<T>(database: string, objectStore: string = "echo-state") {
    return function useEchoManager<Selected = T[]>(
      selector?: (data: T[]) => Selected
    ): Selected {
      const [data, setData] = useState<T[]>([]);
      const [, forceUpdate] = useState({});

      useEffect(() => {
        let isMounted = true;

        // 添加监听器
        const listener = (newData: T[]) => {
          if (isMounted) {
            setData(newData);
            forceUpdate({});
          }
        };
        EchoManager.subscribe(database, objectStore, listener);

        return () => {
          isMounted = false;
        };
      }, []);

      return selector ? selector(data) : (data as unknown as Selected);
    };
  }

  /**
   * React Hook 方法
   */
  public static use<T, Selected = T[]>(
    database: string,
    objectStore: string = "echo-state",
    selector?: (data: T[]) => Selected
  ): Selected {
    const key = this.getKey(database, objectStore);
    if (!this.hooks.has(key)) {
      this.hooks.set(key, this.createHook<T>(database, objectStore));
    }
    const hook = this.hooks.get(key);
    if (!hook) {
      throw new Error("Hook not initialized");
    }
    return hook(selector);
  }
} 