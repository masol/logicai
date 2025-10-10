import { WorkflowDefinition } from "../index.type.js";
import extract from "./extract1.js";
import buildwf from "./buildwf2.js";
import dispatch from "./dispatch.js";

export default {
    actions: {
        分析输入: {
            type: "function",
            fn: extract
        },
        构建工作流: {
            type: "function",
            fn: buildwf
        },
        任务分遣: {
            type: "function",
            fn: dispatch
        },
    } as const,
    flowDef: {
        id: "plan",
        tasks: [
            "任务分遣", "分析输入", "构建工作流"
        ],
    } as WorkflowDefinition,
};
