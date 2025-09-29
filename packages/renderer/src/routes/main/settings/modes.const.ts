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
    "DeepSeek": { showName: "DeepSeek官方", model: "deepseek-chat", category: "llm", needsApiKey: true },
    "QianWen": { showName: "通义千问", model: "qwen-flash", category: "llm", needsApiKey: true },
    "Zhipu": { showName: "智谱", model: "glm-4.5v", category: "llm", needsApiKey: true },
    "Moonshot": { showName: "月之暗面", model: "moonshot-v1-auto", category: "llm", needsApiKey: true },
    "OpenRouter": { model: "qwen/qwen3-coder:free", category: "llm", needsApiKey: true },

    // next may not work!
    // "Baichuan": { showName: "百川", model: "baichuan4-turbo", category: "llm", needsApiKey: true },
    "OpenAI": { model: "gpt-4o", category: "llm", needsApiKey: true },
    "Groq": { model: "llama-3.1-8b-instant", category: "llm", needsApiKey: true },
};

export const languages = [
    { code: "zh-CN", name: "简体中文" },
    { code: "en-US", name: "English" },
    { code: "ja-JP", name: "日本語" },
];