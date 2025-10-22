// import { isPlainObject } from "remeda";
import { ExecutionContext } from "../../task/index.type.js";
import { Common } from "./model/common.js";
import { outlineCmds, charCmds, plotCmds } from './cmds/index.js'

type Fntype = (exeCtx: ExecutionContext, args: any[]) => Promise<string | undefined>


async function impl(exeCtx: ExecutionContext) {
    const userInput = (exeCtx.input.content.content).trim();
    const uinputs = userInput.split(' ');
    const setUinput = () => {
        uinputs.shift();
        exeCtx.input.content.content = uinputs.join(' ').trim();
    }

    const chkAndExit = (ret = "_next") => {
        if (!exeCtx.input.content.content) {
            console.log("没有给出正文，退出！")
            return "_exit";
        }
        return ret;
    }

    const common = Common.inst(exeCtx);

    switch (uinputs[0]) {
        case '/n':
            setUinput();
            return chkAndExit();
        case '/world':
            setUinput();
            return chkAndExit("世界设定");
        case '/outline':
            setUinput();
            await outlineCmds(exeCtx, uinputs);
            return '_exit';
        case '/char':
            setUinput();
            await charCmds(exeCtx, uinputs);
            return '_exit';
        case '/plot':
            setUinput();
            await plotCmds(exeCtx, uinputs);
            return '_exit';
        default:
            console.log("return uinpts[0]:", uinputs[0])
            return common.next;
    }
}

export default async function (exeCtx: ExecutionContext) {
    try {
        return await impl(exeCtx)
    } catch (error) {
        console.log("error in Dispatch.", error)
        return "_exit";
    }
}