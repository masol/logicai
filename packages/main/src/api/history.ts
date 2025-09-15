/// 注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数，如同下例．
import { type AppContext } from "../app/context.js";


async function get(name: string) {
    //@ts-expect-error　注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数．
    const ctx: AppContext = this;
    const result = await ctx.history.loadRecentMessages();
    return result;
}

export default {
    get
};
