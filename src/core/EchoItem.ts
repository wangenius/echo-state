import { Echo } from "./Echo";

export abstract class EchoList<T extends Record<string, any> & { id: string }> {
  protected store: Echo<Record<string, T>> = new Echo<Record<string, T>>(
    {},
  ).localStorage({
    name: this.name,
  });

  constructor(private name: string) {}

  public use = this.store.use.bind(this.store);
  public set = this.store.set.bind(this.store);
  public delete = this.store.delete.bind(this.store);
  public get current() {
    return this.store.current;
  }
}

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
  protected store: Echo<T> = new Echo<T>({} as T);

  /** 使用 React Hook 获取状态 */
  public use = this.store.use.bind(this.store);

  /** 更新状态 */
  public set = this.store.set.bind(this.store);

  /**
   * 构造函数
   * @param database 数据库名称
   */
  constructor(private database: string,  defaultItem: T) {
    this.store.set(defaultItem);
  }

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
  public async create(item: T): Promise<EchoItem<T>> {
    if (!item.id) {
      throw new Error("Data item must contain an id field");
    }

    const config = {
      database: this.database,
      name: item.id,
    };

    try {
      await this.store.indexed(config).ready();
      this.store.set(item);
      return this;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to create data item: ${errorMessage}`);
    }
  }

  /**
   * 切换到指定 ID 的数据项
   * @param id 数据项 ID
   * @throws Error 如果切换失败
   */
  public async switch(id: string): Promise<EchoItem<T>> {
    if (!id) {
      throw new Error("ID 不能为空");
    }

    try {
      this.store.switch(id);
      await this.store.ready();
      return this;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to switch data item: ${errorMessage}`);
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
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to delete data item: ${errorMessage}`);
    }
  }
}
