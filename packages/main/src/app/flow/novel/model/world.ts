// // ===== 基础类型 =====

import { BaseModel, refprop } from "../../basemodel.js";

// // 角色
// export interface 角色 {
//     id: string;
//     名称: string;
//     身份: '主角' | '反派' | '配角' | '对照角色';
//     性格特征: string[];        // 如 ["勇敢", "多疑"]
//     当前目标: string;
//     情绪状态: 情绪;            // 当前情绪
// }

// // 情绪
// export type 情绪 = '充满希望' | '恐惧' | '愤怒' | '悲伤' | '喜悦' | '平静';

// // 情感弧线
// export interface 情感弧线 {
//     起始: 情绪;
//     结束: 情绪;
//     强度: number; // 1-5
// }

// // 场景类型
// export type 场景类型 = '动作' | '对话' | '叙述' | '闪回' | '高潮' | '结局';


class 内在制约 {

};


type Character = {
    姓名: string;
    出生: string;
    性格: string;
    外貌: Record<string, string>;
    人际关系: Record<string, string>;
    所属势力: string;
};



export class World extends BaseModel {
    static key = "World";
    static basePath = "world"

    // 主题轴线数组。
    @refprop("characters", [])
    characters!: Character[]

    // 主角

    @refprop("major", {})
    major!: Character

    findChar(name: string): Character | undefined {
        const chars = this.characters
        return chars.find(item => item.姓名 === name);
    }

    addChar(character: Character) {
        const oldChar = this.findChar(character.姓名);
        if (oldChar) {
            Object.assign(oldChar, character)
        } else {
            const chars = this.characters;
            chars.push(character);
            this.characters = chars;
        }
    }
}