import { ExecutionContext } from "../../task/index.type.js";
import { Common } from "./model/common.js";
import { Target } from "./model/target.js";
import { render } from "ejs";
import Tpl from "./prompt/theme/synthesis.emd"
import ArcTpl from './prompt/theme/arc.emd'



export default async function (exeCtx: ExecutionContext) {
    exeCtx.task.app.tasks.reportProgress("正在设计主题变奏...");
    const common = Common.inst(exeCtx);
    const target = Target.inst(exeCtx);
    common.next = "主题变奏";


    const prompt = render(Tpl, {
        highConcept: common.highConcept,
        theme: common.theme,
        target: target.dump()
    });

    const errorRet = (msg = "发生错误，无法设计主题变奏．") => {
        exeCtx.response = msg;
        return "_exit";
    }

    const results = await exeCtx.task.app.llms.callJSON(prompt)
    if (!results.success || !results.json) {
        return errorRet();
    }

    common.synthesis = results.json;
    console.log("synthesis=", common.synthesis)


    const arcPrompt = render(ArcTpl, {
        highConcept: common.highConcept,
        theme: common.theme,
        target: target.dump()
    });


    const finalResult = await exeCtx.task.app.llms.callJSON(arcPrompt)
    if (!finalResult.success || !finalResult.json) {
        return errorRet();
    }

    common.arc = finalResult.json;
    console.log("arc=", common.arc)

}