import { BaseModel, refprop } from "../../basemodel.js";

// 标准处理过程．
export const SEQ = ["高概念",
    "受众分析",
    "主题设计",
    "主题变奏",
    "主角弧光",
    "世界设定",
    "情节骨架"
]

/**
 * 一般信息
 */
export class Common extends BaseModel {
    static key = "Common";
    static basePath = "common"

    @refprop("name", "")
    name!: string

    @refprop("next", "")
    next!: string

    // @refprop("themeSet", [])
    // themeSet!: Record<string, any>[]

    // 主题轴线数组。
    @refprop("synthesis", [])
    synthesis!: Record<string, any>[]

    // 主角沿主题演化路径-主角弧线。
    @refprop("arc", {})
    arc!: Record<string, any>

    // 世界定义．
    @refprop("world", {})
    world!: Record<string, any>


    @refprop("theme", {})
    theme!: Record<string, any>

    @refprop("highConceptSet", [])
    highConceptSet!: Record<string, any>[]

    @refprop("highConcept", {})
    highConcept!: Record<string, any>

    // 当前处理步骤在请求的stepName之后，意味着stepName可处理．
    isAfter(stepName: string): boolean {
        const realIdx = SEQ.indexOf(this.next);
        const reqIdx = SEQ.indexOf(stepName);
        // console.log("currentIdx=", realIdx)
        // console.log("reqIdx=", reqIdx)
        return realIdx >= reqIdx;
    }
}
