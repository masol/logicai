// flow/index.type.ts

import type { ExecutionContext } from "../task/index.type.js";

/**
 * 退出指令常量（负整数，保留>=0的数字）
 */
export const WORKFLOW_EXIT_ALL = -1;   // 退出所有层
export const WORKFLOW_RETURN = -2;     // 退出当前层


/**
 * 类型别名
 */
export type ExitInstruction = typeof WORKFLOW_EXIT_ALL | typeof WORKFLOW_RETURN;

/**
 * 函数执行的返回值类型
 */
export type FunctionResult =
    | void
    | string                         // 跳转到 taskId
    | number                         // 数值（包括 0, 正数，-1/-2 为控制指令）
    | WorkflowTask[]                 // 内联任务列表
    | WorkflowDefinition             // 子流程定义
    | { [key: string]: any };        // 普通对象或数组

/**
 * 本地函数 Action
 */
export interface FunctionAction {
    type: 'function';
    meta?: {
        description?: string;
        [key: string]: any
    };
    fn: (exeCtx: ExecutionContext) => Promise<FunctionResult>;
}

/**
 * LLM Action
 */
export interface LLMAction {
    type: 'llm';
    meta?: {
        description?: string;
        [key: string]: any
    };
    promptTemplate: string | string[2]; // 如果是数组,0为system,1为userInput.
    inputMapping: Map<string, string>;
}

/**
 * 联合 Action 类型
 */
export type ActionEntry = FunctionAction | LLMAction;

/**
 * 任务类型
 */
export type TaskType = 'task' | 'parallel';

/**
 * 基础任务
 */
export interface BaseTask {
    id: string;
    type: TaskType;
}

export interface Task extends BaseTask {
    type: 'task';
}

export interface ParallelTask extends BaseTask {
    type: 'parallel';
    concurrency?: number; // 最大并行数。
    tasks: WorkflowTask[];
}


export type WorkflowTask = Task | ParallelTask | string;

/**
 * 工作流定义
 */
export interface WorkflowDefinition {
    id: string;
    description?: string;
    output?: string[];
    input?: string[];
    tasks: WorkflowTask[];
}

/**
 * Flow 类的接口定义
 *
 * 用于定义工作流引擎的核心行为，支持动态设置 actions 和 workflow 定义，
 * 并提供执行、持久化和状态管理功能。
 */
export interface IFlow {
    // --- 状态管理方法 ---

    /**
     * 设置工作流中可用的所有 actions
     * @param actions 键值对形式的 action 映射
     * @returns 当前实例（链式调用）
     */
    setActions(actions: Record<string, ActionEntry>, clear?: boolean): this;
    /**
     * 添加一个action.
     * @param id 
     * @param action 
     */
    setAction(id: string, action: ActionEntry): this;

    /**
     * 设置工作流定义
     * @param workflowDef 工作流定义对象
     * @returns 当前实例（链式调用）
     */
    setWorkflow(workflowDef: WorkflowDefinition): this;

    /**
     * 获取当前工作流定义（只读副本）
     * @returns 工作流定义或 null
     */
    getWorkflow(): WorkflowDefinition | null;

    /**
     * 检查当前状态是否为“脏”（即自上次保存后有变更）
     * @returns true 表示有未保存的更改
     */
    isDirty(): boolean;

    /**
     * 设置 dirty 状态
     * @param dirty 是否为脏状态
     * @returns 当前实例（链式调用）
     */
    setDirty(dirty: boolean): this;

    // --- 持久化方法 ---

    /**
     * 从文件加载 Flow 的状态（actions 和 workflowDef）
     * @param filePath 文件路径
     * @returns 当前实例（Promise）
     */
    loadFromFile(filePath: string): Promise<this>;

    /**
     * 将当前 Flow 状态保存到文件
     * @param filePath 文件路径
     * @returns 当前实例（Promise）
     */
    saveToFile(filePath: string): Promise<this>;

    // --- 执行方法 ---

    /**
     * 执行整个工作流
     * @returns Promise<void>
     * @throws 如果未设置 workflowDef
     */
    execute(): Promise<void>;
}

export interface IFlowFactory {
    load(id: string): Promise<IFlow>
}

