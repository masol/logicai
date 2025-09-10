<script lang="ts">
  import Paperclip from "~icons/lucide/paperclip";
  import Send from "~icons/lucide/send";
</script>

<div class="flex h-full flex-col">
  <!-- Top Bar -->
  <header
    class="flex h-14 flex-shrink-0 items-center justify-between border-b bg-base-200 px-4"
  >
    <div class="flex items-center space-x-2">
      <!-- App Logo -->
      <a href="/main" class="text-xl font-bold">AI 指挥官</a>
    </div>
    <nav class="flex items-center space-x-4">
      <a href="/main/workflow" class="btn btn-ghost">工作流中心</a>
      <a href="/main/graph" class="btn btn-ghost">知识图谱</a>
    </nav>
  </header>

  <!-- Dialogue Area -->
  <main class="flex-1 overflow-y-auto p-4">
    <div class="chat chat-start">
      <div class="chat-bubble">您好，我是您的 AI 指挥官。请下达您的指令。</div>
    </div>
    <div class="chat chat-end">
      <div class="chat-bubble chat-bubble-primary">
        帮我分析上周的用户增长数据。
      </div>
    </div>
    <div class="chat chat-start">
      <div class="chat-bubble">
        好的，我已经启动了 "周数据分析" 工作流。
        <div class="collapse collapse-arrow">
          <input type="checkbox" />
          <div class="collapse-title text-sm font-medium">思考过程</div>
          <div class="collapse-content">
            <ul class="steps steps-vertical">
              <li class="step step-primary">意图识别: 用户增长分析</li>
              <li class="step step-primary">
                模板匹配: "周数据分析" (匹配度 95%)
              </li>
              <li class="step step-primary">工作流启动: 实例 #123</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Input Bar -->
  <footer class="flex items-center border-t bg-base-200 p-4">
    <button class="btn btn-ghost btn-circle">
      <Paperclip />
    </button>
    <input
      type="text"
      placeholder="下达您的指令..."
      class="input input-bordered w-full"
    />
    <button class="btn btn-primary ml-4">
      <Send />
    </button>
  </footer>
</div>
