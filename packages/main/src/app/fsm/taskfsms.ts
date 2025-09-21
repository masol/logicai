import type { IDynamicActor } from "./index.type.js";



// 维护task所使用的fsm及其上下文。
export class TaskFsms {
    readonly entry: IDynamicActor | null = null; // 入口fsm.默认是plan.
    readonly subFsms: Record<string, IDynamicActor> = {};
    readonly id: string; // uuid.

    constructor(id?: string) {
        this.id = id || crypto.randomUUID();
        if (!id) {
            //创建plan actor.
        }
    }
}

