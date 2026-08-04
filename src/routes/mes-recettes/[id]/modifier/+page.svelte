<!-- Le tailwindCSS est généré par Claude.IA -->
<!-- Principe de la route [id] permet de récupérer les détails d'une recette spécifique : https://svelte.dev/docs/kit/advanced-routing -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData, ActionData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

	// Reconstruit la liste des étapes
	function parserEtapes(texte: string): string[] {
		const lignes = texte
			.split('\n')
			.map((ligne) => ligne.replace(/^\d+\.\s*/, '').trim())
			.filter(Boolean);

		return lignes.length > 0 ? lignes : [''];
	}

	// Structure d'une préparation
	type PreparationEtat = {
		nom: string;
		selection: Map<number, { quantite: string; unite: string }>;
		recherche: string;
		etapes: string[];
	};

	// Pré-remplit chaque préparation à partir des données déjà en base
	let preparationsListe = $state<PreparationEtat[]>(
		data.recette.preparations.map((prep) => ({
			nom: prep.nom,
			selection: new Map(
				prep.recetteIngredients.map((ri) => [
					ri.ingredientId,
					{ quantite: ri.quantite, unite: ri.unite ?? '' }
				])
			),
			recherche: '',
			etapes: parserEtapes(prep.etapes)
		}))
	);

	// Crée une nouvelle préparation vide
	function nouvellePreparation(): PreparationEtat {
		return { nom: '', selection: new Map(), recherche: '', etapes: [''] };
	}

	// Ajoute une nouvelle préparation à la liste
	function ajouterPreparation() {
		preparationsListe = [...preparationsListe, nouvellePreparation()];
	}

	// Supprime une préparation de la liste
	function supprimerPreparation(index: number) {
		if (preparationsListe.length > 1) {
			preparationsListe = preparationsListe.filter((_, i) => i !== index);
		}
	}

    // Fonction pour basculer la sélection d'un ingrédient
	function toggleIngredient(prepIndex: number, id: number) {
		const prep = preparationsListe[prepIndex];
		const copie = new Map(prep.selection);

		// Si l'ingrédient est déjà sélectionné, le retirer.
		// Sinon, l'ajouter avec des valeurs par défaut.
		if (copie.has(id)) {
			copie.delete(id);
		} else {
			copie.set(id, { quantite: '', unite: '' });
		}

		prep.selection = copie;
	}

	// Fonction pour ajouter une nouvelle étape à une préparation
	function ajouterEtape(prepIndex: number) {
		preparationsListe[prepIndex].etapes = [...preparationsListe[prepIndex].etapes, ''];
	}

	// Fonction pour supprimer une étape d'une préparation
	function supprimerEtape(prepIndex: number, etapeIndex: number) {
		const prep = preparationsListe[prepIndex];
		if (prep.etapes.length > 1) {
			prep.etapes = prep.etapes.filter((_, i) => i !== etapeIndex);
		}
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

				<!-- Bouton pour supprimer la préparation -->
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

			<!-- Section pour gérer les ingrédients associés à cette préparation -->
			<span class="mb-2 block text-sm font-semibold text-gray-800">Ingrédients</span>

			<!-- Champ de recherche pour filtrer les ingrédients -->
			<input
				type="text"
				placeholder="Rechercher un ingrédient..."
				bind:value={prep.recherche}
				class="mb-3 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm transition focus:border-orange-600 focus:outline-none focus:ring-3 focus:ring-orange-600/15"
			/>

			<!-- Affiche les ingrédients filtrés en fonction de la recherche -->
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

			<!-- Affiche les ingrédients sélectionnés avec des champs pour la quantité et l'unité -->
			{#if prep.selection.size > 0}
				<div class="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4">
					<span class="text-sm font-semibold text-gray-500">Ingrédients sélectionnés :</span>

					<!-- Parcourt les ingrédients sélectionnés et affiche un champ pour la quantité et l'unité -->
					{#each [...prep.selection.entries()] as [id, valeurs]}
						{@const ingredient = data.ingredients.find((i) => i.id === id)}
						<div class="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
							<span class="w-28 shrink-0 font-medium">{ingredient?.nom}</span>

							<!-- Indique à quelle préparation appartient cet ingrédient -->
							<input type="hidden" name="preparation_index" value={prepIndex} />
							<input type="hidden" name="ingredient_id" value={id} />

							<!-- Champ pour la quantité -->
							<input
								type="number"
								step="any"
								name="quantite"
								placeholder="Quantité (optionnel)"
								bind:value={valeurs.quantite}
								class="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
							/>

							<!-- Champ pour l'unité -->
							<input
								type="text"
								name="unite"
								placeholder="Unité (optionnel)"
								bind:value={valeurs.unite}
								class="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
							/>

							<!-- Bouton pour retirer l'ingrédient -->
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

			<!-- Champ pour les étapes de cette préparation -->
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

							<!-- Champ pour décrire l'étape -->
							<textarea
								name="etape"
								rows="2"
								bind:value={prep.etapes[etapeIndex]}
								placeholder="Décris cette étape..."
								class="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-base transition focus:border-orange-600 focus:outline-none focus:ring-3 focus:ring-orange-600/15"
							></textarea>

							 <!-- Bouton pour supprimer l'étape -->
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

    <!-- Affiche un message d'erreur si la modification échoue -->
	{#if form?.message}
		<p class="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-center text-sm text-red-700">
			{form.message}
		</p>
	{/if}

	<!-- Boutons enregistrer-->
<div class="flex gap-3">
	<button
		type="submit" class="rounded-lg bg-orange-600 px-6 py-2.5 font-medium text-white transition hover:bg-orange-700">
		Enregistrer les modifications
	</button>

	<!-- Bouton annuler-->
	<a href="/mes-recettes" class="rounded-lg border border-gray-300 px-6 py-2.5 font-medium text-gray-600 transition hover:bg-gray-100">
		Annuler
	</a>
</div>
</form>