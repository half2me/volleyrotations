<script lang="ts">
	import { href } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { explorerPrefs } from '#lib/prefs.svelte.js';
	import IconSun from '~icons/lucide/sun';

	/**
	 * Shown on the rotation tools when the reader has picked beach: rotations, positions and the
	 * overlap rule only exist indoors, so these tools would teach a beach player nothing true.
	 */
	let { quiz = false }: { quiz?: boolean } = $props();
	$effect(() => explorerPrefs.load());
</script>

{#if explorerPrefs.current.sport === 'beach'}
	<div
		class="card animate-reveal mt-6 flex max-w-2xl flex-col gap-3 border-accent sm:flex-row sm:items-center"
		role="note"
		data-pagefind-ignore
	>
		<IconSun class="size-6 shrink-0 text-accent" aria-hidden="true" />
		<p class="text-sm">{m.indoor_only_notice()}</p>
		<div class="flex shrink-0 flex-wrap gap-2">
			{#if quiz}
				<a class="btn-secondary" href={href('/beach/quiz')}>{m.indoor_only_quiz()}</a>
			{:else}
				<a class="btn-secondary" href={href('/beach')}>{m.beach_title()}</a>
			{/if}
			<button
				type="button"
				class="btn-ghost"
				onclick={() => explorerPrefs.set({ ...explorerPrefs.current, sport: 'indoor' })}
				>{m.indoor_only_switch()}</button
			>
		</div>
	</div>
{/if}
