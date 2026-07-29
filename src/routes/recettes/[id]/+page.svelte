<!-- Le tailwindCSS est généré par Claude.IA -->
<script lang="ts">
	let { data } = $props();
	const { recette } = data;
</script>

<svelte:head>
	<title>{recette.titre} — Les recettes de grand-mère</title>
</svelte:head>

<!-- Lien de retour vers la page d'accueil -->
<a href="/" class="mb-5 inline-block text-sm text-gray-500 no-underline hover:text-orange-600">
	← Retour aux recettes
</a>

<article class="rounded-xl bg-white p-8 shadow-md">
	<h1 class="mb-2.5 text-3xl font-bold text-orange-700">{recette.titre}</h1>

	<p class="mb-5 text-gray-500">
		Par

		<!-- Lien vers le profil de l'auteur -->
		<a	href="/profil/{recette.utilisateur.id}" class="font-semibold text-orange-600 no-underline hover:underline">
			{recette.utilisateur.nom}
		</a>
	</p>

	{#if recette.description}
		<p class="mb-6 text-gray-500">{recette.description}</p>
	{/if}

	<section class="mt-7">
		<h2 class="mb-3 border-b border-gray-200 pb-2 text-lg font-bold text-orange-700">
			Ingrédients
		</h2>
		<ul class="flex flex-col gap-2">
			{#each recette.recetteIngredients as ri}
				<li class="rounded-lg bg-gray-100 px-3 py-2">
					<!-- L'unité est affichée seulement si présente -->
					{ri.quantite}{#if ri.unite} {ri.unite}{/if}
					— {ri.ingredient.nom}
				</li>
			{/each}
		</ul>
	</section>

	<section class="mt-7">
		<h2 class="mb-3 border-b border-gray-200 pb-2 text-lg font-bold text-orange-700">
			Étapes
		</h2>
		<!-- whitespace générer par Claude.IA -->
		<p class="whitespace-pre-line leading-relaxed">{recette.etapes}</p>
	</section>
</article>