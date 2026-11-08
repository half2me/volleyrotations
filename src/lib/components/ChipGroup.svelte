<script lang="ts" generics="T extends string | number | boolean">
	/** A labelled set of radio chips: one choice out of a few, all visible at once. */
	let {
		legend,
		options,
		value = $bindable(),
		hideLegend = false
	}: {
		legend: string;
		options: readonly { value: T; label: string; hint?: string }[];
		value: T;
		hideLegend?: boolean;
	} = $props();

	const name = $props.id();
</script>

<fieldset class="min-w-0">
	<legend class={hideLegend ? 'sr-only' : 'eyebrow mb-2'}>{legend}</legend>
	<div class="flex flex-wrap gap-2">
		{#each options as option (String(option.value))}
			<label class="chip flex-col gap-0 leading-tight" title={option.hint}>
				<input
					type="radio"
					class="sr-only"
					{name}
					checked={value === option.value}
					onchange={() => (value = option.value)}
				/>
				<span>{option.label}</span>
				{#if option.hint}<span class="text-[0.7rem] font-normal opacity-80">{option.hint}</span
					>{/if}
			</label>
		{/each}
	</div>
</fieldset>
