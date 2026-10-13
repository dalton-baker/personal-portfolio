<script>
	import SystemMap from '$lib/components/SystemMap.svelte';
	import { byId } from '$lib/orbit/system.js';
	import { game } from '$lib/game';

	let { data } = $props();

	const DEFAULT_DESCRIPTION = 'Dalton Baker: software engineer, maker, and builder of things both useful and ridiculous.';

	const head = $derived.by(() => {
		if (data.slug === game.slug) return { title: `${game.title} | Dalton Baker`, description: game.description };
		const b = data.slug ? byId[data.slug] : null;
		if (!b) return { title: 'Dalton Baker | Portfolio', description: DEFAULT_DESCRIPTION };
		if (b.post) return { title: `${b.post.pageTitle} | Dalton Baker`, description: b.post.dek };
		if (b.kind === 'hole') return { title: 'About | Dalton Baker', description: b.summary };
		return { title: `${b.name} | Dalton Baker`, description: b.summary };
	});
</script>

<svelte:head>
	<title>{head.title}</title>
	<meta name="description" content={head.description} />
</svelte:head>

<SystemMap slug={data.slug} />
