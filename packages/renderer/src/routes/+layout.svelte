<script lang="ts">
  import "../app.css";
  import { theme } from "$lib/stores/theme";
  import { onMount } from "svelte";
  import { initLib } from "$lib/index";

  let { children } = $props();

  onMount(async () => {
    document.documentElement.setAttribute("data-theme", $theme);
    await initLib();

    // 调试：检查 DaisyUI 是否加载
    console.log("Theme set to:", $theme);
    console.log(
      "DaisyUI CSS var:",
      getComputedStyle(document.documentElement).getPropertyValue("--b1"),
    );
  });
</script>

<!-- 添加基础的 HTML 结构 -->
<div class="min-h-screen">
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
