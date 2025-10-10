import { render } from "ejs";
import type { ExecutionContext } from "../../task/index.type.js";
import DelivPrompt from './deliverable.emd'
import PrevDelivery from './predelivery.emd'
import * as md from 'ts-markdown-builder';
import { isArray } from "remeda";


// console.log(DelivPrompt);
/**
 * 根据输入的内容信息生成相应的Markdown字符串。
 * 若 "类别" 为空，则提示用户并返回警告Markdown；
 * 若 "类别" 不为空，则返回空字符串。
 */
export function generateMarkdown(data: any): string {
    if (data["类别"] && data["类别"].trim() !== "") {
        return "";
    }

    const template = `
## ⚠️ 无法判断所属类别

您提供的交付物名称为 **<%= data["名称"] %>**  
但系统检测到其 **类别为空**，无法判断所属类别。  
请您补充此交付物的类别信息以继续。

---

### 📋 要求:
<% if (data["要求"] && data["要求"].length > 0) { %>
<% data["要求"].forEach((r) => { %>
- <%= r %>
<% }) %>
<% } else { %>
（暂无要求）
<% } %>

### 🛠️ 制作要求:
<% if (data["制作要求"] && data["制作要求"].length > 0) { %>
<% data["制作要求"].forEach((r) => { %>
- <%= r %>
<% }) %>
<% } else { %>
（暂无制作要求）
<% } %>

<% if (data["用户意图"] && data["用户意图"].trim() !== '') { %>
### 💡 用户意图:
<%= data["用户意图"] %>
<% } %>

---

由于未能识别出所属类别，以上信息 **暂未保存**。  
请您补充类别后，系统将重新记录相关内容。
`;

    return render(template, { data });
}


export default async function (exeCtx: ExecutionContext) {
    exeCtx.task.sharedContext.delivery = exeCtx.task.sharedContext.delivery || {}
    const delivery = exeCtx.task.sharedContext.delivery;
    exeCtx.task.app.tasks.reportProgress("正在分析交付物...")

    if (delivery["名称"] && delivery["类别"]) {
        let requirement = ''
        let procreq = ''
        if (isArray(delivery["要求"]) && delivery["要求"].length > 0) {
            requirement = md.joinBlocks([
                md.bold('交付物要求'),
                md.list(delivery['要求'] as string[])])
        }
        if (isArray(delivery["制作要求"]) && delivery["制作要求"].length > 0) {
            procreq = md.joinBlocks([
                md.bold('交付物的制作要求'),
                md.list(delivery['制作要求'] as string[])])
        }

        const previousResult = md.joinBlocks([
            `名称:${delivery["名称"]}`,
            `类别:${delivery["类别"]}`,
            requirement,
            procreq
        ])

        const prompt = render(PrevDelivery, {
            previousResult,
            userInput: exeCtx.input.content.content
        })

        // console.log(prompt)


        const result = await exeCtx.task.app.llms.callJSON(prompt);
        if (result.success) {
            if (isArray(result.json["新增要求"]) && result.json["新增要求"].length > 0) {
                delivery["要求"] = delivery["要求"] || []
                delivery["要求"] = [...delivery["要求"], ...result.json["新增要求"]]
            }
            if (isArray(result.json["新增制作要求"]) && result.json["新增制作要求"].length > 0) {
                delivery["制作要求"] = delivery["制作要求"] || []
                delivery["制作要求"] = [...delivery["制作要求"], ...result.json["新增制作要求"]]
            }
            // exeCtx.task.app.tasks.aiUpdate(result.response!, true);
        }
        console.log("on parseInput has old value:", result);
    } else {
        const prompt = render(DelivPrompt, {
            name: exeCtx.task.name,
            body: exeCtx.input.content.content
        })

        const result = await exeCtx.task.app.llms.callJSON(prompt);
        if (result.success && result.json) {
            console.log(result.json)
            result.json["名称"] = result.json["名称"] || exeCtx.task.name;
            const reportMd = generateMarkdown(result.json);
            if (reportMd) {
                exeCtx.task.app.tasks.aiUpdate(reportMd, true);
                return "_exit";
            }
            exeCtx.task.sharedContext.delivery = result.json
        }
        console.log("on parseInput:", result);
    }
}