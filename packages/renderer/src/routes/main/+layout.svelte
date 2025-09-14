<script lang="ts">
  // import Footer from '$lib/components/footer.svelte';
  import Header from "./header.svelte";
  // import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
</script>

<Header></Header>
<div class="bg-base-100">
  <slot></slot>
</div>

<!-- 页脚 -->
<!-- <Footer></Footer> -->

<!-- <ConfirmDialog></ConfirmDialog> -->
