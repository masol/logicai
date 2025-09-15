<!-- AISay.svelte -->
<script lang="ts">
  import { fade, slide } from "svelte/transition";
  import { spring } from "svelte/motion";
  import SvelteMarkdown from "svelte-exmarkdown";
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

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return "🖼️";
    if (type.includes("video")) return "🎥";
    if (type.includes("audio")) return "🎵";
    if (type.includes("pdf")) return "📄";
    return "📎";
  };
</script>

{#if visible}
  <div
    in:slide={{ duration: 400, delay: 100 }}
    out:fade={{ duration: 200 }}
    style="transform: scale({$scale})"
    class="group relative"
  >
    <div class="flex items-start justify-start">
      <!-- 消息内容 -->
      <div class="flex flex-col space-y-3 max-w-4xl">
        <div
          class="rounded-2xl rounded-tl-sm bg-blue-800 dark:bg-blue-900 px-4 py-3 shadow-lg transition-all duration-200 group-hover:shadow-xl group-hover:bg-blue-700 dark:group-hover:bg-blue-800"
        >
          <div
            class="prose prose-sm max-w-none text-blue-50 dark:text-blue-100 prose-headings:text-blue-100 prose-strong:text-blue-100 prose-code:text-blue-200 prose-pre:bg-blue-900 prose-pre:text-blue-100"
          >
            <SvelteMarkdown md={content.content} />
          </div>
        </div>

        {#if content.files && content.files.length > 0}
          <div class="flex flex-col space-y-2 ml-4">
            {#each content.files as file, i}
              <div
                in:slide={{ duration: 300, delay: 150 + i * 50 }}
                class="flex items-center space-x-3 rounded-lg bg-blue-100 dark:bg-blue-800/30 px-3 py-2 transition-all duration-200 hover:bg-blue-200 dark:hover:bg-blue-700/40"
              >
                <span class="text-lg">{getFileIcon(file.type)}</span>
                <div class="flex-1 min-w-0">
                  <p
                    class="text-sm font-medium text-blue-900 dark:text-blue-100 truncate"
                  >
                    {file.filename}
                  </p>
                  {#if file.desc}
                    <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {file.desc}
                    </p>
                  {/if}
                </div>
                <span
                  class="text-xs text-blue-600 dark:text-blue-400 bg-blue-200 dark:bg-blue-700 px-2 py-1 rounded"
                >
                  {file.type.split("/")[0]}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
