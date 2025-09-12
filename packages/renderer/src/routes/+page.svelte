<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import { rpc } from "@app/preload";
  import { eventBus } from "$lib/utils/evtbus";
  import IconSpinner from "~icons/lucide/loader-2";
  import IconCheck from "~icons/lucide/check-circle";

  let hasNavigated = $state<boolean>(false);
  let showSuccess = $state<boolean>(false);
  let inited = $state<boolean>(false);

  async function handleInitComplete() {
    hasNavigated = true;
    showSuccess = true;

    // 显示成功状态一段时间再跳转
    await new Promise((resolve) => setTimeout(resolve, 800));

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

<div class="min-h-screen flex items-center justify-center bg-base-100">
  <div class="flex flex-col items-center gap-6 p-8">
    {#if !showSuccess}
      <!-- 加载状态 -->
      <div class="relative">
        <IconSpinner class="w-16 h-16 text-primary animate-spin" />
        <div
          class="absolute inset-0 w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse"
        ></div>
      </div>

      <div class="flex flex-col items-center gap-2">
        <div class="text-xl font-medium text-base-content animate-pulse">
          初始化系统中
        </div>
        <div class="flex gap-1">
          <div
            class="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"
          ></div>
          <div
            class="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"
          ></div>
          <div class="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>

      <progress class="progress progress-primary w-64 animate-pulse"></progress>
    {:else}
      <!-- 成功状态 -->
      <div class="relative">
        <div
          class="w-16 h-16 bg-success rounded-full flex items-center justify-center animate-bounce"
        >
          <IconCheck class="w-10 h-10 text-success-content" />
        </div>
        <div
          class="absolute inset-0 w-16 h-16 border-4 border-success/30 rounded-full animate-ping"
        ></div>
      </div>

      <div class="flex flex-col items-center gap-2 animate-fade-in">
        <div class="text-xl font-medium text-success animate-pulse">
          系统初始化完成
        </div>
        <div class="text-sm text-base-content/70">正在跳转到指挥中心...</div>
      </div>

      <progress class="progress progress-success w-64" value="100" max="100"
      ></progress>
    {/if}
  </div>
</div>

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }
</style>
