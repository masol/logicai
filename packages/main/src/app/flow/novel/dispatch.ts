// import { isPlainObject } from "remeda";
import { ExecutionContext } from "../../task/index.type.js";
import { Common } from "./model/common.js";
import Outline from './cmds/outline.js'
import Expand from './cmds/expand.js'
import { isNumber } from "remeda";

type Fntype = (exeCtx: ExecutionContext, args: any[]) => Promise<string | undefined>

const ThreeArgsCmds: Record<string, Fntype> = {
    "expand": Expand
}

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

    const outlineCmds = async () => {
        let fn: Fntype | null = null;
        const args: any[] = [];
        if (uinputs.length === 0) {
            fn = Outline;
            // await Outline(exeCtx);
        } else {
            console.log("uintpus=", uinputs)
            const cmdStr = uinputs[0].trim()

            switch (cmdStr) {
                case 'expand':
                case 'char':
                case 'story':
                    if (uinputs.length < 2) {
                        exeCtx.response = "命令错误，缺少数量．"
                        return;
                    }
                    const num = parseInt(uinputs[1]);
                    if (!isNumber(num)) {
                        exeCtx.response = "命令错误，缺少数量．"
                        return;
                    }
                    uinputs.shift();
                    uinputs.shift();
                    exeCtx.input.content.content = uinputs.join(' ').trim();
                    fn = ThreeArgsCmds[cmdStr]
                    args.push(num);
                    break;
                default:
                    fn = Outline;
            }
        }
        if (fn) {
            return await fn(exeCtx, args);
        }
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
            await outlineCmds();
            return '_exit';
        default:
            console.log("return uinpts[0]:",uinputs[0])
            return common.next;
    }
}

export default async function (exeCtx: ExecutionContext) {
    try {
        return await impl(exeCtx)
    } catch {
        console.log("error in Dispatch.")
    }
}