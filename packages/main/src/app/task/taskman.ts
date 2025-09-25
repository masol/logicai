import { type IAppContext } from "../context.type.js"
import { AiTask, ITask, type ITaskMan } from "./index.type.js"
import { getSetting, setSetting } from "../../api/sys.js";
import { Task } from "./task.js";
import { pick } from "remeda";
import type { Message, MessageContent } from "../history.type.js";

export const CollectName = "tasks"

const settingKey = "currentTask";
const AiSayMsg = 'aimsg';
const AiStepMsg = "aistep";


function cvt2Aitask(task: ITask): AiTask {
    return pick(task, ['id', 'name', 'time']) as AiTask
}

export class TaskMan implements ITaskMan {
    private app: IAppContext;
    #current: Task | null = null;

    constructor(app: IAppContext) {
        this.app = app;
    }

    private updateCurrent(aiTask: AiTask) {
        setSetting(this.app, settingKey, aiTask);
    }

    get current(): ITask | null {
        return this.#current;
    }

    async onUserInput(msg: Message): Promise<Message> {
        // console.log("on user msg");
        // console.log(msg);
        await this.app.history.addMessage(msg)

        const testContent: MessageContent = {
            content: "当前没有选中任意任务，请选中任务后继续。",
            isProcessing: true,
            processingSteps: ["test123"]
        };
        const retMsg = {
            id: crypto.randomUUID(),
            type: 'ai',
            taskId: msg.taskId,
            content: testContent,
            timestamp: Date.now()
        }
        setImmediate(async () => {
            for (let i = 0; i < 10; i++) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                testContent.processingSteps!.unshift(`do step ${i}`);
                this.app.emit(AiStepMsg, { id: retMsg.id, step: `do step ${i}` })
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            this.app.emit(AiStepMsg, { id: retMsg.id, step: '' })
            testContent.isProcessing = false;
            delete testContent.processingSteps;
            await this.app.history.addMessage(retMsg)
        })
        return retMsg;
    }

    async create(name: string): Promise<ITask> {
        const task: Task | null = await this.loadTask({
            id: crypto.randomUUID(),
            name,
            time: (new Date()).toISOString()
        });
        if (!task) {
            throw new Error("can not create task!")
        }
        const coll = this.app.db.collection<AiTask>(CollectName);
        const aiTask = cvt2Aitask(task);
        coll.insert(aiTask);
        this.updateCurrent(aiTask);
        this.#current = task;
        return task;
    }

    private async loadTask(aiTask: AiTask): Promise<Task | null> {
        if (aiTask?.id !== this.#current?.id) {
            const task = await Task.create(this.app, aiTask);
            return task;
        }
        return null;
    }

    async loadCurrent(): Promise<ITask | null> {
        const currentTask = getSetting(this.app, settingKey);
        this.#current = await this.loadTask(currentTask);
        // console.log("current task =", currentTask)
        return this.#current;
    }


    async setActiveTask(id: string, doUpdateCurrent: boolean = true): Promise<boolean> {
        console.log("enter setActiveTask=", id, doUpdateCurrent)
        if (id !== this.#current?.id) {
            const coll = this.app.db.collection(CollectName);
            const aiTask: AiTask = coll.findOne({ id });
            if (aiTask) {
                this.#current = await this.loadTask(aiTask);
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