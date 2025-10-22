import { isNumber } from "remeda";
import { ExecutionContext } from "../../../task/index.type.js";
import outline from './outline.js'
import expand from './expand.js'
import addChar from './char/add.js'
import genPlot from './plot/gen.js'


type Fntype = (exeCtx: ExecutionContext, args: any[]) => Promise<string | undefined>

// 定义参数解析器类型
type ParamParser = (uinputs: string[], exeCtx: any) => {
    success: boolean;
    args?: any[];
    error?: string;
};

// 定义命令配置类型
interface CommandItem {
    fn: Fntype;
    parseParams: ParamParser;
}

interface CommandConfig {
    commands: Record<string, CommandItem>;
    defaultFn: Fntype | null;
}

// 通用的数字参数解析器
const parseNumberParam: ParamParser = (uinputs, exeCtx) => {
    if (uinputs.length < 2) {
        return { success: false, error: "命令错误，缺少数量．" };
    }

    const num = parseInt(uinputs[1]);
    if (!isNumber(num)) {
        return { success: false, error: "命令错误，缺少数量．" };
    }

    uinputs.shift();
    uinputs.shift();
    exeCtx.input.content.content = uinputs.join(' ').trim();

    return { success: true, args: [num] };
};

// 无参数解析器
const parseNoParam: ParamParser = (uinputs, exeCtx) => {
    return { success: true, args: [] };
};

// // 字符串参数解析器示例
// const parseStringParam: ParamParser = (uinputs, exeCtx) => {
//     if (uinputs.length < 2) {
//         return { success: false, error: "命令错误，缺少参数．" };
//     }

//     uinputs.shift();
//     const param = uinputs.join(' ').trim();
//     exeCtx.input.content.content = param;

//     return { success: true, args: [param] };
// };

// // 多个参数解析器示例
// const parseMultipleParams: ParamParser = (uinputs, exeCtx) => {
//     if (uinputs.length < 3) {
//         return { success: false, error: "命令错误，参数不足．" };
//     }

//     const num = parseInt(uinputs[1]);
//     if (!isNumber(num)) {
//         return { success: false, error: "第一个参数必须是数字．" };
//     }

//     const type = uinputs[2];
//     uinputs.shift();
//     uinputs.shift();
//     uinputs.shift();
//     exeCtx.input.content.content = uinputs.join(' ').trim();

//     return { success: true, args: [num, type] };
// };

// 定义各个命令配置
const OUTLINE_CONFIG: CommandConfig = {
    commands: {
        'expand': {
            fn: expand,
            parseParams: parseNumberParam
        },
    },
    defaultFn: outline
};

const CHAR_CONFIG: CommandConfig = {
    commands: {
        'add': {
            fn: addChar,
            parseParams: parseNumberParam
        },
    },
    defaultFn: null
};

const PLOT_CONFIG: CommandConfig = {
    commands: {
        'gen': {
            fn: genPlot,
            parseParams: parseNoParam
        },
    },
    defaultFn: null
};


const executeCmds = async (exeCtx: ExecutionContext, uinputs: string[], config: CommandConfig) => {
    let fn: Fntype | null = null;
    let args: any[] = [];

    if (uinputs.length === 0) {
        fn = config.defaultFn;
    } else {
        console.log("uinputs=", uinputs);
        const cmdStr = uinputs[0].trim();

        const commandItem = config.commands[cmdStr];
        if (commandItem) {
            // 使用对应的参数解析器
            const parseResult = commandItem.parseParams(uinputs, exeCtx);

            if (!parseResult.success) {
                exeCtx.response = parseResult.error;
                return;
            }

            fn = commandItem.fn;
            args = parseResult.args || [];
        } else {
            fn = config.defaultFn;
        }
    }

    if (fn) {
        return await fn(exeCtx, args);
    }
};

// 使用方式
export const outlineCmds = (exeCtx: ExecutionContext, uinputs: string[]) => executeCmds(exeCtx, uinputs, OUTLINE_CONFIG);
export const charCmds = (exeCtx: ExecutionContext, uinputs: string[]) => executeCmds(exeCtx, uinputs, CHAR_CONFIG);
export const plotCmds = (exeCtx: ExecutionContext, uinputs: string[]) => executeCmds(exeCtx, uinputs, PLOT_CONFIG);

