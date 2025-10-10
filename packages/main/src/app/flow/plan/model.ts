import { BaseModel } from "../basemodel.js";

class Plan extends BaseModel {
    public hasClassify(): boolean {
        const delivery = this.refctx.delivery;
        return delivery["名称"] && delivery["类别"]
    }
}
