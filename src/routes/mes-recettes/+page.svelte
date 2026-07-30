<!-- Le tailwindCSS est généré par Claude.IA -->
<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();
</script>

<svelte:head>
	<title>Mes recettes — Les recettes de grand-mère</title>
</svelte:head>

<h1 class="mb-6 text-3xl font-bold">Mes recettes</h1>

<!-- Bouton pour créer une nouvelle recette -->
<a href="/mes-recettes/creer" class="mb-6 inline-block rounded-lg bg-orange-600 px-4 py-2.5 font-medium text-white transition hover:bg-orange-700">
	Créer une recette
</a>

<!-- Liste des recettes de l'utilisateur -->
<div class="mt-6 flex flex-col gap-5">
	{#each data.recettes as recette}

		<!-- Chaque recette est affichée dans une carte avec un lien vers la page de détails -->
		<div class="rounded-xl bg-white p-5 shadow-md">
			<a href="/recettes/{recette.id}" class="block text-inherit no-underline">
				<h2 class="mb-2.5 text-lg font-bold text-orange-700">{recette.titre}</h2>
				<p class="text-gray-500">{recette.description}</p>
			</a>

			<!-- Boutons pour modifier ou supprimer la recette -->
			<div class="mt-4 flex gap-3 border-t border-gray-200 pt-4">
				<a href="/mes-recettes/{recette.id}/modifier"class="rounded-lg border border-orange-600 px-4 py-1.5 text-sm text-orange-600 transition hover:bg-orange-600 hover:text-white">
					Modifier
				</a>

				<!-- Formulaire pour supprimer la recette avec confirmation -->
					<form
						method="post"
						action="?/supprimer"
						use:enhance={({ cancel }) => {
							if (!confirm('Supprimer cette recette définitivement ?')) {
								cancel();
							}
						}}
					>

					<input type="hidden" name="id" value={recette.id} />
					<button
						type="submit"
						class="rounded-lg border border-red-600 px-4 py-1.5 text-sm text-red-600 transition hover:bg-red-600 hover:text-white"
					>
						Supprimer
					</button>
				</form>
			</div>
		</div>
	{:else}
		<div class="rounded-xl bg-white p-10 text-center shadow-md">
			<p class="text-lg font-semibold text-gray-800">Tu n'as pas encore créé de recette</p>
			<p class="mt-1 text-sm text-gray-500">Clique sur le bouton ci-dessus pour en créer une.</p>
		</div>
	{/each}
</div>