import type { IAppContext } from "../context.type.js";
import { Flow } from "./flow.js";
import type { ActionEntry, IFlow, IFlowFactory, WorkflowDefinition } from "./index.type.js";
import path from "path";
import Plan from "./plan/index.js"
import Novel from './novel/index.js'
import validator from 'validator';

type FlowDef = {
    actions: Record<string, ActionEntry>,
    flowDef: WorkflowDefinition
}

const Id2Cls: Record<string, FlowDef> = {
    'plan': Plan,
    'novel': Novel
}

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
        } else {
            const ClsObj = Id2Cls[id];
            if (ClsObj) {
                const flow = new Flow(this.app, id);
                flow.setActions(ClsObj.actions);
                flow.setWorkflow(ClsObj.flowDef);
                return flow;
            }
            throw new Error(`Unsupported id: ${id}`);
        }
    }
}