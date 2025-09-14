<!-- AISay.svelte -->
<script lang="ts">
  import { fade, slide } from "svelte/transition";
  import { spring } from "svelte/motion";

  interface Props {
    content: string;
    timestamp?: number;
  }

  let { content, timestamp }: Props = $props();

  let visible = $state(false);
  let scale = spring(0.8);

  $effect(() => {
    visible = true;
    scale.set(1);
  });

  const formatTime = (ts?: number) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
</script>

{#if visible}
  <div
    in:slide={{ duration: 400, delay: 100 }}
    out:fade={{ duration: 200 }}
    style="transform: scale({$scale})"
    class="group relative"
  >
    <div class="flex items-start space-x-3">
      <!-- AI头像 -->
      <div
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        <span class="text-sm font-medium">AI</span>
      </div>

      <!-- 消息内容 -->
      <div class="flex flex-col space-y-1">
        <div
          class="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 shadow-sm transition-all duration-200 group-hover:shadow-md"
        >
          <p class="text-sm leading-relaxed text-foreground">{content}</p>
        </div>

        {#if timestamp}
          <span
            class="text-xs text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            {formatTime(timestamp)}
          </span>
        {/if}
      </div>
    </div>
  </div>
{/if}
