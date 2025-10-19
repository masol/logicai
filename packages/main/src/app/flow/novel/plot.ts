import { ExecutionContext } from "../../task/index.type.js";
import { Common } from "./model/common.js";
import { Target } from "./model/target.js";
import { Plot } from "./model/plot.js";
import { render } from "ejs";
import ploTpl from './prompt/plot/role.emd'


export default async function (exeCtx: ExecutionContext) {
    exeCtx.task.app.tasks.reportProgress("正在设计情节骨架...");
    const common = Common.inst(exeCtx);
    const target = Target.inst(exeCtx);
    const plot = Plot.inst(exeCtx);
    common.next = "情节骨架";

    const errorRet = (msg = "发生错误，无法设计关键情节.") => {
        exeCtx.response = msg;
        return "_exit";
    }

    const prompt = render(ploTpl, {
        highConcept: common.highConcept,
        theme: common.theme,
        arc: common.arc,
        target: target.dump(),
        world: common.world,
        protagonist_current_state: common.arc.角色弧光.起始状态,
        protagonist_target_state: common.arc.角色弧光.摇摆节点[0]
    });

    console.log("prompt=", prompt)


    const result = await exeCtx.task.app.llms.callJSON(prompt)
    if (!result.success || !result.json) {
        return errorRet();
    }


    const mainPlots = [...plot.mainPlots,...result.json.欲望代价组合列表];
    // mainPlots.push(result.json)
    plot.mainPlots = mainPlots;

    console.log("plot=", plot.mainPlots)
}