/// 注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数，如同下例．
import { type IAppContext } from "../app/context.type.js";

const colName = "setting";

export function setSetting(ctx: IAppContext, name: string, value: any) {
    const coll = ctx.db.collection(colName);
    const existingRecord = coll.findOne({ id: name });
    if (existingRecord) {
        // 存在则更新
        coll.updateWhere(
            {
                id: name,
            },
            {
                value,
            }
        );
    } else {
        // 不存在则新建
        coll.insert({
            id: name,
            value,
        });
    }
}

async function set(name: string, value: any) {
    //@ts-expect-error　注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数．
    const ctx: IAppContext = this;
    setSetting(ctx, name, value);
    if (name === "models") { // 如果设置模型，重新初始化！
        const models = value?.llm || [];
        ctx.llms.removeAllLLMs();
        ctx.llms.init(models);
        console.log("llm status=")
        console.dir(ctx.llms.getInstancesStatus());
    }
}

export function getSetting(ctx: IAppContext, name: string): any {
    switch (name) {
        case "inited":
            return ctx.inited;
    }
    const coll = ctx.db.collection(colName);
    const existingRecord = coll.findOne({ id: name });
    return existingRecord?.value ?? "";
}

async function get(name: string) {
    //@ts-expect-error　注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数．
    const ctx: IAppContext = this;
    return getSetting(ctx, name)
}

async function passive(value: boolean) {
    //@ts-expect-error　注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数．
    const ctx: IAppContext = this;
    ctx.passive = value;
    setSetting(ctx, "passive", value);
}

export default {
    get,
    set,
    passive
};
