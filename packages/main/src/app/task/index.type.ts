import type { Store } from 'n3';


export interface AiTask {
    id: string;
    name: string;
    time: string; // 最后更新时间。
    [key: string]: any;
}


export interface ITask extends AiTask {
    readonly store: Store;
}


export interface ITaskMan {
    // 此时自动设置为Active.
    create(name: string): Promise<ITask>;
    // getById(id: string): Promise<AiTask | null>;
    currentTask(): AiTask | null;
    setActiveTask(id: string): Promise<boolean>;
    loadCurrent(): Promise<ITask | null>;
}