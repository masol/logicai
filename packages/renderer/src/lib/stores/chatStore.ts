// stores/chatStore.ts
import { writable } from 'svelte/store';
import { rpc } from '@app/preload'

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

export interface ChatState {
    messages: Message[];
    totalCount: number;
}

export interface AiTask {
    id: string;
    name: string;
    time: string; // 最后更新时间。
}

function createChatStore() {
    // 假数据
    const initialState: ChatState = {
        messages: [],
        totalCount: 0,
    };

    const { subscribe, set, update } = writable(initialState);

    return {
        subscribe,
        addMessage: (message: Message) => update(state => ({
            ...state,
            messages: [...state.messages, message],
            totalCount: state.totalCount + 1
        })),
        setMessages: (messages: Message[], total = -1) => update(state => ({
            ...state,
            messages,
            totalCount: total < 0 ? messages.length : total
        })),
    };
}

interface HistoryLoadResult {
    messages: Message[];
    total: number;
}

export async function loadHistory() {
    const infos: HistoryLoadResult = await rpc.task.history();
    if (infos) {
        // console.log("loaded history", infos.messages, infos.total)
        chatStore.setMessages(infos.messages, infos.total)
    } else {
        chatStore.setMessages([])
    }
}

export const chatStore = createChatStore();