<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import { site } from '#lib/config.js';
	import { localizedMarkdown } from '#lib/content.js';

	const { default: Content, metadata } = localizedMarkdown(
		import.meta.glob('/src/lib/content/about/*.md', { eager: true })
	);
</script>

<Seo title="{metadata.title} · {site.name}" description={metadata.description} path="/about" />

<article class="prose-site">
	<Content />
</article>
