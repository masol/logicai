import { type LokiDatabase } from "./loki.js";
import { type History } from "./history.js";
import { type ITaskMan } from "./task/index.type.js";
import type { ILLMManager } from './llms/index.type.js'

export interface IAppContext {
    /**
     * Electron 应用实例（只读）
     */
    readonly app: Electron.App;

    /**
     * Electron 主窗口实例（只读）
     */
    readonly win: Electron.BrowserWindow;

    /**
     * 主数据库实例（只读）
     */
    readonly db: LokiDatabase;

    readonly llms: ILLMManager;

    /**
     * 历史记录实例（只读）
     */
    readonly history: History;

    readonly task: ITaskMan;

    /**
     * 获取初始化状态
     */
    readonly inited: boolean;

    passive: boolean; // 当前AI是否处于被动工作模式(true:自行根据上下文确定一切待决信息,false: 询问用户缺失信息。)

    /**
     * 发送事件到渲染进程
     * @param eventName 事件名称
     * @param eventData 事件数据，默认为空对象
     */
    emit(eventName: string, eventData?: Record<string, any>): void;


    //获取指定任务的目录。id为任务id.
    taskDir(id: string): string;

}
