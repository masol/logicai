import type { IAppContext } from '../context.type.js';
import type { AiTask, ITask } from './index.type.js'
import type { SWipl } from '../swipl/swipl.js';
import { SWiplFactory } from '../swipl/swiplFactory.js';
import * as path from "path";
import { promises as fs } from "fs";
import type { IFlow } from '../flow/index.type.js';
import pMap from 'p-map';

const ContextFile = 'context.json'

// 定义了JSON文件的数据结构.
type PersistData = {
    // sharedContext
    context?: Record<string, any>;
    reasoner?: any;
    flows?: {
        entry: string;
        subflows?: string[];
    }
}

export class Task implements ITask {
    readonly id: string;
    readonly name: string;
    readonly time: string;
    readonly taskDir: string;
    readonly app: IAppContext;
    // 维护当前运行的subFlows.
    #subFlows: Record<string, IFlow> = {};
    // workflow的sharedContext.
    #sharedContext: Record<string, any> = {};
    #entry: IFlow | null = null; // 入口flow.默认是plan.
    // 本体推理。
    #reasoner!: SWipl;

    static async create(app: IAppContext, aiTask: AiTask): Promise<Task> {
        const task = new Task(app, aiTask);
        await task.init();
        return task;
    }

    private constructor(app: IAppContext, aiTask: AiTask) {
        this.id = aiTask.id;
        this.name = aiTask.name;
        this.time = aiTask.time;
        this.app = app;
        this.taskDir = app.taskDir(this.id);
    }

    get sharedContext(): Record<string, any> {
        return this.#sharedContext;
    }

    get subFlows(): Record<string, IFlow> {
        return this.#subFlows;
    }

    get entry(): IFlow {
        if (!this.#entry) {
            throw new Error(`Task ${this.name} no entry fsm!!!`)
        }
        return this.#entry;
    }

    get reasoner(): SWipl {
        return this.#reasoner;
    }

    private async init(): Promise<void> {
        // Step1: 初始化 swipl 存储
        // 此步骤放入Swipl实现，并负责同步。加载文件ontology.json，并设置给this.#store(保存了)   // 不使用rdf.n3格式了。
        this.#reasoner = await SWiplFactory.create(this.taskDir);


        let persistData: PersistData = {};

        // Step2: 加载context.json
        try {
            const ctxPath = path.join(this.taskDir, ContextFile);
            const fileContent = await fs.readFile(ctxPath, 'utf-8');
            persistData = JSON.parse(fileContent);
        } catch (err) {
            // 文件存在但读取或解析失败，忽略错误
            // contextData 保持 null 或可按需处理
        }

        if (persistData.context) {
            this.#sharedContext = persistData.context;
        }

        let entryId = persistData.flows?.entry || "plan";
        let subFlows = persistData.flows?.subflows || [];

        // const services = this.loadServices(executionContext?.entry.)
        this.#entry = await this.app.flowFactory.load(entryId);

        // 并行加载所有 subFlow，并构建 [id, flow] 对
        const entries = await pMap(
            subFlows,
            async (id) => {
                const flowInstance = await this.app.flowFactory.load(id);
                return [id, flowInstance] as const; // 返回 [key, value]
            },
            { concurrency: 5 } // 可选：控制并发数
        );

        // 转为 Record<string, IFlow>
        this.#subFlows = Object.fromEntries(entries) as Record<string, IFlow>;
    }
}