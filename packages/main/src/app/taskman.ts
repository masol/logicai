import { type IAppContext } from "./context.type.js"
import { AiTask, type ITaskMan } from "./taskman.type.js"
import { getSetting, setSetting } from "../api/sys.js";

export const CollectName = "tasks"

const settingKey = "currentTask";

export class TaskMan implements ITaskMan {
    private app: IAppContext;
    private current: AiTask | null = null;

    constructor(app: IAppContext) {
        this.app = app;
    }

    private updateCurrent(task: AiTask) {
        setSetting(this.app, settingKey, task);
    }

    currentTask(): AiTask | null {
        return this.current;
    }

    create(name: string): AiTask {
        const task: AiTask = {
            id: crypto.randomUUID(),
            name,
            time: (new Date()).toISOString()
        }
        const coll = this.app.db.collection<AiTask>(CollectName);
        coll.insert(task);
        this.current = task;
        this.updateCurrent(task);
        return task;
    }

    loadCurrent(): void {
        const currentTask = getSetting(this.app, settingKey);
        console.log("current task =", currentTask)
        if (currentTask) {
            this.current = currentTask;
        }
    }


    setActiveTask(id: string, doUpdateCurrent: boolean = true): boolean {
        if (id !== this.current?.id) {
            const coll = this.app.db.collection(CollectName);
            const task = coll.findOne({ id });
            if (task) {
                this.current = task;
                if (doUpdateCurrent) {
                    this.updateCurrent(task);
                }
                return true;
            }
            return false;
        }
        return true;
    }
}