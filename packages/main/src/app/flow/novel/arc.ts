import { ExecutionContext } from "../../task/index.type.js";
import { Common } from "./model/common.js";
import { Target } from "./model/target.js";
import { render } from "ejs";
import ArcTpl from './prompt/theme/arc.emd'



export default async function (exeCtx: ExecutionContext) {
    exeCtx.task.app.tasks.reportProgress("正在设计主角弧光...");
    const common = Common.inst(exeCtx);
    const target = Target.inst(exeCtx);
    common.next = "主角弧光";



    const arcPrompt = render(ArcTpl, {
        highConcept: common.highConcept,
        theme: common.theme,
        target: target.dump()
    });

    const errorRet = (msg = "发生错误，无法设计主角弧光.") => {
        exeCtx.response = msg;
        return "_exit";
    }

    const finalResult = await exeCtx.task.app.llms.callJSON(arcPrompt)
    if (!finalResult.success || !finalResult.json) {
        return errorRet();
    }

    common.arc = finalResult.json;
    console.log("arc=", common.arc)
}