import { type AppRouter, type RouteResult } from "@app/main";
import { ipcRenderer } from "electron";

async function electronInvoke(path: string, ...args: any[]): Promise<any> {
    if (!ipcRenderer) {
        throw new Error("ipcRenderer not available - are you running in Electron?");
    }

    const result: RouteResult = await ipcRenderer.invoke("lai-rpc", path, ...args);
    if (result.ok) {
        return result.data;
    }
    throw result.error;
}

export type EmitterFunc = (name: string, data: Record<string, any>) => void;

interface CachedEvent {
    name: string;
    data: Record<string, any>;
}

let emitter: EmitterFunc | null = null;
const cachedEvts: CachedEvent[] = [];

ipcRenderer.on('eventbus', (_event, eventName: string, eventData: Record<string, any>) => {
    if (emitter) {
        try {
            emitter(eventName, eventData);
        } catch (error) {
            console.error('触发事件时发生错误:', eventName, error);
        }
    } else {
        console.warn('Emitter 尚未设置，无法触发事件，缓冲之:', eventName);
        cachedEvts.push({
            name: eventName,
            data: eventData
        });
    }
});

export function setEmit(emit: EmitterFunc) {
    emitter = emit;

    // 处理缓存的事件
    if (cachedEvts.length > 0) {
        console.log(`触发 ${cachedEvts.length} 个缓存的事件`);

        // 从头开始调用缓存的事件
        const eventsToProcess = [...cachedEvts]; // 创建副本防止并发问题
        cachedEvts.length = 0; // 立即清除缓存

        for (const event of eventsToProcess) {
            try {
                emitter(event.name, event.data);
            } catch (error) {
                console.error('处理缓存事件时发生错误:', event.name, error);
            }
        }
    }
}

export const rpc = {
    sys: {
        get: async (...args: any[]) => electronInvoke("sys.get", ...args),
        set: async (...args: any[]) => electronInvoke("sys.set", ...args),
        passive: async (...args: any[]) => electronInvoke("sys.passive", ...args),
    },
    task: {
        history: async (...args: any[]) => electronInvoke("task.history", ...args),
        get: async (...args: any[]) => electronInvoke("task.get", ...args),
        current: async (...args: any[]) => electronInvoke("task.current", ...args),
        create: async (...args: any[]) => electronInvoke("task.create", ...args),
        active: async (...args: any[]) => electronInvoke("task.active", ...args),
        userInput: async (...args: any[]) => electronInvoke("task.userInput", ...args),
    }
};