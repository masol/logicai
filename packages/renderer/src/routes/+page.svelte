<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import { rpc } from "@app/preload";
  import { eventBus } from "$lib/utils/evtbus";
  import IconSpinner from "~icons/lucide/loader-2";
  import IconCheck from "~icons/lucide/check-circle";
  import IconAlertTriangle from "~icons/lucide/alert-triangle";
  import { tweened } from "svelte/motion";
  import { fade, scale } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  let hasNavigated = $state<boolean>(false);
  let showSuccess = $state<boolean>(false);
  let showError = $state<boolean>(false);
  let inited = $state<boolean>(false);
  let isDestroyed = $state<boolean>(false);
  let retryCount = $state<number>(0);
  let errorMessage = $state<string>("");

  const MAX_RETRY = 3;
  const RETRY_DELAY = 1000;

  const progress = tweened(0, {
    duration: 800,
    easing: cubicOut,
  });

  async function navigateWithRetry(
    url: string,
    attempt: number = 0,
  ): Promise<boolean> {
    if (isDestroyed) return false;

    try {
      await goto(url, { replaceState: true, invalidateAll: false });
      return true;
    } catch (error) {
      console.error(`Navigation attempt ${attempt + 1} failed:`, error);

      if (attempt < MAX_RETRY - 1 && !isDestroyed) {
        // 显示重试状态
        showError = true;
        errorMessage = `导航失败，正在重试... (${attempt + 2}/${MAX_RETRY})`;

        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * (attempt + 1)),
        );

        if (!isDestroyed) {
          showError = false;
          return navigateWithRetry(url, attempt + 1);
        }
      }
      return false;
    }
  }

  async function handleInitComplete() {
    if (hasNavigated || isDestroyed) return;

    hasNavigated = true;
    showSuccess = true;
    showError = false;

    try {
      await progress.set(100);

      // 显示成功状态一段时间再跳转
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (isDestroyed) return;

      console.log("System initialized, navigating to commander!");

      const navigationSuccess = await navigateWithRetry("/main/commander");

      if (!navigationSuccess && !isDestroyed) {
        // 最终导航失败，显示错误状态
        showSuccess = false;
        showError = true;
        errorMessage = "导航失败，请手动刷新页面或稍后重试";
        retryCount = MAX_RETRY;

        // 5秒后尝试重新加载页面
        setTimeout(() => {
          if (!isDestroyed) {
            window.location.href = "/main/commander";
          }
        }, 5000);
      }
    } catch (error) {
      console.error("Init complete error:", error);
      if (!isDestroyed) {
        showSuccess = false;
        showError = true;
        errorMessage = "初始化过程出现错误";
        hasNavigated = false;
        await progress.set(60);
      }
    }
  }

  async function handleRetryClick() {
    if (isDestroyed) return;

    showError = false;
    retryCount = 0;
    hasNavigated = false;
    showSuccess = false;

    await progress.set(60);
    await handleInitComplete();
  }

  let eventHandler: (() => void) | null = null;

  onMount(async () => {
    console.log("got main/commander!!");

    try {
      inited = (await rpc.sys.get("inited")) as boolean;

      if (inited && !isDestroyed) {
        await handleInitComplete();
      } else if (!isDestroyed) {
        await progress.set(60);

        eventHandler = () => {
          if (isDestroyed || hasNavigated) return;

          inited = true;
          handleInitComplete();
          cleanupEventHandler();
        };

        eventBus.on("inited", eventHandler);
      }
    } catch (error) {
      console.error("Initialization error:", error);
      if (!isDestroyed) {
        showError = true;
        errorMessage = "系统初始化失败，请刷新页面重试";
      }
    }
  });

  function cleanupEventHandler() {
    if (eventHandler) {
      eventBus.off("inited", eventHandler);
      eventHandler = null;
    }
  }

  onDestroy(() => {
    isDestroyed = true;
    cleanupEventHandler();
  });
</script>

<div
  class="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-200 to-base-300 dark:from-base-300 dark:to-base-100"
>
  <div
    class="flex flex-col items-center gap-8 p-8 bg-base-100 dark:bg-base-200 rounded-2xl shadow-2xl border border-base-300 dark:border-base-content/10 max-w-md w-full mx-4"
  >
    {#if showError}
      <!-- 错误状态 -->
      <div class="relative" in:scale={{ duration: 300, easing: cubicOut }}>
        <div class="relative">
          <div
            class="w-20 h-20 bg-error rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-error/30"
          >
            <IconAlertTriangle class="w-12 h-12 text-error-content" />
          </div>
          <div
            class="absolute inset-0 w-20 h-20 border-4 border-error/30 dark:border-error/40 rounded-full animate-ping"
          ></div>
        </div>
      </div>

      <div
        class="flex flex-col items-center gap-4 text-center"
        in:fade={{ duration: 400, delay: 200 }}
      >
        <div class="text-xl font-semibold text-error">系统错误</div>
        <div
          class="text-sm text-base-content/70 dark:text-base-content/60 max-w-xs"
        >
          {errorMessage}
        </div>

        {#if retryCount < MAX_RETRY}
          <button
            class="btn btn-primary btn-sm mt-2 animate-bounce"
            onclick={handleRetryClick}
            type="button"
          >
            重试
          </button>
        {:else}
          <div class="text-xs text-base-content/50 dark:text-base-content/40">
            5秒后将尝试自动跳转...
          </div>
        {/if}
      </div>
    {:else if !showSuccess}
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
            class="w-3 h-3 bg-primary rounded-full animate-bounce"
            style="animation-delay: -0.3s"
          ></div>
          <div
            class="w-3 h-3 bg-primary rounded-full animate-bounce"
            style="animation-delay: -0.15s"
          ></div>
          <div class="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
        </div>
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
    {/if}

    <!-- 进度条 -->
    <div
      class="w-80 bg-base-200 dark:bg-base-300 rounded-full h-3 overflow-hidden"
    >
      <div
        class="h-full rounded-full shadow-sm transition-all duration-500 ease-out"
        class:bg-gradient-to-r={!showError}
        class:from-primary={!showError && !showSuccess}
        class:to-secondary={!showError && !showSuccess}
        class:from-success={!showError && showSuccess}
        class:to-success={!showError && showSuccess}
        class:bg-error={showError}
        class:animate-pulse={!showError}
        style="width: {$progress}%"
      ></div>
    </div>
  </div>
</div>
