<script lang="ts" module>
	export type HandSign = 'one' | 'two' | 'fist' | 'open';
</script>

<script lang="ts">
	import Sprite, { type FigureId } from '#lib/components/figure/Sprite.svelte';
	import { m } from '#lib/paraglide/messages.js';

	/**
	 * A beach blocker seen from behind, as the defender sees them, giving a signal behind their
	 * back: the left hand for the attacker on their left, the right hand for the one on their
	 * right. The pre-rendered figure flicks the sign out and closes the hands again, as players
	 * do between rallies.
	 */
	let { left, right, label }: { left: HandSign; right: HandSign; label: string } = $props();

	const id = $derived(`partner-${left}-${right}` as FigureId);
</script>

<div role="img" aria-label={label}>
	<Sprite {id} tempo="partner" />
</div>
<p class="grid grid-cols-2 text-center text-sm font-semibold" aria-hidden="true">
	<span>{m.partner_left()}</span><span>{m.partner_right()}</span>
</p>
