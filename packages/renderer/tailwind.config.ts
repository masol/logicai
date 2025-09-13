import type { Config } from "tailwindcss";

import daisyui from "daisyui";
import typography from "@tailwindcss/typography";
import forms from "@tailwindcss/forms";
import aspectRatio from "@tailwindcss/aspect-ratio";
import containerQueries from "@tailwindcss/container-queries";
import animatedPlugin from "tailwindcss-animated";




export default {
  // darkMode: "class",
  content: [
    "./src/**/*.{html,js,svelte,ts}",
  ],
  theme: {
    extend: {
      padding: {
        "-4": "-1rem", // 添加负值内边距
      },
      zIndex: {
        "1000": "1000", // 添加自定义的 z-index
      },
      maxHeight: {
        // 添加一个自定义的工具类名，比如 '2/3screen'
        gratio: "61.8vh",
      },
      // 添加自定义动画配置
      animation: {
        "fade-up": "fade-up 0.5s ease-out",
        "fade-down": "fade-down 0.5s ease-out",
        "slide-in": "slide-in 0.5s ease-out",
        "slide-out": "slide-out 0.5s ease-out",
      },
      keyframes: {
        "fade-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-down": {
          "0%": {
            opacity: "0",
            transform: "translateY(-20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-in": {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(0)",
          },
        },
        "slide-out": {
          "0%": {
            transform: "translateX(0)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
      },
    },
  },
  plugins: [
    daisyui,
    typography,
    forms,
    aspectRatio,
    containerQueries,
    animatedPlugin,
  ],
  daisyui: {
    themes: [
      "cupcake",
      "dim"
    ],    //设置为true,以包含全部主题。目前只包含了两个选择的。
    base: true,
    styled: true,
    utils: true,
    logs: true,
    // 设置默认主题
    defaultTheme: "cupcake",
    darkTheme: "dim",
  },
} as Config;
