import { isPlainObject } from "remeda";
import { ExecutionContext } from "../../task/index.type.js";


function chkNexTask(ctx: ExecutionContext): string {
    const delivery = ctx.task.sharedContext.delivery;

    if (isPlainObject(delivery)) {
        if (delivery["名称"] && delivery["类别"]) {
            //这里继续判断，是否是下一个工作流。
            return "构建工作流";
        }
    }
    return ""
}

export default async function (exeCtx: ExecutionContext) {
    const userInput = (exeCtx.input.content.content).trim();
    const uinputs = userInput.split(' ');
    switch (uinputs[0]) {
        case '/c':
            // console.log("continue!!!!")
            return chkNexTask(exeCtx);
        default:
            return;
    }
}