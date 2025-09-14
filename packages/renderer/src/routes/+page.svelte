<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import { rpc } from "@app/preload";
  import { eventBus } from "$lib/utils/evtbus";
  import IconSpinner from "~icons/lucide/loader-2";
  import IconCheck from "~icons/lucide/check-circle";
  import { tweened } from "svelte/motion";
  import { fade, scale } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  let hasNavigated = $state<boolean>(false);
  let showSuccess = $state<boolean>(false);
  let inited = $state<boolean>(false);

  const progress = tweened(0, {
    duration: 800,
    easing: cubicOut,
  });

  async function handleInitComplete() {
    hasNavigated = true;
    showSuccess = true;
    progress.set(100);

    // 显示成功状态一段时间再跳转
    await new Promise((resolve) => setTimeout(resolve, 90));

    console.log("System initialized, navigating to commander!");
    goto("/main/commander");
  }

  let eventHandler: (() => void) | null = null;
  onMount(async () => {
    console.log("got main/commander!!");

    inited = (await rpc.sys.get("inited")) as boolean;

    if (inited) {
      handleInitComplete();
    } else {
      // 启动进度动画
      progress.set(60);

      eventHandler = () => {
        inited = true;
        handleInitComplete();

        // 状态已设置为 true 后，移除监听器
        if (eventHandler) {
          eventBus.off("inited", eventHandler);
          eventHandler = null;
        }
      };
      // 监听事件总线
      eventBus.on("inited", eventHandler);
    }
  });

  function cleanupEventHandler() {
    if (eventHandler) {
      eventBus.off("inited", eventHandler);
      eventHandler = null;
    }
  }

  onDestroy(() => {
    cleanupEventHandler();
  });
</script>

<div
  class="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-200 to-base-300 dark:from-base-300 dark:to-base-100"
>
  <div
    class="flex flex-col items-center gap-8 p-8 bg-base-100 dark:bg-base-200 rounded-2xl shadow-2xl border border-base-300 dark:border-base-content/10"
  >
    {#if !showSuccess}
      <!-- 加载状态 -->
      <div class="relative" in:scale={{ duration: 300, easing: cubicOut }}>
        <div class="relative w-20 h-20 flex items-center justify-center">
          <IconSpinner class="w-16 h-16 text-primary animate-spin" />
          <div
            class="absolute inset-2 border-4 border-primary/20 dark:border-primary/30 rounded-full animate-pulse"
          ></div>
          <div
            class="absolute inset-0 border-2 border-primary/10 dark:border-primary/20 rounded-full animate-ping"
          ></div>
        </div>
      </div>

      <div
        class="flex flex-col items-center gap-4"
        in:fade={{ duration: 400, delay: 200 }}
      >
        <div class="text-2xl font-semibold text-base-content animate-pulse">
          初始化系统中
        </div>
        <div class="flex gap-1">
          <div
            class="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"
          ></div>
          <div
            class="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"
          ></div>
          <div class="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>

      <div
        class="w-80 bg-base-200 dark:bg-base-300 rounded-full h-3 overflow-hidden"
      >
        <div
          class="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500 ease-out animate-pulse"
          style="width: {$progress}%"
        ></div>
      </div>
    {:else}
      <!-- 成功状态 -->
      <div class="relative" in:scale={{ duration: 500, easing: cubicOut }}>
        <div class="relative">
          <div
            class="w-20 h-20 bg-success rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-success/30"
          >
            <IconCheck class="w-12 h-12 text-success-content" />
          </div>
          <div
            class="absolute inset-0 w-20 h-20 border-4 border-success/30 dark:border-success/40 rounded-full animate-ping"
          ></div>
          <div
            class="absolute -inset-2 w-24 h-24 border-2 border-success/20 dark:border-success/30 rounded-full animate-pulse"
          ></div>
        </div>
      </div>

      <div
        class="flex flex-col items-center gap-3"
        in:fade={{ duration: 500, delay: 200 }}
      >
        <div class="text-2xl font-semibold text-success animate-pulse">
          系统初始化完成
        </div>
        <div class="text-base text-base-content/70 dark:text-base-content/60">
          正在跳转到指挥中心...
        </div>
      </div>

      <div
        class="w-80 bg-base-200 dark:bg-base-300 rounded-full h-3 overflow-hidden"
      >
        <div
          class="h-full bg-gradient-to-r from-success to-success/80 rounded-full shadow-sm"
          style="width: {$progress}%"
        ></div>
      </div>
    {/if}
  </div>
</div>
