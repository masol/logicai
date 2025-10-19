import { WorkflowDefinition } from "../index.type.js";
import concept from "./concept.js";
import dispatch from "./dispatch.js";
import synthesis from "./synthesis.js";
import target from "./target.js";
import theme from './theme.js'
import arc from './arc.js'
import world from './world.js'
import plot from './plot.js'
import { SEQ } from "./model/common.js";

export default {
    actions: {
        任务分遣: dispatch,
        受众分析: target,
        主题设计: theme,
        主题变奏: synthesis,
        高概念: concept,
        主角弧光: arc,
        世界设定: world,
        情节骨架: plot
    } as const,
    flowDef: {
        id: "novel",
        tasks: [
            "任务分遣",
            ...SEQ
        ],
    } as WorkflowDefinition,
};
