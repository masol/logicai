<script lang="ts">
  import { fly, fade } from "svelte/transition";
  import IconSend from "~icons/mdi/send";
  import IconMicrophone from "~icons/mdi/microphone";
  import IconAttachment from "~icons/mdi/attachment";
  import IconKeyboard from "~icons/mdi/keyboard";

  let {
    breadcrumbsLength = 0,
    onSubmit = () => {},
    placeholder = "输入您的消息...",
    disabled = false,
  } = $props();

  let message = $state("");
  let inputElement = $state<HTMLTextAreaElement>();
  let containerElement = $state<HTMLDivElement>();
  let isExpanded = $state(false);
  let isRecording = $state(false);
  let glowOpacity = $state(0);
  let containerHeight = $state(80);
  let currentInputHeight = $state(48);
  let animationFrame = $state<number | null>(null);
  let isAtMaxHeight = $state(false);

  function handleSubmit() {
    if (message.trim() && !disabled) {
      onSubmit(message.trim());
      message = "";
      isExpanded = false;
      isAtMaxHeight = false;
      animateToHeight(48);
    }
  }

  function scrollToBottom() {
    if (inputElement && isAtMaxHeight) {
      requestAnimationFrame(() => {
        inputElement.scrollTop = inputElement.scrollHeight;
      });
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      if (event.ctrlKey) {
        // Ctrl + Enter 换行 - 手动插入换行符
        event.preventDefault();
        const start = inputElement?.selectionStart || 0;
        const end = inputElement?.selectionEnd || 0;
        const newValue = message.slice(0, start) + "\n" + message.slice(end);
        message = newValue;

        // 设置光标位置并触发高度计算
        if (inputElement) {
          setTimeout(() => {
            inputElement.selectionStart = inputElement.selectionEnd = start + 1;
            calculateAndAnimateHeight();
            // 在下一帧滚动到底部
            setTimeout(scrollToBottom, 50);
          }, 0);
        }
      } else {
        // Enter 发送
        event.preventDefault();
        handleSubmit();
      }
    }
  }

  function calculateAndAnimateHeight() {
    if (inputElement) {
      // 临时设置高度为auto来获取真实高度
      const originalHeight = inputElement.style.height;
      const originalOverflow = inputElement.style.overflowY;

      inputElement.style.height = "auto";
      inputElement.style.overflowY = "hidden";

      const scrollHeight = inputElement.scrollHeight;

      inputElement.style.height = originalHeight;
      inputElement.style.overflowY = originalOverflow;

      // 限制最大高度
      const targetHeight = Math.min(Math.max(scrollHeight, 48), 128);
      isExpanded = targetHeight > 48;
      isAtMaxHeight = scrollHeight > 128;

      // 如果内容超过最大高度，显示滚动条
      if (isAtMaxHeight) {
        inputElement.style.overflowY = "auto";
      } else {
        inputElement.style.overflowY = "hidden";
      }

      animateToHeight(targetHeight);
    }
  }

  function animateToHeight(targetHeight: number) {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }

    const startHeight = currentInputHeight;
    const diff = targetHeight - startHeight;
    const duration = 200;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 使用easeOutQuart缓动函数
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      currentInputHeight = startHeight + diff * easeOutQuart;

      if (inputElement) {
        inputElement.style.height = `${currentInputHeight}px`;
      }

      updateContainerHeight();

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        animationFrame = null;
        // 动画完成后滚动到底部
        scrollToBottom();
      }
    }

    animationFrame = requestAnimationFrame(animate);
  }

  function handleInput() {
    // 延迟一帧来确保DOM更新
    requestAnimationFrame(() => {
      calculateAndAnimateHeight();
      // 如果已经达到最大高度，输入后滚动到底部
      if (isAtMaxHeight) {
        setTimeout(scrollToBottom, 50);
      }
    });
  }

  function handleFocus() {
    const startOpacity = glowOpacity;
    const targetOpacity = 0.5;
    const diff = targetOpacity - startOpacity;
    const duration = 300;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      glowOpacity = startOpacity + diff * easeOut;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  function handleBlur() {
    const startOpacity = glowOpacity;
    const targetOpacity = 0;
    const diff = targetOpacity - startOpacity;
    const duration = 300;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      glowOpacity = startOpacity + diff * easeOut;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  function toggleRecording() {
    isRecording = !isRecording;
  }

  function updateContainerHeight() {
    if (containerElement) {
      requestAnimationFrame(() => {
        if (containerElement) {
          containerHeight = containerElement.getBoundingClientRect().height;
        }
      });
    }
  }

  $effect(() => {
    if (inputElement) {
      // 初始化输入框高度
      inputElement.style.height = `${currentInputHeight}px`;
      inputElement.style.overflowY = "hidden";

      updateContainerHeight();

      // 自动聚焦到输入框
      setTimeout(() => {
        inputElement.focus();
      }, 100);

      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }
  });

  $effect(() => {
    const handleResize = () => updateContainerHeight();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  $effect(() => {
    message;
    updateContainerHeight();
  });
</script>

<!-- 对话输入组件 -->
<div
  bind:this={containerElement}
  class="chat-input-container fixed left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg w-full"
  style="top: {breadcrumbsLength > 0 ? '5rem' : '4rem'};"
  in:fly={{ y: -20, duration: 300 }}
>
  <!-- 发光效果 -->
  <div
    class="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl"
    style="opacity: {glowOpacity}"
  ></div>

  <div class="relative px-6 py-3 w-full">
    <!-- 输入框容器 -->
    <div
      class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700
             transition-all duration-300 hover:shadow-xl group w-full"
      class:ring-2={message.length > 0}
      class:ring-blue-500={message.length > 0}
      class:ring-opacity-50={message.length > 0}
    >
      <!-- 动态背景 -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      ></div>

      <div class="relative flex items-end gap-3 p-4 w-full">
        <!-- 附件按钮 -->
        <button
          type="button"
          class="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200
                 hover:scale-110 active:scale-95"
          onkeydown={(e) => e.key === "Enter" && e.currentTarget.click()}
          in:fly={{ x: -20, delay: 100 }}
        >
          <IconAttachment class="w-5 h-5" />
        </button>

        <!-- 输入框 -->
        <textarea
          bind:this={inputElement}
          bind:value={message}
          oninput={handleInput}
          onkeydown={handleKeydown}
          onfocusin={handleFocus}
          onfocusout={handleBlur}
          {placeholder}
          {disabled}
          rows="1"
          class="flex-1 w-full resize-none bg-transparent border-0 focus:ring-0 focus:outline-none
                 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                 text-base leading-6 min-h-[24px] scrollbar-thin scrollbar-thumb-gray-300
                 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
          style="height: {currentInputHeight}px; transition: none; overflow-y: hidden;"
        ></textarea>

        <!-- 录音按钮 -->
        <button
          type="button"
          onclick={toggleRecording}
          onkeydown={(e) => e.key === "Enter" && toggleRecording()}
          class="flex-shrink-0 p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95
                 {isRecording
            ? 'text-red-500 bg-red-100 dark:bg-red-900 dark:bg-opacity-20'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
          in:fly={{ x: 20, delay: 200 }}
        >
          <IconMicrophone
            class="w-5 h-5 {isRecording ? 'animate-pulse' : ''}"
          />
        </button>

        <!-- 发送按钮 -->
        <button
          type="button"
          onclick={handleSubmit}
          onkeydown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={!message.trim() || disabled}
          class="flex-shrink-0 p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                 {message.trim()
            ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
          in:fly={{ x: 20, delay: 300 }}
        >
          <IconSend class="w-5 h-5" />
        </button>
      </div>

      <!-- 扩展指示器 -->
      {#if isExpanded}
        <div
          class="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5
                 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          in:fade={{ duration: 200 }}
          out:fade={{ duration: 200 }}
        ></div>
      {/if}
    </div>

    <!-- 帮助信息 -->
    <div
      class="flex items-center justify-between mt-2 px-2 text-xs text-gray-500 dark:text-gray-400 w-full"
    >
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-1">
          <IconKeyboard class="w-3 h-3" />
          <span>Enter 发送</span>
        </div>
        <div>Ctrl + Enter 换行</div>
        <!-- 始终显示字符数统计 -->
        <div
          class="text-blue-500 dark:text-blue-400 font-mono"
          class:text-amber-500={message.length > 1500}
          class:dark:text-amber-400={message.length > 1500}
          class:text-red-500={message.length > 1800}
          class:dark:text-red-400={message.length > 1800}
        >
          {message.length}/6000
        </div>
      </div>
      <div class="flex items-center gap-2">
        {#if isRecording}
          <div class="flex items-center gap-1 text-red-500">
            <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>正在录音...</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- 动态占位元素 -->
<div
  class="transition-all duration-200 ease-out"
  style="height: {containerHeight}px;"
></div>
