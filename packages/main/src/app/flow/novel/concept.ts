import { ExecutionContext } from "../../task/index.type.js";
import { Common } from "./model/common.js";
import { render } from "ejs";
import Tpl from "./prompt/concept/high.emd";
// import pMap from "p-map";
import { isEmpty } from 'remeda';
import selecTpl from './prompt/concept/select.emd'


export default async function (exeCtx: ExecutionContext) {
    const userInput = exeCtx.input.content.content.trim();
    exeCtx.task.app.tasks.reportProgress("正在分析高概念...");
    const prompt = render(Tpl, {
        userInput,
    });

    // console.log("prompt=", prompt)

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

    const errorRet = () => {
        exeCtx.response = "发生错误，无法确定高概念．";
        return "_exit";
    }

    const common = Common.inst(exeCtx);

    // 1. 先收集所有可能的错误
    if (highConcepts.length === 0) {
        return errorRet();
    }

    // 2. 正常路径：唯一分支
    common.highConceptSet = highConcepts;
    const selPrompt = render(selecTpl, { highConcepts });
    const finalResult = await exeCtx.task.app.llms.callJSON(selPrompt);

    if (!finalResult.success || !finalResult.json) {
        return errorRet();
    }

    common.highConcept = finalResult.json;
}
