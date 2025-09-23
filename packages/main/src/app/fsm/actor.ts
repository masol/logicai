import {
    createActor,
    type AnyActor,
    type Snapshot,
    type SnapshotFrom,
    setup
} from "xstate";
import type { IDynamicActor, MachineCfg } from "./index.type.js";
import { Machine } from "./machine.js";

/**
 * 动态管理 xstate v5 actor
 */
export class DynamicActor implements IDynamicActor {
    private machineManager: Machine<any, any>;
    private currentActor: AnyActor | null = null;

    constructor(initialConfig: MachineCfg = {} as any) {
        this.machineManager = new Machine(initialConfig);
    }

    get machine() {
        return this.machineManager;
    }

    get actor() {
        return this.currentActor;
    }

    /**
     * 启动或重建 actor
     */
    rebuild(snapshot?: SnapshotFrom<AnyActor>) {

        if (!this.machineManager.canStart()) {
            console.warn("FSM not ready: missing initial state or states");
            return this.currentActor;
        }

        // 停掉旧 actor
        if (this.currentActor) {
            this.currentActor.stop();
            this.currentActor = null;
        }

        // 获取完整配置
        const newConfig = this.machineManager.config;

        // 如果传入了 snapshot，则优先恢复
        if (snapshot?.value) {
            newConfig.initial = snapshot.value as string;
        }
        if (snapshot?.context) {
            newConfig.context = snapshot.context;
        }

        const machine = setup(this.machine.setup).createMachine(newConfig as Record<string,any>);

        // v5: createActor 可以直接带 snapshot
        this.currentActor = createActor(machine, snapshot ? { snapshot } : {});

        // 启动
        this.currentActor.start();

        return this.currentActor;
    }

    canStart() {
        return this.machineManager.canStart();
    }

    /**
     * 获取当前 Actor 的 snapshot（持久化用）
     */
    getSnapshot(): Snapshot<any> | null {
        return this.currentActor?.getSnapshot() ?? null;
    }

    /**
     * 获取可持久化的 snapshot（和 v4 的 getPersistedSnapshot 类似）
     */
    getPersistedSnapshot(): any | null {
        return this.currentActor?.getPersistedSnapshot() ?? null;
    }
}