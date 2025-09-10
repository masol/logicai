// postcss.config.ts
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss'

export default {
  plugins: [
    tailwindcss(),
    autoprefixer(),
    // 在这里添加其他 PostCSS 插件
  ],
};