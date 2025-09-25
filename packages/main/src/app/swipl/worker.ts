import * as Comlink from "comlink";
import nodeEndpoint from "./nodeEndpoint.js";
import { parentPort } from "worker_threads";
// @ts-ignore: swipl-wasm 没有类型定义
import SWIPL, { type SWIPLModule } from "swipl-wasm";
import fs from "fs";
import path from "path";

import planSource from './lib/workflow.pl';

// console.log(prologSource);

class SwiplWorker {
    private static instance: SwiplWorker;
    private swipl!: SWIPLModule;
    private taskDir!: string;
    // 客户端维护instId，防止query错误的知识库。
    #instId: string = "";

    private constructor() {
    }

    public async create(): Promise<void> {
        this.swipl = await SWIPL({
            arguments: ["-q"]
        });
        const plfiles = await this.prepareVfs();

        // console.log("plfiles=", JSON.stringify(plfiles))
        if (plfiles.length > 0) {
            const loadFiles = this.swipl.prolog.query(JSON.stringify(plfiles) + '.')
            console.log("loadFiles.once()=")
            // const onceResult2 = result2.once()
            console.log(await loadFiles.once());
        } else {
            console.log("not prolog file to load...")
        }
    }

    public get instId() {
        return this.#instId;
    }

    public async refresh(dirName: string) {
        // console.log("dirName=", dirName)
        this.taskDir = dirName;
        this.#instId = crypto.randomUUID();
        return await this.create();
    }

    public static async inst(): Promise<SwiplWorker> {
        if (!this.instance) {
            this.instance = new SwiplWorker();
            // await this.instance.create();
        }
        return this.instance;
    }

    // 返回需要加载进入kc的pl文件列表。
    private async prepareVfs(): Promise<string[]> {
        const fileList: string[] = []
        // 简单的文件复制，避免所有挂载问题
        try {
            const swiplFS = this.swipl.FS;
            // 创建目录（如果失败就忽略）
            try { swiplFS.mkdir("/work"); } catch (e) { }

            const planFile = '/work/plan.pl'
            swiplFS.writeFile(planFile, planSource);
            fileList.push(planFile)


            try {
                // 检查目录是否存在且是一个目录
                const stats = await fs.promises.stat(this.taskDir);
                if (stats.isDirectory()) {
                    // 直接复制 .pl 文件
                    const files = await fs.promises.readdir(this.taskDir);
                    for (const file of files) {
                        if (file.endsWith('.pl')) {
                            const content = await fs.promises.readFile(path.join(this.taskDir, file), 'utf8');
                            const filename = `/work/${file}`
                            swiplFS.writeFile(filename, content);
                            fileList.push(filename)
                            console.log(`Loaded: ${file}`);
                        }
                    }
                }
            } catch (err) { }

            console.log('File setup complete');

        } catch (error) {
            console.error('Setup error:', error);
            // 继续运行，可能不需要文件系统
        }
        return fileList;
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