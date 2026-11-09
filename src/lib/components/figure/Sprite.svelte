<script lang="ts" module>
	import figures from '#lib/figures.json' with { type: 'json' };

	export type FigureId = keyof typeof figures;
	export const FIGURES = figures;
</script>

<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';

	/**
	 * Plays one of the pre-rendered figures in static/figures/: a WebP sprite sheet of frames
	 * drawn by `pnpm figures` from the 3D mannequin in scripts/figures/. The sheet's metadata in
	 * src/lib/figures.json says how many frames there are, how many lead from rest into the
	 * signal, and whether the rest cycle (a rolling or waving movement).
	 *
	 * Timing: a held signal rises, holds, lowers and rests; a cycling one rises and then repeats
	 * its cycle. It is still while off screen and for readers who prefer less motion, showing the
	 * `still` frame, which is also what the prerendered page shows before any script runs.
	 */
	let {
		id,
		tempo = 'signal'
	}: {
		id: FigureId;
		/** How the frames are timed: a referee's signal, or a beach blocker flicking a sign. */
		tempo?: 'signal' | 'partner';
	} = $props();

	const meta = $derived(figures[id]);
	let frame = $state(-1);
	let box: HTMLDivElement | undefined = $state();
	let visible = $state(false);

	$effect(() => {
		if (!box) return;
		const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
		observer.observe(box);
		return () => observer.disconnect();
	});

	type Step = { from: number; to: number; ms: number };
	/** The timeline, as runs of frames that each take `ms`; a run with from === to holds. */
	function timeline(): Step[] {
		const last = meta.frames - 1;
		const rise = meta.rise - 1;
		if (meta.loop) {
			const cycle = meta.frames - meta.rise;
			const period = cycle > 12 ? 2600 : 1500;
			const steps: Step[] = [{ from: 0, to: rise, ms: 600 }];
			if (meta.pingPong) {
				steps.push(
					{ from: meta.rise, to: last, ms: period },
					{ from: last, to: meta.rise, ms: period }
				);
			} else {
				steps.push({ from: meta.rise, to: last, ms: period });
			}
			return steps;
		}
		if (tempo === 'partner') {
			return [
				{ from: 0, to: last, ms: 220 },
				{ from: last, to: last, ms: 2200 },
				{ from: last, to: 0, ms: 220 },
				{ from: 0, to: 0, ms: 600 }
			];
		}
		return [
			{ from: 0, to: last, ms: meta.slow ? 1500 : 650 },
			{ from: last, to: last, ms: 1900 },
			{ from: last, to: 0, ms: 600 },
			{ from: 0, to: 0, ms: 700 }
		];
	}

	$effect(() => {
		if (!visible || prefersReducedMotion.current) {
			frame = meta.still;
			return;
		}
		const steps = timeline();
		// A cycling figure repeats only its cycle once it has risen.
		const loopFrom = meta.loop ? 1 : 0;
		const total = (from: number) => steps.slice(from).reduce((sum, s) => sum + s.ms, 0);
		const start = performance.now();
		let raf = 0;
		const tick = (now: number) => {
			let t = now - start;
			let i = 0;
			if (t >= total(0)) {
				t = ((t - total(0)) % total(loopFrom)) + (loopFrom ? steps[0].ms : 0);
			}
			while (i < steps.length - 1 && t >= steps[i].ms) {
				t -= steps[i].ms;
				i++;
			}
			const s = steps[i];
			const k = Math.min(1, t / s.ms);
			frame = Math.round(s.from + (s.to - s.from) * k);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<div
	bind:this={box}
	class="relative mx-auto w-full overflow-hidden"
	style:aspect-ratio="{meta.width} / {meta.height}"
	aria-hidden="true"
>
	<img
		src="/figures/{id}.webp"
		alt=""
		width={meta.width * meta.frames}
		height={meta.height}
		loading="lazy"
		decoding="async"
		class="absolute top-0 left-0 h-full w-auto max-w-none"
		style:transform="translateX({(-(frame < 0 ? meta.still : frame) * 100) / meta.frames}%)"
	/>
</div>
