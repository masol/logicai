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

}
