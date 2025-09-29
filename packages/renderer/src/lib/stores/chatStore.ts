// stores/chatStore.ts
import { writable } from 'svelte/store';
import { rpc } from '@app/preload'
import { currentTaskStore } from './shared.svelte'
import { eventBus } from '$lib/utils/evtbus';
import type { Events } from '$lib/utils/evtbus.type';

const NewAiMsg = 'aimsg';
const AiStepMsg = "aistep";
const UpdateAiMsg = 'updmsg';

export interface MessageContent {
    content: string;
    files?: {
        filename: string;
        type: string;
        desc?: string;
    }[];
    isProcessing?: boolean;
    processingSteps?: string[];
}

export interface Message {
    id: string;
    type: "ai" | "user" | "sys";
    content: MessageContent;
    taskId: string;  //添加所属task    
    timestamp: number;
}

export interface ChatState {
    messages: Message[];
    totalCount: number;
}

export interface AiTask {
    id: string;
    name: string;
    type: string;
    time: string; // 最后更新时间。
}

export function createMessage(content: string): Message {
    return {
        id: crypto.randomUUID(),
        type: "user",
        taskId: currentTaskStore.value.id,
        content: {
            content: content,
        },
        timestamp: Date.now(),
    }
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
        addMessage: async (message: Message | string) => {
            const msg = (typeof message === 'string') ? createMessage(message) : message;
            update(state => ({
                ...state,
                messages: [msg, ...state.messages],
                totalCount: state.totalCount + 1
            }))
            const result = await rpc.task.userInput(msg);
            // console.log("userinput result:", result);
            update(state => ({
                ...state,
                messages: [result, ...state.messages],
                totalCount: state.totalCount + 1
            }))
        },
        setMessages: (messages: Message[], total = -1) => update(state => ({
            ...state,
            messages,
            totalCount: total < 0 ? messages.length : total
        })),
        /**
         * 更新指定 id 消息的内容
         * @param id 消息的唯一标识
         * @param content 要更新的文本内容
         * @param clear - true: 替换原内容；false: 在原内容后追加
         */
        updateMessage: (id: string, content: string, clear: boolean) =>
            update((state) => ({
                ...state,
                messages: state.messages.map((msg) => {
                    if (msg.id === id) {
                        const msgContent = msg.content || { content: '' };
                        return {
                            ...msg,
                            content: {
                                ...msgContent,
                                content: clear
                                    ? content
                                    : msgContent.content + content
                            }
                        };
                    }
                    return msg;
                })
            })),
        /**
            * 更新指定 id 消息的处理状态
            * - 若 step 为空：设置 content.isProcessing = false
            * - 若 step 非空：设置 content.isProcessing = true，并将 step 插入 processingSteps 开头
            */
        step: (id: string, step: string) =>
            update((state) => ({
                ...state,
                messages: state.messages.map((msg) => {
                    if (msg.id === id) {
                        const content = msg.content || { content: '' }; // 确保 content 存在
                        // console.log("old content=", content)
                        const newMsg = {
                            ...msg,
                            content: {
                                ...content,
                                isProcessing: step !== '', // 有 step 就是 true，否则 false
                                processingSteps: step === ''
                                    ? [] // 保持原数组不变（或设为 []）
                                    : [step, ...(content.processingSteps || [])] // 添加到开头
                            },
                        };
                        // console.log("newMsg=", newMsg);
                        return newMsg;
                    }
                    return msg;
                }),
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

eventBus.on(AiStepMsg, (evt: Events) => {
    // console.log("on AiStepMsg", evt)
    chatStore.step(evt.id as string, evt.step as string)
})

eventBus.on(NewAiMsg, (evt: Events) => {
    chatStore.addMessage(evt.message as Message)
})


eventBus.on(UpdateAiMsg, (evt: Events) => {
    chatStore.updateMessage(evt.id as string, evt.content as string, !!evt.clear)
})


