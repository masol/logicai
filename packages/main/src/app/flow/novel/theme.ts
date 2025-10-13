import { ExecutionContext } from "../../task/index.type.js";
import { Common } from "./model/common.js";
import { Target } from "./model/target.js";
import { render } from "ejs";
import Tpl from "./prompt/theme/design.emd";
import auditTpl from "./prompt/theme/audit.emd";
import { isEmpty } from "remeda";

export default async function (exeCtx: ExecutionContext) {
    const userInput = exeCtx.input.content.content.trim();
    exeCtx.task.app.tasks.reportProgress("正在设计主题...");
    const target = Target.inst(exeCtx);
    const common = Common.inst(exeCtx);
    common.next = "主题设计";
    const prompt = render(Tpl, {
        highConcept: common.highConcept
    });

    const errorRet = (msg = "发生错误，无法确定主题．") => {
        exeCtx.response =
            "发生错误，无法确定主题．";
        return "_exit";
    }

    const results = await exeCtx.task.app.llms.callJSON(prompt)
    if (!results.success || !results.json) {
        return errorRet();
    }

    common.theme = results.json;

    console.log("theme=", common.theme)
    // const concepts: Record<string, any>[] = [];
    // results.forEach(result => {
    //     if (result.success && result.json && Array.isArray(result.json)) {
    //         // 只把非空值加入
    //         concepts.push(...result.json.filter((v: Record<string, any>) => !isEmpty(v)));
    //     }
    // });


    return "_exit"

    //     common.themeSet = result.json;

    //     const prompt = render(auditTpl, {
    //         target: target.dump(),
    //         userInput,
    //         themeStr: JSON.stringify(result.json)
    //     })

    //     const finalResult = await exeCtx.task.app.llms.callJSON(prompt);
    //     if (finalResult.success && finalResult.json) {
    //         common.theme = finalResult.json;
    //     } else {
    //         exeCtx.response =
    //             "发生错误，无法确定主题．";
    //         return "_exit";
    //     }
    // }
}
