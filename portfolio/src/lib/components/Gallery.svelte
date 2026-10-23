<script>
	import { lightbox } from './lightbox.svelte.js';
	import { picture } from '$lib/images';

	/** items: { src, alt } photos from $lib/images (click to enlarge) or { src, video: true } clips from static/. */
	let { items, cols = 2 } = $props();

	// How wide a thumbnail shows, so the browser fetches a small enough photo: the reader column is 672px
	// (the page less 48px of padding on narrower screens) with 10px gaps, and below 560px wide two columns
	// become one and three or four become two.
	const SIZES = {
		1: '(min-width: 720px) 672px, calc(100vw - 48px)',
		2: '(min-width: 720px) 331px, (min-width: 560px) calc(50vw - 29px), calc(100vw - 48px)',
		3: '(min-width: 720px) 217px, (min-width: 560px) calc(33vw - 23px), calc(50vw - 29px)',
		4: '(min-width: 720px) 160px, (min-width: 560px) calc(25vw - 20px), calc(50vw - 29px)'
	};
</script>

<!-- Styled in system-map.css rather than here: SvelteKit's CSS inlining drops a component's styles when
	the server build splits them into their own chunk, as it does for this shared component. -->
<div class="gallery cols-{cols}">
	{#each items as item (item.src)}
		{#if item.video}
			<!-- svelte-ignore a11y_media_has_caption (silent clips) -->
			<video class="g-media" controls playsinline preload="metadata">
				<source src={item.src} type="video/mp4" />
			</video>
		{:else}
			<button
				class="g-media g-thumb"
				onclick={() => {
					lightbox.src = item.src;
					lightbox.alt = item.alt;
				}}
				aria-label="Enlarge: {item.alt}"
			>
				<enhanced:img src={picture(item.src)} alt={item.alt} sizes={SIZES[cols]} loading="lazy" />
			</button>
		{/if}
	{/each}
</div>
