<script lang="ts">
  import { onMount } from "svelte";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { rpc } from "@app/preload";

  let passiveValue = $state(false);
  let isLoading = $state(true);
  let showTooltip = $state(false);

  const scale = tweened(1, {
    duration: 200,
    easing: cubicOut,
  });

  onMount(async () => {
    try {
      const result = await rpc.sys.get("passive");
      passiveValue = !!result;
    } catch (error) {
      console.error("Failed to get passive value:", error);
    } finally {
      isLoading = false;
    }
  });

  async function handleChange() {
    if (!isLoading) {
      const newValue = !passiveValue;
      passiveValue = newValue;
      scale.set(0.9).then(() => scale.set(1));

      try {
        await rpc.sys.passive(newValue);
      } catch (error) {
        console.error("Failed to set passive value:", error);
        passiveValue = !newValue;
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleChange();
    }
  }

  function handleMouseEnter() {
    showTooltip = true;
  }

  function handleMouseLeave() {
    showTooltip = false;
  }
</script>

<div class="relative">
  <div
    class="relative inline-flex items-center cursor-pointer select-none"
    class:cursor-wait={isLoading}
    style="transform: scale({$scale})"
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
  >
    <input
      type="checkbox"
      checked={passiveValue}
      onchange={handleChange}
      onkeydown={handleKeyDown}
      class="sr-only"
    />

    <div
      class="w-5 h-5 rounded border-2 transition-all duration-300 ease-out
             {passiveValue
        ? 'bg-primary border-primary'
        : 'bg-background border-border hover:border-primary/50'}"
      onclick={handleChange}
      onkeydown={handleKeyDown}
      role="checkbox"
      tabindex="0"
      aria-checked={passiveValue}
    >
      {#if isLoading}
        <div
          class="w-2 h-2 bg-muted-foreground rounded-full m-auto animate-spin"
        ></div>
      {:else if passiveValue}
        <svg
          class="w-3 h-3 text-primary-foreground m-auto mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      {/if}
    </div>
  </div>

  {#if showTooltip}
    <div
      class="absolute right-0 top-full mt-2 w-64 p-3 bg-popover text-popover-foreground
             border border-border rounded-lg shadow-lg z-50 transform transition-all
             duration-200 ease-out animate-in slide-in-from-top-2"
    >
      <div class="text-sm space-y-2">
        <div class="font-medium">
          当前模式: {passiveValue ? "工作模式" : "交互模式"}
        </div>
        <div class="text-muted-foreground">
          {#if passiveValue}
            工作模式：AI不会询问用户，而是自己猜测来确定一切信息
          {:else}
            交互模式：AI在拿不准时，会主动询问用户
          {/if}
        </div>
      </div>

      <!-- 箭头指示器 -->
      <div
        class="absolute -top-1 right-3 w-2 h-2 bg-popover border-l border-t
               border-border transform rotate-45"
      ></div>
    </div>
  {/if}
</div>
