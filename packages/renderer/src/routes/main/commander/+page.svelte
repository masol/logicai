<script lang="ts">
  import Paperclip from "~icons/lucide/paperclip";
  import Send from "~icons/lucide/send";
  import Input from "./input.svelte";
</script>

<Input></Input>
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
