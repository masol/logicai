<script lang="ts">
  import { JSONEditor } from "svelte-jsoneditor";
  import { onMount } from "svelte";
  import {rpc} from "@app/preload"

  let content = $state({ json: {} });
  let isLoading = $state(true);

  // 模拟异步加载JSON数据
  async function loadData() {
    isLoading = true;

    const taskData = (await rpc.task.shared()) || {};

    // console.log("taskData=",taskData)

    content = { json: taskData };
    isLoading = false;
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="flex h-full w-full flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative">
  {#if isLoading}
    <div class="flex items-center justify-center h-full">
      <div class="text-center">
        <div
          class="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"
        ></div>
        <p class="text-slate-600 dark:text-slate-400">加载数据中...</p>
      </div>
    </div>
  {:else}
    <div class="w-full h-full">
      <JSONEditor
        {content}
        readOnly={true}
        mainMenuBar={true}
        navigationBar={true}
        statusBar={true}
      />
    </div>
  {/if}
</div>

<style>
  :global(.jse-theme-dark) {
    --jse-background-color: rgb(30 41 59);
    --jse-panel-background: rgb(15 23 42);
  }
</style>
