<script>
	import SystemMap from '$lib/components/SystemMap.svelte';
	import { pageHead } from '$lib/head.js';

	let { data } = $props();

	const head = $derived(pageHead(data.slug));
</script>

<svelte:head>
	<title>{head.title}</title>
	<meta name="description" content={head.description} />
	<link rel="canonical" href={head.url} />
	{#if head.markdown}<link rel="alternate" type="text/markdown" href={head.markdown} />{/if}
	<meta property="og:site_name" content="Dalton Baker" />
	<meta property="og:type" content={head.type} />
	<meta property="og:url" content={head.url} />
	<meta property="og:title" content={head.title} />
	<meta property="og:description" content={head.description} />
	{#if head.image}<meta property="og:image" content={head.image} />{/if}
	<meta name="twitter:card" content={head.image ? 'summary_large_image' : 'summary'} />
	{@html `<script type="application/ld+json">${head.jsonLd}</script>`}
</svelte:head>

<SystemMap slug={data.slug} />
