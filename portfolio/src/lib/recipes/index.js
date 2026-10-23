/**
 * Recipes, which orbit The Log after the posts. Every .js file in this folder is a recipe, and its file name
 * is its URL: chili.js is served at /chili. Each one default-exports:
 *   title        recipe name
 *   order        its place in The Log's list of recipes, lowest first
 *   dek          a sentence or two about it, shown under the title
 *   makes, prep, cook   optional: how much it makes and how long it takes (any text)
 *   ingredients  [{ title, items: [...] }] groups of ingredients (one group can leave out its title)
 *   steps        [{ title, items: [...] }] groups of numbered steps (likewise)
 *   tips         optional sections after the steps: [{ title, items: [...] }] for a list (tips, notes) or
 *                [{ title, body: [...] }] for paragraphs
 *   photo        optional { src, alt, width, height } picture at the end of the recipe
 */

const modules = import.meta.glob(['./*.js', '!./index.js'], { eager: true, import: 'default' });

export const recipes = Object.entries(modules)
	.map(([path, r]) => ({ tips: [], ...r, slug: path.slice(2, -'.js'.length) }))
	.sort((a, b) => a.order - b.order);

recipes.forEach((r, i) => {
	r.n = i + 1;
});
