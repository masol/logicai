<script lang="ts">
  import IconAlertCircle from "~icons/tabler/alert-circle";
  import IconPlus from "~icons/tabler/plus";
  import IconBook from "~icons/tabler/book";
  import IconCode from "~icons/tabler/code";
  import IconBriefcase from "~icons/tabler/briefcase";
</script>

<div class="flex flex-col items-center justify-center h-full space-y-6 p-8">
  <div class="relative">
    <div
      class="h-20 w-20 rounded-full bg-gradient-to-br from-orange-500/20 to-red-600/20 dark:from-orange-400/30 dark:to-red-500/30 p-4 animate-pulse"
    >
      <IconAlertCircle class="h-full w-full text-gray-400 dark:text-gray-500" />
    </div>
    <div
      class="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-600/30 dark:from-blue-400/40 dark:to-purple-500/40 p-1.5 animate-bounce"
    >
      <IconPlus class="h-full w-full text-gray-400 dark:text-gray-500" />
    </div>
  </div>

  <div class="text-center space-y-3 max-w-md">
    <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
      需要选择任务才能开始对话
    </h3>
    <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
      请先选择一个现有任务或新建一个任务。当前版本不支持自动任务维护功能。在上方输入栏下的提示行中，点击"无任务"按钮开始切换和新建任务。
    </p>
  </div>

  <div class="w-full max-w-sm space-y-4">
    <div class="text-center">
      <p
        class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3"
      >
        推荐的任务类型
      </p>
    </div>

    <div class="grid grid-cols-1 gap-3 text-sm">
      <div
        class="flex items-center space-x-3 p-3 rounded-lg bg-purple-50/50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-700/30"
      >
        <div
          class="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 p-1"
        >
          <IconBook class="h-full w-full text-white" />
        </div>
        <span class="text-gray-600 dark:text-gray-400">书写长篇小说</span>
      </div>

      <div
        class="flex items-center space-x-3 p-3 rounded-lg bg-green-50/50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/30"
      >
        <div
          class="h-6 w-6 rounded-full bg-gradient-to-br from-green-500 to-teal-600 p-1"
        >
          <IconCode class="h-full w-full text-white" />
        </div>
        <span class="text-gray-600 dark:text-gray-400">制作完整程序</span>
      </div>

      <div
        class="flex items-center space-x-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/30"
      >
        <div
          class="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-1"
        >
          <IconBriefcase class="h-full w-full text-white" />
        </div>
        <span class="text-gray-600 dark:text-gray-400">大规模项目管理</span>
      </div>
    </div>

    <div class="pt-4 text-center">
      <p class="text-xs text-gray-500 dark:text-gray-400">
        大规模任务更适合长期协作和持续优化
      </p>
    </div>
  </div>
</div>
