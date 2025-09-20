import type { AnyActor, SnapshotFrom, MachineConfig } from "xstate";

/**
 * 动态状态机配置
 * 
 * - 直接复用 XState v5 提供的 MachineConfig 类型
 * - 泛型参数默认使用 any，开发者可自行在实例化时传入上下文与事件类型
 */
export type DynamicMachineConfig<TContext = any> = MachineConfig<any, any, any> & {
    context?: TContext;
};

/**
 * DynamicMachine 对外暴露的接口
 * 
 * 说明：
 * - 该接口约束了 DynamicMachine 类需要实现的功能
 * - 包含 DSL 构建方法（添加状态/转换/服务）、状态持久化与恢复、重置等能力
 */
export interface IDynamicMachine<TContext = any> {
    /**
     * 当前正在运行的 XState Actor 实例
     * - Actor 是解释状态机逻辑的运行单元
     * - 可以通过 actor.send(event) 发送事件
     * - 可以通过 actor.getSnapshot() 获取当前快照
     */
    actor: AnyActor;

    /**
     * 添加 Service / Actor 实现
     * @param nameOrServices - 服务名称或者服务映射对象
     * @param fn - 当传入的是服务名称时，需要提供具体实现函数
     * @param opts - 配置项，支持 merge（合并）或覆盖行为
     */
    addService(
        nameOrServices: string | Record<string, any>,
        fn?: any,
        opts?: { merge?: boolean }
    ): this;

    /**
     * 添加新的状态
     * @param name - 状态名称
     * @param def - 状态定义（可包含 on、invoke、entry、exit 等）
     */
    addState(name: string, def?: any): this;

    /**
     * 在状态之间添加事件转换
     * @param from - 源状态名称
     * @param event - 事件类型
     * @param to - 目标状态名称
     */
    addTransition(from: string, event: string, to: string): this;

    /**
     * 设置默认上下文（仅在没有快照恢复时生效）
     * @param ctx - 作为默认值合并到现有 context 中
     */
    setContext(ctx: Partial<TContext>): this;

    /**
     * 设置默认初始状态（仅在没有快照恢复时生效）
     * @param state - 初始状态名称
     */
    setInitial(state: string): this;

    /**
     * 重新构建 Actor
     * @param snapshot - 可选，传入持久化的快照时，将从该快照恢复
     * @param opts - 配置选项：
     *   - reset = true 表示忽略快照或旧状态，从 initial/context 重置执行
     */
    rebuild(
        snapshot?: SnapshotFrom<AnyActor>,
        opts?: { reset?: boolean }
    ): AnyActor;

    /**
     * 导出当前 Actor 的持久化快照
     * - 可将快照序列化并存储到外部（如数据库、本地存储）
     * - 之后可通过 restore(snapshot) 或新建实例时传入 snapshot 恢复
     */
    persist(): ReturnType<AnyActor["getPersistedSnapshot"]>;

    /**
     * 从快照恢复执行
     * @param snapshot - 之前通过 persist 导出的快照
     * @returns 新的 Actor 实例
     */
    restore(snapshot: SnapshotFrom<AnyActor>): AnyActor;

    /**
     * 强制重置 Actor
     * - 忽略已有状态与上下文
     * - 回到 config 配置中的 initial 状态与 context
     * @returns 重置后的 Actor 实例
     */
    reset(): AnyActor;

    /**
     * 获取当前的状态机配置（仅结构定义，不含运行中状态）
     * - 可用于序列化保存机器定义，或调试输出
     */
    getConfig(): DynamicMachineConfig<TContext>;
}