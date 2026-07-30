<!-- Le tailwindCSS est généré par Claude.IA -->
<script lang='ts'>
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();

	// Récupère la première lettre du nom pour l'afficher dans l'avatar rond
	const initiale = data.user.name.charAt(0).toUpperCase();
</script>

<svelte:head>
	<title>Mon profil — Les recettes de grand-mère</title>
</svelte:head>

<!-- Affiche les détails de l'utilisateur et ses recettes -->
<div class="flex items-center gap-5 rounded-xl bg-white p-8 shadow-md mb-8">
	<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-600 text-2xl font-bold text-white">
		{initiale}
	</div>

	<div>
		<h1 class="text-2xl font-bold text-orange-700">{data.user.name}</h1>
	</div>

	<!-- <form method="post" action="?/signOut" use:enhance class="ml-auto">
		<button type="submit" class="rounded-lg border border-orange-600 px-4 py-2 text-orange-600 transition hover:bg-orange-600 hover:text-white">
			Se déconnecter
		</button>
	</form> -->
</div>

<h2 class="mb-4 text-xl font-bold text-orange-700">Mes recettes</h2>

<!-- Affiche la liste des recettes de l'utilisateur ou un message si aucune recette n'est trouvée -->
<div class="flex flex-col gap-5">
	<!-- Parcourt les recettes de l'utilisateur et les affiche -->
	{#each data.recettes as recette}
		<!-- Chaque recette est un lien vers sa page de détails -->
		<a href="/recettes/{recette.id}" class="block text-inherit no-underline">
			<div class="rounded-xl bg-white p-5 shadow-md">
				<h3 class="mb-2.5 text-lg font-bold text-orange-700">{recette.titre}</h3>
				<p class="text-gray-500">{recette.description}</p>
			</div>
		</a>
	{:else}
		<div class="rounded-xl bg-white p-10 text-center shadow-md">
			<p class="text-lg font-semibold text-gray-800">Tu n'as pas encore créé de recette</p>
		</div>
	{/each}
</div>