import { defineConfig } from "vite";
// import { svelte } from "@sveltejs/vite-plugin-svelte";
import { sveltekit } from "@sveltejs/kit/vite";
import Icons from "unplugin-icons/vite";
import { FileSystemIconLoader } from "unplugin-icons/loaders";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    sveltekit(),
    Icons({
      compiler: "svelte",
      autoInstall: true,
      customCollections: {
        // 'my-icons' 是你自定义图标集合的名称
        "fs-icons": FileSystemIconLoader("./assets/icons", (svg) =>
          svg.replace(/^<svg /, '<svg fill="currentColor" ')
        ),
      },
    }),
  ],
  server: {
    proxy: {
      '^/(.*).html': {
        target: 'http://localhost:5173',
        rewrite: (path) => path.replace(/\.html$/, '')
      }
    }
  },
  build: {
    emptyOutDir: true,
    target: "esnext",
    rollupOptions: {
      external: ["electron"],
    },
  },
  optimizeDeps: {
    exclude: ['electron']
  },
  resolve: {
    alias: {
      // 使用别名来管理路径
      "$assets": path.resolve("./src/assets"),
    },
  },
});
