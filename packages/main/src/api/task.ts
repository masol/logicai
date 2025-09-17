/// 注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数，如同下例．
import { type IAppContext } from "../app/context.type.js";
import { type AiTask } from "../app/taskman.type.js";
import { CollectName } from "../app/taskman.js";
import { pick } from "remeda";

function get() {
    //@ts-expect-error　注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数．
    const ctx: IAppContext = this;
    const coll = ctx.db.collection<AiTask>(CollectName);
    const existingRecord = coll.findAll({
        sort: "-time",
    });

    // console.log("get tasks=", existingRecord)

    // 使用 remeda 的 pick 函数只选择需要的字段
    return existingRecord.map((task) => pick(task, ["id", "name", "time"]));
}

function current() {
    //@ts-expect-error　注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数．
    const ctx: IAppContext = this;
    return ctx.task.currentTask()
}


function create(name: string) {
    //@ts-expect-error　注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数．
    const ctx: IAppContext = this;
    return ctx.task.create(name);
}


function active(id: string) {
    //@ts-expect-error　注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数．
    const ctx: IAppContext = this;
    return ctx.task.setActiveTask(id)
}


// 加载历史记录。
async function history() {
    //@ts-expect-error　注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数．
    const ctx: IAppContext = this;
    const current = ctx.task.currentTask()
    // console.log("history current=", current)
    if (current && current.id) {
        const result = await ctx.history.loadRecentMessages(current.id);
        return result;
    }
    return { messages: [], total: 0 };
}

export default {
    get,
    create,
    current,
    active,
    history
};
