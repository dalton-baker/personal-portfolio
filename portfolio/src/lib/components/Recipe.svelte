<script>
	/** A recipe in the reader: what it makes and how long it takes, the ingredients, the steps, tips and notes, then a photo. */
	let { recipe } = $props();

	const stats = $derived([['Makes', recipe.makes], ['Prep', recipe.prep], ['Cooking', recipe.cook]].filter(([, v]) => v));
</script>

{#if stats.length}
	<dl class="rstats">
		{#each stats as [k, v] (k)}<div><dt>{k}</dt><dd>{v}</dd></div>{/each}
	</dl>
{/if}

<h2>Ingredients</h2>
<div class="ringr">
	{#each recipe.ingredients as group, g (g)}
		<div>
			{#if group.title}<h3>{group.title}</h3>{/if}
			<ul>
				{#each group.items as item, i (i)}<li>{item}</li>{/each}
			</ul>
		</div>
	{/each}
</div>

<h2>Instructions</h2>
{#each recipe.steps as group, g (g)}
	{#if group.title}<h3>{group.title}</h3>{/if}
	<ol>
		{#each group.items as item, i (i)}<li>{item}</li>{/each}
	</ol>
{/each}

{#each recipe.tips as group (group.title)}
	<h2>{group.title}</h2>
	{#if group.items}
		<ul>
			{#each group.items as item, i (i)}<li>{item}</li>{/each}
		</ul>
	{:else}
		{#each group.body as para, i (i)}<p>{para}</p>{/each}
	{/if}
{/each}

{#if recipe.photo}
	<figure class="rphoto">
		<img src={recipe.photo.src} alt={recipe.photo.alt} width={recipe.photo.width} height={recipe.photo.height} loading="lazy" decoding="async" />
	</figure>
{/if}
