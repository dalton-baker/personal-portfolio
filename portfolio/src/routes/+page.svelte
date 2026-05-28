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

<section class="mb-5 pb-3">
    <h2 class="h3 mb-4 text-center">My Businesses</h2>
    <div class="row g-4">
        <div class="col-md-4">
            <div class="card text-light h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">Reg X Timing</h5>
                    <p class="card-text">Integrated registration, timing, and results platform designed for small to
                        mid-sized races.</p>
                    <a href="https://regxtiming.com" target="_blank"
                        class="btn btn-outline-light btn-sm stretched-link mt-auto align-self-start">View Site</a>
                </div>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card text-light h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">Best Choice Pawn</h5>
                    <p class="card-text">Pawn shop located in Rapid City, South Dakota. Buying, selling, and loaning on a wide variety of items.</p>
                    <a href="https://bestchoicepawn.com/" target="_blank"
                        class="btn btn-outline-light btn-sm stretched-link mt-auto align-self-start">Visit Site</a>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="mb-5 pb-3">
    <h2 class="h3 mb-4 text-center">My Websites</h2>
    <div class="row g-4">
        <div class="col-md-4">
            <div class="card text-light h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">Heartland Tanks Website</h5>
                    <p class="card-text">Custom website for a South Dakota-based tire tank manufacturer. Built for
                        simplicity, performance, and easy maintenance.</p>
                    <a href="https://heartlandtanks.com/" target="_blank"
                        class="btn btn-outline-light btn-sm stretched-link mt-auto align-self-start">Visit Site</a>
                </div>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card text-light h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">Blog: Dalton's Department of Truth</h5>
                    <p class="card-text">A tongue-in-cheek conspiracy blog exploring absurd ideas.</p>
                    <a href="https://truth.dalt.dev" target="_blank"
                        class="btn btn-outline-light btn-sm stretched-link mt-auto align-self-start">Read Blog</a>
                </div>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card text-light h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">dalt.dev Tools</h5>
                    <p class="card-text">A browser-based, locally-running collection of web dev tools, including image utilities for icons, WebP conversions, and more.</p>
                    <a href="https://tools.dalt.dev/" target="_blank"
                        class="btn btn-outline-light btn-sm stretched-link mt-auto align-self-start">Open Tools</a>
                </div>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card text-light h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">State Your Name</h5>
                    <p class="card-text">A space exploration idle game, currently in development. Explore the cosmos at your own pace.</p>
                    <a href="https://state-your-name.dalt.dev/" target="_blank"
                        class="btn btn-outline-light btn-sm stretched-link mt-auto align-self-start">Play Game</a>
                </div>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card text-light h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">Metals Market Display</h5>
                    <p class="card-text">Displays live gold and silver prices with automatic updates. Designed for display in coin and pawn shops. Powered by Cloudflare Workers and R2 storage.</p>
                    <a href="https://metalsmarketdisplay.com/" target="_blank"
                        class="btn btn-outline-light btn-sm stretched-link mt-auto align-self-start">See Live Display</a>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="mb-5 pb-3">
    <h2 class="h3 mb-4 text-center">My Packages</h2>
    <div class="row g-4">
        <div class="col-md-4">
            <div class="card text-light h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">Cosmos DB Query Converter</h5>
                    <p class="card-text">A lightweight NuGet package for writing native Cosmos DB SQL queries with automatic parameterization.</p>
                    <a href="https://www.nuget.org/packages/DBaker.CosmosDbQueryConverter" target="_blank"
                        class="btn btn-outline-light btn-sm stretched-link mt-auto align-self-start">Explore Package</a>
                </div>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card text-light h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">Dependency Registration Attributes</h5>
                    <p class="card-text">A lightweight NuGet package that simplifies dependency injection by letting you register services using C# attributes.</p>
                    <a href="https://www.nuget.org/packages/DBaker.DepRegAttributes" target="_blank"
                        class="btn btn-outline-light btn-sm stretched-link mt-auto align-self-start">Explore Package</a>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="mb-5 pb-3">
    <h2 class="h3 mb-4 text-center">My Projects</h2>
    <div class="row g-4">
        <div class="col-md-4">
            <div class="card text-light h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">8" Dobsonian Telescope</h5>
                    <p class="card-text">A fully custom 8-inch Dobsonian reflector telescope I designed from scratch and 3D printed. Built for deep-sky observing on a budget.</p>
                    <span class="badge bg-secondary mt-auto align-self-start">Coming Soon</span>
                </div>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card text-light h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">Telescope Push-To System</h5>
                    <p class="card-text">A custom push-to navigation system designed for the Apertura AD8 Dobsonian. Uses encoders to help point the telescope at any object in the sky.</p>
                    <span class="badge bg-secondary mt-auto align-self-start">Coming Soon</span>
                </div>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card text-light h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">Scrolling LED Price Sign</h5>
                    <p class="card-text">A scrolling LED sign built for a coin shop that displays live precious metal price data, keeping customers informed in real time.</p>
                    <span class="badge bg-secondary mt-auto align-self-start">Coming Soon</span>
                </div>
            </div>
        </div>
    </div>
</section>
