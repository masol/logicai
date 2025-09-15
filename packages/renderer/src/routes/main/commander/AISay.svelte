<!-- AISay.svelte -->
<script lang="ts">
  import { fade, slide } from "svelte/transition";
  import { spring, tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { type MessageContent } from "$lib/stores/chatStore";
  import Markdown from "svelte-exmarkdown";
  import IconMdiFile from "~icons/mdi/file";
  import IconMdiChevronDown from "~icons/mdi/chevron-down";
  import IconMdiChevronUp from "~icons/mdi/chevron-up";
  import IconMdiBrain from "~icons/mdi/brain";
  import IconMdiLoading from "~icons/mdi/loading";

  interface Props {
    content: MessageContent;
  }

  let { content }: Props = $props();

  let visible = $state(false);
  let scale = spring(0.8);
  let progressExpanded = $state(false);

  // 思考动画相关
  let thinkingRotation = tweened(0, { duration: 1000, easing: cubicOut });
  let typingProgress = tweened(0, { duration: 200 });

  // 检测是否正在思考
  let isThinking = $derived(!!content.progressId);

  // 反转思考步骤，最新的在上方
  let reversedProgressCtx = $derived(
    content.progressCtx ? [...content.progressCtx].reverse() : [],
  );

  $effect(() => {
    visible = true;
    scale.set(1);
  });

  // 思考动画效果
  $effect(() => {
    if (isThinking) {
      // 持续旋转动画
      const rotateAnimation = () => {
        thinkingRotation.set(360).then(() => {
          thinkingRotation.set(0, { duration: 0 });
          if (isThinking) rotateAnimation();
        });
      };
      rotateAnimation();

      // 自动展开思考过程
      progressExpanded = true;
    }
  });

  // 打字机效果
  $effect(() => {
    if (content.progressCtx && content.progressCtx.length > 0) {
      typingProgress.set(content.progressCtx.length);
    }
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return "🖼️";
    if (type.startsWith("audio/")) return "🎵";
    if (type.startsWith("video/")) return "🎥";
    if (type.includes("pdf")) return "📄";
    return "📁";
  };
</script>

{#if visible}
  <div
    in:slide={{ duration: 400, delay: 100 }}
    out:fade={{ duration: 200 }}
    style="transform: scale({$scale})"
    class="group relative w-full"
  >
    <div class="flex flex-col space-y-3">
      <!-- 主要内容 -->
      <div
        class="rounded-2xl bg-muted/50 px-6 py-4 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-muted/70 border border-border/50"
      >
        <div class="prose prose-sm dark:prose-invert max-w-none">
          <Markdown md={content.content} />
        </div>
      </div>

      <!-- 文件显示 -->
      {#if content.files && content.files.length > 0}
        <div in:slide={{ duration: 300 }} class="flex flex-wrap gap-2 px-2">
          {#each content.files as file}
            <div
              class="flex items-center space-x-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs border border-border/30 hover:bg-secondary/80 transition-colors duration-200"
            >
              <span class="text-base">{getFileIcon(file.type)}</span>
              <div class="flex flex-col">
                <span class="font-medium text-foreground">{file.filename}</span>
                {#if file.desc}
                  <span class="text-muted-foreground text-xs">{file.desc}</span>
                {/if}
              </div>
              <IconMdiFile class="h-3 w-3 text-muted-foreground" />
            </div>
          {/each}
        </div>
      {/if}

      <!-- AI思考进度 -->
      {#if content.progressId && content.progressCtx && content.progressCtx.length > 0}
        <div
          in:slide={{ duration: 400, delay: 200 }}
          class="border border-primary/20 rounded-xl bg-primary/5 overflow-hidden {isThinking
            ? 'shadow-lg shadow-primary/20'
            : ''}"
        >
          <!-- 思考进度标题栏 -->
          <button
            onclick={() => (progressExpanded = !progressExpanded)}
            onkeydown={(e) =>
              e.key === "Enter" && (progressExpanded = !progressExpanded)}
            class="w-full flex items-center justify-between px-4 py-3 bg-primary/10 hover:bg-primary/15 transition-all duration-200 {isThinking
              ? 'bg-gradient-to-r from-primary/15 to-primary/10'
              : ''}"
          >
            <div class="flex items-center space-x-2">
              {#if isThinking}
                <!-- 思考中的旋转图标 -->
                <div
                  style="transform: rotate({$thinkingRotation}deg)"
                  class="relative"
                >
                  <IconMdiLoading class="h-4 w-4 text-primary" />
                  <div class="absolute inset-0 animate-ping">
                    <IconMdiBrain class="h-4 w-4 text-primary/30" />
                  </div>
                </div>
                <span class="text-sm font-medium text-primary animate-pulse">
                  AI正在思考中...
                </span>
              {:else}
                <IconMdiBrain class="h-4 w-4 text-primary" />
                <span class="text-sm font-medium text-primary">AI思考过程</span>
              {/if}
              <span
                class="text-xs text-muted-foreground {isThinking
                  ? 'animate-pulse'
                  : ''}">({content.progressCtx.length} 步骤)</span
              >
            </div>
            {#if progressExpanded}
              <IconMdiChevronUp
                class="h-4 w-4 text-primary transition-transform duration-200"
              />
            {:else}
              <IconMdiChevronDown
                class="h-4 w-4 text-primary transition-transform duration-200"
              />
            {/if}
          </button>

          <!-- 思考进度内容 -->
          {#if progressExpanded}
            <div
              in:slide={{ duration: 300 }}
              out:slide={{ duration: 200 }}
              class="px-4 pb-4 space-y-3"
            >
              {#if isThinking}
                <!-- 思考中的提示（置顶显示） -->
                <div
                  class="flex items-center justify-center py-3 border-b border-primary/20"
                >
                  <div class="flex items-center space-x-3">
                    <div class="flex space-x-1">
                      <div
                        class="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                      ></div>
                      <div
                        class="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                        style="animation-delay: 0.1s"
                      ></div>
                      <div
                        class="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                        style="animation-delay: 0.2s"
                      ></div>
                    </div>
                    <span class="text-xs text-primary/80 animate-pulse"
                      >正在思考...</span
                    >
                  </div>
                </div>
              {/if}

              <!-- 思考步骤（最新的在上方，反转显示） -->
              {#each reversedProgressCtx as step, reverseIndex}
                {@const originalIndex =
                  content.progressCtx.length - 1 - reverseIndex}
                {@const isLatest = reverseIndex === 0}
                <div
                  in:slide={{ duration: 200, delay: reverseIndex * 30 }}
                  class="rounded-lg bg-background/50 p-3 border border-border/30 {isThinking &&
                  isLatest
                    ? 'border-primary/40 bg-primary/5 relative overflow-hidden animate-pulse'
                    : ''}"
                >
                  {#if isThinking && isLatest}
                    <!-- 最新步骤的闪烁效果 -->
                    <div
                      class="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-pulse"
                    ></div>
                    <div
                      class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30 animate-pulse"
                    ></div>
                  {/if}
                  <div class="flex items-start space-x-2 relative z-10">
                    <div
                      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold {isThinking &&
                      isLatest
                        ? 'bg-primary/40 text-primary animate-pulse'
                        : 'bg-primary/20 text-primary'}"
                    >
                      {#if isThinking && isLatest}
                        <!-- 最新步骤显示脉冲点 -->
                        <div
                          class="w-3 h-3 bg-primary rounded-full animate-ping relative"
                        >
                          <div
                            class="absolute inset-0 w-3 h-3 bg-primary rounded-full animate-pulse"
                          ></div>
                        </div>
                      {:else}
                        {originalIndex + 1}
                      {/if}
                    </div>
                    <div
                      class="prose prose-xs dark:prose-invert max-w-none flex-1 {isThinking &&
                      isLatest
                        ? 'animate-pulse'
                        : ''}"
                    >
                      <Markdown md={step} />
                      {#if isThinking && isLatest}
                        <!-- 打字机光标效果 -->
                        <span
                          class="inline-block w-1 h-4 bg-primary ml-1 animate-pulse"
                        ></span>
                      {/if}
                    </div>
                  </div>

                  {#if isThinking && isLatest}
                    <!-- 最新步骤的时间戳闪烁 -->
                    <div class="absolute top-2 right-2">
                      <div
                        class="w-2 h-2 bg-primary/60 rounded-full animate-ping"
                      ></div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  :global(.prose) {
    color: hsl(var(--foreground));
  }

  :global(.prose p) {
    margin: 0.5em 0;
  }

  :global(.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6) {
    margin: 0.8em 0 0.4em 0;
    color: hsl(var(--foreground));
  }

  :global(.prose code) {
    background: hsl(var(--muted));
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875em;
  }

  :global(.prose pre) {
    background: hsl(var(--muted));
    border: 1px solid hsl(var(--border));
    border-radius: 0.5rem;
    padding: 1rem;
    overflow-x: auto;
  }

  :global(.prose blockquote) {
    border-left: 4px solid hsl(var(--primary));
    padding-left: 1rem;
    margin: 1rem 0;
    font-style: italic;
    color: hsl(var(--muted-foreground));
  }

  @keyframes bounce {
    0%,
    80%,
    100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }
</style>
