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

<style>
	.gallery {
		display: grid;
		gap: 10px;
		margin: 30px 0 36px;
	}
	.cols-1 { grid-template-columns: minmax(0, 1fr); }
	.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
	@media (max-width: 559.98px) {
		.cols-2 { grid-template-columns: minmax(0, 1fr); }
		.cols-3, .cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	}
	.g-media {
		display: block;
		width: 100%;
		aspect-ratio: 4 / 3;
		background: #13111c;
		border: 1px solid rgba(241, 238, 247, 0.12);
	}
	/* Clips keep their own shape (most are portrait phone video). */
	video.g-media {
		aspect-ratio: auto;
		height: auto;
		max-height: 80vh;
		align-self: start;
	}
	.g-thumb {
		padding: 0;
		margin: 0;
		overflow: hidden;
		cursor: zoom-in;
		transition: border-color 0.15s;
	}
	.g-thumb img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: opacity 0.15s;
	}
	@media (hover: hover) {
		.g-thumb:hover {
			border-color: #ff2e88;
		}
		.g-thumb:hover img {
			opacity: 0.85;
		}
	}
	.g-thumb:focus-visible {
		outline: 2px solid #c8ff2e;
		outline-offset: 2px;
	}
</style>
