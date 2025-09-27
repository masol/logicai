import pMap from 'p-map';
import fs from 'fs/promises';
import path from 'path';
import serialize from 'serialize-javascript';
import type {
    ActionEntry,
    FunctionResult,
    ParallelTask,
    WorkflowDefinition,
    WorkflowTask,
    IFlow
} from './index.type.js';

import {
    WORKFLOW_EXIT_ALL,
    WORKFLOW_RETURN,
} from './index.type.js';

import type { ExecutionContext } from '../task/index.type.js';
import type { IAppContext } from '../context.type.js';

const NEXT_ACTION = '_next';
const EXIT_ACTION = '_exit';

function isExitingAll(context: ExecutionContext): boolean {
    return !!context.isExitingAll;
}

function setExitingAll(context: ExecutionContext) {
    context.isExitingAll = true;
}

interface PersistFlow {
    actions: Record<string, ActionEntry>;
    flowDef: WorkflowDefinition;
}

type ActiveFlowInfo = {
    p: Promise<void>;
    ec: ExecutionContext;
}

export class Flow implements IFlow {
    private actions: Map<string, ActionEntry> = new Map();
    private flowDef: WorkflowDefinition | null = null;
    private app: IAppContext;
    // 活动任务注册表（外部可访问),每个异步链有id,对应的值是异步链的executionContext和它的Promise.
    // 通过设置ec.isExitingAll = true来终止任务。
    private activeFlows: Map<string, ActiveFlowInfo> = new Map();
    #dirty: boolean = false;

    /**
     * 构造函数支持可选 workflowDef
     */
    constructor(app: IAppContext, flowDef?: WorkflowDefinition) {
        this.app = app;
        if (flowDef) {
            this.setWorkflow(flowDef);
        }
    }

    /**
     * 获取当前 ExecutionContext
     */
    private get executionContext(): ExecutionContext {
        const exeContext = this.app.tasks.asyncStore.getStore();
        if (!exeContext) {
            throw new Error('[Flow] No ExecutionContext available. Use asyncStore.run() to wrap execution.');
        }
        return exeContext;
    }

    // --- 状态管理 API ---

    /**
     * 设置所有 actions
     */
    setActions(actions: Record<string, ActionEntry>, clear: Boolean = false): this {
        if (clear) {
            this.actions.clear();
        }
        Object.entries(actions).forEach(([id, action]) => {
            this.actions.set(id, action);
        });
        this.setDirty(true);
        return this;
    }
    /**
     * 注册 Action
     */
    setAction(id: string, action: ActionEntry): this {
        this.actions.set(id, action);
        this.setDirty(true);
        return this;
    }

    /**
     * 设置 workflow 定义
     */
    setWorkflow(flowDef: WorkflowDefinition): this {
        if (!flowDef || !flowDef.id || !Array.isArray(flowDef.tasks)) {
            throw new Error('[Flow] Invalid WorkflowDefinition: missing id or tasks.');
        }
        this.flowDef = flowDef;
        this.setDirty(true);
        return this;
    }

    /**
     * 获取当前 workflow 定义（只读）
     */
    getWorkflow(): WorkflowDefinition | null {
        return this.flowDef;
    }

    /**
     * 获取 dirty 状态
     */
    isDirty(): boolean {
        return this.#dirty;
    }

    /**
     * 设置 dirty 状态
     */
    setDirty(dirty: boolean): this {
        this.#dirty = dirty;
        return this;
    }

    // --- 持久化方法 ---

    /**
     * 从文件加载 Flow 状态（actions + workflowDef）
     */
    async loadFromFile(filePath: string): Promise<this> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const serializedData: PersistFlow = eval(`(${content})`); // deserialize

            // 还原 actions 为 Map
            this.actions.clear();
            Object.entries(serializedData.actions).forEach(([id, action]) => {
                this.actions.set(id, action);
            });

            this.flowDef = serializedData.flowDef;
            this.#dirty = false; // 加载后认为是干净的

            console.log(`[Flow] Loaded from ${filePath}`);
            return this;
        } catch (error: any) {
            throw new Error(`[Flow] Failed to load from ${filePath}: ${error.message}`);
        }
    }

    /**
     * 保存当前状态到文件（使用 serialize-javascript 支持函数）
     */
    async saveToFile(filePath: string): Promise<this> {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });

        const state: PersistFlow = {
            actions: Object.fromEntries(this.actions),
            flowDef: this.flowDef!,
        };

        const serialized = serialize(state, { unsafe: true }); // 允许函数
        await fs.writeFile(filePath, serialized, 'utf-8');

        this.#dirty = false;
        console.log(`[Flow] Saved to ${filePath}`);
        return this;
    }

    // --- 原有逻辑（修改 execute）---

    private async executeTask(taskId: string): Promise<string | null> {
        const executionContext = this.executionContext;
        const action = this.actions.get(taskId);
        if (!action || action.type !== 'function') {
            return NEXT_ACTION;
        }

        let result: FunctionResult;

        try {
            result = await action.fn(executionContext);
        } catch (error) {
            console.warn(`[Flow] Action '${taskId}' failed:`, error);
            return NEXT_ACTION;
        }

        if (typeof result === 'number') {
            if (result === WORKFLOW_EXIT_ALL) {
                setExitingAll(executionContext);
                return EXIT_ACTION;
            }
            if (result === WORKFLOW_RETURN) {
                return EXIT_ACTION;
            }
            return NEXT_ACTION;
        }

        if (result === undefined || result === null) {
            return NEXT_ACTION;
        }

        if (typeof result === 'string') {
            return result;
        }

        if (Array.isArray(result) && result.length > 0 && 'id' in result[0] && 'type' in result[0]) {
            await this.executeTaskList(result as WorkflowTask[]);
            if (isExitingAll(executionContext)) return EXIT_ACTION;
            return NEXT_ACTION;
        }

        if (typeof result === 'object' && result !== null && 'id' in result && 'tasks' in result) {
            const subFlow = new Flow(this.app);
            subFlow.actions = this.actions; // 共享 actions
            subFlow.flowDef = (result as WorkflowDefinition)
            await subFlow.execute();
            return NEXT_ACTION;
        }

        return NEXT_ACTION;
    }

    private getValidConcurrency(concurrency: unknown): number | undefined {
        const num = Number(concurrency);
        if (!Number.isInteger(num) || num <= 0) {
            return undefined;
        }
        return num;
    }

    private async executeTaskNode(task: WorkflowTask): Promise<string | null> {
        const executionContext = this.executionContext;
        if (isExitingAll(executionContext)) return EXIT_ACTION;

        switch (task.type) {
            case 'task':
                return await this.executeTask(task.id);

            case 'parallel': {
                const parallelTask = task as ParallelTask;
                const tasks = parallelTask.tasks;
                const concurrency = this.getValidConcurrency(parallelTask.concurrency);

                let hasExit = false;

                await pMap(
                    tasks,
                    async (subTask): Promise<void> => {
                        if (hasExit || isExitingAll(executionContext)) return;
                        const result = await this.executeTaskNode(subTask);
                        if (result === EXIT_ACTION || isExitingAll(executionContext)) {
                            hasExit = true;
                        }
                    },
                    { concurrency }
                );

                if (hasExit || isExitingAll(executionContext)) {
                    return EXIT_ACTION;
                }

                return NEXT_ACTION;
            }

            default:
                return NEXT_ACTION;
        }
    }

    private async executeTaskList(tasks: WorkflowTask[]): Promise<void> {
        const executionContext = this.executionContext;
        let i = 0;
        while (i < tasks.length) {
            if (isExitingAll(executionContext)) break;

            const task = tasks[i];
            const next = await this.executeTaskNode(task);

            if (next === EXIT_ACTION || isExitingAll(executionContext)) {
                return;
            }

            if (next === NEXT_ACTION) {
                i++;
                continue;
            }

            if (typeof next === 'string') {
                const targetIndex = tasks.findIndex(t => t.id === next);
                if (targetIndex >= 0) {
                    i = targetIndex;
                } else {
                    console.warn(`[Flow] Jump target not found: ${next}`);
                    i++;
                }
                continue;
            }

            i++;
        }
    }

    /**
     * 执行整个工作流（无需参数）
     */
    async execute(): Promise<void> {
        if (!this.flowDef) {
            throw new Error('[Flow] No workflow definition set. Use setWorkflow() before execute().');
        }

        const ctx = this.executionContext;
        console.log(`[Flow] Starting: ${this.flowDef.id} (Task: ${ctx.task.id})`);

        await this.executeTaskList(this.flowDef.tasks);

        console.log(`[Flow] Completed: ${this.flowDef.id}`);
    }
}