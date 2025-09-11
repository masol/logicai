import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  kit: {
    // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://svelte.dev/docs/kit/adapters for more information about adapters.
    adapter: adapter({
      // default options are shown. On some platforms
      // these options are set automatically — see below
      pages: "dist",
      assets: "dist",
      fallback: undefined,
      precompress: true,
      strict: true,
      extensions: [".html"], // 指定输出文件的扩展名为.html
    }),
    prerender: {
      entries: ["*"], // 预渲染所有路由
      handleMissingId: "ignore", // 404处理
    },
    alias: {
      '@api': '../main/src/api'
    }
  },
  extensions: ['.svelte', '.svx'],
};
