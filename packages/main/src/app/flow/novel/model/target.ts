import { BaseModel, refprop } from "../../basemodel.js";


/**
 * {
  "核心类型": "玄幻",
  "补充标签": ["重生", "热血", "轻松"],
  "目标平台": "起点中文网",
  
  "核心读者年龄": "18-25岁",
  "核心读者性别": "男性",
  "读者身份": ["大学生", "年轻上班族"],
  "阅读动机": ["放松解压", "追求爽感", "逃避现实"],
  
  "剧情节奏": "快",
  "情节密度": "高",
  "情感基调": ["爽快", "热血", "轻松"],
  "受欢迎套路": ["逆袭", "打脸", "扮猪吃虎"],
  "避雷元素": ["虐主", "憋屈", "文青病"],
  
  "主角类型": "杀伐果断、恩怨分明",
  "世界观特点": "力量至上，规则清晰",
  "核心冲突": "个人成长与外界压迫",
  "力量体系": "简单直接，升级感强"
}

{
  "core_genre": "玄幻",
  "supplementary_tags": ["重生", "热血", "轻松"],
  "target_platform": "起点中文网",
  
  "core_reader_age": "18-25岁",
  "core_reader_gender": "男性",
  "reader_identity": ["大学生", "年轻上班族"],
  "reading_motivation": ["放松解压", "追求爽感", "逃避现实"],
  
  "plot_pacing": "快",
  "plot_density": "高",
  "emotional_tone": ["爽快", "热血", "轻松"],
  "popular_tropes": ["逆袭", "打脸", "扮猪吃虎"],
  "avoided_elements": ["虐主", "憋屈", "文青病"],
  
//   "expected_word_count": "300万字左右",
//   "chapter_length": "3000-4000字",
//   "update_frequency": "日更",
//   "pacing_milestones": "百章内小成，三百章内扬名",
  
  "protagonist_type": "杀伐果断、恩怨分明",
  "worldview_characteristics": "力量至上，规则清晰",
  "core_conflict": "个人成长与外界压迫",
  "power_system": "简单直接，升级感强"
}
 * 一般信息
 */
export class Target extends BaseModel {
    static key = "Target";
    static basePath = "target"

    @refprop("核心类型", "")
    核心类型!: string

    @refprop("补充标签", [])
    补充标签!: string[]

    @refprop("目标平台", "")
    目标平台!: string

    @refprop("核心读者年龄", "")
    核心读者年龄!: string

    @refprop("核心读者性别", "")
    核心读者性别!: string

    @refprop("读者身份", [])
    读者身份!: string[]

    @refprop("阅读动机", [])
    阅读动机!: string[]

    @refprop("剧情节奏", "快")
    剧情节奏!: string

    @refprop("情节密度", "高")
    情节密度!: string

    @refprop("情感基调", [])
    情感基调!: string[]

    @refprop("受欢迎套路", [])
    受欢迎套路!: string[]

    @refprop("避雷元素", [])
    避雷元素!: string[]

    @refprop("主角类型", [])
    主角类型!: string[]

    @refprop("世界观特点", "")
    世界观特点!: string

    @refprop("核心冲突", "")
    核心冲突!: string

    @refprop("力量体系", "")
    力量体系!: string
}
