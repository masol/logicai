/// 注意，由于箭头函数不能绑定this,如果需要接收appContext,必须使用函数，如同下例．
import { type IAppContext } from "../app/context.type.js";
import { type AiTask } from "../app/task/index.type.js";
import { CollectName } from "../app/task/taskman.js";
import type { Message } from "../app/history.type.js";
import { isEmpty, isPlainObject, pick } from "remeda";
import * as R from "remeda";

function pickTask(task: AiTask | null) {
    if (task) {
        return pick(task, ["id", "name", "time", "type"]);
    }
    return task;
}

function get(app: IAppContext) {
    const coll = app.db.collection<AiTask>(CollectName);
    const existingRecord = coll.findAll({
        sort: "-time",
    });

    // 使用 remeda 的 pick 函数只选择需要的字段
    return existingRecord.map((task) => pickTask(task));
}

function current(app: IAppContext,) {
    return pickTask(app.tasks.current);
}

async function userInput(app: IAppContext, userMsg: Message): Promise<Message> {
    return await app.tasks.onUserInput(userMsg);
}


async function create(app: IAppContext, name: string, type: string) {
    // console.log("name,type=", name, type)
    return pickTask(await app.tasks.create(name, type));
}


async function active(app: IAppContext, id: string) {
    console.log("enter active!!!")
    return await app.tasks.setActiveTask(id)
}


// 加载历史记录。
async function history(app: IAppContext) {
    const current = app.tasks.current
    // console.log("history current=", current)
    if (current && current.id) {
        const result = await app.history.loadRecentMessages(current.id);
        return result;
    }
    return { messages: [], total: 0 };
}


// 加载当前激活task的sharedContext.
async function shared(app: IAppContext) {
    const current = app.tasks.current
    // console.log("history current=", current)
    if (current && current.id) {
        return current.sharedContext;
    }
    return null;
}

async function saveShared(app: IAppContext, value: Record<string, any>) {
    const current = app.tasks.current
    if (!current?.id) return;

    if (isEmpty(value) || !isPlainObject(value)) return;

    // 删除 sharedContext 顶层中、但不在 value 中的键
    for (const k of Object.keys(current.sharedContext)) {
        if (!(k in value)) delete current.sharedContext[k];
    }

    // 再做 mergeDeep 合并覆盖
    const merged = R.mergeDeep(R.mergeDeep({}, current.sharedContext), value);
    for (const k of Object.keys(merged)) {
        current.sharedContext[k] = merged[k];
    }

    await current.save();
}


export default {
    get,
    create,
    current,
    active,
    history,
    userInput,
    shared,
    saveShared
};
