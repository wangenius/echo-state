import { StorageAdapter, StorageConfig } from "../core/types";

/**
 * LocalStorage 存储适配器
 */
export class LocalStorageAdapter<T = any> implements StorageAdapter<T> {
  constructor(private readonly config: StorageConfig) {}

  get name(): string {
    return this.config.name;
  }

  async init(): Promise<void> {
    // LocalStorage 不需要特殊初始化
  }

  async getItem(): Promise<T | null> {
    const value = localStorage.getItem(this.name);
    return value ? JSON.parse(value) : null;
  }

  async setItem(value: T): Promise<void> {
    localStorage.setItem(this.name, JSON.stringify(value));
  }

  async removeItem(): Promise<void> {
    localStorage.removeItem(this.name);
  }

  destroy(): void {
    this.removeItem();
  }

  close(): void {
    // LocalStorage 不需要特殊关闭
  }
}
