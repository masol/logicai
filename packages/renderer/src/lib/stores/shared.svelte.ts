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

export const androidNameStore = new AndroidNameStore();



export async function initSharedStores() {
    androidNameStore.set(await rpc.sys.get("androidName"));
}