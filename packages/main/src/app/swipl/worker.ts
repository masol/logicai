import * as Comlink from "comlink";
import nodeEndpoint from "./nodeEndpoint.js";
import { parentPort, workerData } from "worker_threads";
// @ts-ignore: swipl-wasm 没有类型定义
import SWIPL, { type SWIPLModule } from "swipl-wasm";
import fs from "fs";
import path from "path";

import prologSource from './lib/workflow.pl';

console.log(prologSource);


class SwiplWorker {
    private static instance: SwiplWorker;
    private swipl!: SWIPLModule;
    #instId: string = "";

    private constructor() {
    }

    public async create(): Promise<void> {
        this.swipl = await SWIPL({
            arguments: ["-q"]
        });
    }

    public get instId() {
        return this.#instId;
    }

    public async refresh(dirName: string) {
        console.log("dirName=", dirName)
        this.#instId = crypto.randomUUID();
    }

    public static async inst(): Promise<SwiplWorker> {
        if (!this.instance) {
            this.instance = new SwiplWorker();
            await this.instance.create();
        }
        return this.instance;
    }

    private async vp2Vfs() {
        // 简单的文件复制，避免所有挂载问题
        try {
            const swiplFS = this.swipl.FS;
            // 创建目录（如果失败就忽略）
            try { swiplFS.mkdir("/work"); } catch (e) { }

            // 直接复制 .pl 文件
            const files = await fs.promises.readdir(workerData.dir);
            for (const file of files) {
                if (file.endsWith('.pl')) {
                    const content = await fs.promises.readFile(path.join(workerData.dir, file), 'utf8');
                    swiplFS.writeFile(`/work/${file}`, content);
                    console.log(`Loaded: ${file}`);
                }
            }

            console.log('File setup complete');

        } catch (error) {
            console.error('Setup error:', error);
            // 继续运行，可能不需要文件系统
        }
    }

    public async query(query: string) {
        const results: Record<string, string>[] = [];
        const result = this.swipl.prolog.query("directory_files('/', Files).")
        console.log("result.once()=")
        const onceResult = result.once()
        console.log(onceResult);
        return onceResult;
    }

}

const api = {
    async init() {
        // console.log("enter init")
        return true;
    },
    async dispatch(
        instanceId: string,
        funcName: string,
        ...args: any[]
    ): Promise<any> {
        // console.log("enter dispatch")
        const sw = await SwiplWorker.inst();

        if (funcName === "refresh") {
            await sw.refresh(args[0]);   // args 第一个就是原本的 arguments[2]
            return sw.instId;
        }

        if (instanceId !== sw.instId) {
            throw new Error(`${instanceId}实例对象已销毁!`);
        }

        const target = (sw as any)[funcName];

        if (typeof target === "function") {
            const r = await target.apply(sw, args);
            // console.log("dispatch return type:", typeof r, r && r.constructor?.name);
            return r;
        }

        throw new Error(`${funcName} 方法未支持`);
    }
};

Comlink.expose(api, nodeEndpoint(parentPort));