<!-- Le tailwindCSS est généré par Claude.IA -->
<script lang="ts">
	// goto() : navigue vers une URL sans recharger toute la page : https://svelte.dev/docs/kit/$app-navigation#goto
	import { goto } from '$app/navigation';
	let { data } = $props();

	// $state : rend une variable réactive et modifiable directement : https://svelte.dev/docs/svelte/$state
	let selection = $state(new Set(data.selectionIngredients));

	// Texte tapé dans la barre de recherche des ingrédients
	let recherche = $state('');

	// $effect : réexécute ce bloc à chaque fois que data change : https://svelte.dev/docs/svelte/$effect
	$effect(() => {
		selection = new Set(data.selectionIngredients);
	});

	// $derived : valeur recalculée automatiquement dès que recherche ou data.ingredients changent : https://svelte.dev/docs/svelte/$derived
	let ingredientsFiltres = $derived(
		data.ingredients.filter((ing) =>
			ing.nom.toLowerCase().includes(recherche.toLowerCase())
		)
	);

	// Liste des ingrédients actuellement sélectionnés comme filtres actifs
	let ingredientsSelectionnes = $derived(
		data.ingredients.filter((ing) => selection.has(ing.id))
	);

	// Construit l'URL avec les ingrédients sélectionnés en query params, puis navigue vers cette URL sans recharger la page ni perdre le scroll/focus
	function appliquerSelection(nouvelleSelection: Set<number>) {
		const params = new URLSearchParams();
		nouvelleSelection.forEach((id) => params.append('ingredient', String(id)));

		goto(`?${params.toString()}`, {
			replaceState: true, // remplace l'entrée d'historique au lieu d'en empiler une nouvelle
			keepFocus: true,    // garde le focus sur l'élément cliqué
			noScroll: true      // empêche de remonter en haut de page à chaque clic sur un filtre
		});
	}

	// Ajoute ou retire un ingrédient de la sélection, puis met à jour l'URL en conséquence
	function changerFiltre(id: number) {
		const nouvelleSelection = new Set(selection);

		if (nouvelleSelection.has(id)) {
			nouvelleSelection.delete(id);
		} else {
			nouvelleSelection.add(id);
		}

		appliquerSelection(nouvelleSelection);
	}

	// Retire tous les filtres actifs d'un coup
	function toutEffacer() {
		appliquerSelection(new Set());
	}

	// Code générer par Claude.IA
	const pillBase =
		'rounded-full border px-3.5 py-1.5 text-sm transition cursor-pointer font-inherit';
	const pillInactive =
		'bg-gray-100 border-gray-300 text-gray-800 hover:border-orange-600 hover:text-orange-600';
	const pillActive = 'bg-orange-600 border-orange-600 text-white hover:bg-orange-700';
	// Fin du code généré par Claude.IA
</script>

<svelte:head>
	<title>Les recettes de grand-mère</title>
</svelte:head>

<h1 class="mb-4 text-3xl font-bold">Recettes</h1>

<section class="mb-6 rounded-xl bg-white p-5 shadow-md">
	<h2 class="mb-3 text-lg font-semibold text-orange-700">Filtrer par ingrédients</h2>

	<!-- bind:value lie directement la valeur de l'input à la variable recherche : https://svelte.dev/docs/svelte/bind#input -->
	<input
		type="text"
		placeholder="Rechercher un ingrédient..."
		class="mb-3.5 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm transition focus:border-orange-600 focus:outline-none focus:ring-3 focus:ring-orange-600/15"
		bind:value={recherche}
	/>

	<div class="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
		<!-- {#each} boucle sur ingredientsFiltres pour afficher une pastille par ingrédient : https://svelte.dev/docs/svelte/each -->
		{#each ingredientsFiltres as ingredient}
			<button
				type="button"
				class="{pillBase} {selection.has(ingredient.id) ? pillActive : pillInactive}"
				onclick={() => changerFiltre(ingredient.id)}
			>
				{ingredient.nom}
			</button>
		{:else}
			<!-- {:else} : affiché uniquement si ingredientsFiltres est vide  -->
			<p class="py-2 text-sm text-gray-500">
				Aucun ingrédient ne correspond à "{recherche}"
			</p>
		{/each}
	</div>

	<!-- N'affiche cette section que s'il y a au moins un filtre actif -->
	{#if ingredientsSelectionnes.length > 0}
		<div class="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4">
			<span class="text-sm font-semibold text-gray-500">Filtres actifs :</span>
			<!-- Boucle sur ingredientsSelectionnes pour afficher une pastille par ingrédient actif -->
			{#each ingredientsSelectionnes as ingredient}
			<!-- Bouton pour retirer un ingrédient  -->
				<button
					type="button"
					class="flex items-center gap-1.5 rounded-full bg-orange-600/10 py-1.5 pl-3.5 pr-2.5 text-sm text-orange-700 transition hover:bg-orange-600/20"
					onclick={() => changerFiltre(ingredient.id)}
				>
					{ingredient.nom}
					<span class="text-base leading-none">×</span>
				</button>
			{/each}
			<!-- Bouton pour effacer tous les filtres -->
			<button
				type="button"
				class="ml-1 text-sm text-gray-500 underline hover:text-orange-600"
				onclick={toutEffacer}
			>
				Tout effacer
			</button>
		</div>
	{/if}
</section>

<!-- Liste des recettes filtrées, une par ligne, chacune cliquable vers sa page de détail -->
<div class="flex flex-col gap-5">
	<!-- Boucle sur data.recettes pour afficher chaque recette filtrée -->
	{#each data.recettes as recette}
		<a href="/recettes/{recette.id}" class="block text-inherit no-underline">
			<div class="rounded-xl bg-white p-5 shadow-md">
				<h2 class="mb-2.5 text-lg font-bold text-orange-700">{recette.titre}</h2>
				<p class="text-gray-500">{recette.description}</p>
				<!-- Affiche le nombre de likes de la recette -->
				<p class="mt-2 text-sm text-gray-500">❤️ {recette.nombreJaimes}</p>
			</div>
		</a>
	{:else}
		<!-- Si aucune recette ne correspond aux filtres, affiche un message d'information -->
		<div class="rounded-xl bg-white p-10 text-center shadow-md">
			<p class="text-lg font-semibold text-gray-800">Aucune recette ne correspond à ces filtres</p>
			<p class="mt-1 text-sm text-gray-500">Essaie de retirer un ou plusieurs filtres pour voir plus de résultats.</p>
		</div>
	{/each}
</div>