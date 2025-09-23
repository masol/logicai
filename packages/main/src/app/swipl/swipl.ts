import * as Comlink from "comlink";
import { WorkerAPI } from './swipl.types.js'

export class SWipl {
    private instanceId: string;
    private api: Comlink.Remote<WorkerAPI>;
    constructor(instanceId: string, api: Comlink.Remote<WorkerAPI>) {
        this.instanceId = instanceId;
        this.api = api;
    }

    async query(query: string) {
        const r = await this.api.dispatch(this.instanceId, "query", query);
        console.log("r=", r);
        return r;
    }
}
