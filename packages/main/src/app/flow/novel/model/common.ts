import { BaseModel, refprop } from "../../basemodel.js";


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
    @refprop("arc", [])
    arc!: Record<string, any>[]

    // 世界定义．
    @refprop("world", {})
    world!: Record<string, any>


    @refprop("theme", {})
    theme!: Record<string, any>

    @refprop("highConceptSet", [])
    highConceptSet!: Record<string, any>[]

    @refprop("highConcept", {})
    highConcept!: Record<string, any>
}
