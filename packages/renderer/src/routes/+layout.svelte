
<script lang="ts">
	import '../app.css';
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';
	import { initLib } from '$lib/index';

	let { children } = $props();
	onMount(async () => {
		document.documentElement.setAttribute('data-theme', $theme);
		await initLib();
	});
</script>

{@render children()}
