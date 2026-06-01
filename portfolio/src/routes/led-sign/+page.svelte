<svelte:head>
	<title>Dakota Coin LED Metals Sign | Dalton Baker</title>
</svelte:head>

<script>
    let lightboxSrc = $state('');
    let lightboxAlt = $state('');

    function openLightbox(src, alt) {
        lightboxSrc = src;
        lightboxAlt = alt;
    }

    function closeLightbox() {
        lightboxSrc = '';
    }
</script>

{#if lightboxSrc}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="lightbox-overlay" onclick={closeLightbox}>
        <img src={lightboxSrc} alt={lightboxAlt} class="lightbox-img">
    </div>
{/if}

<div class="card mx-auto p-4 mb-5" style="max-width: 900px;">
    <video class="img-fluid rounded mb-4" autoplay loop muted playsinline>
        <source src="/led-sign/multi-panel-installed-2-final.mp4" type="video/mp4">
    </video>

    <h1 class="mb-4 text-center">The Dakota Coin LED Metals Sign</h1>

    <p>Several years ago, while I was still a student at South Dakota Mines, I built an LED sign for Dakota Coin
        that displayed live precious metals prices.</p>

    <p>It started as a fun shop project during COVID and slowly evolved into one of my longest-running production
        systems. What began as a Raspberry Pi scraping a website and pushing pixels to an LED board eventually
        turned into a small distributed system, then a paid-API-backed service, then a Dockerized home-hosted
        API, and finally a nearly compute-less Cloudflare Workers and R2 setup.</p>

    <p>Not bad for something that started because we had too much time on our hands at the coin shop.</p>

    <h2 class="h3 mt-4 mb-3">The First Prototype</h2>

    <p>The original version was built around a single large 16x32 LED matrix driven by a Raspberry Pi. The Pi ran
        a script that scraped metals prices from a well-known market website, generated an image from that data,
        and then passed the image to another script that scrolled it across the LED sign.</p>

    <p>It worked.</p>

    <p>It was also janky as hell.</p>

    <p>At the same time, Dakota Coin had a large 50-inch TV in the store that displayed a live metals price
        website. When that site went down, we had a hard time finding a better replacement, so I wrote a Python
        program that ran on a laptop attached to the TV. It scraped the same source as the LED sign and displayed
        the data locally.</p>

    <p>That worked too, right up until our IP got blocked.</p>

    <p>Turns out, when multiple devices in the same building scrape the same website every few minutes, the website
        eventually notices. Shocking.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6">
            <video class="w-100 rounded" controls>
                <source src="/led-sign/single-panel-prototype-1-dev.mp4" type="video/mp4">
            </video>
        </div>
        <div class="col-sm-6">
            <video class="w-100 rounded" controls>
                <source src="/led-sign/single-panel-prototype-2-installed.mp4" type="video/mp4">
            </video>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">The First "Cloud" Version</h2>

    <p>To fix that, I built a PHP-based system hosted on my Domain.com account.</p>

    <p>Instead of every display scraping the metals site directly, I moved the scraping to a single server-side
        process. A Raspberry Pi at my house called a protected endpoint on a cron schedule. That endpoint ran PHP
        code, scraped the metals prices, and wrote the latest values into a JSON file.</p>

    <p>From there, I built a simple API for the LED sign to call. I also created
        <a href="https://metalsmarketdisplay.com/" target="_blank">metalsmarketdisplay.com</a>, a website that
        displayed the same live prices. The page refreshed itself every five minutes, giving the shop TV a simple
        always-on display.</p>

    <p>At that point, the system had become a tiny distributed cloud service. One process fetched the data, one
        server hosted it, the LED sign consumed it, and the website displayed it.</p>

    <p>It was crude, but it worked. More importantly, it kept working after I moved out of town.</p>

    <p>That was the first time I built something for a business that just quietly ran for years.</p>

    <h2 class="h3 mt-4 mb-3">Replacing the Scraper</h2>

    <p>Eventually, the scraper broke while I was out of town.</p>

    <p>By then, I was making more money than I had as a college student, so instead of duct-taping the scraper
        back together, I replaced it with a real paid metals API. It was cleaner, more reliable, and much less
        "please don't ban me, mysterious website."</p>

    <p>While I was doing that upgrade, I also switched from writing a JSON file to storing the data in MySQL. It
        came with the hosting plan, so I figured I might as well use it.</p>

    <p>That version ran for a while too.</p>

    <p>Then I had a falling out with Domain.com.</p>

    <p>They were charging me for domains I had already turned off, bumping things into higher tiers without making
        it clear, and generally giving off strong "ancient billing system held together by mold and spite" energy.
        Their tooling felt old, clunky, and weirdly predatory.</p>

    <p>By that point, I had several years of software experience and a much better idea of how I wanted to run
        things.</p>

    <p>So I rebuilt it again.</p>

    <h2 class="h3 mt-4 mb-3">The Docker Era</h2>

    <p>The next version ran as a Docker container.</p>

    <p>The backend was a small API service with a Python script that pulled live metals data from the paid API.
        Since I only had a limited number of API calls per month, the system fetched the data once and served it
        to every consumer from my own API.</p>

    <p>I exposed the service using a Cloudflare Tunnel.</p>

    <p>I also rewrote the website in Blazor WebAssembly and deployed it to Azure Static Web Apps. This was a big
        upgrade over the old PHP page. Instead of refreshing the entire page every five minutes, the site could
        fetch new data dynamically and update the UI in place.</p>

    <p>This version was much cleaner.</p>

    <p>But it still had one huge problem: my apartment internet was now part of the production architecture.</p>

    <p>And my ISP sucked.</p>

    <p>When my home internet went down, the API went down. When the API went down, the LED sign and website
        stopped updating. Hosting a production service out of an apartment is cool right up until you remember
        that residential internet is basically a raccoon wearing a Comcast badge.</p>

    <p>So it was time for another rebuild.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6">
            <video class="w-100 rounded" controls>
                <source src="/led-sign/multi-panel-prototype-1-dev.mp4" type="video/mp4">
            </video>
        </div>
        <div class="col-sm-6">
            <video class="w-100 rounded" controls>
                <source src="/led-sign/multi-panel-prototype-2-dev.mp4" type="video/mp4">
            </video>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">The Cloudflare Version</h2>

    <p>In June 2025, almost exactly a year after the previous major version, I rebuilt the system again. This
        time, I used Cloudflare Workers and R2.</p>

    <p>The backend became dramatically simpler.</p>

    <p>A cron-triggered Worker runs every five minutes. It pulls the current prices for silver, gold, platinum,
        and palladium from the paid API. Then it writes the results to R2 blob storage.</p>

    <p>There is no database.</p>

    <p>There is no always-running server.</p>

    <p>There is no home internet connection holding the whole thing hostage.</p>

    <p>The Worker writes a "current" blob with the latest prices and another blob containing a rolling week of
        historical values for charts. The public API is really just R2 serving those blobs directly.</p>

    <p>The best part is that Cloudflare lets you hide that implementation detail cleanly. The blobs do not need
        file extensions. I set the content type and cache headers myself, route
        <code>api.metalsmarketdisplay.com</code> to the storage, and the outside world sees what looks like a
        normal API.</p>

    <p>In reality, most requests are just retrieving static objects from Cloudflare's edge.</p>

    <p>That is the kind of boring architecture I love. Boring means reliable. Boring means cheap. Boring means I
        am not getting a text because my apartment modem shit itself.</p>

    <h2 class="h3 mt-4 mb-3">The Current Frontend</h2>

    <p>I rewrote the frontend again too, this time in Svelte.</p>

    <p>The site uses a static adapter and is deployed to Cloudflare. It is extremely lightweight, fast, and
        simple. The frontend fetches the current metals data and chart history from the R2-backed API, then
        updates the display dynamically.</p>

    <p>This is the fastest and simplest version the site has ever had.</p>

    <p>The API is effectively compute-less for readers. The site itself is static. The Worker only wakes up every
        five minutes to refresh the data.</p>

    <p>The whole thing uses a tiny fraction of my free Cloudflare resources. Not "tiny" in the hand-wavy
        marketing sense. I mean around 0.288% of the free tier.</p>

    <p>That is not a typo. That is the actual number.</p>

    <h2 class="h3 mt-4 mb-3">Updating the LED Sign and Shop Display</h2>

    <p>The LED sign only needed small changes for the final upgrade.</p>

    <p>Originally, it had its own dedicated endpoint with a custom data shape. In the Cloudflare version, I merged
        that into the main <code>current</code> endpoint, along with the historical endpoints used by the website
        charts.</p>

    <p>Once the backend and frontend were upgraded, I also replaced the old laptop connected to the shop TV.</p>

    <p>That laptop had been running an ancient version of Ubuntu for years. If it shut down or lost the page,
        someone at the shop had to mess with it to get the display working again. It was exactly the kind of
        fragile setup that works fine until a normal human has to touch it.</p>

    <p>So I replaced it with an old Raspberry Pi 4.</p>

    <p>I configured the Pi in kiosk mode, pointed it at the metals display site, and added a few quality-of-life
        improvements like automatic nightly reboots. Now the shop display boots directly into the site and does
        its job without anyone needing to know or care what is running underneath.</p>

    <p>That is the ideal state for business software: invisible, reliable, and boring.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6">
            <video class="w-100 rounded" controls>
                <source src="/led-sign/multi-panel-installed-1.mp4" type="video/mp4">
            </video>
        </div>
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/led-sign/multi-panel-installed-3-inside.jpeg', 'LED sign hardware mounted inside the enclosure')}>
                <img src="/led-sign/multi-panel-installed-3-inside.jpeg" class="thumb-img rounded" alt="LED sign hardware mounted inside the enclosure">
            </button>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">What I Like About This Project</h2>

    <p>This project is still one of my favorites because it shows my growth as a developer in a very concrete
        way.</p>

    <p>The first version was a student project: scrape a page, generate an image, scroll it across an LED board,
        and pray.</p>

    <p>The second version centralized the scraping and turned it into a crude API.</p>

    <p>The third version replaced scraping with a real paid data source and introduced a database.</p>

    <p>The fourth version containerized the API and used Cloudflare Tunnel.</p>

    <p>The current version uses Workers, R2, static hosting, edge caching, and a frontend that is faster and
        simpler than anything before it.</p>

    <p>Every version solved the biggest problem with the version before it.</p>

    <p>That is basically software engineering in miniature. Build the thing. Watch it fail in a specific and
        annoying way. Then make it less stupid.</p>

    <p>The Dakota Coin LED sign has been running in some form for years now. It started as a COVID-era project at
        a coin shop and turned into a real production system that serves live metals data to an in-store LED sign,
        a shop TV display, and a public website.</p>

    <p>And the final version is exactly what I wanted it to become: simple, cheap, fast, and reliable.</p>

    <div class="mt-4">
        <a href="/" class="btn btn-outline-light btn-sm">&larr; Back to Portfolio</a>
    </div>
</div>

<style>
    .thumb-btn {
        display: block;
        width: 100%;
        padding: 0;
        background: none;
        border: none;
        cursor: zoom-in;
    }

    .thumb-img {
        width: 100%;
        height: 200px;
        object-fit: cover;
        display: block;
        transition: opacity 0.15s ease;
    }

    .thumb-btn:hover .thumb-img {
        opacity: 0.85;
    }

    .lightbox-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1050;
        cursor: zoom-out;
        padding: 1rem;
    }

    .lightbox-img {
        max-width: 100%;
        max-height: 90vh;
        border-radius: 0.375rem;
        object-fit: contain;
        box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
    }
</style>
