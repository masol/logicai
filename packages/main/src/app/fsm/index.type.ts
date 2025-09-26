import type { MachineContext, MachineConfig, AnyActorLogic, ActionFunction, AnyActor, Snapshot, SnapshotFrom, CallbackLogicFunction, PromiseActorRef, AnyEventObject } from "xstate";
import type { IAppContext } from "../context.type.js";
import type { SWipl } from "../swipl/swipl.js";

export type AnyActionFunction = ActionFunction<any, any, any, any, any, any, any, any, any>;
export type MachineCfg = MachineConfig<MachineContext, AnyEventObject, never>;

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


// 定义接口
export interface FsmState {
    /** 有限状态机实例的唯一标识符 */
    id: string;

    /** 状态机描述 */
    desc?: string;

    /** xstate actor 的状态快照 */
    snapshot?: Snapshot<AnyActor>;

    // 知识库使用swipl-wasm,暂不使用n3(可导出为n3方便阅读)，文件名固定为: kc.pl。
    // 如果有，保存在当前目录下${storeId}.ttl的n3 rdf持久化版本。
    // storeId?: string;
}

export interface IMachineFactory {
    load(fsmState: FsmState): Promise<IDynamicActor>
}



export interface PersistFsm {
    entry: FsmState;
    subFsms?: Array<FsmState>;
}

export type PromiseFn<Input = any, Output = any> = (args: {
    input: Input;
    system: any;
    self: PromiseActorRef<Output>;
    signal: AbortSignal;
    emit: (emitted: any) => void;
}) => PromiseLike<Output>;

export type llmHandle = {
    prompt?: string;
    itpath?: string; // it在主存储区(taskctx)中的路径。
    mapping?: Record<string, any> // 输出得到的json,存入主存储区的映射。
}

// 用于生成函数的
export type persistedHnale = [args: string, body: string];

// state5中的actor(对应v4的service)的定义结构。
// 可持久化的元信息
export interface SrvDefinitionMeta {
    // 可以在invoke中调用的名称。
    name: string;
    // 用于传送给llm的。
    desc?: string;
    // 类型指明func定义是什么， 如果func为函数，则默认为promise，否则为llm.如果func为字符串，则会将其转化为函数，然后判断type.
    type?: 'llm' | 'promise' | 'callback';// | 'observable' | 'event' | "transition" | 'actor'
}

// 运行时完整定义（判别联合）
export type SrvDefinition =
    | { type: 'promise'; name: string; func: PromiseFn | persistedHnale; desc?: string }
    | { type: 'callback'; name: string; func: CallbackLogicFunction | persistedHnale; desc?: string }
    | { type: 'llm'; name: string; func: llmHandle; desc?: string };
