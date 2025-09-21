import { promises as fs } from "fs";
import * as path from "path";
import type { AnyActorLogic, AnyStateMachine, MachineConfig } from "xstate";
import { fromPromise, fromTransition } from "xstate";
import plan from './plan/index.js'
import type { IMachine, IMachineFactory } from "./index.type.js";
import { Machine } from "./machine.js";

type MachineDefinition = MachineConfig<any, any>

export class MachineFactory implements IMachineFactory {
    // private baseDir: string;

    constructor() {
        // this.baseDir = baseDir;
    }

    async load(id: string): Promise<IMachine> {
        const isUUID =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (isUUID) {
            throw new Error(`Unsupported id: ${id}`);
            // return this.loadByUUID(id);
        } else if (id === "plan") {
            const machine = new Machine(plan.machine)
            return machine;
        } else {
            throw new Error(`Unsupported id: ${id}`);
        }
    }

    // private async loadByUUID(id: string): Promise<MachineDefinition> {
    //     const dir = path.resolve(this.baseDir, id);
    //     const machinePath = path.join(dir, "machine.json");
    //     const serviceJsonPath = path.join(dir, "service.json");
    //     const serviceJsPath = path.join(dir, "service.js");

    //     // 读取 machine.json
    //     const machineJson = await this.safeReadJson(machinePath);

    //     const machine: MachineDefinition = {
    //         ...machineJson,
    //         actors: {},
    //     };

    //     // service.json -> 转 Actor
    //     if (await this.exists(serviceJsonPath)) {
    //         const serviceDef = await this.safeReadJson(serviceJsonPath);
    //         const actors = this.transformServiceToActors(serviceDef);
    //         machine.actors = { ...machine.actors, ...actors };
    //     }

    //     // service.js -> import actor
    //     if (await this.exists(serviceJsPath)) {
    //         const serviceModule = await import(serviceJsPath);
    //         const actor: AnyActorLogic | undefined = serviceModule.default;
    //         if (actor) {
    //             machine.actors = {
    //                 ...machine.actors,
    //                 [path.basename(serviceJsPath, ".js")]: actor,
    //             };
    //         }
    //     }

    //     return machine;
    // }

    // private transformServiceToActors(
    //     serviceDef: any
    // ): Record<string, AnyActorLogic> {
    //     const actors: Record<string, AnyActorLogic> = {};

    //     // 假定 service.json 里定义格式类似：
    //     // [
    //     //   { id: "fetchUser", type: "promise", src: "./actors/fetchUser.ts" },
    //     //   { id: "counter", type: "transition" }
    //     // ]
    //     if (Array.isArray(serviceDef)) {
    //         for (const svc of serviceDef) {
    //             if (!svc.id) continue;
    //             if (svc.type === "promise" && svc.src) {
    //                 // 动态导入 promise 函数
    //                 actors[svc.id] = fromPromise(async (ctx, e) => {
    //                     const mod = await import(svc.src);
    //                     return await mod.default(ctx, e);
    //                 });
    //             } else if (svc.type === "transition") {
    //                 actors[svc.id] = fromTransition(
    //                     (state: any, event: any) => {
    //                         // 你可以在 service.json 定义 transition 逻辑
    //                         return { ...state, lastEvent: event };
    //                     },
    //                     {}
    //                 );
    //             }
    //         }
    //     } else if (typeof serviceDef === "object") {
    //         // 如果是 { id: def } 格式
    //         for (const [id, def] of Object.entries<any>(serviceDef)) {
    //             if (def.type === "promise" && def.src) {
    //                 actors[id] = fromPromise(async (ctx, e) => {
    //                     const mod = await import(def.src);
    //                     return await mod.default(ctx, e);
    //                 });
    //             }
    //         }
    //     }

    //     return actors;
    // }

    // private async safeReadJson(filePath: string): Promise<any> {
    //     if (!(await this.exists(filePath))) return {};
    //     const text = await fs.readFile(filePath, "utf-8");
    //     return JSON.parse(text);
    // }

    // private async exists(filePath: string): Promise<boolean> {
    //     try {
    //         await fs.access(filePath);
    //         return true;
    //     } catch {
    //         return false;
    //     }
    // }
}