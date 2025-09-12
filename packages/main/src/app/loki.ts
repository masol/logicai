import Loki from "lokijs";
import * as path from "path";
import * as fs from "fs";

interface DatabaseConfig {
  dbPath: string;
  autoSaveInterval?: number; // 毫秒，默认 9 秒
}

interface QueryOptions {
  limit?: number;
  offset?: number;
  sort?: string;
}

// Collection 接口，支持泛型
interface CollectionInterface<T = any> {
  insert(doc: Omit<T, "$loki" | "meta">): T;
  insertMany(docs: Omit<T, "$loki" | "meta">[]): T[];
  findOne(query?: LokiQuery<T>): T | null;
  find(query?: LokiQuery<T>, options?: QueryOptions): T[];
  findById(id: number | string): T | null;
  update(doc: T): T;
  updateWhere(query: LokiQuery<T>, updateObj: Partial<T>): number;
  remove(doc: T): T;
  removeWhere(query: LokiQuery<T>): number;
  removeById(id: number | string): boolean;
  clear(): void;
  count(query?: LokiQuery<T>): number;
  ensureIndex(field: keyof T): void;
}

// LokiJS 查询类型
type LokiQuery<T> = {
  [K in keyof T]?:
  | T[K]
  | {
    $eq?: T[K];
    $ne?: T[K];
    $gt?: T[K];
    $gte?: T[K];
    $lt?: T[K];
    $lte?: T[K];
    $in?: T[K][];
    $nin?: T[K][];
    $regex?: RegExp | string;
    $exists?: boolean;
    $type?: string;
    $size?: number;
    $contains?: any;
    $containsAny?: any[];
    $containsNone?: any[];
  };
} & {
  $and?: LokiQuery<T>[];
  $or?: LokiQuery<T>[];
};

export class LokiDatabase {
  private db: Loki;
  private dbPath: string;

  constructor(config: DatabaseConfig, cb: () => void) {
    this.dbPath = this.resolveDatabasePath(config.dbPath);

    // 确保数据库目录存在
    this.ensureDirectoryExists();

    // 初始化 LokiJS
    this.db = new Loki(this.dbPath, {
      adapter: new Loki.LokiFsAdapter(),
      autoload: true,
      autoloadCallback: () => {
        console.log(`Database loaded from ${this.dbPath}`);
        if (cb) {
          cb();
        }
      },
      autosave: true,
      autosaveInterval: config.autoSaveInterval || 9000,
    });
  }

  private resolveDatabasePath(inputPath: string): string {
    const resolvedPath = path.resolve(inputPath);

    // 如果是目录，则在目录中创建默认数据库文件
    if (
      fs.existsSync(resolvedPath) &&
      fs.statSync(resolvedPath).isDirectory()
    ) {
      return path.join(resolvedPath, "database.db");
    }

    return resolvedPath;
  }

  private ensureDirectoryExists(): void {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // 优雅关闭数据库 - 返回 Promise
  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          console.error("Error closing database:", err);
          reject(err);
        } else {
          console.log("Database closed successfully");
          resolve();
        }
      });
    });
  }

  // 泛型 Collection 操作接口
  public collection<T = any>(name: string): CollectionInterface<T> {
    let coll = this.db.getCollection(name);

    // 如果不存在就创建
    if (!coll) {
      coll = this.db.addCollection(name);
      coll.ensureUniqueIndex('id'); // 为id字段增加唯一索引.
    }

    return {
      // 插入数据
      insert: (doc: Omit<T, "$loki" | "meta">): T => {
        return coll!.insert(doc as any) as T;
      },

      // 批量插入
      insertMany: (docs: Omit<T, "$loki" | "meta">[]): T[] => {
        return docs.map((doc) => coll!.insert(doc as any) as T);
      },

      // 查找单个文档
      findOne: (query?: LokiQuery<T>): T | null => {
        return coll!.findOne(query as any) as T | null;
      },

      // 查找多个文档
      find: (query?: LokiQuery<T>, options?: QueryOptions): T[] => {
        let chain = coll!.chain().find(query as any);

        if (options?.sort) {
          chain = chain.simplesort(options.sort);
        }

        if (options?.offset) {
          chain = chain.offset(options.offset);
        }

        if (options?.limit) {
          chain = chain.limit(options.limit);
        }

        return chain.data() as T[];
      },

      // 根据 ID 查找
      findById: (id: number | string): T | null => {
        if (typeof id === 'number') {
          return coll!.get(id) as T | null;
        } else {
          return coll.by('id', id);  // 使用自定义 string ID
        }
      },

      // 更新文档
      update: (doc: T): T => {
        return coll!.update(doc as any) as T;
      },

      // 根据查询更新
      updateWhere: (query: LokiQuery<T>, updateObj: Partial<T>): number => {
        const docs = coll!.find(query as any);
        // console.log("find docs=",docs)
        docs.forEach((doc) => {
          Object.assign(doc, updateObj);
          coll!.update(doc);
        });
        return docs.length;
      },

      // 删除文档
      remove: (doc: T): T => {
        return coll!.remove(doc as any) as T;
      },

      // 根据查询删除
      removeWhere: (query: LokiQuery<T>): number => {
        const docs = coll!.find(query as any);
        docs.forEach((doc) => coll!.remove(doc));
        return docs.length;
      },

      // 根据 ID 删除
      removeById: (id: number | string): boolean => {
        // console.log("removeById:",id)
        let doc;
        if (typeof id === 'number') {
          doc = coll!.get(id);
        } else {
          // 处理字符串 ID，假设自定义 ID 字段名为 'id'
          doc = coll.findOne({ id: id });
        }
        // console.log("found by id:",doc)
        if (doc) {
          coll!.remove(doc);
          return true;
        }
        return false;
      },

      // 清空集合
      clear: (): void => {
        coll!.clear();
      },

      // 获取文档总数
      count: (query?: LokiQuery<T>): number => {
        return query ? coll!.count(query as any) : coll!.count();
      },

      // 创建索引
      ensureIndex: (field: keyof T): void => {
        coll!.ensureIndex(field as string);
      },
    };
  }

  // 手动保存（可选）
  public save(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.saveDatabase((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // 获取所有集合名称
  public getCollectionNames(): string[] {
    return this.db.listCollections().map((coll) => coll.name);
  }

  // 删除集合
  public dropCollection(name: string): boolean {
    const coll = this.db.getCollection(name);
    if (coll) {
      this.db.removeCollection(name);
      return true;
    }
    return false;
  }

  // 获取数据库统计信息
  public getStats() {
    const collections = this.db.listCollections();
    return {
      dbPath: this.dbPath,
      collections: collections.map((coll) => ({
        name: coll.name,
        count: coll.count(),
        maxId: coll.maxId,
      })),
    };
  }
}

/*

// 定义类型
interface User {
  $loki?: number;
  meta?: any;
  id: string;
  name: string;
  email: string;
  age: number;
  createdAt: Date;
}

interface Post {
  $loki?: number;
  meta?: any;
  id: string;
  title: string;
  content: string;
  authorId: string;
  tags: string[];
  publishedAt?: Date;
}

// 使用类型化的 collection
const db = new LokiDatabase({ dbPath: './data' });

// 有类型提示和检查的 collection
const users = db.collection<User>('users');
const posts = db.collection<Post>('posts');

// 插入时有类型检查，不需要包含 $loki 和 meta
const user = users.insert({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  createdAt: new Date()
});

// 查询时有类型提示
const foundUsers = users.find({
  age: { $gte: 18 },
  name: { $regex: /john/i }
});

// 更新时有类型检查
users.updateWhere(
  { age: { $lt: 18 } },
  { age: 18 } // 这里会有类型检查
);

// 如果不指定类型，默认是 any
const logs = db.collection('logs'); // CollectionInterface<any>
logs.insert({ level: 'info', message: 'test' }); // 可以插入任意结构
*/
