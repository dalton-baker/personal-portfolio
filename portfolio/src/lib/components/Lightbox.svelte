<script>
	import { lightbox } from './lightbox.svelte.js';

	const close = () => (lightbox.src = '');
</script>

{#if lightbox.src}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions (Escape is handled by SystemMap) -->
	<div class="lb" role="dialog" aria-modal="true" tabindex="-1" aria-label={lightbox.alt} onclick={close}>
		<img src={lightbox.src} alt={lightbox.alt} />
		<button class="lb-x" onclick={close} aria-label="Close image">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6L6 18"></path></svg>
		</button>
	</div>
{/if}

<style>
	.lb {
		position: fixed;
		inset: 0;
		z-index: 900;
		display: grid;
		place-items: center;
		padding: 56px 16px 24px;
		background: rgba(7, 6, 11, 0.92);
		cursor: zoom-out;
		animation: lbin 0.2s ease-out;
	}
	@keyframes lbin {
		from { opacity: 0; }
	}
	img {
		max-width: 100%;
		max-height: calc(100vh - 96px);
		object-fit: contain;
		border: 1px solid rgba(241, 238, 247, 0.14);
		box-shadow: 0 0 60px rgba(0, 0, 0, 0.8);
	}
	.lb-x {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		padding: 0;
		border: 0;
		background: transparent;
		color: rgba(241, 238, 247, 0.8);
		cursor: pointer;
	}
	.lb-x:hover {
		color: #c8ff2e;
	}
	.lb-x:focus-visible {
		outline: 2px solid #c8ff2e;
		outline-offset: 2px;
	}
</style>
