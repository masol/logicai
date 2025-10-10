import { rpc } from '@app/preload'
import { type AiTask } from './chatStore';

class AndroidNameStore {
    private store = $state<string>("指挥官");

    get value() {
        return this.store;
    }

    set(name: string) {
        this.store = name;
    }
}

class CurrentTaskStore {
    private store = $state<AiTask>({
        id: "",
        name: "",
        time: "",
        type: ""
    });

    get value() {
        return this.store;
    }

    isValid() {
        return !!this.store.id
    }

    empty() {
        this.set({
            id: "",
            name: "",
            time: "",
            type: ""
        })
    }

    set(task: any) {
        const newValue: AiTask = {
            id: (task && typeof task.id === 'string') ? task.id : "",
            name: (task && typeof task.name === 'string') ? task.name : "",
            type: (task && typeof task.type === 'string') ? task.type : "",
            time: (task && typeof task.name === 'string') ? task.time : ""
        };
        this.store = newValue;
    }
}


export const androidNameStore = new AndroidNameStore();
export const currentTaskStore = new CurrentTaskStore();



export async function initSharedStores() {
    androidNameStore.set((await rpc.sys.get("androidName")) || "指挥官" );
    try {
        currentTaskStore.set(await rpc.task.current());
    } catch {
        currentTaskStore.empty();
    }
}