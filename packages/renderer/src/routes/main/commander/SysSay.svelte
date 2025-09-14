<!-- SysSay.svelte -->
<script lang="ts">
  import { fade, scale } from "svelte/transition";

  interface Props {
    content: string;
    timestamp?: number;
  }

  let { content, timestamp }: Props = $props();

  let visible = $state(false);

  $effect(() => {
    visible = true;
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
    in:scale={{ duration: 300, start: 0.9 }}
    out:fade={{ duration: 200 }}
    class="group flex justify-center"
  >
    <div class="flex flex-col items-center space-y-1">
      <div
        class="rounded-full bg-muted/60 px-4 py-2 backdrop-blur-sm transition-all duration-200 group-hover:bg-muted/80"
      >
        <p class="text-xs text-muted-foreground">{content}</p>
      </div>

      {#if timestamp}
        <span
          class="text-xs text-muted-foreground/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          {formatTime(timestamp)}
        </span>
      {/if}
    </div>
  </div>
{/if}
