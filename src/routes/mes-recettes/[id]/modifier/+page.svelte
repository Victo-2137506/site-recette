<!-- Le tailwindCSS est généré par Claude.IA -->
<!-- Principe de la route [id] permet de récupérer les détails d'une recette spécifique : https://svelte.dev/docs/kit/advanced-routing -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData, ActionData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

	// Pré-remplit la sélection à partir des ingrédients déjà associés à la recette
	let selection = $state(
		new Map(
			data.recette.recetteIngredients.map((ri) => [
				ri.ingredientId,
				{ quantite: ri.quantite, unite: ri.unite ?? '' }
			])
		)
	);
	let recherche = $state('');

	// Filtre les ingrédients en fonction de la recherche
	let ingredientsFiltres = $derived(
		data.ingredients.filter((ing) => ing.nom.toLowerCase().includes(recherche.toLowerCase()))
	);

    // Fonction pour basculer la sélection d'un ingrédient
	function toggleIngredient(id: number) {
		const copie = new Map(selection);

		// Si l'ingrédient est déjà sélectionné, le retirer.
		// Sinon, l'ajouter avec des valeurs par défaut.
		if (copie.has(id)) {
			copie.delete(id);
		} else {
			copie.set(id, { quantite: '', unite: '' });
		}

		selection = copie;
	}

    // Styles générer par Claude.IA
	const pillBase = 'rounded-full border px-3.5 py-1.5 text-sm transition cursor-pointer';
	const pillInactive =
		'bg-gray-100 border-gray-300 text-gray-800 hover:border-orange-600 hover:text-orange-600';
	const pillActive = 'bg-orange-600 border-orange-600 text-white hover:bg-orange-700';
</script>

<svelte:head>
	<title>Modifier {data.recette.titre} — Les recettes de grand-mère</title>
</svelte:head>

<h1 class="mb-6 text-3xl font-bold">Modifier la recette</h1>

<!-- Le formulaire de modification -->
<form method="post" use:enhance class="rounded-xl bg-white p-8 shadow-md">

    <!-- Champ pour le titre de la recette -->
	<div class="mb-5 flex flex-col gap-1.5">
		<label for="titre" class="text-sm font-semibold text-gray-800">Titre</label>
		<input
			id="titre"
			name="titre"
			required
			value={data.recette.titre}
			class="rounded-lg border border-gray-300 px-3.5 py-2.5 text-base transition focus:border-orange-600 focus:outline-none focus:ring-3 focus:ring-orange-600/15"
		/>
	</div>

    <!-- Champ pour la description de la recette -->
	<div class="mb-5 flex flex-col gap-1.5">
		<label for="description" class="text-sm font-semibold text-gray-800">Description</label>
		<textarea
			id="description"
			name="description"
			rows="2"
			class="rounded-lg border border-gray-300 px-3.5 py-2.5 text-base transition focus:border-orange-600 focus:outline-none focus:ring-3 focus:ring-orange-600/15"
		>{data.recette.description ?? ''}</textarea>
	</div>

    <!-- Section pour gérer les ingrédients associés à la recette -->
	<div class="mb-5">
		<span class="mb-2 block text-sm font-semibold text-gray-800">Ingrédients</span>

		<input
			type="text"
			placeholder="Rechercher un ingrédient..."
			bind:value={recherche}
			class="mb-3 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm transition focus:border-orange-600 focus:outline-none focus:ring-3 focus:ring-orange-600/15"
		/>

        <!-- Affiche les ingrédients filtrés en fonction de la recherche -->
		<div class="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
			{#each ingredientsFiltres as ingredient}
				<button
					type="button"
					class="{pillBase} {selection.has(ingredient.id) ? pillActive : pillInactive}"
					onclick={() => toggleIngredient(ingredient.id)}
				>
					{ingredient.nom}
				</button>
			{:else}
				<p class="py-2 text-sm text-gray-500">
					Aucun ingrédient ne correspond à "{recherche}"
				</p>
			{/each}
		</div>

        <!-- Affiche les ingrédients sélectionnés avec des champs pour la quantité et l'unité -->
		{#if selection.size > 0}
			<div class="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4">
				<span class="text-sm font-semibold text-gray-500">Ingrédients sélectionnés :</span>

				<!-- Parcourt les ingrédients sélectionnés et affiche un champ pour la quantité et l'unité -->
				{#each [...selection.entries()] as [id, valeurs]}
					{@const ingredient = data.ingredients.find((i) => i.id === id)}
					<div class="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
						<span class="w-28 shrink-0 font-medium">{ingredient?.nom}</span>

						<input type="hidden" name="ingredient_id" value={id} />

						<input
							type="number"
							step="any"
							name="quantite"
							placeholder="Quantité (optionnel)"
							bind:value={valeurs.quantite}
							class="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
						/>

						<input
							type="text"
							name="unite"
							placeholder="Unité (optionnel)"
							bind:value={valeurs.unite}
							class="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
						/>

						<button
							type="button"
							class="ml-auto text-gray-400 hover:text-red-600"
							aria-label="Retirer cet ingrédient"
							onclick={() => toggleIngredient(id)}
						>
							✕
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

    <!-- Champ pour les étapes de la recette -->
	<div class="mb-6 flex flex-col gap-1.5">
		<label for="etapes" class="text-sm font-semibold text-gray-800">Étapes</label>
		<textarea
			id="etapes"
			name="etapes"
			rows="6"
			required
			class="rounded-lg border border-gray-300 px-3.5 py-2.5 text-base transition focus:border-orange-600 focus:outline-none focus:ring-3 focus:ring-orange-600/15"
		>{data.recette.etapes}</textarea>
	</div>

    <!-- Affiche un message d'erreur si la modification échoue -->
	{#if form?.message}
		<p class="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-center text-sm text-red-700">
			{form.message}
		</p>
	{/if}

	<button
		type="submit"
		class="rounded-lg bg-orange-600 px-6 py-2.5 font-medium text-white transition hover:bg-orange-700"
	>
		Enregistrer les modifications
	</button>
</form>