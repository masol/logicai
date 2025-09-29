import { ChatOpenAI } from "@langchain/openai";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage } from "@langchain/core/messages";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { BaseMessage } from "@langchain/core/messages";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { render } from "ejs";
import type { LLMConfig, CallResult, JSONCallResult } from "./index.type.js";
// 提供商配置映射
const PROVIDER_CONFIG = {
    QianWen: {
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        defaultModel: "qwen-flash"
    },
    DeepSeek: {
        baseURL: 'https://api.deepseek.com',
        defaultModel: 'deepseek-chat'
    },
    OpenAI: {
        baseURL: 'https://api.openai.com/v1',
        defaultModel: 'gpt-3.5-turbo'
    },
    Groq: {
        baseURL: 'https://api.groq.com/openai/v1',
        defaultModel: 'llama-3.1-8b-instant'
    },
    Moonshot: {
        baseURL: 'https://api.moonshot.cn/v1',
        defaultModel: 'moonshot-v1-auto'
    },
    Baichuan: {
        baseURL: 'https://api.baichuan-ai.com/v1',
        defaultModel: 'Baichuan2-Turbo'
    },
    Zhipu: {
        baseURL: 'https://open.bigmodel.cn/api/paas/v4',
        defaultModel: 'glm-4'
    },
    OpenRouter: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultModel: 'qwen/qwen3-coder:free'
    }
} as const;

export class LLMWrapper {
    private llm: BaseLanguageModel;
    private jsonParser: JsonOutputParser;

    constructor(
        private config: LLMConfig,
        private options?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            baseURL?: string;
        }
    ) {
        this.llm = this.createLLM();
        this.jsonParser = new JsonOutputParser();
    }

    /**
     * 创建LLM实例
     */
    private createLLM(): BaseLanguageModel {
        const providerConfig = PROVIDER_CONFIG[this.config.provider];
        if (!providerConfig) {
            throw new Error(`不支持的提供商: ${this.config.provider}`);
        }

        const baseURL = (this.options?.baseURL || providerConfig.baseURL).trim();
        const model = (this.config.name || this.options?.model || providerConfig.defaultModel).trim();

        const commonOptions: { model: string, [key: string]: any } = {
            model,
        };

        if (this.options?.temperature) {
            commonOptions.temperature = this.options?.temperature;
        }

        if (this.options?.maxTokens) {
            commonOptions.maxTokens = this.options?.maxTokens;
        }

        switch (this.config.provider) {
            case 'Groq':
                return new ChatGroq({
                    ...commonOptions,
                    apiKey: this.config.apiKey
                });
            case 'DeepSeek':
            case 'OpenAI':
            case 'Moonshot':
            case 'Baichuan':
            case 'Zhipu':
            case 'OpenRouter':
            case 'QianWen':
                return new ChatOpenAI({
                    apiKey: this.config.apiKey,
                    openAIApiKey: this.config.apiKey,
                    ...commonOptions,
                    configuration: {
                        baseURL
                    }
                });

            default:
                throw new Error(`不支持的 LLM 提供商: ${this.config.provider}`);
        }
    }

    /**
     * 将输入转换为消息格式
     */
    private prepareInput(input: string | number | BaseMessage[]): BaseMessage[] {
        if (Array.isArray(input)) {
            return input;
        }

        const content = typeof input === 'number' ? input.toString() : input;
        return [new HumanMessage(content)];
    }

    /**
     * 提取响应内容
     */
    private extractResponse(result: any): string {
        if (typeof result === 'string') {
            return result;
        }

        if (result && typeof result === 'object' && 'content' in result) {
            return result.content;
        }

        return String(result);
    }

    /**
     * 解析JSON字符串
     */
    private parseJSON(jsonString: string): any {
        try {
            return JSON.parse(jsonString);
        } catch {
            return null;
        }
    }

    /**
     * 调用LLM
     */
    async call(input: string | number | BaseMessage[]): Promise<CallResult> {
        const startTime = Date.now();

        try {
            const messages = this.prepareInput(input);
            const result = await this.llm.invoke(messages);
            const response = this.extractResponse(result);
            const responseTime = Date.now() - startTime;

            return {
                success: true,
                response,
                responseTime
            };

        } catch (error) {
            const responseTime = Date.now() - startTime;
            const err = error as Error;

            console.error(`LLM调用失败 (${this.config.name}):`, error);

            return {
                success: false,
                error: err,
                responseTime
            };
        }
    }

    async callJSON(
        input: string | number | BaseMessage[],
        maxRetries: number = 2
    ): Promise<JSONCallResult> {
        const startTime = Date.now();

        // 先正常调用 call 方法
        const callResult = await this.call(input);

        // 如果 call 调用失败，直接返回失败结果
        if (!callResult.success) {
            return {
                ...callResult,
                responseTime: Date.now() - startTime
            };
        }

        let response = callResult.response!;
        let jsonResult = this.parseJSON(response);

        // 如果第一次解析成功，直接返回
        if (jsonResult !== null) {
            return {
                success: true,
                response,
                json: jsonResult,
                responseTime: Date.now() - startTime
            };
        }

        // JSON 解析失败，尝试修复
        let attempts = 0;
        while (attempts < maxRetries) {
            attempts++;

            try {
                const fixPrompt = this.createJSONFixPrompt(response);
                console.log("fixJSONPrompt=", fixPrompt)
                const fixResult = await this.call(fixPrompt);

                // 如果修复调用失败，继续下一次尝试
                if (!fixResult.success) {
                    continue;
                }

                response = fixResult.response!;
                jsonResult = this.parseJSON(response);

                // 如果解析成功，返回结果
                if (jsonResult !== null) {
                    return {
                        success: true,
                        response,
                        json: jsonResult,
                        responseTime: Date.now() - startTime
                    };
                }
            } catch (error) {
                // 修复过程中的错误，继续下一次尝试
                console.warn(`JSON修复第${attempts}次尝试失败:`, error);
            }
        }

        // 所有尝试都失败，返回解析失败的结果
        return {
            success: false,
            error: new Error('无法解析为有效JSON格式'),
            response,
            responseTime: Date.now() - startTime
        };
    }

    /**
     * 创建JSON修复提示词
     */
    private createJSONFixPrompt(invalidResponse: string): string {
        const formatInstructions = this.jsonParser.getFormatInstructions();

        const template = `
以下内容是JSON格式，但因为语法错误，解析失败了：

<%= invalidResponse %>

<%= formatInstructions %>

请修复并返回正确的JSON：
        `.trim();

        return render(template, { invalidResponse, formatInstructions });
    }

    /**
     * 流式调用LLM
     */
    async callStream(
        input: string | number | BaseMessage[],
        onChunk: (chunk: string) => void
    ): Promise<CallResult> {
        const startTime = Date.now();

        try {
            const messages = this.prepareInput(input);
            let fullResponse = '';

            const stream = await this.llm.stream(messages);

            for await (const chunk of stream) {
                const chunkContent = this.extractResponse(chunk);
                fullResponse += chunkContent;
                onChunk(chunkContent);
            }

            const responseTime = Date.now() - startTime;

            return {
                success: true,
                response: fullResponse,
                responseTime
            };

        } catch (error) {
            const responseTime = Date.now() - startTime;
            const err = error as Error;

            console.error(`LLM流式调用失败 (${this.config.name}):`, error);

            return {
                success: false,
                error: err,
                responseTime
            };
        }
    }

    /**
     * 获取配置信息
     */
    getConfig(): LLMConfig {
        return { ...this.config };
    }

    /**
     * 获取当前选项
     */
    getOptions() {
        return { ...this.options };
    }
}