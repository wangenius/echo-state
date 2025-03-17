/* 监听器类型 */
export type Listener<T> = (state: T) => void;

/* 状态更新器类型 */
export type StateUpdater<T> = (state: T) => Partial<T>;

/* 设置选项类型 */
export type SetOptions = {
  isFromSync?: boolean;
  replace?: boolean;
};

/* 存储适配器接口 */
export interface StorageAdapter {
  /** 获取存储名称 */
  readonly name: string;

  /** 初始化存储 */
  init(): Promise<void>;

  /** 获取数据 */
  getItem<T>(): Promise<T | null>;

  /** 设置数据 */
  setItem<T>(value: T): Promise<void>;

  /** 删除数据 */
  removeItem(): Promise<void>;

  /** 清理资源 */
  destroy(): void;

  close(): void;
}

/* 基础配置选项接口 */
export interface CoreOptions<T = any> {
  /** 状态变化回调函数 */
  onChange?: (newState: T, oldState: T) => void;
  /** 是否启用跨窗口同步 */
  sync?: boolean;
}

/* 存储选项接口 */
export interface StorageOptions extends CoreOptions {
  /** 存储适配器实例 */
  adapter: StorageAdapter;
  /** 是否为临时存储（不持久化） */
  temporary?: boolean;
}

/* 存储配置选项 */
export interface StorageConfig {
  /** 存储名称 */
  name: string;
  /** 是否启用跨窗口同步 */
  sync?: boolean;
}

/* IndexedDB 存储配置选项 */
export interface IndexedDBConfig extends StorageConfig {
  /** 对象存储空间名称 */
  storeName?: string;
}

export interface EchoStorageOptions extends Omit<CoreOptions, "name"> {
  /** 存储名称（数据库名称或 localStorage 的 key） */
  name: string;
  /** 对象存储空间名称（仅用于 IndexedDB） */
  object?: string;
}
