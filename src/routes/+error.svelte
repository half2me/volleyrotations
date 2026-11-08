<script lang="ts">
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { href } from '#lib/i18n.js';
</script>

<svelte:head>
	<title>{page.status} · {m.error_title()}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="max-w-xl">
	<p class="text-sm font-semibold text-accent">{page.status}</p>
	<h1 class="mt-2 text-3xl font-bold tracking-tight">
		{page.status === 404 ? m.error_not_found() : m.error_title()}
	</h1>
	<a href={href('/')} class="btn-primary mt-8">{m.error_home()}</a>
</section>
