import { Worker } from "worker_threads";
import * as Comlink from "comlink";
import nodeEndpoint from './nodeEndpoint.js'
import { WorkerAPI } from './swipl.types.js'
import { SWipl } from "./swipl.js";

export class SWiplFactory {
    private static instance: SWiplFactory | null = null;
    private api!: Comlink.Remote<WorkerAPI>;
    private worker!: Worker;
    private ready: Promise<boolean>;


    private constructor() {
        this.worker = new Worker(new URL("./worker.js", import.meta.url));
        this.api = Comlink.wrap<WorkerAPI>(nodeEndpoint(this.worker));
        // worker里必须提供init()
        this.ready = this.api.init();
    }

    /** 首次调用时初始化工厂 */
    private static async ensureFactory() {
        if (!this.instance) {
            this.instance = new SWiplFactory();
            await this.instance.ready; // 等待初始化完成
        }
        return this.instance;
    }

    /** 对外提供 API getter，用于 SWipl 调用 */
    public static getAPI() {
        if (!this.instance) {
            throw new Error("SWiplFactory not initialized. Call create() first.");
        }
        return this.instance.api;
    }

    /** 异步创建一个 SWipl 实例 */
    public static async create(taskDir: string): Promise<SWipl> {
        await this.ensureFactory();
        const swiplId = await this.instance?.api.dispatch("", "refresh", taskDir);
        if (!swiplId) {
            throw new Error("Invalid Worker!")
        }
        return new SWipl(swiplId, this.getAPI());
    }

    public static async terminate() {
        if (this.instance) {
            await this.instance.worker.terminate();
            this.instance = null;
        }
    }
}