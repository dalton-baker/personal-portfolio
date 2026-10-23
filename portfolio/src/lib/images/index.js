/**
 * The site's photos, optimized at build time by @sveltejs/enhanced-img: each is resized to a few widths
 * (never larger than the original) and converted to WebP, plus a JPEG fallback. Posts and recipes refer
 * to a photo by its path in this folder, such as '/telescope-build/first-assembly.jpeg'.
 *
 * The widths cover a gallery thumbnail on a 2x screen (720), a post's hero (1080 and 1440) and the
 * lightbox. Extensions must be lowercase (the image plugin skips .JPG), and the JPEG fallback flattens
 * transparency, so PNGs here should be opaque. Videos stay in static/.
 */
const pictures = import.meta.glob('./**/*.{jpeg,jpg,png}', {
	eager: true,
	import: 'default',
	query: { enhanced: true, w: '480;720;1080;1440', format: 'webp;jpg', quality: '75' }
});

/** The optimized picture for a photo path, for `<enhanced:img src={picture(path)} sizes="...">`. */
export function picture(src) {
	const pic = pictures['.' + src];
	if (!pic) throw new Error(`No photo at ${src} in $lib/images`);
	return pic;
}

/** Whether a path names one of these photos. */
export const isPhoto = (src) => '.' + src in pictures;

/** A photo's largest JPEG, for links and previews (Open Graph, the Markdown copies). */
export const photoUrl = (src) => picture(src).img.src;
