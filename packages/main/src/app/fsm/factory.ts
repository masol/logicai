// import { promises as fs } from "fs";
// import * as path from "path";
import type { AnyActorLogic, CallbackLogicFunction, MachineConfig } from "xstate";
import { fromCallback, fromPromise } from "xstate";
import plan from './plan/index.js'
import type { FsmState, IDynamicActor, IMachineFactory, llmHandle, MachineCfg, PromiseFn, SrvDefinition } from "./index.type.js";
// import { Machine } from "./machine.js";
import { DynamicActor } from "./actor.js";
import type { IAppContext } from "../context.type.js";
import { isArray } from "remeda";

type MachineDefinition = MachineConfig<any, any>

export class MachineFactory implements IMachineFactory {
    private app: IAppContext;

    constructor(app: IAppContext) {
        this.app = app;
    }

    async load(fsmState: FsmState): Promise<IDynamicActor> {
        const id = fsmState.id;
        const isUUID =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (isUUID) {
            throw new Error(`Unsupported id: ${id}`);
            // return this.loadByUUID(id);
        } else if (id === "plan") {
            const actor = new DynamicActor(plan.machine as unknown as MachineCfg)

            if (isArray(plan?.setup?.actors)) {
                let allActors = {}
                for (const actorDef of plan.setup.actors) {
                    allActors = {
                        ...allActors,
                        ...this.loadServices(actorDef as unknown as SrvDefinition)
                    }
                }
                actor.machine.addActor(allActors);

                actor.rebuild(fsmState.snapshot);
            }
            return actor;
        } else {
            throw new Error(`Unsupported id: ${id}`);
        }

    }

    private procLlmHandle(def: SrvDefinition): AnyActorLogic {
        throw new Error("NOT IMPLEMENT procLlmHandle!")
        // 这里写你实际 LLM 的处理逻辑
    }

    private loadServices(definition: SrvDefinition): Record<string, AnyActorLogic> {
        let { name, type, func } = definition;
        let actorLogic: AnyActorLogic;

        if (!name) {
            return {};
        }

        // 1️⃣ 如果 func 是字符串，构造成函数 (默认 Promise)
        if (Array.isArray(func) && func.length === 2 && func.every((item) => typeof item === "string")) {
            const [args, body] = func;
            try {
                func = new Function(args, body) as PromiseFn;
            } catch (err) {
                throw new Error(`Failed to parse function array for service "${name}": ${err}`);
            }
        }

        // 2️⃣ 如果 func 是对象，则认为是 llm，移交 procLlmHandle
        if (typeof func === "object") {
            return { [name]: this.procLlmHandle(definition) };
        }

        // 3️⃣ 如果 type 无值，默认当做 promise
        const finalType = type ?? "promise";

        switch (finalType) {
            case "promise":
                actorLogic = fromPromise(func as PromiseFn);
                break;
            case "callback":
                actorLogic = fromCallback(func as CallbackLogicFunction);
                break;
            case "llm":
                actorLogic = this.procLlmHandle({ ...definition, type: "llm", func: func as llmHandle });
                break;
            default:
                throw new Error(`Unknown service type: ${finalType}`);
        }

        return { [name]: actorLogic };
    }
}