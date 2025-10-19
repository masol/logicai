import { ExecutionContext } from "../../../task/index.type.js";
import { Common } from "../model/common.js";
import { Target } from "../model/target.js";
import { Story } from "../model/story.js";
import { render } from "ejs";
import expandTpl from '../prompt/story/expand.emd'


export default async function (exeCtx: ExecutionContext, args: Record<string, any> = {}) {
    const userInput = exeCtx.input.content.content.trim();
    exeCtx.task.app.tasks.reportProgress("正在扩展历史骨架...");
    const common = Common.inst(exeCtx);
    const target = Target.inst(exeCtx);
    const story = Story.inst(exeCtx);

    const errorRet = (msg = "发生错误，无法扩展历史骨架.") => {
        exeCtx.response = msg;
        return "_exit";
    }

    const outlineCnt = story.outlines.length;
    if (outlineCnt <= args[0] || args[0] < 0) {
        return errorRet("参数错误，无法扩展历史骨架")
    }

    const outline = story.outlines[args[0]];

    // console.log("common.next",common.next)
    if (!common.isAfter("世界设定")) {
        return errorRet("尚未设定世界")
    }

    const prompt = render(expandTpl, {
        target: target.dump(),
        world: common.world,
        historical_event: outline,
        userInput
    });

    console.log("expand outline prompt=", prompt)


    const result = await exeCtx.task.app.llms.callJSON(prompt)
    if (!result.success || !result.json) {
        return errorRet();
    }

    const forces = story.forces
    forces.push(result.json)
    story.forces = forces;

    console.log("expanded outline forces=", result.json)
}