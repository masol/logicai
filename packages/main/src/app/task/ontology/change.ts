
interface ObjectChange<T = any> {
    timestamp: number; // 变更时间戳
    operation: 'create' | 'update' | 'delete'; // 操作类型
    field?: keyof T; // 变更的字段名，使用泛型约束
    changeType: 'add' | 'remove' | 'modify' | 'replace'; // 具体变更类型
    oldValue?: any; // 变更前的值（历史数据）
    metadata?: {
        operator?: string; // 操作者
        reason?: string; // 变更原因
        version?: string; // 版本号
        [key: string]: any; // 允许扩展元数据
    };
}

interface ObjectChangeRecord<T = any> {
    objectId: string; // 对象标识符
    objectType?: string; // 对象类型，便于区分不同类型的对象
    changes: ObjectChange<T>[];
}

// 变更跟踪管理器
interface ChangeTracker<T = any> {
    records: Map<string, ObjectChangeRecord<T>>;

    // 添加变更记录
    addChange(objectId: string, change: ObjectChange<T>): void;

    // 获取对象的变更历史
    getChangeHistory(objectId: string): ObjectChange<T>[];

    // 获取字段的变更历史
    getFieldHistory(objectId: string, field: keyof T): ObjectChange<T>[];
}