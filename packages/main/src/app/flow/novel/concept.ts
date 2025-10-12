import { ExecutionContext } from "../../task/index.type.js";
import { Common } from "./model/common.js";
import { Target } from "./model/target.js";
import { render } from "ejs";
import Tpl from "./prompt/concept/high.emd";
import pMap from "p-map";
import { isEmpty } from 'remeda';


export default async function (exeCtx: ExecutionContext) {
    const userInput = exeCtx.input.content.content.trim();
    exeCtx.task.app.tasks.reportProgress("正在分析高概念...");
    const prompt = render(Tpl, {
        userInput,
    });

    console.log("prompt=", prompt)

    const results = await Promise.all([
        exeCtx.task.app.llms.callJSON(prompt),
        exeCtx.task.app.llms.callJSON(prompt)
    ])

    console.log("results=", results)

    const highConcepts: Record<string, any>[] = [];
    results.forEach(result => {
        if (result.success && result.json && Array.isArray(result.json.high_concepts)) {
            // 只把非空值加入
            highConcepts.push(...result.json.high_concepts.filter((v: Record<string, any>) => !isEmpty(v)));
        }
    });

    const common = Common.inst(exeCtx)
    if (highConcepts.length === 0) {
        exeCtx.response = "发生错误，无法确定高概念．";
    } else {
        common.highConceptSet = highConcepts;
    }


    return "_exit";

}
