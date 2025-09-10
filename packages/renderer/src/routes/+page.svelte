<script>
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  let test = "";
  onMount(() => {
    console.log("got main/commander!!")
    goto("/main/commander");
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-base-100">
  <div class="flex flex-col items-center gap-4">
    <span class="loading loading-spinner loading-lg"></span>
    <div class="text-lg">环境探测中...</div>
  </div>
</div>
