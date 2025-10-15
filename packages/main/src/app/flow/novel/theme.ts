import { ExecutionContext } from "../../task/index.type.js";
import { Common } from "./model/common.js";
import { Target } from "./model/target.js";
import { render } from "ejs";
import Tpl from "./prompt/theme/design.emd";
// import evolutionTpl from "./prompt/theme/evolution.emd";
// import { isEmpty } from "remeda";
// import pMap from "p-map";

// const ThemeLevel = ["哲学概念层", "社会现象层", "人际关系层", "个人选择层"]

export default async function (exeCtx: ExecutionContext) {
    // const userInput = exeCtx.input.content.content.trim();
    exeCtx.task.app.tasks.reportProgress("正在设计主题...");
    // const target = Target.inst(exeCtx);
    const common = Common.inst(exeCtx);
    common.next = "主题设计";
    const prompt = render(Tpl, {
        highConcept: common.highConcept
    });

    const errorRet = (msg = "发生错误，无法确定主题．") => {
        exeCtx.response =
            "发生错误，无法确定主题．";
        return "_exit";
    }

    const results = await exeCtx.task.app.llms.callJSON(prompt)
    if (!results.success || !results.json) {
        return errorRet();
    }

    common.theme = results.json;

    console.log("theme=", common.theme)

    // const concreateTheme = async (themeSet: Record<string, any>[], level: number): Promise<void> => {
    //     await pMap(themeSet, async (item: Record<string, any>) => {
    //         if (isEmpty(item)) {
    //             return;
    //         }
    //         if (level + 1 >= ThemeLevel.length) {
    //             return;
    //         }

    //         const evoPrompt = render(evolutionTpl, {
    //             theme: common.theme,
    //             target,
    //             highConcept: common.highConcept,
    //             current: {
    //                 对立概念: item.对立概念,
    //                 主题名称: item.主题名称,
    //             },
    //             targetLevel: ThemeLevel[level + 1],
    //             currentLevel: ThemeLevel[level],
    //         })
    //         const result = await exeCtx.task.app.llms.callJSON(evoPrompt);
    //         if (result.success && result.json) {
    //             item.children = result.json;
    //             return concreateTheme(result.json, level + 1)
    //         }
    //     },
    //         { concurrency: 10 })
    // }


    // await concreateTheme(common.theme.主题方案,0)

    // const evoPrompt = render(evolutionTpl, {
    //     theme: common.theme,
    //     target,
    //     highConcept: common.highConcept,
    //     current: false,
    //     targetLevel: ThemeLevel[1],
    //     currentLevel: ThemeLevel[0],
    // })

    // const finalResult = await exeCtx.task.app.llms.callJSON(evoPrompt)
    // await pMap(finalResult.json, async (item: Record<string, any>) => {
    //     if (isEmpty(item)) {
    //         return;
    //     }
    //     const evoPrompt = render(evolutionTpl, {
    //         theme: common.theme,
    //         target,
    //         highConcept: common.highConcept,
    //         current: {
    //             对立概念: item.对立概念,
    //             主题名称: item.主题名称,
    //             抽象层级: ThemeLevel[1],
    //         },
    //         targetLevel: ThemeLevel[2],
    //         currentLevel: ThemeLevel[1],
    //     })
    //     const result = await exeCtx.task.app.llms.callJSON(evoPrompt);
    //     if (result.success && result.json) {
    //         item.children = result.json;
    //     }
    // },
    //     { concurrency: 10 })

    // console.log("finalResult=", finalResult)
    // const concepts: Record<string, any>[] = [];
    // results.forEach(result => {
    //     if (result.success && result.json && Array.isArray(result.json)) {
    //         // 只把非空值加入
    //         concepts.push(...result.json.filter((v: Record<string, any>) => !isEmpty(v)));
    //     }
    // });


    // return "_exit"

    //     common.themeSet = result.json;

    //     const prompt = render(auditTpl, {
    //         target: target.dump(),
    //         userInput,
    //         themeStr: JSON.stringify(result.json)
    //     })

    //     const finalResult = await exeCtx.task.app.llms.callJSON(prompt);
    //     if (finalResult.success && finalResult.json) {
    //         common.theme = finalResult.json;
    //     } else {
    //         exeCtx.response =
    //             "发生错误，无法确定主题．";
    //         return "_exit";
    //     }
    // }
}
