<!-- Le tailwindCSS est généré par Claude.IA -->
<!-- Principe de la route [id] permet de récupérer les détails d'un utilisateur spécifique : https://svelte.dev/docs/kit/advanced-routing -->
<script lang="ts">
	let { data } = $props();
	const { utilisateur } = data;

	const initiale = utilisateur.nom.charAt(0).toUpperCase();
</script>

<svelte:head>
	<title>{utilisateur.nom} — Les recettes de grand-mère</title>
</svelte:head>

<!-- Affiche les détails de l'utilisateur et ses recettes -->
<div class="mb-8 flex items-center gap-5 rounded-xl bg-white p-8 shadow-md">
	<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-600 text-2xl font-bold text-white">
		{initiale}
	</div>

	<!-- Affiche le nom et l'ID de l'utilisateur -->
	<div>
		<h1 class="text-2xl font-bold text-orange-700">{utilisateur.nom}</h1>
		<p class="text-sm text-gray-500">ID: {utilisateur.id}</p>
	</div>
</div>

<h2 class="mb-4 text-xl font-bold text-orange-700">Recettes créées</h2>

<!-- Affiche la liste des recettes de l'utilisateur ou un message si aucune recette n'est trouvée -->
<div class="flex flex-col gap-5">

	<!-- Boucle sur chaque recette de l'utilisateur pour les afficher -->
	{#each data.recettes as recette}
		<a href="/recettes/{recette.id}" class="block text-inherit no-underline">
			<!-- Chaque recette est affichée dans une carte avec un lien vers la page de détails -->
			<div class="rounded-xl bg-white p-5 shadow-md">
				<h3 class="mb-2.5 text-lg font-bold text-orange-700">{recette.titre}</h3>
				<p class="text-gray-500">{recette.description}</p>
			</div>
		</a>
	{:else}
		<div class="rounded-xl bg-white p-10 text-center shadow-md">
			<p class="text-lg font-semibold text-gray-800">Cet utilisateur n'a pas encore créé de recette</p>
		</div>
	{/each}
</div>