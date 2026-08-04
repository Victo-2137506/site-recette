<!-- Le tailwindCSS est généré par Claude.IA -->
<script lang='ts'>
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();

	// Récupère la première lettre du nom pour l'afficher dans l'avatar rond
	const initiale = data.user.name.charAt(0).toUpperCase();

	// Onglet actuellement affiché : 'mes-recettes' ou 'aimees'
	let ongletActif = $state<'mes-recettes' | 'aimees'>('mes-recettes');

	const tabBase = 'px-4 py-2.5 text-sm font-semibold transition border-b-2';
	const tabActive = 'border-orange-600 text-orange-600';
	const tabInactive = 'border-transparent text-gray-500 hover:text-orange-600';
</script>

<svelte:head>
	<title>Mon profil — Les recettes de grand-mère</title>
</svelte:head>

<!-- Affiche les détails de l'utilisateur et ses recettes -->
<div class="flex items-center gap-5 rounded-xl bg-white p-8 shadow-md mb-8">
	<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-600 text-2xl font-bold text-white">
		{initiale}
	</div>

	<!-- Affiche le nom et l'ID de l'utilisateur -->
	<div>
		<h1 class="text-2xl font-bold text-orange-700">{data.user.name}</h1>
		<p class="text-sm text-gray-500">ID: {data.user.id}</p>
	</div>
</div>

<!-- Barre d'onglets -->
<div class="mb-6 flex gap-2 border-b border-gray-200">

	<!-- Bouton pour l'onglet "Mes recettes" -->
	<button
		type="button"
		class="{tabBase} {ongletActif === 'mes-recettes' ? tabActive : tabInactive}"
		onclick={() => (ongletActif = 'mes-recettes')}
	>
		Mes recettes ({data.recettes.length})
	</button>

	<!-- Bouton pour l'onglet "Recettes aimées" -->
	<button
		type="button"
		class="{tabBase} {ongletActif === 'aimees' ? tabActive : tabInactive}"
		onclick={() => (ongletActif = 'aimees')}
	>
		Recettes aimées ({data.recettesAimees.length})
	</button>
</div>

<!-- Contenu de l'onglet "Mes recettes" -->
{#if ongletActif === 'mes-recettes'}
	<div class="flex flex-col gap-5">
		{#each data.recettes as recette}
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
{/if}

<!-- Contenu de l'onglet "Recettes aimées" -->
{#if ongletActif === 'aimees'}
	<div class="flex flex-col gap-5">
		{#each data.recettesAimees as recette}
			<a href="/recettes/{recette.id}" class="block text-inherit no-underline">
				<div class="rounded-xl bg-white p-5 shadow-md">
					<h3 class="mb-2.5 text-lg font-bold text-orange-700">{recette.titre}</h3>
					<p class="text-gray-500">{recette.description}</p>
				</div>
			</a>
		{:else}
			<div class="rounded-xl bg-white p-10 text-center shadow-md">
				<p class="text-lg font-semibold text-gray-800">Tu n'as encore aimé aucune recette</p>
			</div>
		{/each}
	</div>
{/if}