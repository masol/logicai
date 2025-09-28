import type { ExecutionContext } from "../../task/index.type.js";
import { WorkflowDefinition } from "../index.type.js";

export default {
    actions: {
        分析输入: {
            type: "function",
            fn: async function (exeCtx: ExecutionContext) {
                const result = await exeCtx.task.app.llms.call("介绍你自己");
                if (result.success) {
                    exeCtx.task.app.tasks.aiUpdate(result.response!, true);
                }
                console.log("on parseInput:", result);
            },
        },
    } as const,
    flowDef: {
        id: "plan",
        tasks: [
            "分析输入",
        ],
    } as WorkflowDefinition,
};
