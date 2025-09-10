<script lang="ts">
  import ArrowLeft from '~icons/lucide/arrow-left';
</script>

<div class="flex h-full flex-col">
  <!-- Top Bar -->
  <header class="flex h-14 flex-shrink-0 items-center justify-between border-b bg-base-200 px-4">
    <div class="flex items-center space-x-2">
      <a href="/main/workflow" class="btn btn-ghost btn-circle">
        <ArrowLeft />
      </a>
      <h1 class="text-xl font-bold">编辑: 会议录音转纪要 v1</h1>
    </div>
    <div class="flex items-center space-x-2">
      <button class="btn btn-primary">保存</button>
      <button class="btn btn-ghost">另存为</button>
    </div>
  </header>

  <!-- Main Area -->
  <main class="flex flex-1 overflow-hidden">
    <!-- Canvas Area -->
    <div class="flex-1 bg-base-100 relative">
      <!-- Placeholder for Graph Library -->
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-gray-400">流程图画布 (Mermaid, etc.)</div>
      </div>
    </div>

    <!-- Property Panel -->
    <aside class="w-1/3 border-l bg-base-200 p-4">
      <h2 class="text-lg font-semibold">属性面板</h2>
       <div class="mt-4 space-y-4">
        <div>
          <label class="label">
            <span class="label-text">名称</span>
          </label>
          <input type="text" value="summarize" class="input input-bordered w-full" />
        </div>
        <div>
          <label class="label">
            <span class="label-text">AI函数</span>
          </label>
          <input type="text" value="gpt-4-turbo-1106" class="input input-bordered w-full" />
        </div>
        <div>
          <label class="label">
            <span class="label-text">Prompt</span>
          </label>
          <textarea class="textarea textarea-bordered w-full" rows="5">请将以下文本总结成...</textarea>
        </div>
      </div>
    </aside>
  </main>
</div>
