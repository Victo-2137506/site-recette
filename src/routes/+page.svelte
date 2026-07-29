<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

    // Ligne générer par Claude.IA
    // Crée un Set pour stocker les IDs des ingrédients sélectionnés
	let selection = new Set(data.selectionIngredients);

    // Fonction pour gérer la sélection/désélection des ingrédients (filtres)
	function changerFiltre(id: number) {
		if (selection.has(id)) {
			selection.delete(id);
		} else {
			selection.add(id);
		}

        // Crée un objet URLSearchParams pour construire la chaîne de requête
		const params = new URLSearchParams();
		selection.forEach((id) => params.append('ingredient', String(id)));

        // Met à jour l'URL avec les ingrédients sélectionnés sans recharger la page
        // https://svelte.dev/docs/kit/$app-navigation#goto
		goto(`?${params.toString()}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}
</script>

<h1>Recettes</h1>

<!-- Filtres (ingrédients) -->
<h2>Filtres par ingrédients</h2>

<div class="filtres">
    {#each data.ingredients as ingredient}
        <label>
            <input
                type="checkbox"
                checked={selection.has(ingredient.id)}
                onchange={() => changerFiltre(ingredient.id)}
            />
            {ingredient.nom}
        </label>
    {/each}
</div>

<!-- Liste des recettes -->
<div class="recipes-grid">
	{#each data.recettes as recette}
		<a href="/recettes/{recette.id}" class="recipe-card-link">
			<div class="recipe-card">
				<div class="recipe-image"></div>

				<div class="recipe-content">
					<h2>{recette.titre}</h2>
					<p class="recipe-description">{recette.description}</p>
				</div>
			</div>
		</a>
	{/each}
</div>

