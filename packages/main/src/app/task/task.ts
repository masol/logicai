import type { IAppContext } from '../context.type.js';
import type { ITaskCtx } from '../fsm/index.type.js';
import type { AiTask, ITask } from './index.type.js'
import { TaskCtx } from '../fsm/taskctx.js';


export class Task implements ITask {
    readonly id: string;
    readonly name: string;
    readonly time: string;
    fsmsInternal!: ITaskCtx;

    get ctx(): ITaskCtx {
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
    }

    private async init(app: IAppContext): Promise<void> {
        console.log("init TaskCtx")
        this.fsmsInternal = await TaskCtx.create(app, this.id);
    }
}