import type { AnyActorLogic, MachineConfig, MachineContext } from "xstate";
import { clone } from "remeda";
import type {
    IMachine, AnyActionFunction
} from "./index.type.js";


/**
 * 动态构建 XState v5 Machine 的包装器
 */
export class Machine<
    TContext extends MachineContext = any,
    THelper = any
> implements IMachine<TContext, THelper> {
    private configInternal: MachineConfig<TContext, any, any>;
    private actorsInternal: Record<string, AnyActorLogic> = {};
    private actionsInternal: Record<string, AnyActionFunction> = {};

    constructor(initialConfig: MachineConfig<TContext, any, any> = {} as any) {
        this.configInternal =
            Object.keys(initialConfig).length > 0
                ? (clone(initialConfig) as MachineConfig<TContext, any, any>)
                : ({
                    id: crypto.randomUUID(),
                    states: {},
                } as MachineConfig<TContext, any, any>);
    }

    /** 配置是否可运行 */
    canStart(): boolean {
        const initial = this.configInternal.initial;
        if (typeof initial !== "string") return false;
        return Boolean(this.configInternal.states?.[initial]);
    }

    /** 只读 config（标准的 MachineConfig 视图，不带 actors/actions） */
    get config(): MachineConfig<any, any, any> {
        return clone(this.configInternal);
    }

    /** 只读 actors */
    get actors(): Readonly<Record<string, AnyActorLogic>> {
        return this.actorsInternal;
    }

    /** 只读 actions */
    get actions(): Readonly<Record<string, AnyActionFunction>> {
        return this.actionsInternal;
    }

    /**
     * 添加 actor 或批量添加
     */
    addActor(name: string, fn: AnyActorLogic): this;
    addActor(actors: Record<string, AnyActorLogic>): this;
    addActor(
        arg1: string | Record<string, AnyActorLogic>,
        arg2?: AnyActorLogic
    ): this {
        if (typeof arg1 === "string" && arg2) {
            this.actorsInternal = {
                ...this.actorsInternal,
                [arg1]: arg2,
            };
        } else if (typeof arg1 === "object" && arg1 !== null) {
            this.actorsInternal = {
                ...this.actorsInternal,
                ...arg1,
            };
        } else {
            throw new Error("Invalid arguments for addActor");
        }
        return this;
    }

    /**
     * 添加 action 或批量添加
     */
    addAction(name: string, fn: AnyActionFunction): this;
    addAction(actions: Record<string, AnyActionFunction>): this;
    addAction(
        arg1: string | Record<string, AnyActionFunction>,
        arg2?: AnyActionFunction
    ): this {
        if (typeof arg1 === "string" && arg2) {
            this.actionsInternal = {
                ...this.actionsInternal,
                [arg1]: arg2,
            };
        } else if (typeof arg1 === "object" && arg1 !== null) {
            this.actionsInternal = {
                ...this.actionsInternal,
                ...arg1,
            };
        } else {
            throw new Error("Invalid arguments for addAction");
        }
        return this;
    }
}