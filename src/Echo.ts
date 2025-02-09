/**
 * Echo 状态管理类
 * 用于管理全局状态，支持持久化
 */

import localforage from "localforage";
import { create, StateCreator, StoreApi, UseBoundStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/* Echo 配置 */
interface EchoOptions<T = any> {
  config?: LocalForageOptions;
  /* 状态变化回调 */
  onChange?: (newState: T, oldState: T) => void;
}

/**
 * Echo 状态管理类
 */
class Echo<T = Record<string, any>> {
  /* 状态管理器, 用于管理状态 */
  private readonly store: UseBoundStore<StoreApi<T>>;
  private forage: LocalForage | undefined;
  /** 构造函数
   * @param defaultValue 默认状态
   * @param options 配置
   * @param options.name 状态名称
   * @param options.storage 存储类型
   * @param options.onChange 状态变化回调
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
      this.store.setState(partial);
    }
    const newState = this.current;
    if (this.options.onChange) {
      this.options.onChange(newState, oldState);
    }
  }

  /** 删除状态 */
  public delete(key: keyof T) {
    this.store.setState((state: T) => {
      const newState = { ...state };
      delete newState[key];
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
        })
      );
    }
  }

  /** 订阅状态变化
   * @param listener 状态变化回调
   * @returns 订阅函数
   */
  public subscribe(listener: (state: T, oldState: T) => void) {
    return this.store.subscribe(listener);
  }

  public storage(config: LocalForageOptions) {
    localforage.config(config);
  }

  /** 从持久化存储中重新加载数据
   * @returns Promise<T> 加载的数据
   */
  public async load(): Promise<T> {
    if (!this.forage) {
      return this.current;
    }

    try {
      const storageKey = `${this.forage.config().name}`;
      const data = await this.forage.getItem<{ state: T }>(storageKey);

      if (data?.state) {
        const oldState = this.current;
        this.store.setState(data.state, true);
        if (this.options.onChange) {
          this.options.onChange(data.state, oldState);
        }
        return data.state;
      }
      return this.current;
    } catch (error) {
      console.error("Failed to load data from storage:", error);
      return this.current;
    }
  }
}

export { Echo, type EchoOptions };
