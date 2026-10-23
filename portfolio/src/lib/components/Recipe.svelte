<script>
	/** A recipe in the reader: what it makes and how long it takes, the ingredients, the steps, then tips and notes. */
	let { recipe } = $props();
</script>

<dl class="rstats">
	<div><dt>Makes</dt><dd>{recipe.makes}</dd></div>
	<div><dt>Prep</dt><dd>{recipe.prep}</dd></div>
	<div><dt>Cooking</dt><dd>{recipe.cook}</dd></div>
</dl>

<h2>Ingredients</h2>
<div class="ringr">
	{#each recipe.ingredients as group (group.title)}
		<div>
			<h3>{group.title}</h3>
			<ul>
				{#each group.items as item, i (i)}<li>{item}</li>{/each}
			</ul>
		</div>
	{/each}
</div>

<h2>Instructions</h2>
{#each recipe.steps as group (group.title)}
	<h3>{group.title}</h3>
	<ol>
		{#each group.items as item, i (i)}<li>{item}</li>{/each}
	</ol>
{/each}

{#each recipe.tips as group (group.title)}
	<h2>{group.title}</h2>
	<ul>
		{#each group.items as item, i (i)}<li>{item}</li>{/each}
	</ul>
{/each}
