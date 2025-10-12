import { ExecutionContext } from "../../task/index.type.js";
import { hasValueDeep } from "../basemodel.js";
import { Common } from "./model/common.js";
import { Target } from "./model/target.js";
import { render } from "ejs";
import Tpl from "./prompt/target/target.emd";
// import mergeTpl from "./prompt/target/merge.emd";
import fillTpl from "./prompt/target/fill.emd";
// import { isEmpty } from "remeda";

export default async function (exeCtx: ExecutionContext) {
    const userInput = exeCtx.input.content.content.trim();
    exeCtx.task.app.tasks.reportProgress("正在设定读者对象...");
    Common.inst(exeCtx).next = "读者分析";
    const target = Target.inst(exeCtx);
    const prompt = render(Tpl, {
        userInput,
    });
    const result = await exeCtx.task.app.llms.callJSON(prompt);
    if (result.success && result.json) {
        // console.log(result.json);
        if (!hasValueDeep(result.json) || !(result.json["类型"] || result.json["读者性别"] || result.json["读者身份"])) {
            exeCtx.response =
                "请提供小说类型，以及读者性别和职业．";
            return "_exit";
        }

        const 类型 = result.json["类型"] || target.类型;
        const 读者性别 = result.json["读者性别"] || target.读者性别;
        const 读者身份 = [...result.json["读者身份"], ...target.读者身份];

        const prompt = render(fillTpl, {
            profile: {
                类型,
                读者性别,
                读者身份
            }
        })

        const finalResult = await exeCtx.task.app.llms.callJSON(prompt);
        if (finalResult.success && finalResult.json) {
            target.set("", finalResult.json);
        } else {
            exeCtx.response =
                "发生错误，无法分析目标用户画像．";
            return "_exit";
        }
    }
}
