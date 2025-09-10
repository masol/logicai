<script lang="ts">
  import ArrowLeft from '~icons/lucide/arrow-left';
  import Search from '~icons/lucide/search';
  import Filter from '~icons/lucide/filter';
</script>

<div class="flex h-full flex-col">
  <!-- Top Bar -->
  <header class="flex h-14 flex-shrink-0 items-center justify-between border-b bg-base-200 px-4">
    <div class="flex items-center space-x-2">
      <a href="/main/commander" class="btn btn-ghost btn-circle">
        <ArrowLeft />
      </a>
      <h1 class="text-xl font-bold">知识图谱</h1>
    </div>
    <div class="flex items-center space-x-2">
      <div class="form-control">
        <input type="text" placeholder="搜索节点..." class="input input-bordered w-48" />
      </div>
      <button class="btn btn-ghost">
        <Filter class="mr-2 h-4 w-4"/> 筛选
      </button>
    </div>
  </header>

  <!-- Main Area -->
  <main class="flex flex-1 overflow-hidden">
    <!-- Canvas Area -->
    <div class="flex-1 bg-base-100 relative">
      <!-- Placeholder for Graph Library -->
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-gray-400">知识图谱画布 (D3.js, G6, etc.)</div>
      </div>
    </div>

    <!-- Property Panel -->
    <aside class="w-1/3 border-l bg-base-200 p-4">
      <h2 class="text-lg font-semibold">属性面板</h2>
      <p class="mt-4 text-sm text-gray-500">选中一个节点以查看其属性</p>
    </aside>
  </main>
</div>
