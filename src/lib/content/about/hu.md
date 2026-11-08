---
title: Rólunk
description: Mi ez az oldal, és hogyan készül.
---

<script>
	import Callout from '#lib/components/Callout.svelte';
</script>

# Rólunk

Ez az oldal **Markdown** formátumban készült. Minden nyelvnek saját fájlja van a
`src/lib/content/about/` mappában, és az útvonal az URL-nek megfelelőt választja.

<Callout>A Markdown fájlokban Svelte komponensek is használhatók, mint ez a kiemelés.</Callout>

## Hogyan készül

- Minden oldal statikus HTML-ként készül el fordításkor.
- A Cloudflare közvetlenül szolgálja ki a fájlokat, szerveroldali kód nélkül.
- Az interaktív részek a böngészőben futnak, az oldal betöltése után.
