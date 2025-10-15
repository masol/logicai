import { ExecutionContext } from "../../task/index.type.js";
import { Common } from "./model/common.js";
import { Target } from "./model/target.js";
import { render } from "ejs";
import HistoryTpl from './prompt/world/history.emd'

const WorldMapping: Record<string, any> = {
    "历史": HistoryTpl,
    "架空": HistoryTpl,
    "架空历史": HistoryTpl,
    "历史架空": HistoryTpl
}


export default async function (exeCtx: ExecutionContext) {
    exeCtx.task.app.tasks.reportProgress("正在设计世界参数...");
    const common = Common.inst(exeCtx);
    const target = Target.inst(exeCtx);
    common.next = "世界设定";

    const errorRet = (msg = "发生错误，无法设计世界参数.") => {
        exeCtx.response = msg;
        return "_exit";
    }

    const worldTpl = WorldMapping[target.类型];
    if (!worldTpl) {
        return errorRet(`设定世界时，发现类型未被支持:${target.类型}`)
    }

    const arcPrompt = render(worldTpl, {
        highConcept: common.highConcept,
        theme: common.theme,
        arc: common.arc,
        target: target.dump()
    });


    const result = await exeCtx.task.app.llms.callJSON(arcPrompt)
    if (!result.success || !result.json) {
        return errorRet();
    }

    common.world = result.json;
    console.log("world=", common.world)
}