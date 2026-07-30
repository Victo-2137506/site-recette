<!-- Le tailwindCSS est généré par Claude.IA -->
<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Mes recettes — Les recettes de grand-mère</title>
</svelte:head>

<h1 class="mb-6 text-3xl font-bold">Mes recettes</h1>


	<a href="/mes-recettes/creer"
	class="mb-6 inline-block rounded-lg bg-orange-600 px-4 py-2.5 font-medium text-white transition hover:bg-orange-700">
	Créer une recette
</a>

<div class="mt-6 flex flex-col gap-5">
	{#each data.recettes as recette}
		<a href="/recettes/{recette.id}" class="block text-inherit no-underline">
			<div class="rounded-xl bg-white p-5 shadow-md">
				<h2 class="mb-2.5 text-lg font-bold text-orange-700">{recette.titre}</h2>
				<p class="text-gray-500">{recette.description}</p>
			</div>
		</a>
	{:else}
		<div class="rounded-xl bg-white p-10 text-center shadow-md">
			<p class="text-lg font-semibold text-gray-800">Tu n'as pas encore créé de recette</p>
			<p class="mt-1 text-sm text-gray-500">Clique sur le bouton ci-dessus pour en créer une.</p>
		</div>
	{/each}
</div>