<script lang="ts">
  import { onMount } from 'svelte';
  import ArrowLeft from '~icons/lucide/arrow-left';
  import Paperclip from '~icons/lucide/paperclip';
  import Send from '~icons/lucide/send';
  import Pause from '~icons/lucide/pause';
  import Play from '~icons/lucide/play';
  import MoreVertical from '~icons/lucide/more-vertical';
  import { getHashValue } from '$lib/utils/url';

  let selectedId: string | null = null;
  let isPaused = false;

  function handleHashChange() {
    selectedId = getHashValue('id');
  }

  onMount(() => {
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  });
</script>

<div class="flex h-full flex-col">
  <!-- Top Bar -->
  <header class="flex h-14 flex-shrink-0 items-center justify-between border-b bg-base-200 px-4">
    <div class="flex items-center space-x-2">
      <a href="/main/commander" class="btn btn-ghost btn-circle">
        <ArrowLeft />
      </a>
      <h1 class="text-xl font-bold">工作流中心</h1>
    </div>
    <div class="flex items-center space-x-4">
      <a href="/main/editor#template=new" class="btn btn-ghost">新建模板</a>
      <button class="btn btn-ghost">编辑模板</button>
    </div>
  </header>

  <!-- Main Area -->
  <div class="flex flex-1 overflow-hidden">
    <!-- Left Panel -->
    <aside class="w-1/3 border-r bg-base-100 overflow-y-auto">
      <div class="p-4">
        <input type="text" placeholder="搜索..." class="input input-bordered w-full" />
      </div>
      <ul class="menu p-4">
        <li>
          <a href="#id=123" class:active={selectedId === '123'}>
             <div class="flex flex-col">
              <div class="flex justify-between">
                <span>周数据分析</span>
                <span class="text-xs">刚刚</span>
              </div>
              <span class="text-xs text-gray-500">AI: 生成图表...</span>
            </div>
          </a>
        </li>
         <li>
          <a href="#id=456" class:active={selectedId === '456'}>
            <div class="flex flex-col">
              <div class="flex justify-between">
                <span>PRD撰写</span>
                <span class="text-xs">昨天18:30</span>
              </div>
              <span class="text-xs text-gray-500">AI: PRD已生成...</span>
            </div>
          </a>
        </li>
         <li>
          <a href="#id=789" class:active={selectedId === '789'}>
            <div class="flex flex-col">
              <div class="flex justify-between">
                <span>服务器部署</span>
                <span class="text-xs">昨天15:12</span>
              </div>
              <span class="text-xs text-error">AI: 验证失败...</span>
            </div>
          </a>
        </li>
      </ul>
    </aside>

    <!-- Right Panel -->
    <main class="w-2/3 flex-1 flex flex-col overflow-hidden">
      {#if selectedId}
        <!-- Workflow Execution Chat -->
        <div class="flex h-full flex-col">
            <header class="flex h-14 flex-shrink-0 items-center justify-between border-b bg-base-200 px-4">
                <h2 class="text-lg font-semibold">工作流: {selectedId}</h2>
                <div class="flex items-center space-x-2">
                    <button class="btn btn-ghost btn-sm" on:click={() => isPaused = !isPaused}>
                        {#if isPaused}
                            <Play class="mr-2 h-4 w-4"/> 继续
                        {:else}
                            <Pause class="mr-2 h-4 w-4"/> 暂停
                        {/if}
                    </button>
                    <button class="btn btn-ghost btn-sm"><MoreVertical class="h-4 w-4"/></button>
                </div>
            </header>
            <div class="flex-1 overflow-y-auto p-4">
                <div class="chat chat-start">
                    <div class="chat-bubble">请提供数据源的数据库连接字符串。</div>
                </div>
            </div>
            <footer class="flex items-center border-t bg-base-200 p-4">
                <button class="btn btn-ghost btn-circle">
                    <Paperclip />
                </button>
                <input type="text" placeholder="输入..." class="input input-bordered w-full" />
                <button class="btn btn-primary ml-4">
                    <Send />
                </button>
            </footer>
        </div>
      {:else}
        <!-- Welcome Page -->
        <div class="flex h-full items-center justify-center">
          <div class="text-center">
            <h2 class="text-2xl font-bold">欢迎来到工作流中心</h2>
            <p class="mt-2 text-gray-500">请从左侧选择一个工作流以查看详情</p>
          </div>
        </div>
      {/if}
    </main>
  </div>
</div>
