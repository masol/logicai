import { WorkflowDefinition } from "../index.type.js";
import dispatch from "./dispatch.js";
import target from "./target.js";

export default {
    actions: {
        任务分遣: {
            type: "function",
            fn: dispatch
        },
        读者分析: {
            type: "function",
            fn: target
        },
    } as const,
    flowDef: {
        id: "novel",
        tasks: [
            "任务分遣",
            "读者分析"
        ],
    } as WorkflowDefinition,
};
