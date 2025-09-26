import type { AsyncLocalStorage } from 'node:async_hooks';
import type { Message } from '../history.type.js';
import type { IAppContext } from '../context.type.js';
import type { SWipl } from '../swipl/swipl.js';
import type { IDynamicActor } from '../fsm/index.type.js';


export interface AiTask {
    readonly id: string;
    readonly name: string;
    readonly time: string; // 最后更新时间。
    [key: string]: any;
}


/**
 * 任务接口，定义了任务的基本结构和行为。
 */
export interface ITask {
    /**
     * 任务的唯一标识符。
     */
    readonly id: string;

    /**
     * 任务的名称。
     */
    readonly name: string;

    /**
     * 任务的时间戳或计划时间。
     */
    readonly time: string;

    /**
     * 任务的根目录路径
     */
    readonly taskDir: string;

    /**
     * 应用上下文，提供全局服务和配置
     */
    readonly app: IAppContext;

    /**
     * 当前任务的状态机上下文数据。
     * 注意：此对象是可变的，但更新应通过 assign 方法进行（如果存在）。
     * 实际上只读引用，内容可变。
     */
    readonly context: Record<string, any>;

    /**
     * 入口状态机（FSM），即任务的主流程控制器。
     * 如果未设置，访问时会抛出错误。
     */
    readonly entry: IDynamicActor;

    /**
     * 子状态机组，按 ID 索引。
     * 用于存放 plan 内部调用的其他 FSM 实例（如 service、action 等）。
     */
    readonly subFsms: Record<string, IDynamicActor>;

    /**
     * SWI-Prolog 存储实例，用于持久化和查询任务相关的逻辑/本体数据。
     */
    readonly store: SWipl;

    // 注意：TypeScript 中接口不能直接声明 static 方法，但可通过文档说明或模块导出约定表达
    // 实际使用中，create 方法由 TaskCtx 实现，使用者通过 TaskCtx.create 调用
}


export interface ITaskMan {
    readonly current: ITask;
    // 异步本地存储，用于维护堆栈变量。
    readonly asyncStore: AsyncLocalStorage<TaskContext>;

    // 当前任务的上下文。注意：在fork异步链时，需要调用reanchorContext来脱离，以维持taskCtx。
    readonly taskCtx: TaskContext;
    /**
     * 脱离当前异步链，在全新的异步执行环境中恢复上下文并执行任务
     * 用于解耦执行生命周期.
     */
    reanchorContext(fn: () => Promise<void>): void;
    // 创建新的异步链上下文。
    runInContext(context:TaskContext, fn: () => Promise<any>): Promise<any>;
    /**
     * 向UI汇报进度，通常在脱离异步链的异步链中调用(reanchorContext的异步链中)。
     * @param stepMsg 进度消息，可以是扩展的markdown(可以使用html，并扩展了类似htmx的事件属性，并自动处理)
     */
    reportProgress(stepMsg: string): void;
    // 后台执行的ai,如果想主动通知用户(UI界面),调用此函数。(追加一条新消息)
    aiNotify(response: Message | string): void;
    /**
     * 更新AI回应的正文内容。
     * 
     * 此函数用于更新已存在的AI回应消息的文本内容。调用时需要提供新的响应内容，
     * 并可通过`clear`参数控制是替换还是追加内容。
     * 
     * @param {string} response - 要更新的AI回应的新内容。
     * @param {boolean} [clear=false] - 是否清除当前已有的内容。  
     * 如果为 `true`，则替换原有内容；如果为 `false`，则在现有内容基础上追加。
     * 
     * @throws {Error} 当尚未发送AI回应（即 `taskCtx.output` 不存在）时抛出错误。
     */
    aiUpdate(response: string, clear?: boolean): void
    // 在上下文异步链中才可以工作！否则应抛出异常。
    createResponse(content: string, type?: string): Message
    // 此时自动设置为Active.
    create(name: string): Promise<ITask>;
    // getById(id: string): Promise<AiTask | null>;
    setActiveTask(id: string): Promise<boolean>;
    loadCurrent(): Promise<ITask | null>;
    onUserInput(msg: Message): Promise<Message>;
}


export interface TaskContext {
    input: Message;
    task:ITask;
    output?: Message;
    [key: string]: any;
}