<script lang="ts">
  import { onMount } from "svelte";
  import { fade, slide } from "svelte/transition";
  import { flip } from "svelte/animate";
  import { quintOut } from "svelte/easing";
  import { chatStore } from "$lib/stores/chatStore";
  import AISay from "./AISay.svelte";
  import UserSay from "./UserSay.svelte";
  import SysSay from "./SysSay.svelte";
  import IconRobot from "~icons/tabler/robot";
  import IconUser from "~icons/tabler/user";
  import IconSystem from "~icons/tabler/settings";
  import IconChevronUp from "~icons/tabler/chevron-up";
  import IconChevronDown from "~icons/tabler/chevron-down";
  import IconHistory from "~icons/tabler/history";
  import IconMessage from "~icons/tabler/message-circle";
  import IconMessageDots from "~icons/tabler/message-dots";
  import dayjs from "$lib/utils/dayjs";

  let scrollContainer = $state<HTMLDivElement>();
  let chatState = $state($chatStore);
  let showScrollButtons = $state(false);
  let isNearTop = $state(false);
  let isNearBottom = $state(true);

  // 订阅store变化
  $effect(() => {
    const unsubscribe = chatStore.subscribe((state) => {
      chatState = state;
    });
    return unsubscribe;
  });

  // 消息列表（按时间倒序显示，最新的在上面）
  let displayedMessages = $derived([...chatState.messages].reverse());

  // 检查是否需要显示历史按钮
  let needsHistoryButton = $derived(
    chatState.totalCount > chatState.messages.length &&
      chatState.totalCount > 0 &&
      chatState.messages.length > 0,
  );

  // 检查是否有消息
  let hasMessages = $derived(displayedMessages.length > 0);

  // 时间格式化函数
  const formatTime = (timestamp: number) => {
    const now = dayjs();
    const messageTime = dayjs(timestamp);

    if (now.diff(messageTime, "minute") < 1) {
      return "刚刚";
    } else if (now.diff(messageTime, "minute") < 60) {
      return `${now.diff(messageTime, "minute")}分钟前`;
    } else if (now.diff(messageTime, "hour") < 24) {
      return `${now.diff(messageTime, "hour")}小时前`;
    } else if (now.diff(messageTime, "day") < 7) {
      return messageTime.format("dddd HH:mm");
    } else {
      return messageTime.format("MM-DD HH:mm");
    }
  };

  // 完整时间格式化函数
  const formatFullTime = (timestamp: number) => {
    return dayjs(timestamp).format("YYYY年MM月DD日 HH:mm:ss");
  };

  // 检查滚动状态
  const checkScrollState = () => {
    if (!scrollContainer || !hasMessages) {
      showScrollButtons = false;
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const scrollableHeight = scrollHeight - clientHeight;

    // 显示快速滚动按钮的条件：滚动区域足够长且有内容
    showScrollButtons = scrollableHeight > 200;

    // 检查是否在顶部或底部附近
    isNearTop = scrollTop < 100;
    isNearBottom = scrollTop > scrollableHeight - 100;
  };

  // 滚动到顶部（最新消息）
  const scrollToTop = () => {
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // 滚动到底部（最旧消息）
  const scrollToBottom = () => {
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  onMount(() => {
    if (scrollContainer) {
      // 添加滚动监听
      scrollContainer.addEventListener("scroll", checkScrollState);

      // 初始检查（新消息在顶部，自动显示最新消息）
      setTimeout(() => {
        if (hasMessages) {
          scrollContainer.scrollTop = 0;
        }
        checkScrollState();
      }, 100);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", checkScrollState);
      }
    };
  });

  // 当有新消息时自动滚动到顶部
  $effect(() => {
    if (scrollContainer && hasMessages) {
      setTimeout(() => {
        scrollContainer.scrollTop = 0;
        checkScrollState();
      }, 100);
    }
  });

  // TODO: 实现查看历史对话功能
  const viewHistory = () => {
    // 实现查看历史对话的逻辑
    console.log("查看历史对话功能待实现");
  };
</script>

<div
  class="flex h-full w-full flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative"
>
  <!-- 对话区域 -->
  <div
    bind:this={scrollContainer}
    class="flex-1 overflow-y-auto scroll-smooth custom-scrollbar bg-white dark:bg-gray-900"
  >
    {#if hasMessages}
      <div class="space-y-4 p-4">
        <!-- 消息列表 -->
        {#each displayedMessages as message (message.id)}
          <div
            animate:flip={{ duration: 400, easing: quintOut }}
            in:slide={{ duration: 300, delay: 50, easing: quintOut }}
            out:fade={{ duration: 200 }}
            class="group transform transition-all duration-300 hover:scale-[1.01]"
          >
            {#if message.type === "ai"}
              <div class="flex items-end space-x-3">
                <!-- AI 头像 -->
                <div
                  class="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 shadow-lg flex-shrink-0"
                >
                  <IconRobot class="h-full w-full text-white" />
                </div>
                <!-- AI 对话气泡 -->
                <div
                  class="relative max-w-[calc(100%-3rem)] rounded-2xl rounded-bl-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <!-- 气泡尾巴 -->
                  <div
                    class="absolute -left-2 bottom-0 h-0 w-0 border-r-8 border-t-8 border-r-gray-50 dark:border-r-gray-800 border-t-transparent"
                  ></div>
                  <div
                    class="absolute -left-1.5 bottom-0 h-0 w-0 border-r-6 border-t-6 border-r-gray-200 dark:border-r-gray-700 border-t-transparent"
                  ></div>
                  <!-- 消息内容 -->
                  <div class="px-4 py-3">
                    <div class="text-gray-900 dark:text-gray-100">
                      <AISay
                        content={message.content}
                      />
                    </div>
                    <!-- 时间显示 -->
                    <div class="relative inline-block mt-2">
                      <div
                        class="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200 hover:text-gray-700 dark:hover:text-gray-200"
                        title={formatFullTime(message.timestamp)}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            {:else if message.type === "user"}
              <div class="flex items-end justify-end space-x-3">
                <!-- 用户对话气泡 -->
                <div
                  class="relative max-w-[calc(100%-3rem)] rounded-2xl rounded-br-sm bg-blue-500 dark:bg-blue-600 shadow-sm"
                >
                  <!-- 气泡尾巴 -->
                  <div
                    class="absolute -right-2 bottom-0 h-0 w-0 border-l-8 border-t-8 border-l-blue-500 dark:border-l-blue-600 border-t-transparent"
                  ></div>
                  <!-- 消息内容 -->
                  <div class="px-4 py-3">
                    <div class="text-white">
                      <UserSay
                        content={message.content}
                      />
                    </div>
                    <!-- 时间显示 -->
                    <div class="relative inline-block mt-2">
                      <div
                        class="text-xs text-white/70 transition-colors duration-200 hover:text-white/90"
                        title={formatFullTime(message.timestamp)}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
                <!-- 用户头像 -->
                <div
                  class="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 p-1.5 shadow-lg flex-shrink-0"
                >
                  <IconUser class="h-full w-full text-white" />
                </div>
              </div>
            {:else if message.type === "sys"}
              <div class="flex justify-center">
                <div
                  class="flex items-center space-x-2 rounded-full bg-gray-100/50 dark:bg-gray-800/50 px-4 py-2 shadow-sm"
                >
                  <!-- System 图标 -->
                  <div
                    class="h-5 w-5 rounded-full bg-gradient-to-br from-orange-500 to-red-600 p-1 shadow-sm"
                  >
                    <IconSystem class="h-full w-full text-white" />
                  </div>
                  <!-- 系统消息内容 -->
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    <SysSay
                      content={message.content}
                    />
                    <span
                      class="ml-2 text-xs opacity-70 transition-opacity duration-200 hover:opacity-100"
                      title={formatFullTime(message.timestamp)}
                    >
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <!-- 空状态显示 -->
      <div
        class="flex flex-col items-center justify-center h-full space-y-6 p-8"
      >
        <div class="relative">
          <div
            class="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 dark:from-blue-400/30 dark:to-purple-500/30 p-4 animate-pulse"
          >
            <IconMessageDots
              class="h-full w-full text-gray-400 dark:text-gray-500"
            />
          </div>
          <div
            class="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-green-500/30 to-teal-600/30 dark:from-green-400/40 dark:to-teal-500/40 p-1.5 animate-bounce"
          >
            <IconMessage
              class="h-full w-full text-gray-400 dark:text-gray-500"
            />
          </div>
        </div>

        <div class="text-center space-y-3 max-w-md">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            开始对话
          </h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            暂时没有消息记录。开始对话后，这里将显示您的聊天历史。如下所示，新消息位于上方。
          </p>
        </div>

        <div class="grid grid-cols-1 gap-3 w-full max-w-sm text-sm">
          <div
            class="flex items-center space-x-3 p-3 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50"
          >
            <div
              class="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1"
            >
              <IconRobot class="h-full w-full text-white" />
            </div>
            <span class="text-gray-600 dark:text-gray-400">AI回复</span>
          </div>

          <div
            class="flex items-center justify-end space-x-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/30"
          >
            <span class="text-gray-600 dark:text-gray-400">您的消息</span>
            <div
              class="h-6 w-6 rounded-full bg-gradient-to-br from-green-500 to-teal-600 p-1"
            >
              <IconUser class="h-full w-full text-white" />
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- 快速滚动按钮 -->
  {#if showScrollButtons}
    <div class="absolute right-4 bottom-20 flex flex-col space-y-2 z-10">
      {#if !isNearTop}
        <button
          onclick={scrollToTop}
          in:fade={{ duration: 200 }}
          out:fade={{ duration: 200 }}
          class="h-10 w-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-110 active:scale-95"
        >
          <IconChevronUp
            class="h-5 w-5 mx-auto text-gray-700 dark:text-gray-300"
          />
        </button>
      {/if}

      {#if !isNearBottom}
        <button
          onclick={scrollToBottom}
          in:fade={{ duration: 200 }}
          out:fade={{ duration: 200 }}
          class="h-10 w-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-110 active:scale-95"
        >
          <IconChevronDown
            class="h-5 w-5 mx-auto text-gray-700 dark:text-gray-300"
          />
        </button>
      {/if}
    </div>
  {/if}

  <!-- 底部状态栏 -->
  {#if hasMessages}
    <div
      class="border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-6 py-3 shadow-sm"
    >
      <div
        class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400"
      >
        <span class="font-medium"
          >显示 {chatState.messages.length} / {chatState.totalCount} 条消息</span
        >
        {#if needsHistoryButton}
          <button
            onclick={viewHistory}
            class="flex items-center space-x-2 rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-sm active:scale-95 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <IconHistory class="h-3 w-3" />
            <span>查看历史对话</span>
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgb(156 163 175 / 0.2);
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgb(156 163 175 / 0.4);
  }

  .custom-scrollbar::-webkit-scrollbar-corner {
    background: transparent;
  }

  :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgb(156 163 175 / 0.3);
  }

  :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgb(156 163 175 / 0.5);
  }
</style>
