<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { initLib } from "$lib/index";
  import { ModeWatcher, setMode } from "mode-watcher";

  let { children } = $props();

  onMount(async () => {
    const mode =
      localStorage.getItem("mode-watcher-mode") === "dark" ? "dark" : "light";
    console.log("mode=", mode);
    setMode(mode);
    // 调试：检查 DaisyUI 是否加载
    console.log(
      "DaisyUI CSS var:",
      getComputedStyle(document.documentElement).getPropertyValue("--b1"),
    );
    await initLib();
  });
</script>

<!-- ModeWatcher 组件 - 必须放在根级别 -->
<ModeWatcher />

<!-- 添加基础的 HTML 结构 -->

<div
  class="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300"
>
  {@render children()}
</div>

<!-- 或者更完整的结构 -->
<!-- 
<div class="drawer lg:drawer-open">
  <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />
  
  <div class="drawer-content flex flex-col">
    {@render children()}
  </div>
</div>
-->
