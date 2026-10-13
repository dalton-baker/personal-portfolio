/**
 * Runs while prerendering. Preloads the fonts the first screen uses along with the scripts and styles, so
 * text doesn't wait for the stylesheet to be parsed before its font starts downloading. (Unbounded 600 is
 * only in post subheadings, so it's left to load on demand.)
 */
export async function handle({ event, resolve }) {
	return resolve(event, {
		preload: ({ type, path }) => type === 'js' || type === 'css' || (type === 'font' && !path.includes('unbounded-600'))
	});
}
