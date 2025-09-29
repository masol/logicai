<script lang="ts">
  import { scale, fade, fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import { tweened } from "svelte/motion";
  import { animate } from "animejs";
  import { rpc } from "@app/preload";
  import { chatStore, type AiTask } from "$lib/stores/chatStore";
  import { currentTaskStore } from "$lib/stores/shared.svelte";
  import TaskTypes from "./newTask";

  interface Props {
    open: boolean;
    oncreated?: (event: { name: string }) => void;
  }

  let { open = $bindable(false), oncreated }: Props = $props();

  let taskName = $state("");
  let taskType = $state("plan");
  let isCreating = $state(false);
  let error = $state("");
  let inputRef = $state<HTMLInputElement>();
  let dialogRef = $state<HTMLDialogElement>();

  const progress = tweened(0, {
    duration: 2000,
    easing: quintOut,
  });

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!taskName.trim() || isCreating) return;

    error = "";
    isCreating = true;
    progress.set(0);

    // 启动进度动画
    progress.set(100);

    const task: AiTask = await rpc.task.create(
      taskName.trim(),
      taskType.trim(),
    );

    // 模拟随机错误
    if (!task || !task.id) {
      error = "创建任务失败: 名称不被允许";
      isCreating = false;
      progress.set(0);

      // 错误动画效果
      setTimeout(() => {
        if (inputRef) {
          animate(inputRef, {
            translateX: [-10, 10, -10, 10, 0],
            duration: 400,
            easing: "easeOutElastic",
          });
        }
      }, 100);
      return;
    }

    currentTaskStore.set(task);
    chatStore.setMessages([]);

    oncreated?.({ name: taskName.trim() });

    // 重置状态
    taskName = "";
    taskType = "plan";
    isCreating = false;
    error = "";
    progress.set(0);
    close();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      const form = (event.target as HTMLElement).closest("form");
      if (form) {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        form.dispatchEvent(submitEvent);
      }
    }
  }

  function close() {
    open = false;
    error = "";
    taskName = "";
    isCreating = false;
    progress.set(0);
    dialogRef?.close();
  }

  function handleCancel(event: Event) {
    event.preventDefault();
    if (!isCreating) {
      close();
    }
  }

  $effect(() => {
    if (dialogRef) {
      if (open) {
        dialogRef.showModal();
        setTimeout(() => {
          inputRef?.focus();
          if (inputRef) {
            animate(inputRef, {
              scale: [0.95, 1],
              duration: 300,
              easing: "easeOutBack",
            });
          }
        }, 100);
      } else {
        dialogRef.close();
      }
    }
  });
</script>

<dialog
  bind:this={dialogRef}
  oncancel={handleCancel}
  class="fixed inset-0 z-50 backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:backdrop:bg-black/70
         bg-transparent border-none outline-none p-0 m-auto"
>
  <div
    class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
           shadow-2xl dark:shadow-black/50 rounded-xl w-full max-w-md p-6"
    transition:scale={{ duration: 300, easing: quintOut }}
  >
    <!-- 头部 -->
    <div class="pb-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
        新建任务
      </h3>
    </div>

    <!-- 内容区域 - 固定高度 -->
    <div class="py-6 min-h-[200px] flex flex-col justify-center">
      {#if isCreating}
        <div class="text-center" transition:fade={{ duration: 200 }}>
          <div
            class="inline-flex items-center justify-center w-16 h-16 mb-4
                   bg-blue-50 dark:bg-blue-900/30 rounded-full"
          >
            <div
              class="w-8 h-8 border-[3px] border-blue-500 border-t-transparent
                     rounded-full animate-spin"
            ></div>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">正在创建任务...</p>

          <!-- 进度条 -->
          <div
            class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
          >
            <div
              class="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full
                     transition-all duration-75"
              style="width: {$progress}%"
              transition:scale={{ duration: 200 }}
            ></div>
          </div>
        </div>
      {:else}
        <form onsubmit={handleSubmit} transition:fade={{ duration: 200 }}>
          <div class="space-y-4">
            <!-- 错误提示 -->
            {#if error}
              <div
                class="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg"
                transition:fly={{ y: -10, duration: 300 }}
              >
                <div class="flex items-start">
                  <div class="flex-shrink-0">
                    <svg
                      class="w-5 h-5 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-red-800 dark:text-red-200">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            {/if}

            <div class="space-y-2">
              <label
                for="taskName"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                任务名称
              </label>
              <input
                bind:this={inputRef}
                bind:value={taskName}
                onkeydown={handleKeydown}
                id="taskName"
                type="text"
                placeholder="输入任务名称..."
                class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                       text-gray-900 dark:text-white
                       placeholder-gray-500 dark:placeholder-gray-400
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       hover:border-gray-400 dark:hover:border-gray-500
                       transition-all duration-200
                       {error
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'}"
                autocomplete="off"
              />
            </div>

            <!-- 任务类型选择 -->
            <div class="space-y-2">
              <label
                for="taskType"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                任务类型
              </label>
              <select
                bind:value={taskType}
                id="taskType"
                class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
               text-gray-900 dark:text-white
               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
               hover:border-gray-400 dark:hover:border-gray-500
               transition-all duration-200
               border-gray-300 dark:border-gray-600"
              >
                {#each TaskTypes as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>

            <div class="flex gap-3 pt-4">
              <button
                type="button"
                onclick={close}
                class="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300
                       bg-gray-100 dark:bg-gray-700
                       hover:bg-gray-200 dark:hover:bg-gray-600
                       rounded-lg transition-all duration-200
                       hover:scale-105 active:scale-95"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={!taskName.trim()}
                class="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600
                       disabled:bg-gray-300 dark:disabled:bg-gray-600
                       disabled:text-gray-500 dark:disabled:text-gray-400
                       text-white rounded-lg
                       hover:shadow-lg hover:scale-105
                       disabled:hover:scale-100 disabled:cursor-not-allowed
                       transition-all duration-200"
              >
                创建
              </button>
            </div>
          </div>
        </form>
      {/if}
    </div>
  </div>
</dialog>
