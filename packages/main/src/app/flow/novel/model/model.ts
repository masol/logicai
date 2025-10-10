import { BaseModel, refprop } from "../../basemodel.js";


/**
 * 目标用户.
 */

type target = {
    audience: string; // 目标受众描述.
    feature: string; // 特性描述．
}

/**
 * 世界规划
 */

type world = {

}

/**
 * 
 */
type people = {
    name: string;
    items: string[]; // 物品id.
}

type item = {
    name: string;
    owner: string; // 主人id.
    holder: string; // 持有人id，如果为空，主人持有．
    preset: string; // 所处场景id，如果为空，被持有人携带．
    desc: string; // 描述．
}


/**
 * 段落
 */
type paragraph = {
    scene: string;    // 场景id.
    items: string[];  // 场景物品．
    people: [{

    }] // 已有人物id.
}



/**
 * model结构说明:
 * 1. 宏观: common
 */

export class novel extends BaseModel {
    //段落:  场景+人物+动作序列+感官细节
    public hasClassify(): boolean {
        const delivery = this.refctx.delivery;
        return delivery["名称"] && delivery["类别"]
    }
}
