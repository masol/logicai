<!-- AISay.svelte -->
<script lang="ts">
  import { fade, slide } from "svelte/transition";
  import { spring } from "svelte/motion";
  import { Markdown } from "svelte-exmarkdown";
  import type { MessageContent } from "$lib/stores/chatStore";

  interface Props {
    content: MessageContent;
  }

  let { content }: Props = $props();

  let visible = $state(false);
  let scale = spring(0.8);

  $effect(() => {
    visible = true;
    scale.set(1);
  });

  const getModeStyles = (mode?: string) => {
    switch (mode) {
      case "warn":
        return "bg-amber-50 border-l-4 border-amber-400 text-amber-900 dark:bg-amber-950/20 dark:border-amber-600 dark:text-amber-200";
      case "info":
        return "bg-blue-50 border-l-4 border-blue-400 text-blue-900 dark:bg-blue-950/20 dark:border-blue-600 dark:text-blue-200";
      case "error":
      default:
        return "bg-red-50 border-l-4 border-red-400 text-red-900 dark:bg-red-950/20 dark:border-red-600 dark:text-red-200";
    }
  };
</script>

{#if visible}
  <div
    in:slide={{ duration: 400, delay: 100 }}
    out:fade={{ duration: 200 }}
    style="transform: scale({$scale})"
    class="group relative"
  >
    <div class="flex justify-start">
      <div
        class="max-w-4xl rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm transition-all duration-300 group-hover:shadow-lg {getModeStyles(
          content.mode,
        )}"
      >
        <div class="prose prose-sm max-w-none dark:prose-invert">
          <Markdown md={content.content} />
        </div>
      </div>
    </div>
  </div>
{/if}
