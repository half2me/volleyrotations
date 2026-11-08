<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { m } from '#lib/paraglide/messages.js';
	import { href } from '#lib/i18n.js';
	import IconArrowRight from '~icons/lucide/arrow-right';
</script>

<Seo title={site.name} description={m.home_description()} path="/" />

<section class="max-w-2xl">
	<h1 class="text-4xl font-bold tracking-tight text-balance sm:text-5xl">{m.home_title()}</h1>
	<p class="mt-4 text-lg text-ink-soft">{m.home_lead()}</p>
	<a href={href('/about')} class="btn-primary mt-8">
		{m.home_cta()}
		<IconArrowRight class="size-4" aria-hidden="true" />
	</a>
</section>
