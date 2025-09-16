
interface taxonomy {
    id: string;
    symbol: string; // 类别符号。
    synonymy: string[];
    is: string[];
    has: string[]; // taxonomy
    features: string[]; // 可能的属性。taxonomy
}