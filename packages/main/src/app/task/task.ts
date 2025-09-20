import { ITask } from './index.type.js'
import { Store } from 'n3'


export class Task implements ITask {
    readonly id: string;
    readonly name: string;
    readonly time: string;
    readonly store: Store;

    constructor(id: string, name: string, time: string) {
        this.id = id;
        this.name = name;
        this.time = time;
        this.store = new Store();
    }
}