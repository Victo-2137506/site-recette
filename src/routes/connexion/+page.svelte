<!-- Le tailwindCSS est généré par Claude.IA -->
<script lang='ts'>
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Connexion — Les recettes de grand-mère</title>
</svelte:head>

<div class="flex justify-center px-5 py-10">
	<div class="w-full max-w-md rounded-xl bg-white p-10 shadow-md">
		<h1 class="text-center text-3xl font-bold text-orange-700">Bienvenue</h1>
		<p class="mb-7 text-center text-sm text-gray-500">
			Connecte-toi ou crée un compte pour partager tes recettes
		</p>

		<form method="post" action="?/signInEmail" use:enhance>

			<!-- Champ email -->
			<div class="mb-4 flex flex-col gap-1.5">
				<label for="email" class="text-sm font-semibold text-gray-800">Email</label>
				<input
					id="email"
					type="email"
					name="email"
					required
					class="rounded-lg border border-gray-300 px-3.5 py-2.5 text-base transition focus:border-orange-600 focus:outline-none focus:ring-3 focus:ring-orange-600/15"
				/>
			</div>
			
			<!-- Champ mot de passe -->
			<div class="mb-4 flex flex-col gap-1.5">
				<label for="password" class="text-sm font-semibold text-gray-800">Mot de passe</label>
				<input
					id="password"
					type="password"
					name="password"
					required
					class="rounded-lg border border-gray-300 px-3.5 py-2.5 text-base transition focus:border-orange-600 focus:outline-none focus:ring-3 focus:ring-orange-600/15"
				/>
			</div>

			<!-- Champ nom : seulement utile pour l'inscription, ignoré côté serveur pour la connexion -->
			<div class="mb-4 flex flex-col gap-1.5">
				<label for="name" class="text-sm font-semibold text-gray-800">Nom (pour l'inscription)</label>
				<input
					id="name"
					name="name"
					class="rounded-lg border border-gray-300 px-3.5 py-2.5 text-base transition focus:border-orange-600 focus:outline-none focus:ring-3 focus:ring-orange-600/15"
				/>
			</div>

			<div class="mt-6 flex flex-col gap-2.5">
				<!-- Bouton par défaut du formulaire : déclenche l'action "signInEmail" -->
				<button
					type="submit"
					class="rounded-lg bg-orange-600 px-4 py-2.5 font-medium text-white transition hover:bg-orange-700"
				>
					Se connecter
				</button>

				<!-- formaction override l'action du <form> uniquement pour ce bouton -->
				<button
					type="submit"
					formaction="?/signUpEmail"
					class="rounded-lg border border-orange-600 px-4 py-2.5 font-medium text-orange-600 transition hover:bg-orange-600 hover:text-white"
				>
					S'inscrire
				</button>
			</div>
		</form>

		<!-- Affiche le message d'erreur renvoyé par fail() côté serveur, s'il y en a un -->
		{#if form?.message}
			<p class="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-center text-sm text-red-700">
				{form.message}
			</p>
		{/if}
	</div>
</div>