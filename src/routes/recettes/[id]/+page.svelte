<script lang="ts">
	let { data } = $props();
	const { recette } = data;
</script>

<svelte:head>
	<title>{recette.titre} — Les recettes de grand-mère</title>
</svelte:head>

<a href="/" class="back-link">← Retour aux recettes</a>

<article class="recipe-detail">
	<h1>{recette.titre}</h1>

	<p class="recipe-author">
		Par
		<a href="/profil/{recette.utilisateur.id}">{recette.utilisateur.nom}</a>
	</p>

	{#if recette.description}
		<p class="recipe-description">{recette.description}</p>
	{/if}

	<section class="recipe-section">
		<h2>Ingrédients</h2>
		<ul class="ingredients-list">
			{#each recette.recetteIngredients as ri}
				<li>
					{ri.quantite}{#if ri.unite} {ri.unite}{/if}
					— {ri.ingredient.nom}
				</li>
			{/each}
		</ul>
	</section>

	<section class="recipe-section">
		<h2>Étapes</h2>
		<p class="recipe-steps">{recette.etapes}</p>
	</section>
</article>