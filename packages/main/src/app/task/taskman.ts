import { type IAppContext } from "../context.type.js"
import { AiTask, ITask, type ITaskMan } from "./index.type.js"
import { getSetting, setSetting } from "../../api/sys.js";
import { Task } from "./task.js";
import { pick } from "remeda";

export const CollectName = "tasks"

const settingKey = "currentTask";

function cvt2Aitask(task: ITask): AiTask {
    return pick(task, ['id', 'name', 'time']) as AiTask
}

export class TaskMan implements ITaskMan {
    private app: IAppContext;
    private current: Task | null = null;

    constructor(app: IAppContext) {
        this.app = app;
    }

    private updateCurrent(aiTask: AiTask) {
        setSetting(this.app, settingKey, aiTask);
    }

    currentTask(): ITask | null {
        return this.current;
    }

    create(name: string): ITask {
        const task: Task | null = this.loadTask({
            id: crypto.randomUUID(),
            name,
            time: (new Date()).toISOString()
        })!
        const coll = this.app.db.collection<AiTask>(CollectName);
        const aiTask = cvt2Aitask(task);
        coll.insert(aiTask);
        this.updateCurrent(aiTask);
        this.current = task;
        return task;
    }

    private loadTask(aiTask: AiTask): Task | null {
        if (aiTask?.id !== this.current?.id) {
            const task = new Task(aiTask.id, aiTask.name, aiTask.time);
            return task;
        }
        return null;
    }

    loadCurrent(): void {
        const currentTask = getSetting(this.app, settingKey);
        this.current = this.loadTask(currentTask);
        // console.log("current task =", currentTask)
    }


    setActiveTask(id: string, doUpdateCurrent: boolean = true): boolean {
        if (id !== this.current?.id) {
            const coll = this.app.db.collection(CollectName);
            const aiTask: AiTask = coll.findOne({ id });
            if (aiTask) {
                this.current = this.loadTask(aiTask);
                if (doUpdateCurrent) {
                    this.updateCurrent(aiTask);
                }
                return true;
            }
            return false;
        }
        return true;
    }
}