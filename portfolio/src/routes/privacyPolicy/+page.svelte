<svelte:head>
	<title>Privacy Policy | Dalton Baker</title>
</svelte:head>

<main class="page">
	<a class="home" href="/">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M19 12H5"></path><path d="M11 6l-6 6 6 6"></path></svg>Back to orbit
	</a>

	<div class="kicker">sys://daltonsbaker.com — legal</div>
	<h1>Privacy Policy</h1>

	<p><strong>Effective Date:</strong> January 1, 2025</p>

	<p>This privacy policy applies to all websites and projects operated by <strong>Dalton Baker</strong>,
		including but not limited to personal portfolio pages, experimental apps, and side projects. This is a
		general catch-all policy for small or experimental sites that don’t collect much — if any — data.</p>

	<h2>Information We Collect</h2>
	<p>Most of my sites do not collect personal information directly. However, certain hosted services (like
		analytics or embedded content) may automatically collect basic technical data such as your IP address,
		browser type, or pages visited.</p>

	<h2>Use of Information</h2>
	<p>Any data collected is used only to improve site performance, monitor traffic, or fix problems. I don’t
		sell, rent, or share your data with anyone, and frankly, I don't want to know about your browsing habits
	</p>

	<h2>Cookies</h2>
	<p>Some sites may use cookies for simple session handling or analytics. You can block them in your browser
		settings without breaking much (if anything).</p>

	<h2>Third-Party Services</h2>
	<p>Some projects may use third-party integrations like Cloudflare, GitHub Pages, Azure, or Google Analytics.
		These services have their own privacy policies, and they might collect limited technical data on their
		behalf.</p>

	<h2>Contact</h2>
	<p>If you have privacy concerns or want something removed, you can reach me at
		<a href="mailto:dalton.s.baker@gmail.com">dalton.s.baker@gmail.com</a>.
	</p>
</main>

<style>
	.page {
		box-sizing: border-box;
		max-width: 720px;
		margin: 0 auto;
		padding: 32px 24px 96px;
	}
	.home {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 16px 0 12px;
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
	.home:focus-visible,
	a:focus-visible {
		outline: 2px solid #c8ff2e;
		outline-offset: 2px;
	}
	.kicker {
		margin-top: 56px;
		font: 500 11px/1 'Geist Mono', ui-monospace, monospace;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #c8ff2e;
	}
	h1 {
		margin: 18px 0 32px;
		font: 800 clamp(34px, 5.4vw, 60px)/1 'Unbounded', system-ui, sans-serif;
		letter-spacing: -0.035em;
		color: #f1eef7;
	}
	h2 {
		margin: 44px 0 14px;
		font: 800 20px/1.15 'Unbounded', system-ui, sans-serif;
		letter-spacing: -0.02em;
		color: #f1eef7;
	}
	p {
		margin: 0 0 20px;
		font: 400 17px/1.7 'Geist', system-ui, sans-serif;
		color: rgba(241, 238, 247, 0.86);
	}
	strong {
		font-weight: 600;
		color: #f1eef7;
	}
	p a {
		color: #c8ff2e;
		text-underline-offset: 3px;
	}
	p a:hover {
		color: #e4ff9a;
	}
</style>
