<svelte:head>
	<title>Dalton Baker | Portfolio</title>
</svelte:head>

<script>
    import pdfUrl from '$lib/assets/DaltonBakerResume.pdf?url'
</script>

<section class="text-center mt-4">
    <img src="logo.svg" style="height: 5rem;">
    <h1 class="display-4">Hi, I'm Dalton</h1>
    <p class="lead">Software engineer. Maker. Builder of things both useful and ridiculous.</p>
</section>

<section class="text-center mb-5">
    <h2 class="h4 mb-3">Connect with me</h2>
    <div class="d-flex justify-content-center gap-3 flex-wrap">
        <a href="https://github.com/dalton-baker" target="_blank"
            class="btn btn-outline-light btn-sm">GitHub</a>
        <a href="https://www.linkedin.com/in/dalton-baker" target="_blank"
            class="btn btn-outline-light btn-sm">LinkedIn</a>
        <a href="{pdfUrl}" target="_blank" class="btn btn-outline-light btn-sm">Resume</a>
        <a href="mailto:dalton.s.baker@gmail.com"
            class="btn btn-outline-light btn-sm">Email</a>
    </div>
</section>

<section class="row g-4 justify-content-center">
    <div class="col-md-4">
        <div class="card text-light h-100">
            <div class="card-body">
                <h5 class="card-title">Race Management Platform</h5>
                <p class="card-text">Integrated registration, timing, and results platform designed for small to
                    mid-sized races.</p>
                <a href="https://regxtiming.com" target="_blank"
                    class="btn btn-outline-light btn-sm stretched-link">View Project</a>
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="card text-light h-100">
            <div class="card-body">
                <h5 class="card-title">Dependency Registration Attributes</h5>
                <p class="card-text">A lightweight NuGet package that simplifies dependency injection by letting you register services using C# attributes.</p>
                <a href="https://www.nuget.org/packages/DBaker.DepRegAttributes" target="_blank"
                    class="btn btn-outline-light btn-sm stretched-link">Explore Package</a>
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="card text-light h-100">
            <div class="card-body">
                <h5 class="card-title">Cosmos DB Query Converter</h5>
                <p class="card-text">A lightweight NuGet package for writing native Cosmos DB SQL queries with automatic parameterization.</p>
                <a href="https://www.nuget.org/packages/DBaker.CosmosDbQueryConverter" target="_blank"
                    class="btn btn-outline-light btn-sm stretched-link">Explore Package</a>
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="card text-light h-100">
            <div class="card-body">
                <h5 class="card-title">Heartland Tanks Website</h5>
                <p class="card-text">Custom website for a South Dakota-based tire tank manufacturer. Built for
                    simplicity, performance, and easy maintenance.</p>
                <a href="https://heartlandtanks.com/" target="_blank"
                    class="btn btn-outline-light btn-sm stretched-link">Visit Site</a>
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="card text-light h-100">
            <div class="card-body">
                <h5 class="card-title">Metals Market Display</h5>
                <p class="card-text">Displays live gold and silver prices with automatic updates. Powered by
                    Cloudflare Workers and R2 storage.</p>
                <a href="https://metalsmarketdisplay.com/" target="_blank"
                    class="btn btn-outline-light btn-sm stretched-link">See Live Display</a>
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="card text-light h-100">
            <div class="card-body">
                <h5 class="card-title">Blog: Dalton’s Department of Truth</h5>
                <p class="card-text">A tongue-in-cheek conspiracy blog exploring absurd ideas.</p>
                <a href="https://truth.dalt.dev" target="_blank"
                    class="btn btn-outline-light btn-sm stretched-link">Read Blog</a>
            </div>
        </div>
    </div>
</section>
