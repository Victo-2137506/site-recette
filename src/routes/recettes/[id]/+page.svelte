<!-- Le tailwindCSS est généré par Claude.IA -->
<!-- Principe de la route [id] permet de récupérer les détails d'une recette spécifique : https://svelte.dev/docs/kit/advanced-routing -->
<script lang="ts">
	import { enhance } from '$app/forms';
	let { data } = $props();
	const { recette } = data;
</script>

<svelte:head>
	<title>{recette.titre} — Les recettes de grand-mère</title>
</svelte:head>

<!-- Lien de retour vers la page d'accueil -->
<a href="/" class="mb-5 inline-block text-sm text-gray-500 no-underline hover:text-orange-600">
	Retour aux recettes
</a>

<!-- Affiche les détails de la recette, le titre, l'auteur, la description, les ingrédients et les étapes -->
<article class="rounded-xl bg-white p-8 shadow-md">
	<h1 class="mb-2.5 text-3xl font-bold text-orange-700">{recette.titre}</h1>

	<p class="mb-5 text-gray-500">
		Par
		<!-- Lien vers le profil de l'auteur -->
		<a	href="/profil/{recette.utilisateur.id}" class="font-semibold text-orange-600 no-underline hover:underline">
			{recette.utilisateur.nom}
		</a>
	</p>

	<!-- Bouton j'aime/je n'aime plus -->
	<form method="post" action="?/toggleLike" use:enhance>
		<button type="submit"class="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition {data.dejaAime
			? 'border-red-500 bg-red-50 text-red-600'
			: 'border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-600'}"
			>
			{data.dejaAime ? '❤️' : '🤍'} {data.nombreJaimes}
			</button>
	</form>


	{#if recette.description}
		<p class="mb-6 text-gray-500">{recette.description}</p>
	{/if}

	<section class="mt-7">
		<h2 class="mb-3 border-b border-gray-200 pb-2 text-lg font-bold text-orange-700">
			Ingrédients
		</h2>
		<ul class="flex flex-col gap-2">
			{#each recette.recetteIngredients as ri}
		<!-- &nbsp;—&nbsp générer par Claude.IA -->
		<li class="rounded-lg bg-gray-100 px-3 py-2">
			{#if ri.quantite}{ri.quantite}{#if ri.unite}&nbsp;{ri.unite}{/if}&nbsp;—&nbsp;{/if}{ri.ingredient.nom}
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