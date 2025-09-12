import { LokiDatabase } from "./loki.js";
import path from "node:path";

export class AppContext {
  #initstate = {
    db: false
  }

  readonly app: Electron.App;
  readonly win: Electron.BrowserWindow;
  readonly db: LokiDatabase;
  // key是id,保存为loki/${id}.json．
  readonly #subdb: Map<string, LokiDatabase> = new Map();
  constructor(app: Electron.App, win: Electron.BrowserWindow) {
    this.app = app;
    this.win = win;
    const userData = app.getPath("userData");
    const dbPath = path.join(userData, "store", "data.json");
    console.log("dbPath=", dbPath);
    const that = this;
    this.db = new LokiDatabase(
      { dbPath },
      () => {
        this.onInitStep("db");
      }
    );
  }

  get inited(): boolean {
    return this.#initstate.db
  }

  private onInitStep(name: "db") {
    this.#initstate[name] = true;
    if (this.#initstate.db) {
      this.emit("inited", { inited: true })
    }
  }

  getFileName(prefix = "result", pathName = ""): string {
    const userData = this.app.getPath("userData");
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
    return path.join(userData, pathName, `${prefix}-${timestamp}.md`);
  }

  // 本体目录．
  ontologyPath(): string {
    const userData = this.app.getPath("userData");
    return path.join(userData, 'store', 'ontology');
  }

  // 发送事件到渲染进程
  emit(eventName: string, eventData: Record<string, any> = {}) {
    if (!this.win || this.win.isDestroyed()) {
      console.warn('主窗口不可用，无法发送事件:', eventName);
      return;
    }

    try {
      this.win.webContents.send('eventbus', eventName, eventData);
      // console.log(`已发送事件: ${eventName}`, eventData);
    } catch (error) {
      console.error('发送事件时出错:', eventName, error);
    }
  }


  async ensureDB(id: string): Promise<LokiDatabase> {
    let db = this.#subdb.get(id)
    if (db) {
      return db;
    }
    const userData = this.app.getPath("userData");
    const dbPath = path.join(userData, "store", `${id}.json`);
    return new Promise((resolve, reject) => {
      db = new LokiDatabase({ dbPath }, () => {
        if (db) {
          this.#subdb.set(id, db);
          resolve(db);
          return;
        }

        reject(false);
      });
    });
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

