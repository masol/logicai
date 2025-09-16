
export interface Feature {
    symbol: string; // 特性符号。也就是形容词或副词或量词,如1个,需要通过1的is来判断类别,得到数/数量/等做为此字段的类型名。
    desc: string; // 特性简述。
    synonymy: string[];
    functional?: string; //true|false|'' :boolean; 是否可数，true表示单值（如"年龄"）,false表示多值（如"颜色"）,undefined表示未知。
}