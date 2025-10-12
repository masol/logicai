import { ExecutionContext } from "../../task/index.type.js";
import { Common } from "./model/common.js";
import { Target } from "./model/target.js";
import { render } from "ejs";
import Tpl from "./prompt/theme/design.emd";
import auditTpl from "./prompt/theme/audit.emd";

export default async function (exeCtx: ExecutionContext) {
    const userInput = exeCtx.input.content.content.trim();
    exeCtx.task.app.tasks.reportProgress("正在设定主题...");
    const target = Target.inst(exeCtx);
    const common = Common.inst(exeCtx);
    common.next = "主题设定";
    const prompt = render(Tpl, {
        userInput,
        target: target.dump()
    });
    const result = await exeCtx.task.app.llms.callJSON(prompt);
    if (result.success && result.json) {
        console.log("主题:", result.json);

        common.themeSet = result.json;

        const prompt = render(auditTpl, {
            target: target.dump(),
            userInput,
            themeStr: JSON.stringify(result.json)
        })

        const finalResult = await exeCtx.task.app.llms.callJSON(prompt);
        if (finalResult.success && finalResult.json) {
            common.theme = finalResult.json;
        } else {
            exeCtx.response =
                "发生错误，无法确定主题．";
            return "_exit";
        }
    }
}
