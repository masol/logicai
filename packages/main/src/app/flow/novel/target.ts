import { ExecutionContext } from "../../task/index.type.js";
import { hasValueDeep } from "../basemodel.js";
import { Common } from "./model/common.js";
import { Target } from "./model/target.js";
import { render } from "ejs";
import Tpl from "./prompt/target/target.emd";
import mergeTpl from "./prompt/target/merge.emd";
import fillTpl from "./prompt/target/fill.emd";
import { isEmpty } from "remeda";

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
        console.log(result.json);
        if (!hasValueDeep(result.json)) {
            exeCtx.response =
                "未提供任意线索，请就您小说的读者对象，做任意的描述－－也可以直接描述小说的风格等内容．";
            return "_exit";
        }

        const old_profile = target.hasValue()
            ? JSON.stringify(target.dump())
            : false;

        let finalJson;
        if (!old_profile) { //没有旧值，使用fill template.
            const prompt = render(fillTpl, {
                profile: JSON.stringify(result.json)
            })
            const finalResult = await exeCtx.task.app.llms.callJSON(prompt);
            if (finalResult.success && finalResult.json) {
                finalJson = finalResult.json;
            }

        } else {// 有旧值，使用merge template.
            for (const key in result.json) {
                // 确保属性是对象自身的，而不是从原型链继承的
                let stepProfile = old_profile;
                if (result.json.hasOwnProperty(key)) {
                    const value = result.json[key];
                    if (!isEmpty(value)) {
                        console.log(`process ${key}= ${value}`)
                        const prompt = render(mergeTpl, {
                            changed_field: key,
                            new_value: JSON.stringify(value),
                            current_profile: stepProfile
                        })
                        const finalResult = await exeCtx.task.app.llms.callJSON(prompt);
                        if (finalResult.success && finalResult.json) {
                            finalJson = finalResult.json;
                            stepProfile = JSON.stringify(finalJson);
                        }
                    }
                }
            }
        }

        if (!finalJson) {
            exeCtx.response =
                "发生错误，无法分析目标用户画像．";
            return "_exit";
        }
        target.set("", finalJson);
    }
}
