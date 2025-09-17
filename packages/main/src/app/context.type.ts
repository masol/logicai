import { type LokiDatabase } from "./loki.js";
import { type History } from "./history.js";
import { type ITaskMan } from "./taskman.type.js";

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

    /**
     * 历史记录实例（只读）
     */
    readonly history: History;

    readonly task: ITaskMan;

    /**
     * 获取初始化状态
     */
    readonly inited: boolean;

    /**
     * 发送事件到渲染进程
     * @param eventName 事件名称
     * @param eventData 事件数据，默认为空对象
     */
    emit(eventName: string, eventData?: Record<string, any>): void;

    /**
     * 确保指定ID的子数据库存在并初始化
     * @param id 数据库ID
     * @returns Promise，resolve时返回数据库实例
     */
    ensureDB(id: string): Promise<LokiDatabase>;

    /**
     * 关闭指定ID的子数据库
     * @param id 数据库ID
     * @returns Promise，resolve时返回操作是否成功
     */
    closeDB(id: string): Promise<boolean>;
}
