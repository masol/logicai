import { ExecutionContext } from "../../../task/index.type.js";
import { Common } from "../model/common.js";
import { Target } from "../model/target.js";
import { Story } from "../model/story.js";
import { render } from "ejs";
import outlineTpl from '../prompt/story/outline.emd'


export default async function (exeCtx: ExecutionContext, args: any[] = []) {
    const userInput = exeCtx.input.content.content.trim();
    exeCtx.task.app.tasks.reportProgress("正在查询历史骨架...");
    const common = Common.inst(exeCtx);
    const target = Target.inst(exeCtx);
    const story = Story.inst(exeCtx);

    const errorRet = (msg = "发生错误，无法查询得到历史骨架.") => {
        exeCtx.response = msg;
        return "_exit";
    }

    // console.log("common.next",common.next)
    if (!common.isAfter("世界设定")) {
        return errorRet("尚未设定世界")
    }

    const prompt = render(outlineTpl, {
        highConcept: common.highConcept,
        theme: common.theme,
        arc: common.arc,
        target: target.dump(),
        world: common.world,
        userInput
    });

    // console.log("outline prompt=", prompt)


    const result = await exeCtx.task.app.llms.callJSON(prompt)
    if (!result.success || !result.json) {
        return errorRet();
    }


    const outlines = [...story.outlines, ...result.json.historical_framework];
    // outlines.push(result.json)
    story.outlines = outlines;

    console.log("outlines=", result.json)
}