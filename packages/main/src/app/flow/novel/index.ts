import { WorkflowDefinition } from "../index.type.js";
import concept from "./concept.js";
import dispatch from "./dispatch.js";
import synthesis from "./synthesis.js";
import target from "./target.js";
import theme from './theme.js'
import arc from './arc.js'
import world from './world.js'

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
        主题变奏: {
            type: "function",
            fn: synthesis
        },
        高概念: {
            type: "function",
            fn: concept
        },
        主角弧光: {
            type: "function",
            fn: arc
        },
        世界设定: {
            type: "function",
            fn: world
        }
    } as const,
    flowDef: {
        id: "novel",
        tasks: [
            "任务分遣",
            "高概念",
            "受众分析",
            "主题设计",
            "主题变奏",
            "主角弧光",
            "世界设定"
        ],
    } as WorkflowDefinition,
};
