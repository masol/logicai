import { IAppContext } from "../context.type.js";
import type { IDynamicActor, TaskFsms } from "./index.type.js";
// import { Store } from "n3";
import { SWiplFactory } from "../swipl/swiplFactory.js";
import { type SWipl } from '../swipl/swipl.js'
import { promises as fs } from "fs";
import * as path from "path";
import { isArray } from "remeda";


const FsmStoreFile = 'fsms.json'

// 维护task所使用的fsm及其上下文。
export class TaskCtx {
    #entry: IDynamicActor | null = null; // 入口fsm.默认是plan.
    readonly subFsms: Record<string, IDynamicActor> = {};
    readonly id: string; // uuid.
    readonly taskDir: string;
    readonly app: IAppContext;
    #store!: SWipl;

    get entry(): IDynamicActor {
        if (!this.#entry) {
            throw new Error("Task Ctx no entry!!")
        }
        return this.#entry;
    }

    get store(): SWipl {
        return this.#store;
    }

    static async create(app: IAppContext, id?: string) {
        const taskCtx = new TaskCtx(app, id);
        await taskCtx.init();
        return taskCtx;
    }

    private constructor(app: IAppContext, id?: string) {
        this.id = id || crypto.randomUUID();
        this.taskDir = app.taskDir(this.id);
        this.app = app;
    }

    private async init(): Promise<void> {
        // Step1: 初始化 swipl 存储
        // 此步骤放入Swipl实现，并负责同步。加载文件ontology.json，并设置给this.#store(保存了)   // 不使用rdf.n3格式了。
        this.#store = await SWiplFactory.create(this.taskDir);

        // Step2: 处理 fsms.json
        const fsmsPath = path.join(this.taskDir, FsmStoreFile);

        let taskCtx: TaskFsms | null = null;
        try {
            // 检查文件是否存在并读取
            const data = await fs.readFile(fsmsPath, "utf-8");
            taskCtx = JSON.parse(data);

        } catch (err: any) {
            if (err.code === "ENOENT") {
                // 文件不存在，创建默认 plan entry

                taskCtx = {
                    entry: {
                        id: "plan"
                    }
                }
            } else {
                // 其他错误抛出
                throw err;
            }
        }

        if (!taskCtx?.entry.id) {
            throw new Error("task未指定entry fsm")
        }
        // const services = this.loadServices(taskCtx?.entry.)

        this.#entry = await this.app.machineFactory.load(taskCtx.entry);

        // console.log("this.#entry=");
        // console.log(this.#entry)

        if (isArray(taskCtx.subFsms) && taskCtx.subFsms.length > 0) {
            // 收集所有加载的 Promise
            const promises = taskCtx.subFsms.map(async subfsm => {
                const instance = await this.app.machineFactory.load(subfsm);
                return [subfsm.id, instance] as const;
            });

            const results = await Promise.all(promises);

            for (const [id, instance] of results) {
                this.subFsms[id] = instance;
            }
        }
    }

}

