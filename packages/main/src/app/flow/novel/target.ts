import { ExecutionContext } from "../../task/index.type.js";
import { hasValueDeep, hasValueEmpty } from "../basemodel.js";
import { Common } from "./model/common.js";
import { Target } from "./model/target.js";
import { render } from "ejs";
import Tpl from "./prompt/target/target.emd";
// import mergeTpl from "./prompt/target/merge.emd";
// import fillTpl from "./prompt/target/fill.emd";
// import { isEmpty } from "remeda";

export default async function (exeCtx: ExecutionContext) {
    const userInput = exeCtx.input.content.content.trim();
    exeCtx.task.app.tasks.reportProgress("正在设定读者对象...");
    const common = Common.inst(exeCtx)
    common.next = "受众分析";
    const target = Target.inst(exeCtx);
    const prompt = render(Tpl, {
        highConcept: common.highConcept.concept,
        additional_details: common.highConcept.additional_details
    });

    const result = await exeCtx.task.app.llms.callJSON(prompt);

    const retError = (msg: string = "请提供小说类型，以及读者性别和职业．") => {
        exeCtx.response = msg;
        return "_exit";
    }

    if (!result.success || !result.json) {
        return retError();
    }

    // console.log(result.json);
    if (hasValueEmpty(result.json)) {
        // @todo: 有空值，调用fill来填充。
    }

    // if (hasValueDeep(result.json) && result.json["类型"] && result.json["读者性别"] && result.json["读者身份"]) {
    //     return retError();
    // }

    target.set("", result.json);
}
