<svelte:head>
	<title>3D-Printed Telescope | Dalton Baker</title>
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
    <img src="/telescope-build/assembled-in-field.jpeg" class="img-fluid rounded mb-4" alt="Telescope assembled in the field">

    <h1 class="mb-4 text-center">Building a 3D-Printed Telescope</h1>

    <p>Around 2020, I acquired an old Optical Craftsman telescope on a cast iron equatorial mount. It was my first real
        telescope, and it was a great way to learn the basics of observing, alignment, eyepieces, mounts, and the
        general mechanics of a reflecting telescope.</p>

    <p>It worked well, but it was also large, heavy, and not very practical once I moved into apartments. The cast iron
        mount was solid, but it was not something I wanted to haul around every time I wanted to observe.</p>

    <p>In early 2025, I decided to reuse the mirror and secondary from that telescope and build a new, more portable
        scope around them.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/original_scope.JPG', 'Original Optical Craftsman telescope')}>
                <img src="/telescope-build/original_scope.JPG" class="thumb-img rounded" alt="Original Optical Craftsman telescope">
            </button>
        </div>
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/origina_scope_in_car.jpeg', 'Original telescope in car')}>
                <img src="/telescope-build/origina_scope_in_car.jpeg" class="thumb-img rounded" alt="Original telescope in car">
            </button>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">Starting the Design</h2>

    <p>This project also became my reason to buy my first 3D printer.</p>

    <p>At the start, I had no CAD experience. I began with Tinkercad, which was useful for getting comfortable with the
        basic idea of modeling parts, but I quickly ran into its limits. The telescope needed more precise and reusable
        designs than Tinkercad was really suited for.</p>

    <p>After that, I moved to Onshape and designed the real scope there.</p>

    <p>Over the course of February 2025, I designed, printed, tested, adjusted, and assembled the telescope. The goal
        was to create a lightweight truss-style Dobsonian using 3D-printed structural components wherever practical.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/onshape-mirror-box.png', 'Onshape mirror box design')}>
                <img src="/telescope-build/onshape-mirror-box.png" class="thumb-img rounded" alt="Onshape mirror box design">
            </button>
        </div>
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/onshape-tube.png', 'Onshape tube design')}>
                <img src="/telescope-build/onshape-tube.png" class="thumb-img rounded" alt="Onshape tube design">
            </button>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">Materials and Structure</h2>

    <p>The telescope reused the primary mirror, secondary mirror, and focusser from the old Optical Craftsman scope.</p>

    <p>The new structure used 3D-printed parts for the mirror box, upper assembly, rail mounts, and other structural
        pieces. For the trusses, I used half-inch, four-foot-long aluminum pipe. For tensioning and support, I used
        thin braided steel cable.</p>

    <p>The large circular side rails were printed in sections and assembled after printing. Since the parts were too
        large to print as single pieces, the design had to account for how the sections would connect and stay
        aligned.</p>

    <p>The result was a much lighter and more portable telescope than the original equatorial-mounted scope.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/printing-mirror-box.jpeg', 'Printing the mirror box')}>
                <img src="/telescope-build/printing-mirror-box.jpeg" class="thumb-img rounded" alt="Printing the mirror box">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/printing-mirror-cell.jpeg', 'Printing the mirror cell')}>
                <img src="/telescope-build/printing-mirror-cell.jpeg" class="thumb-img rounded" alt="Printing the mirror cell">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/test-fit-mirrorbox.jpeg', 'Test fitting the mirror box')}>
                <img src="/telescope-build/test-fit-mirrorbox.jpeg" class="thumb-img rounded" alt="Test fitting the mirror box">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/test-fit-mirror-box-2.jpeg', 'Test fitting the mirror box (2)')}>
                <img src="/telescope-build/test-fit-mirror-box-2.jpeg" class="thumb-img rounded" alt="Test fitting the mirror box (2)">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/test-fit-mirror-box-4.jpeg', 'Test fitting the mirror box (4)')}>
                <img src="/telescope-build/test-fit-mirror-box-4.jpeg" class="thumb-img rounded" alt="Test fitting the mirror box (4)">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/test-fit-mirror-box-mirror.jpeg', 'Test fitting the mirror in the mirror box')}>
                <img src="/telescope-build/test-fit-mirror-box-mirror.jpeg" class="thumb-img rounded" alt="Test fitting the mirror in the mirror box">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/test-fit-truss.jpeg', 'Test fitting the truss')}>
                <img src="/telescope-build/test-fit-truss.jpeg" class="thumb-img rounded" alt="Test fitting the truss">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/first-assembly.jpeg', 'First assembly')}>
                <img src="/telescope-build/first-assembly.jpeg" class="thumb-img rounded" alt="First assembly">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/assembled-truss.jpeg', 'Assembled truss')}>
                <img src="/telescope-build/assembled-truss.jpeg" class="thumb-img rounded" alt="Assembled truss">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/assembled-truss-size-compare.jpeg', 'Assembled truss size comparison')}>
                <img src="/telescope-build/assembled-truss-size-compare.jpeg" class="thumb-img rounded" alt="Assembled truss size comparison">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/assembled-upper-cage-close.jpeg', 'Assembled upper cage close-up')}>
                <img src="/telescope-build/assembled-upper-cage-close.jpeg" class="thumb-img rounded" alt="Assembled upper cage close-up">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/assembled-top-cage.jpeg', 'Assembled top cage')}>
                <img src="/telescope-build/assembled-top-cage.jpeg" class="thumb-img rounded" alt="Assembled top cage">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/assembled-on-balcony.jpeg', 'Assembled telescope on balcony')}>
                <img src="/telescope-build/assembled-on-balcony.jpeg" class="thumb-img rounded" alt="Assembled telescope on balcony">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/assembled-on-balcony-2.jpeg', 'Assembled telescope on balcony (2)')}>
                <img src="/telescope-build/assembled-on-balcony-2.jpeg" class="thumb-img rounded" alt="Assembled telescope on balcony (2)">
            </button>
        </div>
    </div>

    <div class="row justify-content-center my-3">
		<div class="col-sm-6 col-md-4">
			<video class="rounded" style="max-width: 20rem;" controls>
	            <source src="/telescope-build/alt-az-example.mp4" type="video/mp4">
	        </video>
		</div>
    </div>

    <h2 class="h3 mt-4 mb-3">First Field Test</h2>

    <p>In March 2025, I took the telescope out for a real observing trip during the lunar eclipse on March 14th. The
        eclipse peaked around 1am.</p>

    <p>During that trip, I successfully observed the Moon, M81, and M82. I was mostly using an old Circle T 25mm
        Japanese volcano-top eyepiece, which worked pretty well with the scope.</p>

    <p>That trip proved the telescope worked, but it also showed me where the design needed improvement.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/assembled-in-field.jpeg', 'Telescope assembled in the field')}>
                <img src="/telescope-build/assembled-in-field.jpeg" class="thumb-img rounded" alt="Telescope assembled in the field">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/lunar-eclipse-in-field.jpeg', 'Lunar eclipse in the field')}>
                <img src="/telescope-build/lunar-eclipse-in-field.jpeg" class="thumb-img rounded" alt="Lunar eclipse in the field">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/moon-pics-in-field.jpeg', 'Moon pictures in the field')}>
                <img src="/telescope-build/moon-pics-in-field.jpeg" class="thumb-img rounded" alt="Moon pictures in the field">
            </button>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">Post-Trip Upgrades</h2>

    <p>After the first field test, I made a few upgrades.</p>

    <p>The circular rail mounts needed reinforcement, so I added a truss to each one. Before that, they acted too much
        like springs and made the telescope bouncy.</p>

    <p>I also added a shroud. Stray light was a major issue with the open truss design, and the background field looked
        much lighter than it should have. It's a miracle I was able to observe galaxies with it.</p>

    <p>Finally, I added tick marks for altitude and azimuth as an early manual pointing system. The idea was useful,
        but I flipped the altitude values, so that version did not work as intended.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/az-rail-stiffening-upgrade.jpeg', 'Azimuth rail stiffening upgrade')}>
                <img src="/telescope-build/az-rail-stiffening-upgrade.jpeg" class="thumb-img rounded" alt="Azimuth rail stiffening upgrade">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/alt-measurments-upgrade.jpeg', 'Altitude measurements upgrade')}>
                <img src="/telescope-build/alt-measurments-upgrade.jpeg" class="thumb-img rounded" alt="Altitude measurements upgrade">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/telescope-build/az-measurment-upgrade.jpeg', 'Azimuth measurement upgrade')}>
                <img src="/telescope-build/az-measurment-upgrade.jpeg" class="thumb-img rounded" alt="Azimuth measurement upgrade">
            </button>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">Final Result</h2>

    <p>The finished telescope was lightweight, portable, and usable in the field. It started as an old, heavy telescope
        that was difficult to use after moving into an apartment, and it became a compact 3D-printed truss Dobsonian
        that I could actually take outside and observe with.</p>

    <p>The project taught me a lot about CAD, 3D printing, telescope mechanics, stiffness, balance, and the difference
        between something that looks good in a model and something that works under the night sky.</p>

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
