import type { MachineContext, MachineConfig, AnyActorLogic, ActionFunction, AnyActor, Snapshot, SnapshotFrom } from "xstate";

export type AnyActionFunction = ActionFunction<any, any, any, any, any, any, any, any, any>;

export interface IMachine<
    TContext extends MachineContext = any,
    THelper = any
> {
    /** 配置是否可运行 */
    canStart(): boolean;

    /** 只读 config */
    get config(): Readonly<MachineConfig<any, any, any>>;

    /** 只读 actors */
    get actors(): Readonly<Record<string, AnyActorLogic>>;

    /** 只读 actions */
    get actions(): Readonly<
        Record<
            string,
            AnyActionFunction
        >
    >;

    /** 添加 actor */
    addActor(name: string, fn: AnyActorLogic): this;
    addActor(actors: Record<string, AnyActorLogic>): this;

    /** 添加 action */
    addAction(
        name: string,
        fn: AnyActionFunction
    ): this;
    addAction(
        actions: Record<
            string,
            AnyActionFunction
        >
    ): this;
}



export interface IDynamicActor {
    /** 底层状态机管理器 */
    readonly machine: IMachine;

    /** 当前运行中的 actor */
    readonly actor: AnyActor | null;

    /**
     * 根据快照重建或启动新的 actor
     */
    rebuild(snapshot?: SnapshotFrom<AnyActor>): AnyActor | null;

    /**
     * 检查状态机是否能启动
     */
    canStart(): boolean;

    /**
     * 获取当前 actor 的快照
     */
    getSnapshot(): Snapshot<any> | null;

    /**
     * 获取可持久化的快照
     */
    getPersistedSnapshot(): any | null;
}


export interface IMachineFactory {
    load(id: string): Promise<IMachine>
}



// 定义接口
export interface FsmState {
  /** 有限状态机实例的唯一标识符 */
  fsmId: string;

  /** xstate actor 的状态快照 */
  snapshot?: Snapshot<AnyActor>;

  // 如果有，保存在当前目录下${storeId}.ttl的n3 rdf持久化版本。
  storeId?: string;
}

export interface TaskContext {
    entry?: FsmState;
    subFsms?: Array<FsmState>;
}