import type { IAppContext } from "../context.type.js"
import type { AiTask, ITask, TaskContext, ITaskMan } from "./index.type.js"
import { getSetting, setSetting } from "../../api/sys.js";
import { Task } from "./task.js";
import { pick } from "remeda";
import type { Message, MessageContent } from "../history.type.js";
import { AsyncLocalStorage } from 'node:async_hooks';

export const CollectName = "tasks"

const settingKey = "currentTask";
const NewAiMsg = 'aimsg';
const UpdateAiMsg = 'updmsg';
const AiStepMsg = "aistep";

const NOCurrentTaskMsg = "没有任务被激活，请在输入框下方中间位置，新建或选择任务后继续。"

function cvt2Aitask(task: ITask): AiTask {
    return pick(task, ['id', 'name', 'time']) as AiTask
}

export class TaskMan implements ITaskMan {
    private app: IAppContext;
    #current: Task | null = null;
    public readonly asyncStore: AsyncLocalStorage<TaskContext>;

    constructor(app: IAppContext) {
        this.app = app;
        this.asyncStore = new AsyncLocalStorage<TaskContext>()
    }

    private updateCurrent(aiTask: AiTask) {
        setSetting(this.app, settingKey, aiTask);
    }

    get current(): ITask {
        if (!this.#current) {
            throw new Error(NOCurrentTaskMsg)
        }
        return this.#current;
    }

    reanchorContext(fn: () => Promise<void>): void {
        const context: TaskContext = this.taskCtx;
        this.asyncStore.exit(() => {
            setImmediate(async () => {
                await this.asyncStore.run(context, fn);
            });
        });
    }

    runInContext(context:TaskContext, fn: () => Promise<any>): Promise<any> {
        return this.asyncStore.run(context, fn);
    }

    get taskCtx(): TaskContext {
        const taskCtx = this.asyncStore.getStore();
        if (!taskCtx) {
            throw new Error("无法获取任务堆栈上下文，有异步脱离上下文后访问此函数了?");
        }
        return taskCtx;
    }

    createResponse(content: string, type: string = "ai"): Message {
        const taskCtx = this.taskCtx;
        return {
            id: crypto.randomUUID(),
            content: {
                content,
            },
            taskId: taskCtx.input.taskId,
            type,
            timestamp: Date.now()
        }
    }

    reportProgress(stepMsg: string) {
        const taskCtx: TaskContext = this.taskCtx;
        this.app.emit(AiStepMsg, { id: taskCtx.input.id, step: stepMsg });
    }

    aiUpdate(response: string, clear = false): void {
        const taskCtx = this.taskCtx;
        if (!taskCtx.output) {
            throw new Error("调用aiUpdate,但是ai回应尚未发送");
        }
        this.app.emit(UpdateAiMsg, { id: taskCtx.output.id, content: response, clear });
    }

    aiNotify(response: Message | string): void {
        const message: Message = (typeof response === "string") ? this.createResponse(response) : response;
        this.app.emit(NewAiMsg, { message });
    }

    async onUserInput(msg: Message): Promise<Message> {

        const result: Message = await this.runInContext({ input: msg, task: this.current }, async () => {
            await this.app.history.addMessage(msg)

            if (!this.#current) {
                const retMsg = this.createResponse(NOCurrentTaskMsg);
                retMsg.content.level = "error";
                return retMsg;
            }


            const testContent: MessageContent = {
                content: "12322",
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

            this.taskCtx.output = retMsg;
            setImmediate(async () => {
                for (let i = 0; i < 10; i++) {
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    testContent.processingSteps!.unshift(`do step ${i}`);
                    this.app.emit(AiStepMsg, { id: retMsg.id, step: `do step ${i}` })
                    this.aiUpdate("\n\n test 1", i === 5)
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
                this.app.emit(AiStepMsg, { id: retMsg.id, step: '' })
                testContent.isProcessing = false;
                delete testContent.processingSteps;
                await this.app.history.addMessage(retMsg)
            })
            return retMsg;
        })

        return result;
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