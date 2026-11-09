<script lang="ts">
	import { BEACH_DRILLS, DRILLS } from '#lib/drills.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { Persisted } from '#lib/persisted.svelte.js';
	import IconPause from '~icons/lucide/pause';
	import IconPlay from '~icons/lucide/play';
	import IconSkip from '~icons/lucide/skip-forward';
	import IconTrash from '~icons/lucide/trash-2';

	/**
	 * A practice built from the drills: each with its minutes, and a timer that runs through them in
	 * order. The plan is kept in the reader's browser.
	 */
	let { plan }: { plan: Persisted<{ items: { id: string; minutes: number }[] }> } = $props();

	const items = $derived(plan.current.items);
	const total = $derived(items.reduce((sum, i) => sum + i.minutes, 0));
	const name = (id: string) => [...DRILLS, ...BEACH_DRILLS].find((d) => d.id === id)?.name ?? id;

	let current = $state(0);
	let left = $state(0);
	let running = $state(false);

	$effect(() => {
		if (!running) return;
		const timer = setInterval(() => {
			if (left > 1) left--;
			else next();
		}, 1000);
		return () => clearInterval(timer);
	});

	function start() {
		if (!items.length) return;
		if (left === 0) {
			current = 0;
			left = items[0].minutes * 60;
		}
		running = true;
	}

	function next() {
		if (current + 1 < items.length) {
			current++;
			left = items[current].minutes * 60;
		} else {
			running = false;
			left = 0;
			current = 0;
		}
	}

	const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
	const update = (next: { id: string; minutes: number }[]) => plan.set({ items: next });
</script>

<section class="card max-w-3xl" aria-labelledby="plan-heading" data-pagefind-ignore>
	<h2 id="plan-heading" class="text-xl font-bold">{m.plan_title()}</h2>
	{#if items.length === 0}
		<p class="mt-1 text-sm text-ink-soft">{m.plan_empty()}</p>
	{:else}
		<p class="mt-1 text-sm text-ink-soft">{m.plan_total({ minutes: total })}</p>
		<ol class="mt-3 space-y-2">
			{#each items as item, i (i)}
				<li
					class={[
						'flex flex-wrap items-center gap-2 rounded-xl px-2 py-1',
						left > 0 && i === current && 'bg-accent/10'
					]}
				>
					<span class="min-w-0 flex-1 font-medium">{i + 1}. {name(item.id)}</span>
					<label class="flex items-center gap-1 text-sm">
						<input
							type="number"
							min="1"
							max="90"
							class="field w-20 text-center"
							value={item.minutes}
							onchange={(e) =>
								update(
									items.map((x, j) =>
										j === i ? { ...x, minutes: Math.max(1, Number(e.currentTarget.value) || 1) } : x
									)
								)}
						/>
						<span>{m.plan_minutes()}</span>
						<span class="sr-only">{name(item.id)}</span>
					</label>
					<button
						type="button"
						class="btn-ghost"
						aria-label={m.plan_remove({ drill: name(item.id) })}
						onclick={() => update(items.filter((_, j) => j !== i))}
					>
						<IconTrash class="size-4" aria-hidden="true" />
					</button>
				</li>
			{/each}
		</ol>
		<div class="mt-4 flex flex-wrap items-center gap-3">
			{#if running}
				<button type="button" class="btn-primary" onclick={() => (running = false)}>
					<IconPause class="size-4" aria-hidden="true" />{m.pause()}
				</button>
			{:else}
				<button type="button" class="btn-primary" onclick={start}>
					<IconPlay class="size-4" aria-hidden="true" />{left ? m.plan_resume() : m.plan_start()}
				</button>
			{/if}
			{#if left > 0}
				<button type="button" class="btn-secondary" onclick={next}>
					<IconSkip class="size-4" aria-hidden="true" />{m.plan_next()}
				</button>
				<p class="text-lg font-bold tabular-nums" aria-live="off">
					{name(items[current].id)} · {clock(left)}
				</p>
			{/if}
		</div>
	{/if}
</section>
