<script lang="ts">
  import IconUser from "~icons/tabler/user";
  import IconMessage from "~icons/tabler/message-circle";
  import IconMessageDots from "~icons/tabler/message-dots";
  import IconRobot from "~icons/tabler/robot";
</script>

<div class="flex flex-col items-center justify-center h-full space-y-6 p-8">
  <div class="relative">
    <div
      class="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 dark:from-blue-400/30 dark:to-purple-500/30 p-4 animate-pulse"
    >
      <IconMessageDots class="h-full w-full text-gray-400 dark:text-gray-500" />
    </div>
    <div
      class="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-green-500/30 to-teal-600/30 dark:from-green-400/40 dark:to-teal-500/40 p-1.5 animate-bounce"
    >
      <IconMessage class="h-full w-full text-gray-400 dark:text-gray-500" />
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
