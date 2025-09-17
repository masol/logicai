

export interface AiTask {
    id: string;
    name: string;
    time: string; // 最后更新时间。
    [key: string]: any;
}


export interface ITaskMan {
    // 此时自动设置为Active.
    create(name: string): AiTask;
    // getById(id: string): Promise<AiTask | null>;
    currentTask(): AiTask | null;
    setActiveTask(id: string): boolean;
    loadCurrent(): void;
}