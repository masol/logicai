import { Feature } from "./feature.js";

// predicate和feature都从taxonomy中派生。
interface predicate {
    id: string;
    // symbol: string; // 谓词符号。
    // synonymy: string[];
    // features: Feature[];
    range: string[]; // 值域，也就是宾语(也位于本体中)。
    workflow?: string; // 是否有执行流程细化此谓词。如果有，这里存id.可执行的workflow就可以被加载并动态执行(可能是提示词函数或代码函数)
    // workflow是一个Triple数组。额外拥有名称,desc等信息。
}


interface Func {
    input: string[];  // 也是taxonomy
    output: string[];  // 也是taxonomy
    desc: string; // 功能描述。
    symbol?: string; // 如果有名字，此函数的名字，可成为一个predicate。
}

interface Wrokflow {
    id: string;// 如果可执行，则存储在id目录下，可加载进入执行。
    symbol: string;
    runnable: boolean;
}