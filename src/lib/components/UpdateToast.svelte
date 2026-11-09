<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	/** The installed worker waiting to replace the one serving this page. */
	let waiting = $state<ServiceWorker | null>(null);

	$effect(() => {
		if (!('serviceWorker' in navigator)) return;
		const container = navigator.serviceWorker;
		let registration: ServiceWorkerRegistration | undefined;
		let stopped = false;

		// A worker that installs while no other controls the page activates straight away; only
		// an update over a running version waits, so only then is there anything to offer.
		const offer = (worker: ServiceWorker | null) => {
			if (worker && container.controller) waiting = worker;
		};
		const track = (worker: ServiceWorker) =>
			worker.addEventListener('statechange', () => {
				if (worker.state === 'installed') offer(worker);
			});
		const onUpdateFound = () => {
			if (registration?.installing) track(registration.installing);
		};

		void container.ready.then((ready) => {
			if (stopped) return;
			registration = ready;
			offer(ready.waiting);
			if (ready.installing) track(ready.installing);
			ready.addEventListener('updatefound', onUpdateFound);
		});

		return () => {
			stopped = true;
			registration?.removeEventListener('updatefound', onUpdateFound);
		};
	});

	function reload() {
		const worker = waiting;
		if (!worker) return;
		// The new worker claims this page once it activates; reload then, so the page and the
		// worker come from the same deploy.
		navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), {
			once: true
		});
		worker.postMessage({ type: 'SKIP_WAITING' });
	}
</script>

{#if waiting}
	<div
		role="status"
		class="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-sm flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line bg-surface py-2 pr-2 pl-4 text-sm shadow-lg sm:inset-x-auto sm:right-4 print:hidden"
		data-pagefind-ignore
	>
		<p class="mr-auto">{m.update_available()}</p>
		<div class="flex items-center gap-1">
			<button type="button" class="btn-ghost" onclick={() => (waiting = null)}>
				{m.update_later()}
			</button>
			<button type="button" class="btn-primary" onclick={reload}>{m.update_reload()}</button>
		</div>
	</div>
{/if}
