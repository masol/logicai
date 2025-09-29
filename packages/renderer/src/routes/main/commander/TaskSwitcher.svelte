<script lang="ts">
  import { scale, fly, fade } from "svelte/transition";
  import { quintOut, cubicOut } from "svelte/easing";
  import dayjs from "$lib/utils/dayjs";
  import { currentTaskStore } from "$lib/stores/shared.svelte";
  import { loadHistory, type AiTask } from "$lib/stores/chatStore";
  import Icon from "~icons/material-symbols/task-alt";
  import ClockIcon from "~icons/material-symbols/schedule";
  import AddIcon from "~icons/material-symbols/add";
  import SwitchIcon from "~icons/material-symbols/swap-horiz";
  import LoadingIcon from "~icons/material-symbols/refresh";
  import ChevronLeft from "~icons/material-symbols/chevron-left";
  import ChevronRight from "~icons/material-symbols/chevron-right";
  import FirstPageIcon from "~icons/material-symbols/first-page";
  import LastPageIcon from "~icons/material-symbols/last-page";
  import InfoIcon from "~icons/material-symbols/info";
  import { rpc } from "@app/preload";
  import { getLabel } from "./newTask";

  interface Props {
    open: boolean;
    onCreateTask?: () => void;
  }

  let { open = $bindable(), onCreateTask }: Props = $props();
  let tasks = $state<AiTask[]>([]);
  let isLoadingTasks = $state(false);
  let loadingTaskId = $state<string | null>(null);
  let currentPage = $state(1);
  let tasksLoadError = $state<string | null>(null);
  let contentState = $state<"loading" | "error" | "empty" | "single" | "list">(
    "loading",
  );

  const ITEMS_PER_PAGE = 5;
  const MIN_LOADING_TIME = 150;

  const totalPages = $derived(() => Math.ceil(tasks.length / ITEMS_PER_PAGE));

  $effect(() => {
    if (open) {
      currentPage = 1;
      contentState = "loading";
      loadTasks();
    }
  });

  async function loadTasks() {
    const startTime = Date.now();
    isLoadingTasks = true;
    tasksLoadError = null;

    try {
      const result = await rpc.task.get();
      tasks = result || [];

      console.log("tasks=", tasks);

      // 确保最小加载时间
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      // 确定内容状态
      if (tasks.length === 0) {
        contentState = "empty";
      } else if (tasks.length === 1) {
        contentState = "single";
      } else {
        contentState = "list";
      }
    } catch (error) {
      console.error("加载任务失败:", error);
      tasksLoadError = "加载任务失败，请稍后重试";
      tasks = [];
      contentState = "error";
    } finally {
      isLoadingTasks = false;
    }
  }

  const paginatedTasks = $derived(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return tasks.slice(startIndex, endIndex);
  });

  const visiblePages = $derived(() => {
    const delta = 2;
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages(), currentPage + delta);
    const pages: (number | "ellipsis")[] = [];

    if (left > 1) {
      pages.push(1);
      if (left > 2) {
        pages.push("ellipsis");
      }
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < totalPages()) {
      if (right < totalPages() - 1) {
        pages.push("ellipsis");
      }
      pages.push(totalPages());
    }

    return pages;
  });

  function getTaskCardClass(taskId: string) {
    const isCurrentTask = taskId === currentTaskStore.value?.id;
    const isLoading = loadingTaskId === taskId;
    return `group relative p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${
      isCurrentTask
        ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-900 dark:bg-opacity-20 dark:border-emerald-600"
        : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-primary hover:border-opacity-50"
    } ${isLoading ? "opacity-50" : ""}`;
  }

  function getTitleClass(taskId: string) {
    const isCurrentTask = taskId === currentTaskStore.value?.id;
    return `font-semibold mb-2 line-clamp-2 transition-colors duration-200 ${
      isCurrentTask
        ? "text-emerald-800 dark:text-emerald-200 group-hover:text-emerald-900 dark:group-hover:text-emerald-100"
        : "text-gray-900 dark:text-white group-hover:text-primary"
    }`;
  }

  function getButtonClass(taskId: string) {
    const isLoading = loadingTaskId === taskId;
    if (isLoading) {
      return "flex items-center gap-2 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all duration-200 cursor-not-allowed";
    }
    return "flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium transition-all duration-200 hover:bg-opacity-90 hover:scale-105 hover:shadow-lg active:scale-95";
  }

  async function handleSwitch(task: AiTask) {
    if (task.id === currentTaskStore.value?.id) return;

    try {
      await rpc.task.active(task.id);
      await loadHistory();
      currentTaskStore.set(task);
      open = false;
    } catch (error) {
      console.error("切换任务失败:", error);
    } finally {
      loadingTaskId = null;
    }
  }

  function handleKeydown(event: KeyboardEvent, task: AiTask) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSwitch(task);
    }
  }

  function handleClose() {
    if (loadingTaskId || isLoadingTasks) return;
    open = false;
  }

  function handleCreateTask() {
    if (onCreateTask) {
      onCreateTask();
    }
    open = false;
  }

  function goToPage(page: number) {
    if (
      page >= 1 &&
      page <= totalPages() &&
      !loadingTaskId &&
      !isLoadingTasks
    ) {
      currentPage = page;
    }
  }

  function goToFirstPage() {
    goToPage(1);
  }

  function goToLastPage() {
    goToPage(totalPages());
  }

  function nextPage() {
    if (currentPage < totalPages() && !loadingTaskId && !isLoadingTasks) {
      currentPage++;
    }
  }

  function prevPage() {
    if (currentPage > 1 && !loadingTaskId && !isLoadingTasks) {
      currentPage--;
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 p-4"
    transition:fly={{ y: 50, duration: 300, easing: quintOut }}
  >
    <div
      class="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 backdrop-blur-sm"
      onclick={handleClose}
      role="button"
      tabindex="-1"
      onkeydown={(e) => e.key === "Escape" && handleClose()}
    ></div>

    <div
      class="relative mx-auto my-8 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 min-h-fit max-h-[calc(100vh-4rem)] flex flex-col"
      transition:scale={{ duration: 300, easing: quintOut }}
    >
      <!-- 头部 -->
      <div
        class="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="p-2 bg-primary bg-opacity-10 dark:bg-primary dark:bg-opacity-20 rounded-xl"
            >
              <Icon class="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                选择任务
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                切换到其他任务继续工作
              </p>
            </div>
          </div>
          {#if contentState === "list"}
            <div class="text-sm text-gray-500 dark:text-gray-400">
              共 {tasks.length} 个任务
            </div>
          {/if}
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="flex-1 overflow-hidden flex flex-col min-h-0">
        {#if contentState === "loading"}
          <div
            class="flex flex-col items-center justify-center py-12 px-6 text-center min-h-80 flex-1 overflow-y-auto"
          >
            <div class="relative mb-4">
              <div
                class="p-3 bg-primary bg-opacity-10 dark:bg-primary dark:bg-opacity-20 rounded-full"
              >
                <LoadingIcon class="w-6 h-6 text-primary animate-spin" />
              </div>
              <div
                class="absolute inset-0 rounded-full border-2 border-primary border-opacity-20 animate-pulse"
              ></div>
            </div>
            <h4
              class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >
              加载任务中
            </h4>
            <p class="text-gray-500 dark:text-gray-400">
              正在获取您的任务列表，请稍候...
            </p>
          </div>
        {:else if contentState === "error"}
          <div
            class="flex flex-col items-center justify-center py-12 px-6 text-center min-h-80 flex-1 overflow-y-auto"
          >
            <div
              class="p-3 bg-red-100 dark:bg-red-900 dark:bg-opacity-20 rounded-full mb-4"
            >
              <InfoIcon class="w-6 h-6 text-red-500 dark:text-red-400" />
            </div>
            <h4
              class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >
              加载失败
            </h4>
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              {tasksLoadError}
            </p>
            <button
              class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium transition-all duration-200 hover:bg-opacity-90 hover:scale-105 hover:shadow-lg"
              onclick={() => {
                contentState = "loading";
                loadTasks();
              }}
            >
              <LoadingIcon class="w-4 h-4" />
              重新加载
            </button>
          </div>
        {:else if contentState === "empty"}
          <div
            class="flex flex-col items-center justify-center py-12 px-6 text-center min-h-80 flex-1 overflow-y-auto"
            transition:fade={{ duration: 400 }}
          >
            <div class="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <AddIcon class="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <h4
              class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >
              暂无任务
            </h4>
            <p class="text-gray-500 dark:text-gray-400 mb-1">
              您还没有创建任何任务
            </p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mb-4">
              请先创建多个任务，然后就可以在任务间切换了
            </p>
            <button
              class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium transition-all duration-200 hover:bg-opacity-90 hover:scale-105 hover:shadow-lg"
              onclick={handleCreateTask}
            >
              <AddIcon class="w-4 h-4" />
              新建任务
            </button>
          </div>
        {:else if contentState === "single"}
          <div
            class="flex flex-col items-center justify-center py-12 px-6 text-center min-h-80 flex-1 overflow-y-auto"
            transition:fade={{ duration: 400 }}
          >
            <div
              class="p-3 bg-blue-100 dark:bg-blue-900 dark:bg-opacity-20 rounded-full mb-4"
            >
              <InfoIcon class="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <h4
              class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >
              只有一个任务
            </h4>
            <p class="text-gray-500 dark:text-gray-400 mb-1">
              您当前只有一个任务，无法进行切换
            </p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mb-4">
              请创建更多任务来体验任务切换功能
            </p>
            <button
              class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium transition-all duration-200 hover:bg-opacity-90 hover:scale-105 hover:shadow-lg"
              onclick={handleCreateTask}
            >
              <AddIcon class="w-4 h-4" />
              新建任务
            </button>
          </div>
        {:else if contentState === "list"}
          <div
            class="p-6 flex-1 overflow-y-auto min-h-0"
            transition:fade={{ duration: 150 }}
          >
            <div class="space-y-3">
              {#each paginatedTasks() as task, index (task.id)}
                <div
                  class={getTaskCardClass(task.id)}
                  transition:fly={{
                    x: -20,
                    duration: 100,
                    delay: index * 50,
                    easing: cubicOut,
                  }}
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        {#if task.id === currentTaskStore.value?.id}
                          <div
                            class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"
                          ></div>
                          <span
                            class="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide"
                            >当前任务</span
                          >
                        {/if}
                      </div>
                      <h4 class={getTitleClass(task.id)}>
                        {task.name}({getLabel(task.type)})
                      </h4>
                      <div
                        class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
                      >
                        <ClockIcon class="w-4 h-4" />
                        <span>{dayjs(task.time).fromNow()}</span>
                      </div>
                    </div>

                    {#if task.id !== currentTaskStore.value?.id}
                      <button
                        class={getButtonClass(task.id)}
                        onclick={() => handleSwitch(task)}
                        onkeydown={(e) => handleKeydown(e, task)}
                        disabled={loadingTaskId !== null || isLoadingTasks}
                        aria-label="切换到 {task.name}"
                      >
                        {#if loadingTaskId === task.id}
                          <LoadingIcon class="w-4 h-4 animate-spin" />
                          <span>切换中...</span>
                        {:else}
                          <SwitchIcon class="w-4 h-4" />
                          <span>切换</span>
                        {/if}
                      </button>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>

            {#if totalPages() > 1}
              <div
                class="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
                transition:fade={{ duration: 100, delay: 30 }}
              >
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  第 {currentPage} 页，共 {totalPages()} 页
                </div>

                <div class="flex items-center gap-1">
                  <button
                    class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    onclick={goToFirstPage}
                    disabled={currentPage === 1 ||
                      loadingTaskId !== null ||
                      isLoadingTasks}
                    aria-label="首页"
                  >
                    <FirstPageIcon class="w-4 h-4" />
                  </button>

                  <button
                    class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    onclick={prevPage}
                    disabled={currentPage === 1 ||
                      loadingTaskId !== null ||
                      isLoadingTasks}
                    aria-label="上一页"
                  >
                    <ChevronLeft class="w-4 h-4" />
                  </button>

                  <div class="flex items-center gap-1 mx-2">
                    {#each visiblePages() as pageItem}
                      {#if pageItem === "ellipsis"}
                        <span class="px-2 py-1 text-gray-400 dark:text-gray-500"
                          >...</span
                        >
                      {:else}
                        <button
                          class={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                            pageItem === currentPage
                              ? "bg-primary text-white shadow-sm"
                              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          } ${loadingTaskId !== null || isLoadingTasks ? "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" : ""}`}
                          onclick={() => goToPage(pageItem)}
                          disabled={loadingTaskId !== null || isLoadingTasks}
                        >
                          {pageItem}
                        </button>
                      {/if}
                    {/each}
                  </div>

                  <button
                    class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    onclick={nextPage}
                    disabled={currentPage === totalPages() ||
                      loadingTaskId !== null ||
                      isLoadingTasks}
                    aria-label="下一页"
                  >
                    <ChevronRight class="w-4 h-4" />
                  </button>

                  <button
                    class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    onclick={goToLastPage}
                    disabled={currentPage === totalPages() ||
                      loadingTaskId !== null ||
                      isLoadingTasks}
                    aria-label="末页"
                  >
                    <LastPageIcon class="w-4 h-4" />
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- 底部 -->
      <div
        class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 flex-shrink-0"
      >
        <button
          class={`px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
            loadingTaskId !== null || isLoadingTasks
              ? "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
              : "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          onclick={handleClose}
          disabled={loadingTaskId !== null || isLoadingTasks}
        >
          取消
        </button>
      </div>
    </div>
  </div>
{/if}