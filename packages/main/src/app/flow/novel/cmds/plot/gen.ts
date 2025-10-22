import { ExecutionContext } from "../../../../task/index.type.js";
import { Common } from "../../model/common.js";
import { Target } from "../../model/target.js";
import { Story } from "../../model/story.js";
import { World } from "../../model/world.js";
import { render } from "ejs";
import ploTpl from '../../prompt/plot/gen.emd'


export default async function (exeCtx: ExecutionContext, args: Record<string, any> = {}) {
    const userInput = exeCtx.input.content.content.trim();
    exeCtx.task.app.tasks.reportProgress("正在规划情节节拍...");
    const common = Common.inst(exeCtx);
    const target = Target.inst(exeCtx);
    const story = Story.inst(exeCtx);
    const world = World.inst(exeCtx);

    const errorRet = (msg = "发生错误，无法规划情节节拍.") => {
        exeCtx.response = msg;
        return "_exit";
    }

    const forceCnd = story.forces[0].local_forces.length;
    if (forceCnd <= args[0] || args[0] < 0) {
        return errorRet("参数错误，无法设计情节节拍")
    }

    const force = story.forces[0];
    const local_forces = force.local_forces[args[0]]

    // console.log("common.next",common.next)
    if (!common.isAfter("世界设定")) {
        return errorRet("尚未设定世界")
    }

    const prompt = render(ploTpl, {
        target: target.dump(),
        world: common.world,
        theme: common.theme,
        highConcept: common.highConcept,
        force,
        userInput
    });

    console.log("expand outline prompt=", prompt)


    const result = await exeCtx.task.app.llms.callJSON(prompt)
    if (!result.success || !result.json) {
        return errorRet();
    }

    const character = result.json;
    // character.所属势力 = local_forces.name;

    // world.addChar(character);
    // const forces = story.forces
    // forces.push(result.json)
    // story.forces = forces;

    console.log("规划情节节拍 =", result.json)
}