<svelte:head>
	<title>Push-To Telescope System | Dalton Baker</title>
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
    <img src="/push-to-esp-32/full-working-1.jpeg" class="img-fluid rounded mb-4" alt="Push-to system components fully assembled">

    <h1 class="mb-4 text-center">Push-To Telescope System</h1>

    <p>After spending time with a home-built Dobsonian, I upgraded to an Apertura AD8 — a solid, well-regarded
        8-inch Dobsonian that I did not have to design and print myself. It is a great scope, but like any
        manual Dobsonian, finding objects in the dark still comes down to star hopping and patience.</p>

    <p>I wanted a push-to system: a device that tracks where the telescope is pointing and displays live
        coordinates, so I can look up a target on my phone, push the scope until the numbers match, and be
        in the neighborhood instead of searching blind. Commercial push-to options exist, but they tend to be
        expensive, hard to source, and <i>critically</i> several of them require drilling into or otherwise
        modifying the telescope. I decided building something custom would be easier and probably faster than
        tracking down a pre-built solution.</p>

    <p>The result attaches to the AD8 entirely without permanent modifications. Everything mounts via command
        strips and snap-in 3D-printed parts. The system is also intentionally simpler than most push-to
        setups. There is no Stellarium integration, no onboard catalog, no object selection. It is a screen
        that shows where you are pointing, nothing more.</p>

    <h2 class="h3 mt-4 mb-3">The Workflow</h2>

    <p>Observing with the system works like this:</p>
    <ol>
        <li>Power on the device and connect to its Wi-Fi setup server.</li>
        <li>Enter your location, sync the time, and align on one or two known stars.</li>
        <li>Setup finishes, Wi-Fi shuts off, and the OLED shows live Alt/Az and RA/Dec.</li>
        <li>Look up your target's coordinates on your phone. (<a href="https://telescopius.com/" target="_blank">Telescopius</a>, <a href="https://stellarium-web.org/" target="_blank">Stellarium</a>, or <a href="https://theskylive.com/" target="_blank">The Sky Live</a> works well for this)</li>
        <li>Push the telescope until the displayed coordinates match.</li>
        <li>Use the finder or eyepiece to finish centering. You will be close.</li>
    </ol>

    <p>The accuracy is good enough that I end up very close to the target most of the time. The last bit of
        centering takes seconds. Compared to searching an unfamiliar patch of sky from scratch, it is a
        completely different experience.</p>

    <h2 class="h3 mt-4 mb-3">Perf Boards</h2>

    <p>The system started as a breadboard prototype to validate the sensors and coordinate math. Once
        everything checked out, I soldered each component onto its own perf board. Each board got a small
        ceramic capacitor (1 nF) and a larger electrolytic capacitor (100 µF) across power and ground
        to stabilize voltage at each node and keep things clean over the I2C cable runs.</p>

    <p>All components communicate over I2C using short CAT5 cable runs. CAT5 was cheap, easy to find, and 
		gave me enough wires to run everything through a single cable. SCL, SDA, and power each run twisted with a ground 
		wire, which helped keep the signals stable enough for this setup while making the telescope wiring more 
		manageable in the field</p>

    <h3 class="h5 mt-4 mb-2">ESP32-S3 Controller</h3>

    <p>The brains of the system is a Seeed Studio XIAO ESP32-S3. It runs the Wi-Fi setup server, handles
        the sensor reads, does the coordinate math, and drives the display. Currently powered by a USB-C
        phone backup battery; the plan is to eventually integrate a 1100 mAh LiPo with a physical power
        switch.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/esp32-raw-1.jpeg', 'ESP32-S3 controller on perf board')}>
                <img src="/push-to-esp-32/esp32-raw-1.jpeg" class="thumb-img rounded" alt="ESP32-S3 controller on perf board">
            </button>
        </div>
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/esp32-raw-2.jpeg', 'ESP32-S3 controller on perf board, second view')}>
                <img src="/push-to-esp-32/esp32-raw-2.jpeg" class="thumb-img rounded" alt="ESP32-S3 controller on perf board, second view">
            </button>
        </div>
    </div>

    <h3 class="h5 mt-4 mb-2">Altitude Sensor: MPU-6050</h3>

    <p>Altitude is measured by an MPU-6050 accelerometer/gyro module mounted on the telescope tube. Only
        the accelerometer is used (it reads the tilt angle directly). The firmware averages the last ten
        readings to smooth out jitter and keep the display stable enough to aim by.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/alt-raw-1.jpeg', 'MPU-6050 altitude sensor on perf board')}>
                <img src="/push-to-esp-32/alt-raw-1.jpeg" class="thumb-img rounded" alt="MPU-6050 altitude sensor on perf board">
            </button>
        </div>
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/alt-raw-2.jpeg', 'MPU-6050 altitude sensor on perf board, second view')}>
                <img src="/push-to-esp-32/alt-raw-2.jpeg" class="thumb-img rounded" alt="MPU-6050 altitude sensor on perf board, second view">
            </button>
        </div>
    </div>

    <h3 class="h5 mt-4 mb-2">Azimuth Encoder: AS5600</h3>

    <p>Azimuth uses an AS5600 absolute magnetic rotary encoder. A small magnet attaches to azumuth friction adjustment knob; 
		the AS5600 reads its angle directly. Because it is an absolute encoder, it
        reports the full current position rather than counting incremental movement, so there is no drift to
        accumulate between power cycles. The firmware calculates an offset during alignment so the reported
        azimuth is relative to north rather than the magnet's arbitrary starting position.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/az-raw-1.jpeg', 'AS5600 azimuth encoder on perf board')}>
                <img src="/push-to-esp-32/az-raw-1.jpeg" class="thumb-img rounded" alt="AS5600 azimuth encoder on perf board">
            </button>
        </div>
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/az-raw-2.jpeg', 'AS5600 azimuth encoder on perf board, second view')}>
                <img src="/push-to-esp-32/az-raw-2.jpeg" class="thumb-img rounded" alt="AS5600 azimuth encoder on perf board, second view">
            </button>
        </div>
    </div>

    <h3 class="h5 mt-4 mb-2">Display</h3>

    <p>The display is a 0.96-inch 128x64 OLED running an SSD1306 controller over I2C. Bright enough to
        read easily, small enough to mount out of the way. I layered green gel filters over the screen to
        soften the white OLED light. Harsh white at the eyepiece destroys night vision, and the green shift
        makes glancing at coordinates much more comfortable after dark.</p>

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

    <h2 class="h3 mt-4 mb-3">3D-Printed Cases</h2>

    <p>Every component got its own 3D-printed PLA enclosure. The cases protect the boards, provide clean mounting '
		surfaces, and keep the scope looking like a finished tool instead of a science fair victim. Also, the 
		components just look cool as hell in 3D-printed cases.</p>

    <h3 class="h5 mt-4 mb-2">ESP32 Controller</h3>

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
    </div>

    <h3 class="h5 mt-4 mb-2">Altitude Sensor</h3>

    <div class="row g-3 my-3">
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
    </div>

    <h3 class="h5 mt-4 mb-2">Display</h3>

    <div class="row g-3 my-3">
        <div class="col-sm-6 col-md-3">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/display-case-1.jpeg', 'Display case')}>
                <img src="/push-to-esp-32/display-case-1.jpeg" class="thumb-img rounded" alt="Display case">
            </button>
        </div>
        <div class="col-sm-6 col-md-3">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/display-case-2.jpeg', 'Display case, second view')}>
                <img src="/push-to-esp-32/display-case-2.jpeg" class="thumb-img rounded" alt="Display case, second view">
            </button>
        </div>
        <div class="col-sm-6 col-md-3">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/display-case-3.jpeg', 'Display case, third view')}>
                <img src="/push-to-esp-32/display-case-3.jpeg" class="thumb-img rounded" alt="Display case, third view">
            </button>
        </div>
        <div class="col-sm-6 col-md-3">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/display-case-4.jpeg', 'Display case, fourth view')}>
                <img src="/push-to-esp-32/display-case-4.jpeg" class="thumb-img rounded" alt="Display case, fourth view">
            </button>
        </div>
    </div>

    <h3 class="h5 mt-4 mb-2">Azimuth Encoder</h3>

    <p>The azimuth assembly was the hardest mechanical part of the whole project. The AS5600 needs to sit
        at a precise distance from the magnet. Too far and readings get unreliable, too close and there is
        a risk of contact. The mount also needed to be height-adjustable, hold the sensor aligned with the
        magnet's axis, and attach to the AD8 base without wobbling. It took several design iterations to
        get all of that right simultaneously.</p>

    <p>The magnet itself sits in a knob adapter that fits over the existing azimuth friction knob on the
        AD8 base, so the magnet rotates with the base while the sensor stays fixed. No drilling, no
        permanent changes to the scope.</p>

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

    <h2 class="h3 mt-4 mb-3">Fully Assembled System</h2>

    <p>With all four boards soldered and cased, I wired everything together before mounting anything on the
        telescope. The ESP32 acts as the hub. All three peripheral boards plug into it via CAT5 runs. This
        was the first time the complete system ran as a unit outside of the breadboard stage.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/full-working-1.jpeg', 'Complete system assembled and wired')}>
                <img src="/push-to-esp-32/full-working-1.jpeg" class="thumb-img rounded" alt="Complete system assembled and wired">
            </button>
        </div>
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/full-working-2.jpeg', 'Complete system assembled and wired, second view')}>
                <img src="/push-to-esp-32/full-working-2.jpeg" class="thumb-img rounded" alt="Complete system assembled and wired, second view">
            </button>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">Installing on the Telescope</h2>

    <p>Installation on the AD8 required no drilling or permanent modifications. The azimuth knob adapter
        snaps onto the existing friction knob on the rocker base, and the sensor assembly positions the
        AS5600 over it. The altitude sensor and display mount on the telescope tube, and the ESP32 controller
        sits between them with CAT5 runs connecting everything. Command strips and purpose-designed
        snap-fit prints handle all the attachment points.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/telescope-install-1-az-knob-adapter.jpeg', 'Azimuth knob adapter on the scope base')}>
                <img src="/push-to-esp-32/telescope-install-1-az-knob-adapter.jpeg" class="thumb-img rounded" alt="Azimuth knob adapter on the scope base">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/telescope-install-2-az-assembly.jpeg', 'Azimuth encoder assembly installed')}>
                <img src="/push-to-esp-32/telescope-install-2-az-assembly.jpeg" class="thumb-img rounded" alt="Azimuth encoder assembly installed">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/telescope-install-3-alt.jpeg', 'Altitude sensor mounted on the tube')}>
                <img src="/push-to-esp-32/telescope-install-3-alt.jpeg" class="thumb-img rounded" alt="Altitude sensor mounted on the tube">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/telescope-install-4-screen.jpeg', 'Display mounted near the eyepiece end')}>
                <img src="/push-to-esp-32/telescope-install-4-screen.jpeg" class="thumb-img rounded" alt="Display mounted near the eyepiece end">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/telescope-install-5-fully-wired-with-bat.jpeg', 'Telescope fully wired with battery attached')}>
                <img src="/push-to-esp-32/telescope-install-5-fully-wired-with-bat.jpeg" class="thumb-img rounded" alt="Telescope fully wired with battery attached">
            </button>
        </div>
    </div>

    <p>Once everything was on the scope and I started testing, I hit the most painful bug of the entire
        project. The coordinate readouts were wrong, <i><b>badly wrong</b></i>, in a way that looked like a serious
        error in the spherical geometry or the sensor readings. I spent two days going back through the math,
        the time sync, the alignment code, all of it.</p>

    <p>The problem was my longitude. I'm at -103, but I had enetered positive 103 early on in testing. The system had been doing the
        math correctly the entire time. Rememebr to check all of your inputs before you assume the code is wrong!!</p>

    <h2 class="h3 mt-4 mb-3">Setup and Calibration</h2>

    <p>When the device powers on, it hosts a Wi-Fi access point and a small setup server accessible at
        <code>setup.local</code>. From a phone, you enter your latitude and longitude, sync the current
        time, and select alignment stars from a dropdown. The onboard database holds around 450 bright,
        fixed stars. Iit exists purely for calibration, not browsing, so planets and deep-sky objects are
        intentionally excluded.</p>

    <p>There are two alignment modes. One-star alignment does a simple offset and works well when the base
        is reasonably level. Two-star alignment does a spherical calculation from two reference points,
        making it much more forgiving when the base is not level. I hate leveling my scope in the 
		field, so I solved that problem in code. Once alignment is saved, the Wi-Fi server shuts off to conserve battery
        and the OLED takes over.</p>

    <h2 class="h3 mt-4 mb-3">Web Interface</h2>

    <p>The setup server is a small web app served from the ESP32 itself. It handles location entry, time sync,
        and star alignment. Once setup is complete, it shuts off and the OLED takes over for the rest of the
        session.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/web-ui-0-screen-display.jpeg', 'Web UI screen display')}>
                <img src="/push-to-esp-32/web-ui-0-screen-display.jpeg" class="thumb-img rounded" alt="Web UI screen display">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/web-ui-1.jpeg', 'Web UI, view 1')}>
                <img src="/push-to-esp-32/web-ui-1.jpeg" class="thumb-img rounded" alt="Web UI, view 1">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/web-ui-2.jpeg', 'Web UI, view 2')}>
                <img src="/push-to-esp-32/web-ui-2.jpeg" class="thumb-img rounded" alt="Web UI, view 2">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/web-ui-3.jpeg', 'Web UI, view 3')}>
                <img src="/push-to-esp-32/web-ui-3.jpeg" class="thumb-img rounded" alt="Web UI, view 3">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/web-ui-4.jpeg', 'Web UI, view 4')}>
                <img src="/push-to-esp-32/web-ui-4.jpeg" class="thumb-img rounded" alt="Web UI, view 4">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/web-ui-5.jpeg', 'Web UI, view 5')}>
                <img src="/push-to-esp-32/web-ui-5.jpeg" class="thumb-img rounded" alt="Web UI, view 5">
            </button>
        </div>
        <div class="col-sm-6 col-md-4">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/web-ui-6.jpeg', 'Web UI, view 6')}>
                <img src="/push-to-esp-32/web-ui-6.jpeg" class="thumb-img rounded" alt="Web UI, view 6">
            </button>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">First Real Use — May 14, 2026</h2>

    <p>The first real observing session used Pollux as the alignment star. From there I put the system
        through its paces:</p>

    <p><strong>Jupiter</strong>: looked up its coordinates on Telescopius and pushed the scope into
        position. Found it in around 20 seconds. Jupiter was fairly close to Pollux, so it was a good
        confidence builder but not a brutal test.</p>

    <p><strong>Capella</strong>: much farther from Pollux. Looked up the coordinates, moved the scope,
        found it in under a minute. A stronger proof that the system was tracking the sky correctly across
        a wider range of motion.</p>

    <p><strong>M81 and M82</strong>: looked up M81's coordinates and moved the scope. Did not see the
        galaxy immediately; I scanned the area briefly and let my eyes adjust. M81 appeared, and M82 was
        visible nearby.</p>

    <p>The following night I used it to locate M53, a globular cluster in Coma Berenices (the first
        globular cluster I had ever observed!) The push-to system turned what would have been a difficult
        star hop into a matter of moving the scope to the right numbers.</p>

    <div class="row g-3 my-3">
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/first-real-use-1.jpeg', 'First real use in the field')}>
                <img src="/push-to-esp-32/first-real-use-1.jpeg" class="thumb-img rounded" alt="First real use in the field">
            </button>
        </div>
        <div class="col-sm-6">
            <button class="thumb-btn" onclick={() => openLightbox('/push-to-esp-32/first-real-use-2-screen-up-close.jpeg', 'Display showing live coordinates during first use')}>
                <img src="/push-to-esp-32/first-real-use-2-screen-up-close.jpeg" class="thumb-img rounded" alt="Display showing live coordinates during first use">
            </button>
        </div>
    </div>

    <h2 class="h3 mt-4 mb-3">What's Next</h2>

    <p>The system currently runs off a USB-C phone backup battery. The plan is to integrate a 1100 mAh
        LiPo with a physical power switch for a cleaner, more self-contained setup.</p>

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
