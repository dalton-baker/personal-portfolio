import { formatDate } from '$lib/posts';

/**
 * Recipes, which orbit The Log after the posts. Every .js file in this folder is a recipe, and its file name
 * is its URL: chili.js is served at /chili. Each one default-exports:
 *   title        recipe name
 *   date         'YYYY-MM-DD' it went up, also sets the recipe order
 *   dek          a sentence or two about it, shown under the title
 *   hero         optional { src, alt } photo
 *   makes, prep, cook   optional: how much it makes and how long it takes (any text)
 *   ingredients  [{ title, items: [...] }] groups of ingredients (one group can leave out its title)
 *   steps        [{ title, items: [...] }] groups of numbered steps (likewise)
 *   tips         optional [{ title, items: [...] }] lists after the steps (tips, notes)
 */

const modules = import.meta.glob(['./*.js', '!./index.js'], { eager: true, import: 'default' });

export const recipes = Object.entries(modules)
	.map(([path, r]) => ({ tips: [], ...r, slug: path.slice(2, -'.js'.length), displayDate: formatDate(r.date) }))
	.sort((a, b) => a.date.localeCompare(b.date));

recipes.forEach((r, i) => {
	r.n = i + 1;
});
