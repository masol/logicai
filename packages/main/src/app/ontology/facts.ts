

interface Triple {
    id: string;
    timestamp: number; // 时间戳
    taxonomy: string; // id
    predicate: string; // id
    object?: string; // 也是taxonomy
    fetures: string[]; // 也是taxonomy,id(例如位置，目的等任意信息,这里指向的是值，其类型需要通过is继续检索和判定)
}

