/**
 * Echo 状态管理类
 * 一个轻量级的状态管理库，支持本地存储。基于 zustand 的状态管理解决方案。
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
 *     name: "userStore"
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

import { create, StateCreator, StoreApi, UseBoundStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Echo 配置选项接口
 * @interface EchoOptions
 * @template T - 状态类型
 */
interface EchoOptions<T = any> {
  /**
   * 状态名称, 如果提供此配置，状态将被持久化存储
   */
  name?: string;

  /**
   * 状态变化回调函数
   * @param newState - 新状态
   * @param oldState - 旧状态
   */
  onChange?: (newState: T, oldState: T) => void;

  /**
   * 是否启用跨窗口同步
   */
  sync?: boolean;
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
  /* 广播通道，用于跨窗口通信 */
  private channel: BroadcastChannel | null = null;
  /* 最后一次同步的状态哈希值 */
  private lastSyncHash: string | null = null;

  /**
   * 构造函数
   * @param defaultValue - 默认状态值
   * @param options - Echo 配置选项
   * @param options.name - 存储名称，用于持久化存储
   * @param options.onChange - 状态变化回调函数
   * @param options.sync - 是否启用跨窗口同步
   *
   * @example
   * ```typescript
   * const store = new Echo({ count: 0 }, {
   *   name: 'myStore',
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
    this.store = this.initialize();
    if (this.options.sync) {
      this.initializeSync();
    }
  }

  /**
   * 获取当前状态
   * @returns 当前状态值
   */
  public get current(): T {
    return this.store.getState();
  }

  /**
   * 计算状态的哈希值
   * @param state - 状态对象
   * @returns 哈希字符串
   */
  private getStateHash(state: T): string {
    return JSON.stringify(state);
  }

  /**
   * 发送同步消息
   * @param newState - 新状态
   */
  private broadcastState(newState: T) {
    if (!this.channel || !this.options.sync) {
      return;
    }

    const hash = this.getStateHash(newState);
    if (hash === this.lastSyncHash) {
      return;
    }

    try {
      this.channel.postMessage({
        type: "state-update",
        state: newState,
        timestamp: Date.now(),
      });
      this.lastSyncHash = hash;
    } catch (error) {
      console.error("Echo: 发送同步消息失败", error);
    }
  }

  /**
   * 设置状态
   * @param partial - 新的状态值或更新函数
   * @param replace - 是否完全替换状态，默认为 false
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

    // 直接广播状态变化
    if (this.channel) {
      this.broadcastState(newState);
    }

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

  /**
   * 初始化状态
   * @returns 状态管理器
   */
  private initialize() {
    if (!this.options.name) {
      const creator: StateCreator<T> = () => ({
        ...this.defaultValue,
      });
      return create<T>(creator);
    } else {
      const name = this.options.name;
      return create<T>()(
        persist(() => this.defaultValue, {
          name,
          storage: createJSONStorage(() => localStorage),
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
   * 控制跨窗口同步状态
   * @param enabled - 是否启用同步
   */
  public sync(enabled: boolean = true): this {
    if (enabled === (this.channel !== null)) {
      return this;
    }

    if (enabled) {
      this.initializeSync();
    } else {
      if (this.channel) {
        try {
          this.channel.close();
        } catch (error) {
          console.error("Echo: 关闭同步通道失败", error);
        }
        this.channel = null;
      }
      this.lastSyncHash = null;
    }
    return this;
  }

  /** 初始化跨窗口同步 */
  private initializeSync() {
    if (!this.options.name) {
      console.warn("Echo: 无法初始化同步 - 需要提供 name 选项");
      return;
    }

    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
      console.warn("Echo: 当前环境不支持 BroadcastChannel");
      return;
    }

    try {
      const channelName = `echo-${this.options.name}`;
      this.channel = new BroadcastChannel(channelName);

      this.channel.onmessage = (event) => {
        try {
          if (event.data?.type === "state-update" && event.data?.state) {
            const hash = this.getStateHash(event.data.state);
            if (hash !== this.lastSyncHash) {
              this.lastSyncHash = hash;
              this.store.setState(event.data.state, true);
            }
          }
        } catch (error) {
          console.error("Echo: 处理同步消息时出错", error);
        }
      };

      // 发送初始状态
      this.broadcastState(this.current);

      console.log(`Echo: 成功初始化同步 (${channelName})`);
    } catch (error) {
      console.error("Echo: 初始化同步失败", error);
      this.channel = null;
    }
  }
}

export { Echo, type EchoOptions };
