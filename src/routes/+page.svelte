<script lang="ts">
	let { data } = $props();
</script>

<h1>Recettes</h1>

{#each data.recette as recette}
	<article>
		<h2>{recette.titre}</h2>
		<p>{recette.description}</p>
	</article>
{:else}
	<p>Aucune recette trouvée.</p>
{/each}