import { BaseModel, refprop } from "../../basemodel.js";


/**
{
  "类型": "玄幻",
  "目标平台": "起点中文网",
  
  "读者性别": "男性",
  "读者身份": ["大学生", "年轻上班族"],
  "情感基调": ["爽快", "热血", "轻松"],
  "受欢迎套路": ["逆袭", "打脸", "扮猪吃虎"],
  "避雷元素": ["虐主", "憋屈", "文青病"],  
}

 * 一般信息
 */
export class Target extends BaseModel {
    static key = "Target";
    static basePath = "target"

    @refprop("类型", "")
    类型!: string

    @refprop("目标平台", "")
    目标平台!: string

    @refprop("读者性别", "")
    读者性别!: string

    @refprop("读者身份", [])
    读者身份!: string[]

    @refprop("情感基调", [])
    情感基调!: string[]

    @refprop("受欢迎套路", [])
    受欢迎套路!: string[]

    @refprop("避雷元素", [])
    避雷元素!: string[]
}
