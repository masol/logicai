import { WorkflowDefinition } from "../index.type.js";
import concept from "./concept.js";
import dispatch from "./dispatch.js";
import target from "./target.js";
import theme from './theme.js'

export default {
    actions: {
        任务分遣: {
            type: "function",
            fn: dispatch
        },
        受众分析: {
            type: "function",
            fn: target
        },
        主题设计: {
            type: "function",
            fn: theme
        },
        高概念: {
            type: "function",
            fn: concept
        },
    } as const,
    flowDef: {
        id: "novel",
        tasks: [
            "任务分遣",
            "高概念",
            "受众分析",
            "主题设计"
        ],
    } as WorkflowDefinition,
};
