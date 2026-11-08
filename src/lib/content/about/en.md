---
title: About
description: What this site is and how it is built.
---

<script>
	import Callout from '#lib/components/Callout.svelte';
</script>

# About

This page is written in **Markdown**. Each language has its own file in
`src/lib/content/about/`, and the route picks the one matching the URL.

<Callout>Markdown files can use Svelte components, like this callout.</Callout>

## How it is built

- Every page is prerendered to static HTML at build time.
- Cloudflare serves the files directly, with no server code.
- Interactivity runs in the browser, after the page loads.
