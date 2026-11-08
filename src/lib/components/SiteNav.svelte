<script lang="ts">
	import { page } from '$app/state';
	import { href } from '#lib/i18n.js';
	import { pageLabel } from '#lib/page-labels.js';
	import { pages } from '#lib/pages.js';
	import { m } from '#lib/paraglide/messages.js';
	import { deLocalizeHref } from '#lib/paraglide/runtime.js';
	import { Popover } from 'bits-ui';
	import IconMenu from '~icons/lucide/menu';

	const current = $derived(deLocalizeHref(page.url.pathname));
	const items = pages.filter((p) => p.inNav);
	const isCurrent = (path: string) => current === path || current.startsWith(`${path}/`);
	let open = $state(false);
</script>

<!-- Wide screens: the links inline. Narrow screens: a menu button. -->
<nav aria-label={m.nav_main()} class="hidden items-center gap-1 lg:flex">
	{#each items as p (p.path)}
		<a
			href={href(p.path)}
			aria-current={isCurrent(p.path) ? 'page' : undefined}
			class="btn-ghost aria-[current]:font-semibold aria-[current]:text-ink"
			>{pageLabel[p.path]()}</a
		>
	{/each}
</nav>

<Popover.Root bind:open>
	<Popover.Trigger class="btn-ghost lg:hidden" aria-label={m.nav_menu()}>
		<IconMenu class="size-5" aria-hidden="true" />
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content
			sideOffset={8}
			align="end"
			collisionPadding={12}
			class="z-50 w-64 rounded-2xl border border-line bg-surface p-2 shadow-lg"
		>
			<nav aria-label={m.nav_main()}>
				<ul>
					{#each items as p (p.path)}
						<li>
							<a
								href={href(p.path)}
								onclick={() => (open = false)}
								aria-current={isCurrent(p.path) ? 'page' : undefined}
								class="flex min-h-11 items-center rounded-xl px-3 text-ink hover:bg-line/50 aria-[current]:font-semibold aria-[current]:text-accent"
								>{pageLabel[p.path]()}</a
							>
						</li>
					{/each}
				</ul>
			</nav>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
