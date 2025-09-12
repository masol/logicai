/// 注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数，如同下例．
import { type AppContext } from "../app/context.js";

const colName = "setting";
async function set(name: string, value: string) {
    //@ts-expect-error　注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数．
    const ctx: AppContext = this;
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

async function get(name: string) {
    //@ts-expect-error　注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数．
    const ctx: AppContext = this;
    switch (name) {
        case 'inited':
            return ctx.inited;
    }
    const coll = ctx.db.collection(colName);
    const existingRecord = coll.findOne({ id: name });
    return existingRecord?.value ?? "";
}

export default {
    get,
    set,
};
