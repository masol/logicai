console.log("test123123")

import { parentPort, workerData } from "worker_threads"
import fs from "fs";
import path from "path";
// @ts-ignore: swipl-wasm 没有类型定义
import SWIPL from "swipl-wasm";

interface WorkerMessage {
    id: number;
    query?: string;
    results?: Record<string, string>[];
    error?: string;
}


// 挂载宿主文件系统目录
console.log('in swi-prolog workerData.dir=', workerData.dir)
const swipl = await SWIPL({
    arguments: ["-q"]
});

// console.log(swipl);
// console.log(SWIPL);

const swiplFS = swipl.FS;


async function cp2Vfs() {
    // 简单的文件复制，避免所有挂载问题
    try {
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
// await cp2Vfs();

// 暂时让 TS 忽略类型,@todo: mount不工作，直接拷贝，这带来销毁时的同步压力！！
// const NODEFS = (swipl as any).NODEFS;
try { swiplFS.mkdir("/work"); } catch (e) { }


// 检查 mount 函数和可用的文件系统
console.log('FS has mount function:', typeof swiplFS.mount === 'function');
console.log('FS object keys:', Object.keys(swiplFS));

// @ts-ignore 检查文件系统注册表
if (swiplFS.filesystems) {
    // @ts-ignore 检查文件系统注册表
    console.log('Available filesystems:', Object.keys(swiplFS.filesystems));
    // @ts-ignore 检查文件系统注册表
    console.log('NODEFS available:', 'NODEFS' in swiplFS.filesystems);
} else {
    console.log('No filesystems registry found');
}

// @ts-ignore 检查全局或模块级别的 NODEFS
console.log('swipl.NODEFS:', !!swipl.NODEFS);
console.log('swipl.Module?.NODEFS:', !!(swipl as any).Module?.NODEFS);

// 检查是否有其他文件系统类型
const potentialFS = ['NODEFS', 'IDBFS', 'MEMFS', 'WORKERFS'];
potentialFS.forEach(fsType => {
    if ((swiplFS as any)[fsType]) {
        console.log(`Found ${fsType}:`, !!(swiplFS as any)[fsType]);
    }
});
// await swipl.FS.mount(NODEFS, { root: workerData.dir }, "/work");
// try {
//     // @ts-ignore
//     await swiplFS.mount("NODEFS", { root: workerData.dir }, "/work");
//     console.log('✓ Native mount successful');
// } catch (error) {
//     console.log('✗ Native mount failed:', error.message);
// }
console.log("inited")

async function initProlog(): Promise<void> {
    parentPort?.on("message", async ({ id, query }: WorkerMessage) => {
        console.log("recieve msg=", id, query)
        try {

            const results: Record<string, string>[] = [];
            const result = swipl.prolog.query("directory_files('/work', Files).")
            console.log("result.once()=")
            console.log(result.once());

            parentPort?.postMessage({ id, query, results });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            parentPort?.postMessage({ error: msg });
        }
    });
}

initProlog();