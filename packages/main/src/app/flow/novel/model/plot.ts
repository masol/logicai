import { BaseModel, refprop } from "../../basemodel.js";


/**
 * 一般信息
 */
export class Plot extends BaseModel {
    static key = "Plot";
    static basePath = "plot"

    @refprop("name", "")
    name!: string

    // 情节主线．
    @refprop("mainPlots", [])
    mainPlots!: Record<string, any>[]

}

// import { 场景类型, 角色, 情感弧线 } from './character.js'
// // ===== 核心：情节单元 =====

// export interface 情节单元 {
//     id: string;
//     描述: string;
//     类型: 场景类型;
//     涉及角色: 角色[];
//     场景设定: string;           // 时间与地点
//     目标: string;               // 本单元想达成什么
//     冲突: string;               // 内部或外部冲突
//     障碍: string[];             // 阻碍因素
//     行动: string[];             // 角色采取的行动
//     结果: string;               // 成功/失败/部分成功
//     情感弧线: 情感弧线;
//     后果: string[];             // 对后续的影响
//     成功率?: number;            // 0-1
//     紧张度: number;             // 1-10

//     // 子情节（支持嵌套）
//     子情节?: 情节单元[];

//     // 元数据：用于LLM控制
//     元数据: {
//         叙事功能?: '引发事件' | '上升行动' | '高潮' | '回落' | '结局';
//         风格基调?: '黑暗' | '浪漫' | '幽默' | '史诗';
//         视角角色Id?: string;
//         关键词: string[];
//     };
// }

// // ===== 叙事结构模板 =====

// export interface 叙事结构 {
//     名称: string;
//     幕次: {
//         幕: number;
//         名称: string;
//         描述: string;
//         所需情节单元类型: string[];
//     }[];
// }

// // 示例：三幕剧结构
// const 三幕剧结构: 叙事结构 = {
//     名称: "三幕剧结构",
//     幕次: [
//         {
//             幕: 1,
//             名称: "铺垫",
//             描述: "介绍角色、世界和引发事件。",
//             所需情节单元类型: ["介绍主角", "引发事件"]
//         },
//         {
//             幕: 2,
//             名称: "对抗",
//             描述: "上升行动、障碍、中点转折。",
//             所需情节单元类型: ["上升行动", "中点", "至暗时刻"]
//         },
//         {
//             幕: 3,
//             名称: "解决",
//             描述: "高潮与结局。",
//             所需情节单元类型: ["高潮", "结局"]
//         }
//     ]
// };

// // ===== 故事整体 =====

// export interface 故事 {
//     id: string;
//     标题: string;
//     类型: string[];
//     主题: string[]; // 如 "复仇", "成长"
//     角色: 角色[];
//     叙事结构: 叙事结构;
//     情节单元: 情节单元[];
//     连贯性评分?: number;
//     节奏曲线: { 单元索引: number; 紧张度: number }[];
// }

// // ===== LLM 提示模板 =====

// interface LLM提示模板 {
//     角色: string;
//     任务: '生成' | '扩展' | '评估' | '连接';
//     上下文: Partial<故事 | 情节单元>;
//     约束条件: string[];
//     输出格式: 'json' | 'text';
// }