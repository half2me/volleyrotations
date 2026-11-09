<script lang="ts">
	import { site } from '#lib/config.js';
	import { href } from '#lib/i18n.js';
	import { ogImagePath } from '#lib/pages.js';
	import { baseLocale, getLocale, locales, type Locale } from '#lib/paraglide/runtime.js';

	let {
		title,
		description,
		path,
		type = 'website',
		schema,
		breadcrumbs,
		structuredData,
		noindex = false
	}: {
		/** Full document title. */
		title: string;
		description: string;
		/** Base-locale path from the site root, e.g. '/explorer'; '/' for the homepage. */
		path: string;
		type?: 'website' | 'article';
		/**
		 * The schema.org type to describe the page with, as JSON-LD: the whole site on the
		 * homepage, an interactive tool, or a guide.
		 */
		schema?: 'WebSite' | 'WebApplication' | 'Article';
		/**
		 * The page's place in the site, from the homepage down to the page itself, written as a
		 * BreadcrumbList. Paths are base-locale paths, localized here.
		 */
		breadcrumbs?: { name: string; path: string }[];
		/**
		 * More schema.org objects the page describes itself with, such as a Quiz, each written as
		 * its own JSON-LD block; `@context` is added here.
		 */
		structuredData?: Record<string, unknown>[];
		noindex?: boolean;
	} = $props();

	// `<` is escaped so the JSON cannot close the script element early.
	const toJsonLd = (data: Record<string, unknown>) =>
		JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c');

	/** Open Graph wants a territory with the language. */
	const OG_LOCALE: Record<Locale, string> = { en: 'en_GB', hu: 'hu_HU' };

	const urlFor = (locale: Locale, p = path) => site.url + href(p, locale);
	const locale = $derived(getLocale());
	const url = $derived(urlFor(locale));
	// Every page has its own preview image, drawn by `pnpm og` (scripts/og-images.ts).
	const image = $derived(site.url + ogImagePath(path, locale));

	const jsonLd = $derived.by(() => {
		if (!schema) return undefined;
		// Structured data names the page itself, without the site name the <title> ends with.
		const name = title.replace(` · ${site.name}`, '');
		const common = {
			'@type': schema,
			name,
			description,
			url,
			inLanguage: locale,
			image
		};
		const extra =
			schema === 'WebSite'
				? { name: site.name, alternateName: name }
				: schema === 'WebApplication'
					? {
							applicationCategory: 'SportsApplication',
							operatingSystem: 'Any',
							browserRequirements: 'Requires JavaScript',
							isAccessibleForFree: true,
							offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
							isPartOf: { '@type': 'WebSite', name: site.name, url: site.url }
						}
					: {
							headline: name,
							mainEntityOfPage: url,
							author: { '@type': 'Organization', name: site.name, url: site.url },
							publisher: { '@type': 'Organization', name: site.name, url: site.url },
							isPartOf: { '@type': 'WebSite', name: site.name, url: site.url }
						};
		return toJsonLd({ ...common, ...extra });
	});

	const breadcrumbJsonLd = $derived(
		breadcrumbs?.length
			? toJsonLd({
					'@type': 'BreadcrumbList',
					itemListElement: breadcrumbs.map((crumb, i) => ({
						'@type': 'ListItem',
						position: i + 1,
						name: crumb.name,
						item: urlFor(locale, crumb.path)
					}))
				})
			: undefined
	);
	const extraJsonLd = $derived(structuredData?.map(toJsonLd) ?? []);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	{#if noindex}
		<meta name="robots" content="noindex" />
	{:else}
		<meta name="robots" content="index, follow, max-image-preview:large" />
		{#each locales as l (l)}
			<link rel="alternate" hreflang={l} href={urlFor(l)} />
		{/each}
		<link rel="alternate" hreflang="x-default" href={urlFor(baseLocale)} />
	{/if}

	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={site.name} />
	<meta property="og:locale" content={OG_LOCALE[locale]} />
	{#each locales.filter((l) => l !== locale) as l (l)}
		<meta property="og:locale:alternate" content={OG_LOCALE[l]} />
	{/each}
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={image} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={title} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content={title} />
	{#if jsonLd}
		{@html `<script type="application/ld+json">${jsonLd}</script>`}
	{/if}
	{#if breadcrumbJsonLd}
		{@html `<script type="application/ld+json">${breadcrumbJsonLd}</script>`}
	{/if}
	{#each extraJsonLd as block, i (i)}
		{@html `<script type="application/ld+json">${block}</script>`}
	{/each}
</svelte:head>
