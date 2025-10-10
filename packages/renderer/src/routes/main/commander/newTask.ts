const TaskTypes = [
    { label: "通用规划", value: "plan" },
    { label: "-Rust Web", value: "rsweb" },
    { label: "-网络小说", value: "novel" },
    { label: "-论文", value: "article" },
    { label: "-PPT", value: "ppt" },
    { label: "通用沟通", value: "chat" }
]

export default TaskTypes;

export function getLabel(value: string): string {
    const o = TaskTypes.find((t) => t.value === value);
    if (o) {
        return o.label
    }
    return value;
}