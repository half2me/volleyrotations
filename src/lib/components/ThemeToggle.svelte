<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { theme } from '#lib/theme.svelte.js';
	import IconMoon from '~icons/lucide/moon';
	import IconSun from '~icons/lucide/sun';

	$effect(() => theme.load());
</script>

<button
	type="button"
	class="btn-ghost"
	onclick={() => theme.toggle()}
	aria-label={theme.current === 'dark' ? m.theme_light() : m.theme_dark()}
>
	{#if theme.current === 'dark'}
		<IconSun class="size-5" aria-hidden="true" />
	{:else}
		<IconMoon class="size-5" aria-hidden="true" />
	{/if}
</button>
