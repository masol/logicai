import type { IAppContext } from '../context.type.js';
import type { IDynamicActor, PersistFsm } from '../fsm/index.type.js';
import type { AiTask, ITask } from './index.type.js'
import type { SWipl } from '../swipl/swipl.js';
import { SWiplFactory } from '../swipl/swiplFactory.js';
import * as path from "path";
import { promises as fs } from "fs";
import { isArray } from "remeda";


const FsmStoreFile = 'fsms.json'
const ContextFile = 'context.json'

export class Task implements ITask {
    readonly id: string;
    readonly name: string;
    readonly time: string;
    readonly subFsms: Record<string, IDynamicActor> = {};
    readonly taskDir: string;
    readonly app: IAppContext;
    // 取代fsm的context(只读，只能通过assign来更新),用于维护任务的上下文信息。
    #context: Record<string, any> = {};
    #entry: IDynamicActor | null = null; // 入口fsm.默认是plan.
    #store!: SWipl;

    static async create(app: IAppContext, aiTask: AiTask): Promise<Task> {
        const task = new Task(app, aiTask);
        await task.init(app);
        return task;
    }

    private constructor(app: IAppContext, aiTask: AiTask) {
        this.id = aiTask.id;
        this.name = aiTask.name;
        this.time = aiTask.time;
        this.app = app;
        this.taskDir = app.taskDir(this.id);
    }

    get context(): Record<string, any> {
        return this.#context;
    }

    get entry(): IDynamicActor {
        if (!this.#entry) {
            throw new Error(`Task ${this.name} no entry fsm!!!`)
        }
        return this.#entry;
    }

    get store(): SWipl {
        return this.#store;
    }

    private async init(app: IAppContext): Promise<void> {
        // Step1: 初始化 swipl 存储
        // 此步骤放入Swipl实现，并负责同步。加载文件ontology.json，并设置给this.#store(保存了)   // 不使用rdf.n3格式了。
        this.#store = await SWiplFactory.create(this.taskDir);


        // Step2: 加载context.json
        try {
            const ctxPath = path.join(this.taskDir, ContextFile);
            const fileContent = await fs.readFile(ctxPath, 'utf-8');
            this.#context = JSON.parse(fileContent);
        } catch (err) {
            // 文件存在但读取或解析失败，忽略错误
            // contextData 保持 null 或可按需处理
        }


        // Step3: 处理 fsms.json
        const fsmsPath = path.join(this.taskDir, FsmStoreFile);

        let persistFsm: PersistFsm | null = null;
        try {
            // 检查文件是否存在并读取
            const data = await fs.readFile(fsmsPath, "utf-8");
            persistFsm = JSON.parse(data);

        } catch (err: any) {
            if (err.code === "ENOENT") {
                // 文件不存在，创建默认 plan entry

                persistFsm = {
                    entry: {
                        id: "plan"
                    }
                }
            } else {
                // 其他错误抛出
                throw err;
            }
        }

        if (!persistFsm?.entry.id) {
            throw new Error("task未指定entry fsm")
        }
        // const services = this.loadServices(taskCtx?.entry.)

        this.#entry = await this.app.machineFactory.load(persistFsm.entry);

        // console.log("this.#entry=");
        // console.log(this.#entry)

        if (isArray(persistFsm.subFsms) && persistFsm.subFsms.length > 0) {
            // 收集所有加载的 Promise
            const promises = persistFsm.subFsms.map(async subfsm => {
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