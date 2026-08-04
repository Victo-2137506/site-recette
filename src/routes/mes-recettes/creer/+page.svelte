<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	// Récupère les données et le formulaire depuis les props
	let { data, form }: { data: { ingredients: { id: number; nom: string }[] }; form: ActionData } =
		$props();

	// Structure d'une préparation : son nom, ses ingrédients sélectionnés,
	// sa propre barre de recherche et ses propres étapes
	type PreparationEtat = {
		nom: string;
		selection: Map<number, { quantite: string; unite: string }>;
		recherche: string;
		etapes: string[];
	};

	function nouvellePreparation(): PreparationEtat {
		return { nom: '', selection: new Map(), recherche: '', etapes: [''] };
	}

	// Liste réactive des préparations, une recette contient toujours au moins une préparation
	let preparationsListe = $state<PreparationEtat[]>([nouvellePreparation()]);

	function ajouterPreparation() {
		preparationsListe = [...preparationsListe, nouvellePreparation()];
	}

	function supprimerPreparation(index: number) {
		if (preparationsListe.length > 1) {
			preparationsListe = preparationsListe.filter((_, i) => i !== index);
		}
	}

	// Récupère les ingrédients actuellement sélectionnés comme filtres actifs
	// Reprend le même système de filtre dans la page générale.
	function toggleIngredient(prepIndex: number, id: number) {
		const prep = preparationsListe[prepIndex];
		const copie = new Map(prep.selection);

		if (copie.has(id)) {
			copie.delete(id);
		} else {
			copie.set(id, { quantite: '', unite: '' });
		}

		prep.selection = copie;
	}

	// Ajoute une étape à la préparation concernée
	function ajouterEtape(prepIndex: number) {
		preparationsListe[prepIndex].etapes = [...preparationsListe[prepIndex].etapes, ''];
	}

	// Supprime une étape de la préparation concernée
	function supprimerEtape(prepIndex: number, etapeIndex: number) {
		const prep = preparationsListe[prepIndex];
		if (prep.etapes.length > 1) {
			prep.etapes = prep.etapes.filter((_, i) => i !== etapeIndex);
		}
	}

	// Élément style générer par Claude.IA
	const pillBase = 'rounded-full border px-3.5 py-1.5 text-sm transition cursor-pointer';
	const pillInactive =
		'bg-gray-100 border-gray-300 text-gray-800 hover:border-orange-600 hover:text-orange-600';
	const pillActive = 'bg-orange-600 border-orange-600 text-white hover:bg-orange-700';
</script>

<svelte:head>
	<title>Créer une recette — Les recettes de grand-mère</title>
</svelte:head>

<h1 class="mb-6 text-3xl font-bold">Créer une recette</h1>

<form method="post" use:enhance class="rounded-xl bg-white p-8 shadow-md">

	<!-- Champ titre -->
	<div class="mb-5 flex flex-col gap-1.5">
		<label for="titre" class="text-sm font-semibold text-gray-800">Titre</label>
		<input
			id="titre"
			name="titre"
			required
			class="rounded-lg border border-gray-300 px-3.5 py-2.5 text-base transition focus:border-orange-600 focus:outline-none focus:ring-3 focus:ring-orange-600/15"
		/>
	</div>

	<!-- Champ description -->
	<div class="mb-5 flex flex-col gap-1.5">
		<label for="description" class="text-sm font-semibold text-gray-800">Description</label>
		<textarea
			id="description"
			name="description"
			rows="2"
			class="rounded-lg border border-gray-300 px-3.5 py-2.5 text-base transition focus:border-orange-600 focus:outline-none focus:ring-3 focus:ring-orange-600/15"
		></textarea>
	</div>

	<!-- Boucle sur chaque préparation : nom, ingrédients et étapes qui lui sont propres -->
	{#each preparationsListe as prep, prepIndex}
		{@const ingredientsFiltres = data.ingredients.filter((ing) =>
			ing.nom.toLowerCase().includes(prep.recherche.toLowerCase())
		)}

		<div class="mb-6 rounded-lg border border-gray-200 p-5">
			<!-- Nom de la préparation (ex: Pâte, Garniture) -->
			<div class="mb-4 flex items-center gap-3">
				<input
					name="preparation_nom"
					bind:value={prep.nom}
					required
					placeholder="Nom de la préparation (ex: Pâte, Garniture)"
					class="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-base font-semibold transition focus:border-orange-600 focus:outline-none focus:ring-3 focus:ring-orange-600/15"
				/>

				{#if preparationsListe.length > 1}
					<button
						type="button"
						onclick={() => supprimerPreparation(prepIndex)}
						class="shrink-0 rounded-lg border border-red-300 px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
					>
						Retirer cette préparation
					</button>
				{/if}
			</div>

			<!-- Champ ingrédients -->
			<span class="mb-2 block text-sm font-semibold text-gray-800">Ingrédients</span>

			<input
				type="text"
				placeholder="Rechercher un ingrédient..."
				bind:value={prep.recherche}
				class="mb-3 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm transition focus:border-orange-600 focus:outline-none focus:ring-3 focus:ring-orange-600/15"
			/>

			<!-- Liste des ingrédients filtrés -->
			<div class="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
				{#each ingredientsFiltres as ingredient}
					<button
						type="button"
						class="{pillBase} {prep.selection.has(ingredient.id) ? pillActive : pillInactive}"
						onclick={() => toggleIngredient(prepIndex, ingredient.id)}
					>
						{ingredient.nom}
					</button>
				{:else}
					<p class="py-2 text-sm text-gray-500">
						Aucun ingrédient ne correspond à "{prep.recherche}"
					</p>
				{/each}
			</div>

			<!-- Affiche les ingrédients sélectionnés avec leurs quantités et unités -->
			{#if prep.selection.size > 0}
				<div class="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4">
					<span class="text-sm font-semibold text-gray-500">Ingrédients sélectionnés :</span>

					<!-- Boucle sur chaque ingrédient sélectionné pour cette préparation -->
					{#each [...prep.selection.entries()] as [id, valeurs]}
					<!-- @const permet de stocker une valeur calculée dans une variable locale afin d'éviter de recalculer la même valeur plusieurs fois  : https://svelte.dev/docs/svelte/@const -->
						{@const ingredient = data.ingredients.find((i) => i.id === id)}
						<div class="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
							<span class="w-28 shrink-0 font-medium">{ingredient?.nom}</span>

							<!-- Indique à quelle préparation appartient cet ingrédient -->
							<input type="hidden" name="preparation_index" value={prepIndex} />
							<input type="hidden" name="ingredient_id" value={id} />

							<!-- Les champs quantite -->
							<input
								type="number"
								step="any"
								name="quantite"
								placeholder="Quantité (optionnel)"
								bind:value={valeurs.quantite}
								class="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
							/>

							<!-- L'unité est également -->
							<input
								type="text"
								name="unite"
								placeholder="Unité (optionnel)"
								bind:value={valeurs.unite}
								class="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
							/>

							<!-- Bouton pour retirer cet ingrédient et 'X'générer par Claude.IA -->
							<button
								type="button"
								class="ml-auto text-gray-400 hover:text-red-600"
								aria-label="Retirer cet ingrédient"
								onclick={() => toggleIngredient(prepIndex, id)}
							>
								✕
							</button>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Champ étapes -->
			<div class="mt-5">
				<span class="mb-2 block text-sm font-semibold text-gray-800">Étapes</span>

				<!-- Boucle sur chaque étape de la préparation -->
				<div class="flex flex-col gap-3">
					{#each prep.etapes as etape, etapeIndex}
						<div class="flex items-start gap-2">
							<span class="mt-2.5 w-6 shrink-0 text-right font-semibold text-orange-600">
								{etapeIndex + 1}.
							</span>

							<!-- Indique à quelle préparation appartient cette étape -->
							<input type="hidden" name="etape_preparation_index" value={prepIndex} />

							<!-- Champ texte pour décrire l'étape -->
							<textarea
								name="etape"
								rows="2"
								bind:value={prep.etapes[etapeIndex]}
								placeholder="Décris cette étape..."
								class="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-base transition focus:border-orange-600 focus:outline-none focus:ring-3 focus:ring-orange-600/15"
							></textarea>

							<!-- Bouton pour supprimer cette étape -->
							<button
								type="button"
								onclick={() => supprimerEtape(prepIndex, etapeIndex)}
								disabled={prep.etapes.length === 1}
								class="mt-2 shrink-0 rounded-full border border-gray-300 px-2.5 py-0.5 text-gray-500 transition hover:border-red-600 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
								aria-label="Supprimer cette étape"
							>
								−
							</button>
						</div>
					{/each}
				</div>

				<!-- Bouton pour ajouter une nouvelle étape à cette préparation -->
				<button
					type="button"
					onclick={() => ajouterEtape(prepIndex)}
					class="mt-3 rounded-lg border border-orange-600 px-4 py-1.5 text-sm text-orange-600 transition hover:bg-orange-600 hover:text-white"
				>
					Ajouter une étape
				</button>
			</div>
		</div>
	{/each}

	<!-- Bouton pour ajouter une nouvelle préparation à la recette -->
	<button
		type="button"
		onclick={ajouterPreparation}
		class="mb-6 rounded-lg border border-gray-400 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
	>
		Ajouter une préparation
	</button>

	<!-- Affiche le message d'erreur renvoyé par fail() côté serveur, s'il y en a un -->
	{#if form?.message}
		<p class="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-center text-sm text-red-700">
			{form.message}
		</p>
	{/if}

	<!-- Boutons de soumission et d'annulation -->
	<div class="flex gap-3">
		<button
			type="submit" class="rounded-lg bg-orange-600 px-6 py-2.5 font-medium text-white transition hover:bg-orange-700">
			Créer la recette
		</button>

		<a href="/mes-recettes" class="rounded-lg border border-gray-300 px-6 py-2.5 font-medium text-gray-600 transition hover:bg-gray-100">
			Annuler
		</a>
	</div>
</form>