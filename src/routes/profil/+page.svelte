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

<div class="flex items-center gap-5 rounded-xl bg-white p-8 shadow-md mb-8">
	<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-600 text-2xl font-bold text-white">
		{initiale}
	</div>

	<div>
		<h1 class="text-2xl font-bold text-orange-700">{data.user.name}</h1>
		<p class="text-sm text-gray-500">ID: {data.user.id}</p>
	</div>

	<!-- <form method="post" action="?/signOut" use:enhance class="ml-auto">
		<button type="submit" class="rounded-lg border border-orange-600 px-4 py-2 text-orange-600 transition hover:bg-orange-600 hover:text-white">
			Se déconnecter
		</button>
	</form> -->
</div>

<!-- TODO: liste des recettes créées par cet utilisateur, une fois la vraie page profil construite -->