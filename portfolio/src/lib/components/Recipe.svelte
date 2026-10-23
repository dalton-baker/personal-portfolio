<script>
	import Gallery from './Gallery.svelte';
	import { lightbox } from './lightbox.svelte.js';
	import { picture } from '$lib/images';

	/** A recipe in the reader: what it makes and how long it takes, the ingredients, the steps, tips and notes, then photos. */
	let { recipe } = $props();

	const stats = $derived([['Makes', recipe.makes], ['Prep', recipe.prep], ['Cooking', recipe.cook]].filter(([, v]) => v));

	/** Keeps ranges like 3–4 or ½–¾ on one line: a word joiner after the dash stops the line breaking there. */
	const keep = (text) => text.replace(/([\d¼½¾])–(?=[\d¼½¾])/g, '$1–\u2060');
</script>

{#if stats.length}
	<dl class="rstats">
		{#each stats as [k, v] (k)}<div><dt>{k}</dt><dd>{keep(v)}</dd></div>{/each}
	</dl>
{/if}

<h2>Ingredients</h2>
<div class="ringr">
	{#each recipe.ingredients as group, g (g)}
		<div>
			{#if group.title}<h3>{group.title}</h3>{/if}
			<ul>
				{#each group.items as item, i (i)}<li>{keep(item)}</li>{/each}
			</ul>
		</div>
	{/each}
</div>

<h2>Instructions</h2>
{#each recipe.steps as group, g (g)}
	{#if group.title}<h3>{group.title}</h3>{/if}
	<ol>
		{#each group.items as item, i (i)}<li>{keep(item)}</li>{/each}
	</ol>
{/each}

{#each recipe.tips as group (group.title)}
	<h2>{group.title}</h2>
	{#if group.items}
		<ul>
			{#each group.items as item, i (i)}<li>{keep(item)}</li>{/each}
		</ul>
	{:else}
		{#each group.body as para, i (i)}<p>{keep(para)}</p>{/each}
	{/if}
{/each}

{#if recipe.photos.length}
	<h2>Photos</h2>
	{#if recipe.photos.length > 1}
		<Gallery items={recipe.photos} cols={3} />
	{:else}
		{@const photo = recipe.photos[0]}
		<!-- A single photo keeps its own shape, small; it enlarges like a gallery thumbnail. -->
		<button
			class="rphoto"
			onclick={() => {
				lightbox.src = photo.src;
				lightbox.alt = photo.alt;
			}}
			aria-label="Enlarge: {photo.alt}"
		>
			<enhanced:img src={picture(photo.src)} alt={photo.alt} sizes="340px" loading="lazy" />
		</button>
	{/if}
{/if}
