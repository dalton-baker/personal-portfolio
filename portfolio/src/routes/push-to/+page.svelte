<svelte:head>
	<title>ESP32-S3 Push-To Telescope System | Dalton Baker</title>
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
    <img src="/push-to-esp-32/full-working-1.jpeg" class="img-fluid rounded mb-4" alt="Push-to system fully installed on the Apertura AD8">

    <h1 class="mb-4 text-center">ESP32-S3 Push-To Telescope System</h1>

    <p>After building a 3D-printed Dobsonian from scratch, the natural next problem was finding things with it. A
        Dobsonian is a purely manual mount — no motors, no tracking, no goto. Finding a faint galaxy or globular
        cluster in the dark requires either memorizing star hops or spending a frustrating amount of time scanning
        the wrong patch of sky.</p>

    <p>I wanted something in between. Not a full GoTo system with motors and a hand controller, but a simple
        digital aid that tells me where the telescope is currently pointing so I can manually push it to the right
        coordinates. That concept is called a push-to system, and this is the one I built for my Apertura AD8
        Dobsonian.</p>

    <p>The system uses an ESP32-S3 microcontroller, a magnetic rotary encoder for azimuth, an accelerometer for
        altitude, and a small OLED display. When set up, it shows live Alt/Az and RA/Dec. The user looks up the
        target coordinates on their phone, then manually moves the telescope until the numbers match.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/full-working-1.jpeg', 'Push-to system fully installed on the Apertura AD8')}>
                <img src="/push-to-esp-32/full-working-1.jpeg" class="thumb-img rounded" alt="Push-to system fully installed on the Apertura AD8">
            </button>
        </div>
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/full-working-2.jpeg', 'Push-to system fully installed, second view')}>
                <img src="/push-to-esp-32/full-working-2.jpeg" class="thumb-img rounded" alt="Push-to system fully installed, second view">
            </button>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">The Breadboard Prototype</h2>

    <p>Before committing to soldered boards and 3D-printed enclosures, I wired the whole thing up on a breadboard.
        The goal was to prove that the sensors worked, that the coordinate math was correct, and that the overall
        concept was worth pursuing.</p>

    <p>The prototype used a Seeed Studio XIAO ESP32-S3, an MPU-6050 accelerometer for altitude, an AS5600 magnetic
        rotary encoder for azimuth, and a 0.96-inch OLED display, all wired together with jumper wires on a
        breadboard. It was messy, but it worked.</p>

    <p>Once I confirmed the readings looked right and the coordinate transformations were producing sensible
        output, I moved on to building the real version.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/esp32-raw-1.jpeg', 'ESP32-S3 on perf board')}>
                <img src="/push-to-esp-32/esp32-raw-1.jpeg" class="thumb-img rounded" alt="ESP32-S3 on perf board">
            </button>
        </div>
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/esp32-raw-2.jpeg', 'ESP32-S3 on perf board, second view')}>
                <img src="/push-to-esp-32/esp32-raw-2.jpeg" class="thumb-img rounded" alt="ESP32-S3 on perf board, second view">
            </button>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">Sensors</h2>

    <p>The system uses two sensors: one for altitude and one for azimuth.</p>

    <p>Altitude is handled by the MPU-6050, a combined accelerometer and gyroscope module. Only the accelerometer
        is used here — it measures the tilt angle of the telescope tube. To reduce jitter and stabilize the
        display, the firmware averages the last ten readings. The result is smooth enough to aim by.</p>

    <p>Azimuth is handled by the AS5600, an absolute magnetic rotary encoder. A small magnet is mounted on the
        rotating base of the telescope, and the AS5600 reads its angular position directly. Because it is an
        absolute encoder, it reports the full current angle rather than only tracking incremental movement, which
        means there is no drift to accumulate. The firmware calculates an offset during the alignment step so the
        reported azimuth is relative to north rather than to wherever the magnet happened to be on startup.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6 col-md-3">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/alt-raw-1.jpeg', 'MPU-6050 altitude sensor on perf board')}>
                <img src="/push-to-esp-32/alt-raw-1.jpeg" class="thumb-img rounded" alt="MPU-6050 altitude sensor on perf board">
            </button>
        </div>
        <div class="col-sm-6 col-md-3">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/alt-raw-2.jpeg', 'MPU-6050 altitude sensor on perf board, second view')}>
                <img src="/push-to-esp-32/alt-raw-2.jpeg" class="thumb-img rounded" alt="MPU-6050 altitude sensor on perf board, second view">
            </button>
        </div>
        <div class="col-sm-6 col-md-3">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/az-raw-1.jpeg', 'AS5600 azimuth encoder on perf board')}>
                <img src="/push-to-esp-32/az-raw-1.jpeg" class="thumb-img rounded" alt="AS5600 azimuth encoder on perf board">
            </button>
        </div>
        <div class="col-sm-6 col-md-3">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/az-raw-2.jpeg', 'AS5600 azimuth encoder on perf board, second view')}>
                <img src="/push-to-esp-32/az-raw-2.jpeg" class="thumb-img rounded" alt="AS5600 azimuth encoder on perf board, second view">
            </button>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">Display</h2>

    <p>The display is a 0.96-inch 128x64 OLED, white, running an SSD1306 controller over I2C. It is small but
        perfectly readable, and bright enough to see without being blinding in the dark.</p>

    <p>For night observing, harsh white light is the enemy. I layered green gel filters over the display to shift
        the color and reduce the intensity. It makes the display much more eye-friendly after dark and helps
        preserve night vision between glances at the screen.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/display-raw-1.jpeg', 'OLED display on perf board')}>
                <img src="/push-to-esp-32/display-raw-1.jpeg" class="thumb-img rounded" alt="OLED display on perf board">
            </button>
        </div>
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/display-raw-2.jpeg', 'OLED display on perf board, second view')}>
                <img src="/push-to-esp-32/display-raw-2.jpeg" class="thumb-img rounded" alt="OLED display on perf board, second view">
            </button>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">Wiring</h2>

    <p>All components communicate over I2C. The wiring between the ESP32 and the sensors and display uses CAT5
        cable. The twisted pairs in CAT5 are a natural fit for this kind of signal wiring: SCL is twisted with a
        ground wire, SDA is twisted with a ground wire, and the positive power line is twisted with a ground wire
        as well.</p>

    <p>Twisting signal lines with ground helps reduce noise pickup and makes the wiring more robust than loose
        jumper wires strung across the telescope. It also keeps things neat and manageable once the telescope is
        fully wired up in the field.</p>

    <h2 class="h3 mt-4 mb-3">Perf Boards</h2>

    <p>Once the breadboard prototype confirmed the design, I soldered each component onto its own perf board. Each
        board got a small ceramic capacitor and a larger electrolytic capacitor across power — a 1 nF cap and
        roughly 100 µF respectively. The caps help stabilize power at each component and reduce the kind of
        noise that tends to appear when running I2C and power over longer cable runs.</p>

    <p>Soldering to perf board is slower than using a proper PCB, but it is a good middle ground between a
        breadboard that falls apart and a custom board that requires a full design and fabrication cycle.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/esp32-raw-1.jpeg', 'ESP32-S3 controller board')}>
                <img src="/push-to-esp-32/esp32-raw-1.jpeg" class="thumb-img rounded" alt="ESP32-S3 controller board">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/alt-raw-1.jpeg', 'Altitude sensor board')}>
                <img src="/push-to-esp-32/alt-raw-1.jpeg" class="thumb-img rounded" alt="Altitude sensor board">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/az-raw-1.jpeg', 'Azimuth encoder board')}>
                <img src="/push-to-esp-32/az-raw-1.jpeg" class="thumb-img rounded" alt="Azimuth encoder board">
            </button>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">3D-Printed Enclosures</h2>

    <p>Each component got its own 3D-printed case in PLA. The cases protect the boards, provide mounting points,
        and keep the telescope looking organized rather than like a wiring disaster.</p>

    <p>Most of the cases were straightforward to design, but the azimuth mount was the hardest mechanical problem
        of the entire project. The AS5600 needs to sit at a precise distance from the magnet — too far and the
        reading gets unreliable, too close and there is a risk of contact. The mount also needed to adjust for
        variable height, align the sensor cleanly with the magnet's axis, and attach solidly to the base of the
        Apertura AD8 without wobbling. Getting all of that right at the same time required several iterations.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/esp32-case-1.jpeg', 'ESP32 controller case')}>
                <img src="/push-to-esp-32/esp32-case-1.jpeg" class="thumb-img rounded" alt="ESP32 controller case">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/esp32-case-2.jpeg', 'ESP32 controller case, second view')}>
                <img src="/push-to-esp-32/esp32-case-2.jpeg" class="thumb-img rounded" alt="ESP32 controller case, second view">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/esp32-case-3.jpeg', 'ESP32 controller case, third view')}>
                <img src="/push-to-esp-32/esp32-case-3.jpeg" class="thumb-img rounded" alt="ESP32 controller case, third view">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/alt-case-1.jpeg', 'Altitude sensor case')}>
                <img src="/push-to-esp-32/alt-case-1.jpeg" class="thumb-img rounded" alt="Altitude sensor case">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/alt-case-2.jpeg', 'Altitude sensor case, second view')}>
                <img src="/push-to-esp-32/alt-case-2.jpeg" class="thumb-img rounded" alt="Altitude sensor case, second view">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/alt-case-3.jpeg', 'Altitude sensor case, third view')}>
                <img src="/push-to-esp-32/alt-case-3.jpeg" class="thumb-img rounded" alt="Altitude sensor case, third view">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/display-case-1.jpeg', 'Display case')}>
                <img src="/push-to-esp-32/display-case-1.jpeg" class="thumb-img rounded" alt="Display case">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/display-case-2.jpeg', 'Display case, second view')}>
                <img src="/push-to-esp-32/display-case-2.jpeg" class="thumb-img rounded" alt="Display case, second view">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/display-case-3.jpeg', 'Display case, third view')}>
                <img src="/push-to-esp-32/display-case-3.jpeg" class="thumb-img rounded" alt="Display case, third view">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/display-case-4.jpeg', 'Display case, fourth view')}>
                <img src="/push-to-esp-32/display-case-4.jpeg" class="thumb-img rounded" alt="Display case, fourth view">
            </button>
        </div>
    </div>

    <p>The azimuth assembly involved a knob adapter that clips onto the existing azimuth knob of the AD8 base,
        holding the magnet at the right height and angle for the AS5600 to read it cleanly.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/az-case-1.jpeg', 'Azimuth encoder case')}>
                <img src="/push-to-esp-32/az-case-1.jpeg" class="thumb-img rounded" alt="Azimuth encoder case">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/az-case-2.jpeg', 'Azimuth encoder case, second view')}>
                <img src="/push-to-esp-32/az-case-2.jpeg" class="thumb-img rounded" alt="Azimuth encoder case, second view">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/az-case-3.jpeg', 'Azimuth encoder case, third view')}>
                <img src="/push-to-esp-32/az-case-3.jpeg" class="thumb-img rounded" alt="Azimuth encoder case, third view">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/az-case-4.jpeg', 'Azimuth encoder case, fourth view')}>
                <img src="/push-to-esp-32/az-case-4.jpeg" class="thumb-img rounded" alt="Azimuth encoder case, fourth view">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/az-case-5.jpeg', 'Azimuth encoder case, fifth view')}>
                <img src="/push-to-esp-32/az-case-5.jpeg" class="thumb-img rounded" alt="Azimuth encoder case, fifth view">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/full-az-adapter-underside.jpeg', 'Azimuth adapter underside')}>
                <img src="/push-to-esp-32/full-az-adapter-underside.jpeg" class="thumb-img rounded" alt="Azimuth adapter underside">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/az-knob-adapter-1.jpeg', 'Azimuth knob adapter')}>
                <img src="/push-to-esp-32/az-knob-adapter-1.jpeg" class="thumb-img rounded" alt="Azimuth knob adapter">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/az-knob-adapter-2.jpeg', 'Azimuth knob adapter, second view')}>
                <img src="/push-to-esp-32/az-knob-adapter-2.jpeg" class="thumb-img rounded" alt="Azimuth knob adapter, second view">
            </button>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">Installing on the Telescope</h2>

    <p>With each component cased and wired, I installed everything on the AD8. The azimuth knob adapter goes on
        first, followed by the AS5600 sensor assembly that reads the magnet as the base rotates. The altitude
        sensor mounts on the telescope tube, the display mounts within easy view at the eyepiece end, and the
        ESP32 controller board sits between them, connected to everything via CAT5 runs.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/telescope-install-1-az-knob-adapter.jpeg', 'Azimuth knob adapter installed on telescope')}>
                <img src="/push-to-esp-32/telescope-install-1-az-knob-adapter.jpeg" class="thumb-img rounded" alt="Azimuth knob adapter installed on telescope">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/telescope-install-2-az-assembly.jpeg', 'Azimuth assembly installed on telescope')}>
                <img src="/push-to-esp-32/telescope-install-2-az-assembly.jpeg" class="thumb-img rounded" alt="Azimuth assembly installed on telescope">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/telescope-install-3-alt-blury.jpeg', 'Altitude sensor installed on telescope tube')}>
                <img src="/push-to-esp-32/telescope-install-3-alt-blury.jpeg" class="thumb-img rounded" alt="Altitude sensor installed on telescope tube">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/telescope-install-4-screen.jpeg', 'Display mounted near eyepiece')}>
                <img src="/push-to-esp-32/telescope-install-4-screen.jpeg" class="thumb-img rounded" alt="Display mounted near eyepiece">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/telescope-install-5-fully-wired-with-bat.jpeg', 'Telescope fully wired with battery')}>
                <img src="/push-to-esp-32/telescope-install-5-fully-wired-with-bat.jpeg" class="thumb-img rounded" alt="Telescope fully wired with battery">
            </button>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">Setup and Calibration</h2>

    <p>When the device powers on, it starts a Wi-Fi access point and hosts a small setup server. The user
        connects from a phone and navigates to <code>setup.local</code>. From there, they enter their latitude
        and longitude, sync the current time, and pick one or two known stars to align on.</p>

    <p>The system supports two alignment modes. One-star alignment does a simple pointing offset and works well
        when the base is reasonably level. Two-star alignment does a spherical calculation from two reference
        points, which means the base does not need to be perfectly level — much more forgiving for real-world
        conditions where you just set the telescope down and start observing.</p>

    <p>The alignment star database holds around 450 well-known stars with magnitudes below 5. It exists purely
        for calibration, not for target browsing, so it intentionally excludes planets, galaxies, nebulae, and
        anything that moves. Once setup is complete, the Wi-Fi server shuts down to conserve battery, and the
        OLED takes over showing live coordinates.</p>

    <h2 class="h3 mt-4 mb-3">The Observing Workflow</h2>

    <p>After calibration the workflow is simple: look up the coordinates for your target on your phone using
        Telescopius or another astronomy source, then push the telescope until the numbers on the display match.
        When they do, put your eye to the eyepiece and make small sweeps to finish centering. The push-to system
        does not know what you are looking for. It just tells you where you are pointing.</p>

    <p>This is not a billion-dollar NASA instrument. The goal is to get close enough that your eye can finish the
        job, and by that standard it works extremely well.</p>

    <h2 class="h3 mt-4 mb-3">The Most Painful Bug</h2>

    <p>The design worked mostly on the first try. The one exception was a debugging episode that lasted about two
        days. The coordinate readouts were wrong in a way that looked like a serious math error. I went back
        through the spherical geometry, the sensor fusion, the time sync, all of it.</p>

    <p>The problem was my longitude. I had entered it with the wrong sign. The system was doing the math
        correctly the entire time. Nothing like being betrayed by geography.</p>

    <h2 class="h3 mt-4 mb-3">First Live Session — May 14, 2026</h2>

    <p>The first real observing session used Pollux as the set star. From there:</p>

    <p><strong>Jupiter</strong> — looked up its Alt/Az on Telescopius and pushed the scope into position. Found
        it in around 20 seconds. Jupiter was fairly close to Pollux, so it was a good confidence check but not a
        demanding one.</p>

    <p><strong>Capella</strong> — much farther from Pollux than Jupiter was. Looked up the coordinates, moved
        the scope. Found it in under a minute. This was a stronger proof that the system was actually tracking
        the sky correctly across a wider range of motion.</p>

    <p><strong>M81 and M82</strong> — looked up M81's coordinates, moved the scope. Did not see the galaxy
        immediately. Scanned the area briefly and let my eyes adjust. M81 appeared, and M82 was visible nearby.
        First real use, and the system found a planet and two galaxies.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/first-real-use-1.jpeg', 'First real use in the field')}>
                <img src="/push-to-esp-32/first-real-use-1.jpeg" class="thumb-img rounded" alt="First real use in the field">
            </button>
        </div>
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/first-real-use-2-screen-up-close.jpeg', 'Display screen up close during first real use')}>
                <img src="/push-to-esp-32/first-real-use-2-screen-up-close.jpeg" class="thumb-img rounded" alt="Display screen up close during first real use">
            </button>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">Second Live Session — May 15, 2026</h2>

    <p>The next night I used the system to locate M53, a globular cluster in Coma Berenices. It was the first
        globular cluster I had ever observed. The push-to system made it a matter of moving the telescope to the
        right coordinates instead of trying to navigate there by star hopping in unfamiliar sky.</p>

    <h2 class="h3 mt-4 mb-3">What's Next</h2>

    <p>The system currently runs off a USB-C phone backup battery. The plan is to move to a 1100 mAh LiPo with a
        physical power switch for a cleaner, more integrated setup.</p>

    <p>The code and STL files are not currently published, but may be released if there is enough interest from
        people who want to build their own.</p>

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
