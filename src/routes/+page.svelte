<script lang="ts">
    let { data } = $props();

    // Ingrédients sélectionnés (Set pour simplifier l'ajout/retrait)
    let selected = new Set(data.selectedIngredients);

    // Ajoute ou retire un ingrédient des filtres
    function toggle(id: number) {
        if (selected.has(id)) {
            selected.delete(id);
        } else {
            selected.add(id);
        }

        // Reconstruit l'URL avec les ingrédients cochés
        const params = new URLSearchParams();
        selected.forEach((id) => params.append('ingredient', String(id)));

        // Recharge la page avec les bons filtres
        window.location.search = params.toString();
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
                checked={selected.has(ingredient.id)}
                onchange={() => toggle(ingredient.id)}
            />
            {ingredient.nom}
        </label>
    {/each}
</div>

<!-- Liste des recettes -->
<div class="recipes-grid">
    {#each data.recettes as recette}
        <div class="recipe-card">
            <div class="recipe-image"></div>

            <div class="recipe-content">
                <h2>{recette.titre}</h2>
                <p class="recipe-description">{recette.description}</p>
            </div>
        </div>
    {/each}
</div>

