// import { isPlainObject } from "remeda";
import { ExecutionContext } from "../../task/index.type.js";
import { Common } from "./model/common.js";


export default async function (exeCtx: ExecutionContext) {
    const userInput = (exeCtx.input.content.content).trim();
    const uinputs = userInput.split(' ');
    switch (uinputs[0]) {
        case '/n':
            uinputs.shift();
            exeCtx.input.content.content = uinputs.join(' ').trim();
            if (!exeCtx.input.content.content) {
                console.log("/n 没有给出正文，退出！")
                return "_exit";
            }
            return "_next";
        default:
            const common = Common.inst(exeCtx);
            return common.next;
    }
}