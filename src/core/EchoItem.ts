import { Echo } from "./Echo";
import { IndexedDBConfig } from "./types";

/**
 * EchoItem 基类
 * 一个基于 Echo 的状态管理基类，专注于单个数据项的管理
 * 
 * 特性：
 * - 基于 Echo 的状态管理
 * - 支持单个数据项的 CRUD 操作
 * - 支持 IndexedDB 持久化存储
 * - 支持数据项切换
 */
export abstract class EchoItem<T extends Record<string, any> & { id: string }> {
  /** Echo 状态管理实例 */
  private store: Echo<T | null> = new Echo<T | null>(null);

  /** 使用 React Hook 获取状态 */
  public use = this.store.use.bind(this.store);
  
  /** 更新状态 */
  public set = this.store.set.bind(this.store);

  /**
   * 构造函数
   * @param database 数据库名称
   * @param objectStore 对象存储名称
   */
  constructor(
    private database: string,
    private objectStore: string = "items"
  ) {}

  /**
   * 获取当前状态
   * @returns 当前状态
   */
  public async current(): Promise<T | null> {
    return await this.store.getCurrent();
  }

  /**
   * 创建新数据项
   * @param item 数据项
   * @throws Error 如果数据项没有 id 字段
   */
  public async create(item: T): Promise<void> {
    if (!item.id) {
      throw new Error("数据项必须包含 id 字段");
    }

    const config: IndexedDBConfig = {
      database: this.database,
      name: item.id,
      object: this.objectStore,
      sync: true
    };

    try {
      this.store.indexed(config);
      await this.store.set(item);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`创建数据项失败: ${errorMessage}`);
    }
  }

  /**
   * 切换到指定 ID 的数据项
   * @param id 数据项 ID
   * @throws Error 如果切换失败
   */
  public async switch(id: string): Promise<void> {
    if (!id) {
      throw new Error("ID 不能为空");
    }

    try {
      this.store.switch(id);
      // 确保状态已加载
      await this.store.ready();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`切换数据项失败: ${errorMessage}`);
    }
  }

  /**
   * 更新数据项
   * @param item 更新后的数据项
   * @throws Error 如果更新失败
   */
  public async update(item: T): Promise<void> {
    if (!item.id) {
      throw new Error("数据项必须包含 id 字段");
    }

    try {
      await this.store.set(item);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`更新数据项失败: ${errorMessage}`);
    }
  }

  /**
   * 删除当前数据项
   * @throws Error 如果删除失败
   */
  public async delete(): Promise<void> {
    try {
      await this.store.discard();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`删除数据项失败: ${errorMessage}`);
    }
  }
} 