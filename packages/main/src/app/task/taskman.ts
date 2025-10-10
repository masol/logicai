import type { IAppContext } from "../context.type.js";
import type {
  AiTask,
  ITask,
  ExecutionContext,
  ITaskMan,
} from "./index.type.js";
import { getSetting, setSetting } from "../../api/sys.js";
import { Task } from "./task.js";
import { pick } from "remeda";
import type { Message, MessageContent } from "../history.type.js";
import { AsyncLocalStorage } from "node:async_hooks";

export const CollectName = "tasks";

const settingKey = "currentTask";
const NewAiMsg = "aimsg";
const UpdateAiMsg = "updmsg";
const AiStepMsg = "aistep";

const NOCurrentTaskMsg =
  "没有任务被激活，请在输入框下方中间位置，新建或选择任务后继续。";

function cvt2Aitask(task: ITask): AiTask {
  return pick(task, ["id", "name", "time", "type"]) as AiTask;
}

export class TaskMan implements ITaskMan {
  private app: IAppContext;
  #current: Task | null = null;
  public readonly asyncStore: AsyncLocalStorage<ExecutionContext>;

  constructor(app: IAppContext) {
    this.app = app;
    this.asyncStore = new AsyncLocalStorage<ExecutionContext>();
  }

  private updateCurrent(aiTask: AiTask) {
    setSetting(this.app, settingKey, aiTask);
  }

  get current(): ITask {
    if (!this.#current) {
      throw new Error(NOCurrentTaskMsg);
    }
    return this.#current;
  }

  reanchorContext(fn: () => Promise<void>): void {
    const context: ExecutionContext = this.executionContext;
    this.asyncStore.exit(() => {
      setImmediate(async () => {
        await this.asyncStore.run(context, fn);
      });
    });
  }

  private runInContext(
    context: ExecutionContext,
    fn: () => Promise<any>
  ): Promise<any> {
    return this.asyncStore.run(context, fn);
  }

  get executionContext(): ExecutionContext {
    const executionContext = this.asyncStore.getStore();
    if (!executionContext) {
      throw new Error(
        "无法获取任务堆栈上下文，有异步脱离上下文后访问此函数了?"
      );
    }
    return executionContext;
  }

  createResponse(content: string, type: string = "ai"): Message {
    const executionContext = this.executionContext;
    return {
      id: crypto.randomUUID(),
      content: {
        content,
      },
      taskId: executionContext.input.taskId,
      type,
      timestamp: Date.now(),
    };
  }

  reportProgress(stepMsg: string) {
    const executionContext: ExecutionContext = this.executionContext;
    if (!executionContext.output) {
      throw new Error("调用reportProgress,但是ai回应尚未发送");
    }
    this.app.emit(AiStepMsg, { id: executionContext.output.id, step: stepMsg });
  }

  aiUpdate(response: string, clear = false): void {
    const executionContext = this.executionContext;
    if (!executionContext.output) {
      throw new Error("调用aiUpdate,但是ai回应尚未发送");
    }
    this.app.emit(UpdateAiMsg, {
      id: executionContext.output.id,
      content: response,
      clear,
    });
  }

  aiNotify(response: Message | string): void {
    const message: Message =
      typeof response === "string" ? this.createResponse(response) : response;
    this.app.emit(NewAiMsg, { message });
  }

  updateCurrentTime() {
    if (this.#current) {
      const coll = this.app.db.collection<AiTask>(CollectName);

      const existingRecord = coll.findOne({
        id: this.#current.id
      });
      if (existingRecord) {
        // 存在则更新
        coll.updateWhere(
          {
            id: this.#current.id,
          },
          {
            time: new Date().toISOString()
          }
        );
      }
    }
  }

  async onUserInput(msg: Message): Promise<Message> {
    const result: Message = await this.runInContext(
      { input: msg, task: this.current, models: {} },
      async () => {
        await this.app.history.addMessage(msg);

        if (!this.#current) {
          const retMsg = this.createResponse(NOCurrentTaskMsg);
          retMsg.content.level = "error";
          return retMsg;
        }

        // 创建用户输出。
        const exeCtx = this.executionContext;
        exeCtx.output = this.createResponse("请等待AI回应...");

        exeCtx.output.content.isProcessing = true;
        exeCtx.output.content.processingSteps = [];

        if (!this.current.runFlow()) {
          exeCtx.output.content = {
            content: "无法自举默认应对流程。",
          };
          return exeCtx;
        }

        exeCtx.onFinish = async (name: string, left: number) => {
          if (left <= 0) {
            //没有更多flow排队中，通知UI任务结束。
            this.reportProgress("");
            if (exeCtx.output) {
              delete exeCtx.output.content.isProcessing;
              delete exeCtx.output.content.processingSteps;
              const response = exeCtx.response || "已完成，未给出提示"
              this.aiUpdate(response, true);
              exeCtx.output.content.content = response;
              exeCtx.models = {}; // 删除models，防止循环引用．
              await this.app.history.addMessage(exeCtx.output);
              await this.current?.save();
            }
          }
          console.log(`flow ${name} finished...`);
        };

        this.updateCurrentTime();
        return exeCtx.output;
      }
    );

    return result;
  }

  async create(name: string, type: string): Promise<ITask> {
    const task: Task | null = await this.loadTask({
      id: crypto.randomUUID(),
      name,
      type,
      time: new Date().toISOString(),
    });
    if (!task) {
      throw new Error("can not create task!");
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

  async setActiveTask(
    id: string,
    doUpdateCurrent: boolean = true
  ): Promise<boolean> {
    console.log("enter setActiveTask=", id, doUpdateCurrent);
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
