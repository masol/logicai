import {
    createMachine,
    createActor,
    AnyActor,
    SnapshotFrom,
    MachineConfig,
} from "xstate";
import { clone } from "remeda";
import { IDynamicMachine } from "./index.type.js";

export class DynamicMachine<TContext = any>
    implements IDynamicMachine<TContext> {
    private config: MachineConfig<any, any, any>;
    private actors: Record<string, any> = {};
    public actor: AnyActor;

    constructor(initialConfig: MachineConfig<any, any, any>, snapshot?: SnapshotFrom<AnyActor>) {
        this.config = clone(initialConfig);
        this.actor = this.rebuild(snapshot);
    }

    addService( // 保留旧名，内部还是映射到 actors
        nameOrActors: string | Record<string, any>,
        fn?: any,
        opts: { merge?: boolean } = { merge: true }
    ) {
        if (typeof nameOrActors === "string" && fn) {
            if (!opts.merge) {
                this.actors = { [nameOrActors]: fn };
            } else {
                this.actors = { ...this.actors, [nameOrActors]: fn };
            }
        } else if (typeof nameOrActors === "object") {
            if (!opts.merge) {
                this.actors = { ...nameOrActors };
            } else {
                this.actors = { ...this.actors, ...nameOrActors };
            }
        }
        return this;
    }

    addState(name: string, def: any = {}) {
        this.config.states ??= {};
        this.config.states[name] = { on: {}, ...def };
        return this;
    }

    addTransition(from: string, event: string, to: string) {
        if (!this.config.states?.[from]) {
            throw new Error(`State "${from}" does not exist`);
        }
        this.config.states[from].on ??= {};
        this.config.states[from].on[event] = to;
        return this;
    }

    setContext(ctx: Partial<TContext>) {
        this.config.context = { ...(this.config.context ?? {}), ...ctx };
        return this;
    }

    setInitial(state: string) {
        if (!this.config.states?.[state]) {
            throw new Error(`Initial state "${state}" does not exist`);
        }
        this.config.initial = state;
        return this;
    }

    rebuild(snapshot?: SnapshotFrom<AnyActor>, opts: { reset?: boolean } = {}) {
        if (this.actor) {
            this.actor.stop();
        }

        const newConfig = clone(this.config);

        if (!opts.reset) {
            const prev = snapshot ?? this.actor?.getSnapshot();
            if (prev?.value) {
                newConfig.initial = prev.value as string;
            }
            newConfig.context = prev?.context ?? newConfig.context;
        }

        const machine = createMachine(newConfig, {
            actors: this.actors,
        });

        this.actor = createActor(
            machine,
            snapshot && !opts.reset ? { snapshot } : undefined
        ).start();

        return this.actor;
    }

    persist() {
        return this.actor.getPersistedSnapshot();
    }

    restore(snapshot: SnapshotFrom<AnyActor>) {
        return this.rebuild(snapshot);
    }

    reset() {
        return this.rebuild(undefined, { reset: true });
    }

    getConfig() {
        return this.config;
    }
}