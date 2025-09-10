import { LokiDatabase } from "./loki.js";
import path from "node:path";
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';

export class AppContext {
  readonly app: Electron.App;
  readonly win: Electron.BrowserWindow;
  readonly db: LokiDatabase;
  // key是id,保存为loki/${id}.json．
  readonly #subdb: Map<string, LokiDatabase> = new Map();
  constructor(app: Electron.App, win: Electron.BrowserWindow) {
    this.app = app;
    this.win = win;
    const userData = app.getPath("userData");
    const dbPath = path.join(userData, "loki", "database.json");
    console.log("dbPath=", dbPath);
    this.db = new LokiDatabase({
      dbPath,
    });
  }

  getFileName(prefix = "result", pathName = ""): string {
    const userData = this.app.getPath("userData");
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
    return path.join(userData, pathName, `${prefix}-${timestamp}.md`);
  }

  // 指定id的本体目录．
  ontologyPath(id: string, subDir = "data"): string {
    const userData = this.app.getPath("userData");
    return path.join(userData, 'ontology', id, subDir);
  }

  /**
   * 检查文件是否存在，如果存在则读取并返回JSON内容，否则返回false
   * @param id bid
   * @returns JSON对象或false
   */
  async readJson(id: string): Promise<Record<string, any> | false> {
    const filePath = this.ontologyPath(id);
    try {
      // 检查文件是否存在
      await access(filePath, constants.F_OK);

      // 读取文件内容
      const fileContent = await readFile(filePath, 'utf8');

      // 解析JSON
      const jsonData = JSON.parse(fileContent);

      return jsonData;
    } catch (error) {
      // 如果是文件不存在的错误，返回空字符串
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }

      console.error(`读取文件失败: ${filePath}`, error);
      return false;
    }
  }

  /**
   * 将JSON对象写入到指定路径的文件中
   * @param filePath 文件的完整路径
   * @param jsonData 要写入的JSON数据
   * @param prettyFormat 是否格式化JSON（默认为true）
   * @returns Promise<是否写入成功>
   */
  async writeJson(id: string, jsonData: any, prettyFormat: boolean = true): Promise<boolean> {

    const filePath = this.ontologyPath(id)
    // const prettyFormat = true;
    try {
      // 确保目录存在
      const dirPath = path.dirname(filePath);

      try {
        await access(dirPath, constants.F_OK);
      } catch {
        // 目录不存在，创建目录
        await mkdir(dirPath, { recursive: true });
      }

      // 将JSON对象转换为字符串
      const jsonString = prettyFormat
        ? JSON.stringify(jsonData, null, 2)
        : JSON.stringify(jsonData);

      // 写入文件
      await writeFile(filePath, jsonString, 'utf8');

      return true;
    } catch (error) {
      console.error(`写入文件失败: ${filePath}`, error);
      return false;
    }
  }


  ensureDB(id: string): LokiDatabase {
    let db = this.#subdb.get(id)
    if (db) {
      return db;
    }
    const userData = this.app.getPath("userData");
    const dbPath = path.join(userData, "loki", `${id}.json`);
    db = new LokiDatabase({ dbPath })
    this.#subdb.set(id, db);
    return db;
  }
  async closeDB(id: string): Promise<boolean> {
    const db = this.#subdb.get(id);
    if (!db) {
      return true;
    }
    await db.close();
    this.#subdb.delete(id);
    return true;
  }
}

