import { rpc } from '@app/preload'

class AndroidNameStore {
    private store = $state<string>("指挥官");

    get value() {
        return this.store;
    }

    set(name: string) {
        this.store = name;
    }
}

export interface Task {
    id: string;
    name: string;
}

class CurrentTaskStore {
    private store = $state<Task>({
        id: "",
        name: ""
    });

    get value() {
        return this.store;
    }

    set(task: any) {
        const newValue: Task = {
            id: (task && typeof task.id === 'string') ? task.id : "",
            name: (task && typeof task.name === 'string') ? task.name : ""
        };
        this.store = newValue;
    }
}


export const androidNameStore = new AndroidNameStore();
export const currentTaskStore = new CurrentTaskStore();



export async function initSharedStores() {
    androidNameStore.set(await rpc.sys.get("androidName"));
    currentTaskStore.set(await rpc.sys.get("currentTask"))
}