import type { IAppContext } from "../context.type.js";
import { Flow } from "./flow.js";
import type { IFlow, IFlowFactory } from "./index.type.js";
import path from "path";
import Plan from "./internal/plan.js"
import validator from 'validator';

export class FlowFactory implements IFlowFactory {
    private app: IAppContext;
    private baseDir: string;

    constructor(app: IAppContext) {
        this.app = app;
        this.baseDir = path.join(app.baseDir, "store", "flow");
    }

    async load(id: string): Promise<IFlow> {
        if (validator.isUUID(id)) {
            throw new Error(`Unsupported id: ${id}`);
            // return this.loadByUUID(id);
        } else if (id === "plan") {
            const flow = new Flow(this.app);
            flow.setActions(Plan.actions);
            return flow;
        } else {
            throw new Error(`Unsupported id: ${id}`);
        }
    }
}