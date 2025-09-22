/// 注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数，如同下例．
import { type IAppContext } from "../app/context.type.js";
import { type AiTask } from "../app/task/index.type.js";
import { CollectName } from "../app/task/taskman.js";
import { pick } from "remeda";

function pickTask(task: AiTask | null) {
    if (task) {
        return pick(task, ["id", "name", "time"]);
    }
    return task;
}

function get() {
    //@ts-expect-error　注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数．
    const ctx: IAppContext = this;
    const coll = ctx.db.collection<AiTask>(CollectName);
    const existingRecord = coll.findAll({
        sort: "-time",
    });

    // 使用 remeda 的 pick 函数只选择需要的字段
    return existingRecord.map((task) => pickTask(task));
}

function current() {
    //@ts-expect-error　注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数．
    const ctx: IAppContext = this;
    return pickTask(ctx.task.currentTask());
}


async function create(name: string) {
    //@ts-expect-error　注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数．
    const ctx: IAppContext = this;
    return pickTask(await ctx.task.create(name));
}


async function active(id: string) {
    //@ts-expect-error　注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数．
    const ctx: IAppContext = this;
    console.log("enter active!!!")
    return await ctx.task.setActiveTask(id)
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
