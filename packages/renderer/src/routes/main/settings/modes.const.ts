import IconText from "~icons/mdi/text-box";
import IconImage from "~icons/mdi/image";
import IconVideo from "~icons/mdi/video";
import IconAudio from "~icons/mdi/music";
// import IconTransform from "~icons/mdi/swap-horizontal";
import IconImgRecog from "~icons/mdi/image-search";
import IconASR from '~icons/mdi/microphone-settings'
import IconVCA from '~icons/mdi/video-input-component'

// 模型分类及图标
export const modelCategories = {
    llm: { name: "语言模型", icon: IconText },
    asr: { name: "语音识别", icon: IconASR },
    imgrecog: { name: "图像识别", icon: IconImgRecog },
    vca: { name: "视频分析", icon: IconVCA },
    text2img: { name: "文生图", icon: IconImage },
    text2video: { name: "视频生成", icon: IconVideo },
    text2audio: { name: "语音合成", icon: IconAudio },
    // img2img: { name: "图生图", icon: IconTransform },
    // img2video: { name: "图生视频", icon: IconVideo },
};

// 预设模型配置
export const presetModels = {
    "DeepSeek::deepseek-chat": { provider: "DeepSeek", category: "llm", needsApiKey: true },
    "Groq::llama-3.1-8b-instant": { provider: "Groq", category: "llm", needsApiKey: true },
    "Groq::openai/gpt-oss-120b": { provider: "Groq", category: "llm", needsApiKey: true },
    "OpenRouter::groq/compound": { provider: "Groq", category: "llm", needsApiKey: true },
    "OpenRouter::nvidia/nemotron-nano-9b-v2:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::deepseek/deepseek-chat-v3.1:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::openai/gpt-oss-120b:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::openai/gpt-oss-20b:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::z-ai/glm-4.5-air:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::qwen/qwen3-coder:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::moonshotai/kimi-k2:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::cognitivecomputations/dolphin-mistral-24b-venice-edition:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::google/gemma-3n-e2b-it:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::tencent/hunyuan-a13b-instruct:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::mistralai/mistral-small-3.2-24b-instruct:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::meta-llama/llama-3.3-8b-instruct:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::qwen/qwen3-4b:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::qwen/qwen3-30b-a3b:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::meta-llama/llama-4-scout:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::meta-llama/llama-4-maverick:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::mistralai/mistral-small-3.1-24b-instruct:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::google/gemma-3-4b-it:free": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::x-ai/grok-code-fast-1": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::anthropic/claude-sonnet-4": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::google/gemini-2.5-flash": { provider: "OpenRouter", category: "llm", needsApiKey: true },
    "OpenRouter::openai/gpt-4.1-mini": { provider: "OpenRouter", category: "llm", needsApiKey: true }
};

export const languages = [
    { code: "zh-CN", name: "简体中文" },
    { code: "en-US", name: "English" },
    { code: "ja-JP", name: "日本語" },
];