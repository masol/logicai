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
    "deepseek-chat": { provider: "DeepSeek", category: "llm", needsApiKey: true },
    "groq:groq/compound": { provider: "Groq", category: "llm", needsApiKey: true },
    "groq:llama-3.1-8b-instant": { provider: "Groq", category: "llm", needsApiKey: true },
    "groq:openai/gpt-oss-120b": { provider: "Groq", category: "llm", needsApiKey: true }
    // "GPT-4o": { provider: "OpenAI", category: "llm", needsApiKey: true },
    // "GPT-4o mini": { provider: "OpenAI", category: "llm", needsApiKey: true },
    // "Claude-3.5 Sonnet": {
    //     provider: "Anthropic",
    //     category: "llm",
    //     needsApiKey: true,
    // },
    // "Claude-3.5 Haiku": {
    //     provider: "Anthropic",
    //     category: "llm",
    //     needsApiKey: true,
    // },
    // "Gemini Pro": { provider: "Google", category: "llm", needsApiKey: true },
    // "DALL-E 3": { provider: "OpenAI", category: "text2img", needsApiKey: true },
    // Midjourney: {
    //     provider: "Midjourney",
    //     category: "text2img",
    //     needsApiKey: true,
    // },
    // "Stable Diffusion": {
    //     provider: "Stability AI",
    //     category: "text2img",
    //     needsApiKey: true,
    // },
    // "Stable Video": {
    //     provider: "Stability AI",
    //     category: "text2video",
    //     needsApiKey: true,
    // },
};


export const languages = [
    { code: "zh-CN", name: "简体中文" },
    { code: "en-US", name: "English" },
    { code: "ja-JP", name: "日本語" },
];