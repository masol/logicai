import sqlite3 from 'sqlite3';
import * as nodejieba from 'nodejieba';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface MessageContent {
    content: string;
    files?: {
        filename: string;
        type: string;
        desc?: string;
    }[];
    progressId?: string;
    progressCtx?: string[];
}

export interface Message {
    id: string;
    type: "ai" | "user" | "sys";
    content: MessageContent;
    timestamp: number;
}

export interface HistoryLoadResult {
    messages: Message[];
    total: number;
}

export class History {
    private db!: sqlite3.Database;
    private isInitialized: boolean = false;

    constructor(
        private filename: string,
        private onInitialized?: (error?: Error) => void
    ) {
        this.initializeAsync().catch(error => {
            console.error('数据库初始化失败:', error);
            this.onInitialized?.(error);
        });
    }

    private async initializeAsync(): Promise<void> {
        try {
            await this.checkAndInitDatabase();
            this.isInitialized = true;
            this.onInitialized?.();
        } catch (error) {
            this.onInitialized?.(error as Error);
            throw error;
        }
    }

    private async checkAndInitDatabase(): Promise<void> {
        let isNewDatabase = false;

        try {
            await fs.access(this.filename);
            console.log(`使用现有数据库: ${this.filename}`);
        } catch {
            // 文件不存在，需要创建
            const dir = path.dirname(this.filename);
            await fs.mkdir(dir, { recursive: true });
            isNewDatabase = true;
            console.log(`创建新数据库: ${this.filename}`);
        }

        // 使用 sqlite3 创建数据库连接
        this.db = await this.openDatabase(this.filename);

        // 启用外键约束和WAL模式以提高性能
        await this.execAsync('PRAGMA foreign_keys = ON');
        await this.execAsync('PRAGMA journal_mode = WAL');
        await this.execAsync('PRAGMA synchronous = NORMAL');
        await this.execAsync('PRAGMA cache_size = -64000'); // 64MB cache
        await this.execAsync('PRAGMA temp_store = memory');

        // 检查并创建表结构
        await this.initializeTables(isNewDatabase);
    }

    private openDatabase(filename: string): Promise<sqlite3.Database> {
        return new Promise((resolve, reject) => {
            // 确保verbose模式以获得更好的错误信息
            const Database = sqlite3.verbose().Database;
            const db = new Database(filename, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(db);
                }
            });
        });
    }

    private execAsync(sql: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.exec(sql, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    private runAsync(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    private getAsync(sql: string, params: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    private allAsync(sql: string, params: any[] = []): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    private async initializeTables(isNewDatabase: boolean): Promise<void> {
        // 检查主表是否存在
        const tableExists = await this.checkTableExists('messages');
        const ftsTableExists = await this.checkTableExists('messages_fts');

        if (!tableExists) {
            console.log('创建主表 messages');
            await this.createMainTable();
        }

        if (!ftsTableExists) {
            console.log('创建全文搜索表 messages_fts');
            await this.createFTSTable();
        }

        // 检查并创建索引
        await this.ensureIndexes();

        // 检查并创建触发器
        await this.ensureTriggers();

        // 如果是现有数据库，检查表结构是否需要更新
        if (!isNewDatabase) {
            await this.checkAndUpgradeSchema();
        }
    }

    private async checkTableExists(tableName: string): Promise<boolean> {
        const result = await this.getAsync(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name=?
        `, [tableName]);

        return !!result;
    }

    private async createMainTable(): Promise<void> {
        await this.execAsync(`
            CREATE TABLE messages (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL CHECK(type IN ('ai', 'user', 'sys')),
                content_json TEXT NOT NULL,
                content_text TEXT NOT NULL,
                content_tokens TEXT NOT NULL,
                progress_id TEXT,
                progress_ctx_json TEXT,
                timestamp INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    private async createFTSTable(): Promise<void> {
        // 检查FTS5是否可用，优先使用FTS5
        try {
            await this.execAsync(`
                CREATE VIRTUAL TABLE messages_fts USING fts5(
                    id UNINDEXED,
                    content_tokens,
                    content='messages',
                    content_rowid='rowid',
                    tokenize='unicode61 remove_diacritics 1'
                )
            `);
            console.log('使用FTS5全文搜索');
        } catch (error) {
            console.error('FTS5不可用，降级使用FTS4:', error);
            await this.execAsync(`
                CREATE VIRTUAL TABLE messages_fts USING fts4(
                    id,
                    content_tokens,
                    tokenize=unicode61
                )
            `);
            console.log('使用FTS4全文搜索');
        }
    }

    private async ensureIndexes(): Promise<void> {
        const indexes = [
            { name: 'idx_messages_timestamp', sql: 'CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC)' },
            { name: 'idx_messages_type', sql: 'CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type)' },
            { name: 'idx_messages_progress_id', sql: 'CREATE INDEX IF NOT EXISTS idx_messages_progress_id ON messages(progress_id)' },
            { name: 'idx_messages_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)' }
        ];

        for (const index of indexes) {
            const indexExists = await this.getAsync(`
                SELECT name FROM sqlite_master 
                WHERE type='index' AND name=?
            `, [index.name]);

            if (!indexExists) {
                console.log(`创建索引: ${index.name}`);
                await this.execAsync(index.sql);
            }
        }
    }

    private async ensureTriggers(): Promise<void> {
        const triggers = [
            {
                name: 'messages_ai',
                sql: `
                    CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
                        INSERT INTO messages_fts(rowid, id, content_tokens) 
                        VALUES (new.rowid, new.id, new.content_tokens);
                    END
                `
            },
            {
                name: 'messages_ad',
                sql: `
                    CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
                        INSERT INTO messages_fts(messages_fts, rowid, id, content_tokens) 
                        VALUES ('delete', old.rowid, old.id, old.content_tokens);
                    END
                `
            },
            {
                name: 'messages_au',
                sql: `
                    CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages 
                    WHEN old.content_tokens != new.content_tokens BEGIN
                        INSERT INTO messages_fts(messages_fts, rowid, id, content_tokens) 
                        VALUES ('delete', old.rowid, old.id, old.content_tokens);
                        INSERT INTO messages_fts(rowid, id, content_tokens) 
                        VALUES (new.rowid, new.id, new.content_tokens);
                    END
                `
            },
            {
                name: 'messages_update_timestamp',
                sql: `
                    CREATE TRIGGER IF NOT EXISTS messages_update_timestamp AFTER UPDATE ON messages BEGIN
                        UPDATE messages SET updated_at = CURRENT_TIMESTAMP WHERE id = new.id;
                    END
                `
            }
        ];

        for (const trigger of triggers) {
            const triggerExists = await this.getAsync(`
                SELECT name FROM sqlite_master 
                WHERE type='trigger' AND name=?
            `, [trigger.name]);

            if (!triggerExists) {
                console.log(`创建触发器: ${trigger.name}`);
                await this.execAsync(trigger.sql);
            }
        }
    }

    private async checkAndUpgradeSchema(): Promise<void> {
        // 检查是否需要添加新列
        const tableInfo = await this.allAsync("PRAGMA table_info(messages)") as Array<{ name: string }>;
        const columnNames = tableInfo.map(col => col.name);

        const newColumns = [
            { name: 'created_at', sql: 'ALTER TABLE messages ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP' },
            { name: 'updated_at', sql: 'ALTER TABLE messages ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP' },
            { name: 'progress_id', sql: 'ALTER TABLE messages ADD COLUMN progress_id TEXT' },
            { name: 'progress_ctx_json', sql: 'ALTER TABLE messages ADD COLUMN progress_ctx_json TEXT' }
        ];

        for (const column of newColumns) {
            if (!columnNames.includes(column.name)) {
                console.log(`升级数据库schema：添加${column.name}列`);
                await this.execAsync(column.sql);
            }
        }

        // 重建FTS索引（如果需要）
        await this.rebuildFTSIfNeeded();
    }

    private async rebuildFTSIfNeeded(): Promise<void> {
        try {
            // 检查FTS表是否包含所有数据
            const mainTableCount = await this.getAsync("SELECT COUNT(*) as count FROM messages") as { count: number };
            const ftsTableCount = await this.getAsync("SELECT COUNT(*) as count FROM messages_fts") as { count: number };

            if (mainTableCount.count !== ftsTableCount.count) {
                console.log('重建FTS索引...');
                await this.execAsync("INSERT INTO messages_fts(messages_fts) VALUES('rebuild')");
            }
        } catch (error) {
            console.error('检查FTS索引时出错:', error);
        }
    }

    private extractTextContent(content: MessageContent): string {
        let text = content.content;

        if (content.files && content.files.length > 0) {
            const fileTexts = content.files.map(file => {
                const parts = [file.filename];
                if (file.desc) {
                    parts.push(file.desc);
                }
                return parts.join(' ');
            });
            text += ' ' + fileTexts.join(' ');
        }

        // 添加progressCtx内容到搜索文本中
        if (content.progressCtx && content.progressCtx.length > 0) {
            text += ' ' + content.progressCtx.join(' ');
        }

        return text;
    }

    private async tokenizeContent(text: string): Promise<string> {
        return new Promise((resolve) => {
            // 使用setImmediate让分词操作异步，避免阻塞事件循环
            setImmediate(() => {
                try {
                    // 使用nodejieba进行中文分词
                    const tokens = nodejieba.cut(text);

                    // 过滤掉过短的词和标点符号
                    const filteredTokens = tokens.filter(token => {
                        const trimmed = token.trim();
                        return trimmed.length > 1 && !/^[^\w\u4e00-\u9fa5]+$/.test(trimmed);
                    });

                    resolve(filteredTokens.join(' '));
                } catch (error) {
                    console.error('分词失败，使用原始文本:', error);
                    resolve(text);
                }
            });
        });
    }

    private rowToMessage(row: {
        id: string;
        type: string;
        content_json: string;
        progress_id: string | null;
        progress_ctx_json: string | null;
        timestamp: number;
    }): Message {
        const content = JSON.parse(row.content_json) as MessageContent;

        // 从数据库中恢复progressId和progressCtx
        if (row.progress_id) {
            content.progressId = row.progress_id;
        }
        if (row.progress_ctx_json) {
            content.progressCtx = JSON.parse(row.progress_ctx_json);
        }

        return {
            id: row.id,
            type: row.type as "ai" | "user" | "sys",
            content: content,
            timestamp: row.timestamp
        };
    }

    /**
     * 检查数据库是否已初始化
     */
    public isReady(): boolean {
        return this.isInitialized;
    }

    /**
     * 等待数据库初始化完成
     */
    public async waitForReady(): Promise<void> {
        return new Promise((resolve) => {
            if (this.isInitialized) {
                resolve();
                return;
            }

            const checkReady = () => {
                if (this.isInitialized) {
                    resolve();
                } else {
                    setTimeout(checkReady, 10);
                }
            };
            checkReady();
        });
    }

    /**
     * 获取数据库文件信息
     */
    public async getDatabaseInfo(): Promise<{ filename: string; exists: boolean; size: number }> {
        try {
            const stats = await fs.stat(this.filename);
            return { filename: this.filename, exists: true, size: stats.size };
        } catch {
            return { filename: this.filename, exists: false, size: 0 };
        }
    }

    /**
     * 添加一条新的消息记录
     */
    public async addMessage(message: Message): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('数据库未初始化完成');
        }

        try {
            const contentJson = JSON.stringify(message.content);
            const contentText = this.extractTextContent(message.content);
            const contentTokens = await this.tokenizeContent(contentText);
            const progressId = message.content.progressId || null;
            const progressCtxJson = message.content.progressCtx ? JSON.stringify(message.content.progressCtx) : null;

            await this.runAsync(`
                INSERT INTO messages (id, type, content_json, content_text, content_tokens, progress_id, progress_ctx_json, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                message.id,
                message.type,
                contentJson,
                contentText,
                contentTokens,
                progressId,
                progressCtxJson,
                message.timestamp
            ]);
        } catch (error) {
            console.error('添加消息失败:', error);
            throw error;
        }
    }

    /**
     * 批量添加消息（使用事务提高性能）
     */
    public async addMessages(messages: Message[]): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('数据库未初始化完成');
        }

        if (messages.length === 0) {
            return;
        }

        try {
            await this.execAsync('BEGIN IMMEDIATE TRANSACTION');

            for (const message of messages) {
                const contentJson = JSON.stringify(message.content);
                const contentText = this.extractTextContent(message.content);
                const contentTokens = await this.tokenizeContent(contentText);
                const progressId = message.content.progressId || null;
                const progressCtxJson = message.content.progressCtx ? JSON.stringify(message.content.progressCtx) : null;

                await this.runAsync(`
                    INSERT OR REPLACE INTO messages (id, type, content_json, content_text, content_tokens, progress_id, progress_ctx_json, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    message.id,
                    message.type,
                    contentJson,
                    contentText,
                    contentTokens,
                    progressId,
                    progressCtxJson,
                    message.timestamp
                ]);
            }

            await this.execAsync('COMMIT');
        } catch (error) {
            try {
                await this.execAsync('ROLLBACK');
            } catch (rollbackError) {
                console.error('事务回滚失败:', rollbackError);
            }
            console.error('批量添加消息失败:', error);
            throw error;
        }
    }

    /**
     * 更新消息内容
     */
    public async updateMessage(messageId: string, content: MessageContent): Promise<boolean> {
        if (!this.isInitialized) {
            throw new Error('数据库未初始化完成');
        }

        try {
            const contentJson = JSON.stringify(content);
            const contentText = this.extractTextContent(content);
            const contentTokens = await this.tokenizeContent(contentText);
            const progressId = content.progressId || null;
            const progressCtxJson = content.progressCtx ? JSON.stringify(content.progressCtx) : null;

            const result = await this.runAsync(`
                UPDATE messages 
                SET content_json = ?, content_text = ?, content_tokens = ?, progress_id = ?, progress_ctx_json = ?
                WHERE id = ?
            `, [
                contentJson,
                contentText,
                contentTokens,
                progressId,
                progressCtxJson,
                messageId
            ]);

            return (result.changes || 0) > 0;
        } catch (error) {
            console.error('更新消息失败:', error);
            throw error;
        }
    }

    /**
     * 根据ID获取消息
     */
    public async getMessageById(messageId: string): Promise<Message | null> {
        if (!this.isInitialized) {
            throw new Error('数据库未初始化完成');
        }

        try {
            const row = await this.getAsync(`
                SELECT id, type, content_json, progress_id, progress_ctx_json, timestamp
                FROM messages
                WHERE id = ?
            `, [messageId]) as {
                id: string;
                type: string;
                content_json: string;
                progress_id: string | null;
                progress_ctx_json: string | null;
                timestamp: number;
            } | undefined;

            return row ? this.rowToMessage(row) : null;
        } catch (error) {
            console.error('获取消息失败:', error);
            throw error;
        }
    }

    /**
     * 根据progressId获取相关消息
     */
    public async getMessagesByProgressId(progressId: string): Promise<Message[]> {
        if (!this.isInitialized) {
            throw new Error('数据库未初始化完成');
        }

        try {
            const rows = await this.allAsync(`
                SELECT id, type, content_json, progress_id, progress_ctx_json, timestamp
                FROM messages
                WHERE progress_id = ?
                ORDER BY timestamp ASC
            `, [progressId]) as Array<{
                id: string;
                type: string;
                content_json: string;
                progress_id: string | null;
                progress_ctx_json: string | null;
                timestamp: number;
            }>;

            return rows.map(row => this.rowToMessage(row));
        } catch (error) {
            console.error('根据progressId获取消息失败:', error);
            throw error;
        }
    }

    /**
     * 分页获取消息
     */
    public async getMessages(offset: number = 0, limit: number = 30): Promise<HistoryLoadResult> {
        if (!this.isInitialized) {
            throw new Error('数据库未初始化完成');
        }

        try {
            const [rows, countResult] = await Promise.all([
                this.allAsync(`
                    SELECT id, type, content_json, progress_id, progress_ctx_json, timestamp
                    FROM messages
                    ORDER BY timestamp DESC
                    LIMIT ? OFFSET ?
                `, [limit, offset]) as Promise<Array<{
                    id: string;
                    type: string;
                    content_json: string;
                    progress_id: string | null;
                    progress_ctx_json: string | null;
                    timestamp: number;
                }>>,
                this.getAsync(`SELECT COUNT(*) as total FROM messages`) as Promise<{ total: number }>
            ]);

            const messages = rows.map(row => this.rowToMessage(row));
            const total = countResult.total;

            return { messages, total };
        } catch (error) {
            console.error('获取消息失败:', error);
            throw error;
        }
    }

    /**
     * 搜索消息内容
     */
    public async searchMessages(query: string, limit: number = 50): Promise<Message[]> {
        if (!this.isInitialized) {
            throw new Error('数据库未初始化完成');
        }

        try {
            // 对搜索查询进行分词
            const queryTokens = await this.tokenizeContent(query);

            if (!queryTokens.trim()) {
                return [];
            }

            // 构建FTS查询，支持部分匹配
            const ftsQuery = queryTokens
                .split(' ')
                .filter(token => token.length > 0)
                .map(token => `"${token.replace(/"/g, '""')}"*`)  // 转义双引号
                .join(' OR ');

            const rows = await this.allAsync(`
                SELECT m.id, m.type, m.content_json, m.progress_id, m.progress_ctx_json, m.timestamp
                FROM messages_fts f
                JOIN messages m ON f.id = m.id
                WHERE messages_fts MATCH ?
                ORDER BY rank, m.timestamp DESC
                LIMIT ?
            `, [ftsQuery, limit]) as Array<{
                id: string;
                type: string;
                content_json: string;
                progress_id: string | null;
                progress_ctx_json: string | null;
                timestamp: number;
            }>;

            return rows.map(row => this.rowToMessage(row));
        } catch (error) {
            console.error('搜索消息失败:', error);
            // 如果FTS搜索失败，退回到简单的LIKE搜索
            try {
                const rows = await this.allAsync(`
                    SELECT id, type, content_json, progress_id, progress_ctx_json, timestamp
                    FROM messages
                    WHERE content_text LIKE ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                `, [`%${query}%`, limit]) as Array<{
                    id: string;
                    type: string;
                    content_json: string;
                    progress_id: string | null;
                    progress_ctx_json: string | null;
                    timestamp: number;
                }>;

                return rows.map(row => this.rowToMessage(row));
            } catch (fallbackError) {
                console.error('备用搜索也失败:', fallbackError);
                return [];
            }
        }
    }

    /**
     * 删除指定ID的消息
     */
    public async deleteMessage(messageId: string): Promise<boolean> {
        if (!this.isInitialized) {
            throw new Error('数据库未初始化完成');
        }

        try {
            const result = await this.runAsync(`DELETE FROM messages WHERE id = ?`, [messageId]);
            return (result.changes || 0) > 0;
        } catch (error) {
            console.error('删除消息失败:', error);
            throw error;
        }
    }

    /**
     * 清除所有消息
     */
    public async clearAll(): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('数据库未初始化完成');
        }

        try {
            await this.runAsync(`DELETE FROM messages`);
            console.log('已清除所有消息');
        } catch (error) {
            console.error('清除所有消息失败:', error);
            throw error;
        }
    }

    /**
     * 重新加载最近的消息
     */
    public async loadRecentMessages(): Promise<HistoryLoadResult> {
        return this.getMessages(0, 30);
    }

    /**
     * 获取数据库统计信息
     */
    public async getStats(): Promise<{
        totalMessages: number;
        messagesByType: { ai: number; user: number; sys: number };
        oldestMessage?: number;
        newestMessage?: number;
        databaseSize: number;
    }> {
        if (!this.isInitialized) {
            throw new Error('数据库未初始化完成');
        }

        try {
            const [totalResult, typeResults, timestampResult, dbInfo] = await Promise.all([
                this.getAsync(`SELECT COUNT(*) as total FROM messages`) as Promise<{ total: number }>,
                this.allAsync(`SELECT type, COUNT(*) as count FROM messages GROUP BY type`) as Promise<Array<{ type: string; count: number }>>,
                this.getAsync(`SELECT MIN(timestamp) as oldest, MAX(timestamp) as newest FROM messages`) as Promise<{ oldest?: number; newest?: number }>,
                this.getDatabaseInfo()
            ]);

            const messagesByType = { ai: 0, user: 0, sys: 0 };
            typeResults.forEach(result => {
                if (result.type in messagesByType) {
                    messagesByType[result.type as keyof typeof messagesByType] = result.count;
                }
            });

            return {
                totalMessages: totalResult.total,
                messagesByType,
                oldestMessage: timestampResult.oldest,
                newestMessage: timestampResult.newest,
                databaseSize: dbInfo.size
            };
        } catch (error) {
            console.error('获取统计信息失败:', error);
            throw error;
        }
    }

    /**
     * 优化数据库（VACUUM和ANALYZE）
     */
    public async optimize(): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('数据库未初始化完成');
        }

        try {
            console.log('开始优化数据库...');
            await this.execAsync('VACUUM');
            await this.execAsync('ANALYZE');
            console.log('数据库优化完成');
        } catch (error) {
            console.error('数据库优化失败:', error);
            throw error;
        }
    }

    /**
     * 关闭数据库连接
     */
    public async close(): Promise<void> {
        if (this.db) {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('数据库连接已关闭');
                        resolve();
                    }
                });
            });
        }
    }
}