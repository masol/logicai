// stores/chatStore.ts
import { writable } from 'svelte/store';

export interface MessageContent {
    content: string;
    mode?: string; //warn,error,info
    files?: {
        filename: string;
        type: string;
        desc?: string;
    }[];
    progressId?: string;
    progressCtx?: string[];
}

export interface Message {
    id: string;
    type: "ai" | "user" | "sys";
    content: MessageContent;
    timestamp: number;
}

export interface ChatState {
    messages: Message[];
    totalCount: number;
    isComplete: boolean;
}

function createChatStore() {
    // 假数据
    const mockMessages: Message[] = [
        {
            id: "1",
            type: "sys",
            content: {
                content: "对话开始",
                files: []
            },
            timestamp: Date.now() - 20000,
        },
        {
            id: "2",
            type: "user",
            content: {
                content: "你好，我想了解一下AI的工作原理",
                files: []
            },
            timestamp: Date.now() - 19000,
        },
        {
            id: "3",
            type: "ai",
            content: {
                content: "你好！AI的工作原理主要基于机器学习算法，通过大量数据训练神经网络模型。简单来说，就是让计算机通过学习来模拟人类的思维过程。",
                files: [
                    {
                        filename: "ai_basics.pdf",
                        type: "document",
                        desc: "AI基础概念介绍文档"
                    }
                ]
            },
            timestamp: Date.now() - 18000,
        },
        {
            id: "4",
            type: "user",
            content: {
                content: "那具体是怎么训练的呢？",
                files: []
            },
            timestamp: Date.now() - 17000,
        },
        {
            id: "5",
            type: "ai",
            content: {
                content: "训练过程包括几个步骤：1. 数据收集和预处理 2. 选择合适的模型架构 3. 通过反向传播算法调整权重 4. 验证和测试模型性能。这个过程需要大量的计算资源和时间。",
                files: [
                    {
                        filename: "training_process.png",
                        type: "image",
                        desc: "神经网络训练流程图"
                    },
                    {
                        filename: "backpropagation_demo.py",
                        type: "code",
                        desc: "反向传播算法示例代码"
                    }
                ]
            },
            timestamp: Date.now() - 16000,
        },
        {
            id: "6",
            type: "user",
            content: {
                content: "听起来很复杂，有什么实际应用吗？",
                files: [
                    {
                        filename: "my_project.zip",
                        type: "archive",
                        desc: "我的机器学习项目代码"
                    }
                ]
            },
            timestamp: Date.now() - 15000,
        },
        {
            id: "7",
            type: "ai",
            content: {
                content: "当然有很多应用！比如：语音识别、图像识别、自然语言处理、推荐系统、自动驾驶等。你现在和我对话就是自然语言处理的应用。",
                files: [
                    {
                        filename: "ai_applications.json",
                        type: "data",
                        desc: "AI应用领域数据"
                    },
                    {
                        filename: "nlp_demo.mp4",
                        type: "video",
                        desc: "自然语言处理演示视频"
                    }
                ],
                progressId: "analysis_001",
                progressCtx: ["正在分析应用场景,正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景正在分析应用场景", "生成示例代码", "完成"]
            },
            timestamp: Date.now() - 14000,
        },
        {
            id: "8",
            type: "sys",
            content: {
                content: "用户已连接10分钟",
                files: []
            },
            timestamp: Date.now() - 13000,
        },
        {
            id: "9",
            type: "user",
            content: {
                content: "AI会取代人类的工作吗？",
                files: []
            },
            timestamp: Date.now() - 12000,
        },
        {
            id: "10",
            type: "ai",
            content: {
                content: "AI更多的是辅助和增强人类的能力，而不是完全取代。它可能会改变某些工作的性质，但也会创造新的工作机会。重要的是适应和学习新技能。",
                files: [
                    {
                        filename: "future_jobs_report.xlsx",
                        type: "spreadsheet",
                        desc: "未来就业趋势分析报告"
                    }
                ]
            },
            timestamp: Date.now() - 11000,
        },
        {
            id: "11",
            type: "user",
            content: {
                content: "谢谢你的解答！",
                files: []
            },
            timestamp: Date.now() - 10000,
        },
        {
            id: "12",
            type: "ai",
            content: {
                content: "不客气！如果你还有其他问题，随时可以问我。",
                files: []
            },
            timestamp: Date.now() - 9000,
        },
        {
            id: "13",
            type: "user",
            content: {
                content: "那我们聊聊编程话题吧",
                files: []
            },
            timestamp: Date.now() - 8000,
        },
        {
            id: "14",
            type: "ai",
            content: {
                content: "好的！编程是一个很有趣的话题。你对哪种编程语言比较感兴趣？",
                files: [
                    {
                        filename: "programming_languages.md",
                        type: "document",
                        desc: "主流编程语言对比"
                    }
                ]
            },
            timestamp: Date.now() - 7000,
        },
        {
            id: "15",
            type: "user",
            content: {
                content: "我最近在学习TypeScript",
                files: [
                    {
                        filename: "my_ts_config.json",
                        type: "config",
                        desc: "我的TypeScript配置文件"
                    }
                ]
            },
            timestamp: Date.now() - 6000,
        },
        {
            id: "16",
            type: "ai",
            content: {
                content: "TypeScript是个很好的选择！它为JavaScript添加了静态类型检查，能帮助你写出更可靠的代码。你觉得最难的部分是什么？",
                files: [
                    {
                        filename: "typescript_guide.pdf",
                        type: "document",
                        desc: "TypeScript学习指南"
                    },
                    {
                        filename: "type_examples.ts",
                        type: "code",
                        desc: "TypeScript类型示例"
                    }
                ]
            },
            timestamp: Date.now() - 5000,
        },
        {
            id: "17",
            type: "user",
            content: {
                content: "泛型的概念有点难理解",
                files: []
            },
            timestamp: Date.now() - 4000,
        },
        {
            id: "18",
            type: "ai",
            content: {
                content: "泛型确实是TypeScript的高级特性。简单说就是让类型也能作为参数传递，这样可以写出更通用的代码。比如Array<T>，这里的T就是泛型参数。",
                files: [
                    {
                        filename: "generics_tutorial.ts",
                        type: "code",
                        desc: "泛型详细教程和示例"
                    },
                    {
                        filename: "generics_diagram.svg",
                        type: "image",
                        desc: "泛型概念图解"
                    }
                ],
                progressId: "tutorial_002",
                progressCtx: ["准备教程内容", "生成代码示例", "创建图表", "完成"]
            },
            timestamp: Date.now() - 3000,
        },
        {
            id: "19",
            type: "sys",
            content: {
                content: "连接状态良好",
                files: [],
                progressId: "system_check",
                progressCtx: ["检查网络连接", "验证服务状态", "完成"]
            },
            timestamp: Date.now() - 2000,
        },
        {
            id: "20",
            type: "user",
            content: {
                content: "能举个具体的例子吗？",
                files: []
            },
            timestamp: Date.now() - 1000,
        },
    ];

    const initialState: ChatState = {
        messages: mockMessages,
        totalCount: mockMessages.length + 1000,
        isComplete: true
    };

    const { subscribe, set, update } = writable(initialState);

    return {
        subscribe,
        addMessage: (message: Message) => update(state => ({
            ...state,
            messages: [...state.messages, message],
            totalCount: state.totalCount + 1
        })),
        setMessages: (messages: Message[]) => update(state => ({
            ...state,
            messages,
            totalCount: messages.length
        })),
        setComplete: (isComplete: boolean) => update(state => ({
            ...state,
            isComplete
        }))
    };
}

export const chatStore = createChatStore();