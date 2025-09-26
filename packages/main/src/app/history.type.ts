
export interface MessageContent {
    content: string;
    files?: {
        filename: string;
        type: string;
        desc?: string;
    }[];
    level?: string;  // warn, error, info.
    isProcessing?: boolean;
    processingSteps?: string[];
}

export interface Message {
    id: string;
    type: string; // "ai" | "user" | "sys";
    taskId: string;  //添加所属task
    content: MessageContent;
    timestamp: number;
}

export interface HistoryLoadResult {
    messages: Message[];
    total: number;
}
