import { IAppContext } from "../context.type.js";
import type { IDynamicActor } from "./index.type.js";
import { Store } from "n3";
import { SWipl } from "../swipl/swipl.js";



// 维护task所使用的fsm及其上下文。
export class TaskCtx {
    readonly entry: IDynamicActor | null = null; // 入口fsm.默认是plan.
    readonly subFsms: Record<string, IDynamicActor> = {};
    readonly id: string; // uuid.
    // readonly store: Store = new Store();
    readonly store!: SWipl;

    static async create(app: IAppContext, id?: string) {
        const taskCtx = new TaskCtx(app, id);
        await taskCtx.init();
        return taskCtx;
    }

    private constructor(app: IAppContext, id?: string) {
        this.id = id || crypto.randomUUID();
        this.store = new SWipl({ dir: '/tmp/test', files: [] });
        this.store.query("");
    }

    private async init(): Promise<void> {
        // 检查目录task目录的info.json.
        // 如果没有,则新建plan entry.
        // 如果有,则加载.
        // app.machineFactory.load()
    }


}

