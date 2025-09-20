import { createMachine, createActor, StateFrom, ActorRef } from 'xstate';
import { readFile, writeFile, access } from 'fs/promises';
import { join } from 'path';
import { Parser, Store } from 'n3';
import * as R from 'remeda';
import { IAppContext } from '../../context.type.js';

// 导入特殊FSM定义
import planMachine from './plan.js';

// FSM上下文接口
interface FSMContext {
    id: string;
    rdf?: Store;
    [key: string]: any;
}

// FSM状态持久化接口
interface FSMPersistedState {
    initialState?: any;  // 对应xstate的initial状态值
    context: FSMContext; // 上下文数据
}

/**
 * 绑定状态机定义中所有函数的this到app
 * @param definition 状态机定义
 * @param app 应用上下文
 * @returns 绑定后的状态机定义
 */
function bindFunctionsToApp(definition: any, app: IAppContext): any {
    function bindRecursively(obj: any): any {
        if (typeof obj === 'function') {
            // 将函数的this绑定到app
            return obj.bind(app);
        } else if (Array.isArray(obj)) {
            return obj.map(bindRecursively);
        } else if (obj && typeof obj === 'object') {
            const result: any = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = bindRecursively(value);
            }
            return result;
        }
        return obj;
    }

    return bindRecursively(definition);
}

/**
 * 加载并创建FSM实例
 * @param fsmName FSM名称
 * @param taskId 任务ID
 * @param app 应用上下文
 * @returns FSMWrapper实例
 */
export async function loadFsm(fsmName: string, taskId: string, app: IAppContext): Promise<FSMWrapper> {
    const wrapper = new FSMWrapper(fsmName, taskId, app);
    await wrapper.load();
    return wrapper;
}

/**
 * FSM包装类，负责加载、保存和管理单个状态机
 */
class FSMWrapper {
    private machine: any;
    private actor?: ActorRef<any, any>; // 声明为可选属性
    private taskId: string;
    private fsmName: string;
    private app: IAppContext;
    private subfsmset: Map<string, FSMWrapper> = new Map();

    constructor(fsmName: string, taskId: string, app: IAppContext) {
        this.fsmName = fsmName;
        this.taskId = taskId;
        this.app = app;
    }

    /**
     * 加载FSM（包含定义、上下文、RDF和状态）
     */
    async load(): Promise<void> {
        try {
            const taskDirectory = this.app.taskDir(this.taskId);

            // 1. 加载状态机定义
            let machineDefinition = await this.loadMachineDefinition();

            // 2. 绑定所有函数的this到app
            machineDefinition = bindFunctionsToApp(machineDefinition, this.app);

            // 3. 加载持久化状态（包含上下文和初始状态）
            const contextPath = join(taskDirectory, 'context.json');
            const persistedState = await this.loadPersistedState(contextPath);

            // 4. 加载RDF本体数据
            const rdfPath = join(taskDirectory, 'rdf.ttl');
            const rdfStore = await this.loadRDF(rdfPath);

            // 5. 准备最终上下文
            let finalContext: FSMContext;

            if (persistedState) {
                // 有持久化状态，合并上下文
                finalContext = {
                    ...persistedState.context,
                    id: this.taskId,
                    rdf: rdfStore // 确保使用最新的RDF数据
                };

                // 如果有持久化的初始状态，设置到机器定义中
                if (persistedState.initialState !== undefined) {
                    machineDefinition.initial = persistedState.initialState;
                }
            } else {
                // 没有持久化状态，使用默认上下文
                finalContext = {
                    id: this.taskId,
                    rdf: rdfStore
                };
            }

            // 6. 设置最终的机器定义
            machineDefinition = {
                ...machineDefinition,
                context: finalContext
            };

            // 7. 创建状态机和Actor
            this.machine = createMachine(machineDefinition);
            this.actor = createActor(this.machine);

            console.log(`FSM [${this.fsmName}] 任务 [${this.taskId}] 加载完成`);
        } catch (error) {
            throw new Error(`加载FSM失败 [${this.fsmName}] 任务 [${this.taskId}]: ${error}`);
        }
    }

    /**
     * 从指定目录加载RDF数据并设置到上下文
     * @param rdfDirectory RDF目录路径
     */
    async loadRDFFromDirectory(rdfDirectory: string): Promise<void> {
        if (!this.actor) {
            throw new Error('FSM未初始化，请先调用load()方法');
        }

        const rdfPath = join(rdfDirectory, 'rdf.ttl');
        const rdfStore = await this.loadRDF(rdfPath);

        // 更新上下文中的RDF数据
        this.actor.send({
            type: 'UPDATE_CONTEXT',
            data: { rdf: rdfStore }
        });
    }

    /**
     * 保存FSM状态到context.json
     */
    async save(): Promise<void> {
        if (!this.actor) {
            throw new Error('FSM未初始化，请先调用load()方法');
        }

        try {
            const taskDirectory = this.app.taskDir(this.taskId);
            const currentSnapshot = this.actor.getSnapshot();

            // 准备持久化状态，排除RDF数据，确保包含id
            const contextToSave: FSMContext = {
                id: this.taskId, // 确保id字段存在
                ...R.omit(currentSnapshot.context, ['rdf'])
            };

            const persistedState: FSMPersistedState = {
                initialState: currentSnapshot.value,
                context: contextToSave
            };

            // 保存到context.json
            const contextPath = join(taskDirectory, 'context.json');
            await writeFile(contextPath, JSON.stringify(persistedState, null, 2));

            // 保存所有子FSM
            for (const [subfsmName, subfsm] of this.subfsmset) {
                await subfsm.save();
            }

            console.log(`FSM [${this.fsmName}] 任务 [${this.taskId}] 状态已保存`);
        } catch (error) {
            throw new Error(`保存FSM状态失败 [${this.fsmName}] 任务 [${this.taskId}]: ${error}`);
        }
    }

    /**
     * 添加子FSM
     * @param subfsmName 子FSM名称
     * @param subfsm 子FSM实例
     */
    addSubFsm(subfsmName: string, subfsm: FSMWrapper): void {
        this.subfsmset.set(subfsmName, subfsm);
    }

    /**
     * 获取子FSM
     * @param subfsmName 子FSM名称
     * @returns 子FSM实例或undefined
     */
    getSubFsm(subfsmName: string): FSMWrapper | undefined {
        return this.subfsmset.get(subfsmName);
    }

    /**
     * 移除子FSM
     * @param subfsmName 子FSM名称
     * @returns 是否成功移除
     */
    removeSubFsm(subfsmName: string): boolean {
        const subfsm = this.subfsmset.get(subfsmName);
        if (subfsm) {
            subfsm.stop();
            return this.subfsmset.delete(subfsmName);
        }
        return false;
    }

    /**
     * 获取所有子FSM名称
     */
    getSubFsmNames(): string[] {
        return Array.from(this.subfsmset.keys());
    }

    /**
     * 获取所有子FSM
     */
    getAllSubFsms(): Map<string, FSMWrapper> {
        return new Map(this.subfsmset);
    }

    /**
     * 启动状态机和所有子FSM
     */
    start(): void {
        if (!this.actor) {
            throw new Error('FSM未初始化，请先调用load()方法');
        }
        this.actor.start();

        // 启动所有子FSM
        for (const subfsm of this.subfsmset.values()) {
            subfsm.start();
        }
    }

    /**
     * 停止状态机和所有子FSM
     */
    stop(): void {
        // 停止所有子FSM
        for (const subfsm of this.subfsmset.values()) {
            subfsm.stop();
        }

        if (this.actor) {
            this.actor.stop();
        }
    }

    /**
     * 发送事件
     */
    send(event: string | object): void {
        if (!this.actor) {
            throw new Error('FSM未初始化，请先调用load()方法');
        }
        this.actor.send(event);
    }

    /**
     * 获取当前状态快照
     */
    getCurrentSnapshot(): any {
        if (!this.actor) {
            throw new Error('FSM未初始化，请先调用load()方法');
        }
        return this.actor.getSnapshot();
    }

    /**
     * 获取当前上下文
     */
    getContext(): FSMContext {
        if (!this.actor) {
            throw new Error('FSM未初始化，请先调用load()方法');
        }
        return this.actor.getSnapshot().context;
    }

    /**
     * 订阅状态变化
     */
    subscribe(listener: (snapshot: any) => void): () => void {
        if (!this.actor) {
            throw new Error('FSM未初始化，请先调用load()方法');
        }
        return this.actor.subscribe(listener).unsubscribe;
    }

    /**
     * 获取FSM名称
     */
    getFsmName(): string {
        return this.fsmName;
    }

    /**
     * 获取任务ID
     */
    getTaskId(): string {
        return this.taskId;
    }

    /**
     * 获取Actor引用
     */
    getActor(): ActorRef<any, any> | undefined {
        return this.actor;
    }

    // 私有方法
    private async loadMachineDefinition(): Promise<any> {
        const specialFsms = {
            'plan': planMachine
        };

        if (this.fsmName in specialFsms) {
            return specialFsms[this.fsmName as keyof typeof specialFsms];
        } else {
            const taskDirectory = this.app.taskDir(this.taskId);
            return await loadMachineDefinitionFromDirectory(taskDirectory);
        }
    }

    private async loadPersistedState(contextPath: string): Promise<FSMPersistedState | null> {
        try {
            const contextData = await readFile(contextPath, 'utf-8');
            const data = JSON.parse(contextData);

            // 检查是否是新的持久化格式（包含initialState字段）
            if (data.hasOwnProperty('initialState') || data.hasOwnProperty('context')) {
                return data as FSMPersistedState;
            }

            // 兼容旧格式，只有context数据的情况
            if (typeof data === 'object' && data.id) {
                return {
                    context: data
                };
            }

            return null;
        } catch (error) {
            console.log(`持久化状态文件不存在，将使用默认状态: ${error}`);
            return null;
        }
    }

    private async loadRDF(rdfPath: string): Promise<Store> {
        try {
            const rdfContent = await readFile(rdfPath, 'utf-8');
            const parser = new Parser();
            const store = new Store();

            return new Promise((resolve, reject) => {
                parser.parse(rdfContent, (error, quad, prefixes) => {
                    if (error) {
                        reject(error);
                    } else if (quad) {
                        store.addQuad(quad);
                    } else {
                        resolve(store);
                    }
                });
            });
        } catch (error) {
            console.log(`RDF文件不存在，返回空Store: ${error}`);
            return new Store();
        }
    }
}

/**
 * 从目录加载机器定义的辅助函数
 */
async function loadMachineDefinitionFromDirectory(directory: string): Promise<any> {
    // 优先尝试machine.json
    const jsonPath = join(directory, 'machine.json');
    try {
        await access(jsonPath);
        const jsonContent = await readFile(jsonPath, 'utf-8');
        return JSON.parse(jsonContent);
    } catch (error) {
        // machine.json不存在，尝试machine.js
        const jsPath = join(directory, 'machine.js');
        try {
            const definition = await import(jsPath);
            return definition.default || definition;
        } catch (jsError) {
            throw new Error(`加载状态机定义失败，machine.json和machine.js都不存在或有错误: ${error}, ${jsError}`);
        }
    }
}

export { FSMWrapper };