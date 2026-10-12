<script>
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} | Dalton Baker</title>
</svelte:head>

<main class="lost">
	<div class="kicker">Signal lost // {page.status}</div>
	<h1>{page.status}</h1>
	<p>{page.status === 404 ? "Sorry, that page doesn't exist." : 'Something went wrong.'}</p>
	<a class="home" href="/">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M19 12H5"></path><path d="M11 6l-6 6 6 6"></path></svg>Go home
	</a>
</main>

<style>
	.lost {
		box-sizing: border-box;
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 24px;
		text-align: center;
	}
	.kicker {
		font: 500 11px/1 'Geist Mono', ui-monospace, monospace;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #c8ff2e;
	}
	h1 {
		margin: 18px 0 0;
		font: 800 clamp(72px, 16vw, 160px)/0.9 'Unbounded', system-ui, sans-serif;
		letter-spacing: -0.04em;
		color: #f1eef7;
		text-shadow: -3px 0 #ff2e88, 3px 0 #c8ff2e;
	}
	p {
		margin: 22px 0 30px;
		font: 400 18px/1.5 'Geist', system-ui, sans-serif;
		color: rgba(241, 238, 247, 0.72);
	}
	.home {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 18px 0 14px;
		border: 1.5px solid #c8ff2e;
		color: #f1eef7;
		text-decoration: none;
		font: 400 16px/1 'Geist', system-ui, sans-serif;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.home:hover {
		background: #c8ff2e;
		color: #07060b;
	}
	.home:focus-visible {
		outline: 2px solid #c8ff2e;
		outline-offset: 2px;
	}
</style>
