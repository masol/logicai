import { Worker } from "worker_threads";

interface WorkerMessage {
    id: number;
    query?: string;
    results?: Record<string, string>[];
    error?: string;
}

interface WorkerInitOptions {
    dir: string;
    files: string[];
}

export class SWipl {
    private worker: Worker;
    private requestId = 0;
    private pending = new Map<number, {
        resolve: (msg: WorkerMessage) => void;
        reject: (err: any) => void;
    }>();

    constructor(options: WorkerInitOptions) {
        console.log("init swi-prolog!!")

        const url = new URL("./worker.js", import.meta.url)
        console.log("url=", url)
        this.worker = new Worker(url, {
            workerData: options
        });

        // console.log("this.worker=", this.worker)


        // 在构造函数中只设置一次监听器
        this.worker.on("message", (msg: WorkerMessage) => {
            const { id, error } = msg;
            const task = this.pending.get(id);
            if (!task) return;

            if (error) {
                task.reject(new Error(error));
            } else {
                task.resolve(msg);
            }
            this.pending.delete(id);
        });

        this.worker.on("error", (err: Error) => {
            // 兜底: 若 worker 本身 crash，所有未完成任务报错
            for (const [, task] of this.pending) {
                task.reject(err);
            }
            this.pending.clear();
        });
    }

    public query(query: string): Promise<WorkerMessage> {
        return new Promise((resolve, reject) => {
            const id = ++this.requestId;
            this.pending.set(id, { resolve, reject });
            this.worker.postMessage({ id, query });
        });
    }

    public terminate() {
        return this.worker.terminate();
    }
}

// // ========== 使用示例 ===========
// async function main() {
//     const workerPath = new URL("./worker.js", import.meta.url).href;

//     const workerWrapper = new WorkerWrapper(workerPath, { dir: "/tmp", files: [] });

//     try {
//         const res1 = await workerWrapper.query("member(X, [apple, banana, cherry])");
//         console.log("结果1:", res1);

//         const res2 = await workerWrapper.query("member(X, [dog, cat, bird])");
//         console.log("结果2:", res2);
//     } catch (err) {
//         console.error("Worker 报错:", err);
//     } finally {
//         await workerWrapper.terminate();
//     }
// }

// main();