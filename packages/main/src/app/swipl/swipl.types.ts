export interface WorkerAPI {
    dispatch(instanceId: string, funcName: string, ...args: any[]): Promise<any>;
    init(): Promise<boolean>;
}

