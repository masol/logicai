import type { IAppContext } from '../context.type.js';
import { TaskCtx } from '../fsm/taskctx.js';
import type { AiTask, ITask } from './index.type.js'
import { Store } from 'n3'


export class Task implements ITask {
    readonly id: string;
    readonly name: string;
    readonly time: string;
    readonly store: Store;
    fsmsInternal!: TaskCtx;

    get fsms(): TaskCtx {
        return this.fsmsInternal;
    }

    static async create(app: IAppContext, aiTask: AiTask): Promise<Task> {
        const task = new Task(app, aiTask);
        await task.init(app);
        return task;
    }

    private constructor(app: IAppContext, aiTask: AiTask) {
        this.id = aiTask.id;
        this.name = aiTask.name;
        this.time = aiTask.time;
        this.store = new Store();
    }

    private async init(app: IAppContext): Promise<void> {
        console.log("init TaskCtx")
        this.fsmsInternal = await TaskCtx.create(app, this.id);
    }
}