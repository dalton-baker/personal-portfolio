<script module>
	export const meta = {
		title: 'Building a 3D-Printed Telescope',
		pageTitle: '3D-Printed Telescope',
		date: '2026-05-28T16:49',
		dek: 'A fully custom 8-inch Dobsonian reflector telescope I designed from scratch and 3D printed. Built for deep-sky observing on a budget.',
		hero: { src: '/telescope-build/assembled-in-field.jpeg', alt: 'Telescope assembled in the field' }
	};
</script>

<script>
	import Gallery from '$lib/components/Gallery.svelte';
</script>

<p>Around 2020, I acquired an old Optical Craftsman telescope on a cast iron equatorial mount. It was my first real
	telescope, and it was a great way to learn the basics of observing, alignment, eyepieces, mounts, and the
	general mechanics of a reflecting telescope.</p>

<p>It worked well, but it was also large, heavy, and not very practical once I moved into apartments. The cast iron
	mount was solid, but it was not something I wanted to haul around every time I wanted to observe.</p>

<p>In early 2025, I decided to reuse the mirror and secondary from that telescope and build a new, more portable
	scope around them.</p>

<Gallery items={[
	{ src: '/telescope-build/original_scope.JPG', alt: 'Original Optical Craftsman telescope' },
	{ src: '/telescope-build/origina_scope_in_car.jpeg', alt: 'Original telescope in car' }
]} />

<h2>Starting the Design</h2>

<p>This project also became my reason to buy my first 3D printer.</p>

<p>At the start, I had no CAD experience. I began with Tinkercad, which was useful for getting comfortable with the
	basic idea of modeling parts, but I quickly ran into its limits. The telescope needed more precise and reusable
	designs than Tinkercad was really suited for.</p>

<p>After that, I moved to Onshape and designed the real scope there.</p>

<p>Over the course of February 2025, I designed, printed, tested, adjusted, and assembled the telescope. The goal
	was to create a lightweight truss-style Dobsonian using 3D-printed structural components wherever practical.</p>

<Gallery items={[
	{ src: '/telescope-build/onshape-mirror-box.png', alt: 'Onshape mirror box design' },
	{ src: '/telescope-build/onshape-tube.png', alt: 'Onshape tube design' }
]} />

<h2>Materials and Structure</h2>

<p>The telescope reused the primary mirror, secondary mirror, and focusser from the old Optical Craftsman scope.</p>

<p>The new structure used 3D-printed parts for the mirror box, upper assembly, rail mounts, and other structural
	pieces. For the trusses, I used half-inch, four-foot-long aluminum pipe. For tensioning and support, I used
	thin braided steel cable.</p>

<p>The large circular side rails were printed in sections and assembled after printing. Since the parts were too
	large to print as single pieces, the design had to account for how the sections would connect and stay
	aligned.</p>

<p>The result was a much lighter and more portable telescope than the original equatorial-mounted scope.</p>

<Gallery cols={3} items={[
	{ src: '/telescope-build/printing-mirror-box.jpeg', alt: 'Printing the mirror box' },
	{ src: '/telescope-build/printing-mirror-cell.jpeg', alt: 'Printing the mirror cell' },
	{ src: '/telescope-build/test-fit-mirrorbox.jpeg', alt: 'Test fitting the mirror box' },
	{ src: '/telescope-build/test-fit-mirror-box-2.jpeg', alt: 'Test fitting the mirror box (2)' },
	{ src: '/telescope-build/test-fit-mirror-box-4.jpeg', alt: 'Test fitting the mirror box (4)' },
	{ src: '/telescope-build/test-fit-mirror-box-mirror.jpeg', alt: 'Test fitting the mirror in the mirror box' },
	{ src: '/telescope-build/test-fit-truss.jpeg', alt: 'Test fitting the truss' },
	{ src: '/telescope-build/first-assembly.jpeg', alt: 'First assembly' },
	{ src: '/telescope-build/assembled-truss.jpeg', alt: 'Assembled truss' },
	{ src: '/telescope-build/assembled-truss-size-compare.jpeg', alt: 'Assembled truss size comparison' },
	{ src: '/telescope-build/assembled-upper-cage-close.jpeg', alt: 'Assembled upper cage close-up' },
	{ src: '/telescope-build/assembled-top-cage.jpeg', alt: 'Assembled top cage' },
	{ src: '/telescope-build/assembled-on-balcony.jpeg', alt: 'Assembled telescope on balcony' },
	{ src: '/telescope-build/assembled-on-balcony-2.jpeg', alt: 'Assembled telescope on balcony (2)' }
]} />

<figure class="narrow">
	<!-- svelte-ignore a11y_media_has_caption (silent clip) -->
	<video controls playsinline preload="metadata">
		<source src="/telescope-build/alt-az-example.mp4" type="video/mp4" />
	</video>
</figure>

<h2>First Field Test</h2>

<p>In March 2025, I took the telescope out for a real observing trip during the lunar eclipse on March 14th. The
	eclipse peaked around 1am.</p>

<p>During that trip, I successfully observed the Moon, M81, and M82. I was mostly using an old Circle T 25mm
	Japanese volcano-top eyepiece, which worked pretty well with the scope.</p>

<p>That trip proved the telescope worked, but it also showed me where the design needed improvement.</p>

<Gallery cols={3} items={[
	{ src: '/telescope-build/assembled-in-field.jpeg', alt: 'Telescope assembled in the field' },
	{ src: '/telescope-build/lunar-eclipse-in-field.jpeg', alt: 'Lunar eclipse in the field' },
	{ src: '/telescope-build/moon-pics-in-field.jpeg', alt: 'Moon pictures in the field' }
]} />

<h2>Post-Trip Upgrades</h2>

<p>After the first field test, I made a few upgrades.</p>

<p>The circular rail mounts needed reinforcement, so I added a truss to each one. Before that, they acted too much
	like springs and made the telescope bouncy.</p>

<p>I also added a shroud. Stray light was a major issue with the open truss design, and the background field looked
	much lighter than it should have. It's a miracle I was able to observe galaxies with it.</p>

<p>Finally, I added tick marks for altitude and azimuth as an early manual pointing system. The idea was useful,
	but I flipped the altitude values, so that version did not work as intended.</p>

<Gallery cols={3} items={[
	{ src: '/telescope-build/az-rail-stiffening-upgrade.jpeg', alt: 'Azimuth rail stiffening upgrade' },
	{ src: '/telescope-build/alt-measurments-upgrade.jpeg', alt: 'Altitude measurements upgrade' },
	{ src: '/telescope-build/az-measurment-upgrade.jpeg', alt: 'Azimuth measurement upgrade' }
]} />

<h2>Final Result</h2>

<p>The finished telescope was lightweight, portable, and usable in the field. It started as an old, heavy telescope
	that was difficult to use after moving into an apartment, and it became a compact 3D-printed truss Dobsonian
	that I could actually take outside and observe with.</p>

<p>The project taught me a lot about CAD, 3D printing, telescope mechanics, stiffness, balance, and the difference
	between something that looks good in a model and something that works under the night sky.</p>
