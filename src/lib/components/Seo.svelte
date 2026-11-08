<script lang="ts">
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { baseLocale, getLocale, locales, type Locale } from '#lib/paraglide/runtime.js';

	let {
		title,
		description,
		path,
		type = 'website',
		image,
		noindex = false
	}: {
		/** Full document title. */
		title: string;
		description: string;
		/** Base-locale path from the site root, e.g. '/about'; '/' for the homepage. */
		path: string;
		type?: 'website' | 'article';
		/** Social card, 1200×630, as a path under static/ (e.g. '/og.png'). */
		image?: string;
		noindex?: boolean;
	} = $props();

	const urlFor = (locale: Locale) => site.url + href(path, locale);
	const url = $derived(urlFor(getLocale()));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	{#if noindex}
		<meta name="robots" content="noindex" />
	{:else}
		{#each locales as locale (locale)}
			<link rel="alternate" hreflang={locale} href={urlFor(locale)} />
		{/each}
		<link rel="alternate" hreflang="x-default" href={urlFor(baseLocale)} />
	{/if}

	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={site.name} />
	<meta property="og:locale" content={getLocale()} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	{#if image}
		<meta property="og:image" content={site.url + image} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
</svelte:head>
