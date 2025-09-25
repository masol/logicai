import type { ITaskCtx } from '../fsm/index.type.js';
import type { Message } from '../history.type.js';


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
     * 获取任务的上下文对象。
     * 
     * @returns {ITaskCtx} 当前任务的上下文。
     */
    get ctx(): ITaskCtx;
}

export interface ITaskMan {
    readonly current: ITask | null;
    // 此时自动设置为Active.
    create(name: string): Promise<ITask>;
    // getById(id: string): Promise<AiTask | null>;
    setActiveTask(id: string): Promise<boolean>;
    loadCurrent(): Promise<ITask | null>;
    onUserInput(msg: Message): Promise<Message>;
}

