import { LokiDatabase } from "./loki.js";
import path from "node:path";
import { History } from "./history.js";
import { IAppContext } from "./context.type.js";
import { TaskMan } from "./task/taskman.js";
import { getSetting } from "../api/sys.js";
import { LLMManager } from './llms/manager.js'
import { MachineFactory } from "./fsm/factory.js";

export class AppContext implements IAppContext {
  #initstate = {
    db: false,
    history: false,
  }

  readonly app: Electron.App;
  readonly win: Electron.BrowserWindow;
  readonly db: LokiDatabase;
  readonly history: History;
  readonly task: TaskMan;
  readonly llms: LLMManager;
  readonly machineFactory: MachineFactory;

  passive: boolean = true;

  // key是id,保存为loki/${id}.json．
  // readonly #subdb: Map<string, LokiDatabase> = new Map();
  constructor(app: Electron.App, win: Electron.BrowserWindow) {
    this.app = app;
    this.win = win;
    const userData = app.getPath("userData");
    const dbPath = path.join(userData, "store", "data.json");
    // console.log("dbPath=", dbPath);
    const that = this;
    this.llms = new LLMManager();
    this.db = new LokiDatabase(
      { dbPath },
      () => {
        this.passive = !!getSetting(this, "passive");
        this.task.loadCurrent();

        //加载和初始化llm集合
        const allModels = getSetting(this, "models") ?? { llm: [] };

        // console.log("models=", allModels.llm)
        this.llms.init(allModels.llm);

        // console.log("llm status=")
        // console.dir(this.llms.getInstancesStatus());

        this.onInitStep("db");
      }
    );
    this.history = new History(path.join(userData, "store", "history.sqlite"), (error) => {
      if (error) {
        that.emit("ERROR", { message: "历史数据库初始化错误" })
      } else {
        this.onInitStep("history")
      }
    })

    this.machineFactory = new MachineFactory();
    this.task = new TaskMan(this);
  }

  get inited(): boolean {
    return this.#initstate.db && this.#initstate.history
  }

  private onInitStep(name: "db" | "history") {
    this.#initstate[name] = true;
    if (this.#initstate.db && this.#initstate.history) {
      this.emit("inited", { inited: true })
    }
  }

  // // 本体目录．
  // ontologyPath(): string {
  //   const userData = this.app.getPath("userData");
  //   return path.join(userData, 'store', 'ontology');
  // }


  // 返回指定id的任务目录．
  taskDir(id: string): string {
    const userData = this.app.getPath("userData");
    return path.join(userData, 'tasks', id);
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

}

