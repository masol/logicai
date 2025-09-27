import type { ExecutionContext } from "src/app/task/index.type.js";


export default {
    actions: {
        "分析输入": {
            type: 'function',
            fn: async function (exeCtx: ExecutionContext) {
                console.log("on parseInput")
            }
        }
    } as const,
    flowDef: {
        id: "plan",
        tasks: ['分析输入']
    }
}