<!-- Le tailwindCSS est généré par Claude.IA -->
<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	// Icônes de la librairie lucide-svelte : https://lucide.dev/guide/packages/lucide-svelte
	import { LogIn, LogOut, User } from 'lucide-svelte'; 
	// Client Better Auth : https://better-auth.com/docs/integrations/svelte-kit#client-side
	import { authClient } from '$lib/auth-client';
	// goto() : navigue vers une autre route sans recharger la page
	// invalidateAll() : force SvelteKit à ré-exécuter toutes les fonctions load actives : https://svelte.dev/docs/kit/$app-navigation
	import { goto, invalidateAll } from '$app/navigation';

	let { data, children } = $props();

	// Fonction de déconnexion puis redirige vers l'accueil pour refléter immédiatement l'état déconnecté
	async function handleSignOut() {
		await authClient.signOut();
		await invalidateAll();
		goto('/');
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<header class="mb-5 bg-white px-6 py-4 shadow-sm">
		<div class="mx-auto flex max-w-7xl items-center justify-between">
			<h1 class="text-2xl font-bold text-orange-600">Les recettes de grand-mère</h1>

			<nav class="flex items-center gap-5">
				<a href="/" class="text-gray-500 transition hover:text-orange-600">Général</a>

				{#if data.user}
					<!-- Route "Mes recettes" -->
					<a href="/mes-recettes" class="text-gray-500 transition hover:text-orange-600">
						Mes recettes
					</a>	
					<!-- Route "Créer une recette" -->
					<a href="/profil"
						class="flex items-center text-gray-500 transition hover:text-orange-600"
						aria-label="Mon profil"
					><User size={20} /></a>
					<!-- Bouton de déconnexion -->
					<button
						onclick={handleSignOut}
						class="flex items-center text-gray-500 transition hover:text-orange-600"
						aria-label="Se déconnecter"
					><LogOut size={20} /></button>
				{:else}
					<!-- Route "Connexion" -->
					<a href="/connexion"
						class="flex items-center text-gray-500 transition hover:text-orange-600"
						aria-label="Se connecter"
					><LogIn size={20} /></a>
				{/if}
			</nav>
		</div>
	</header>

	<main class="mx-auto w-full max-w-7xl flex-1 px-5">{@render children()}</main>

	<footer class="mt-10 border-t border-gray-200 bg-white px-5 py-5 text-center text-sm text-gray-500">
		<p>© 2026 Les recettes de grand-mère — Créé par Frédérick BETHERMAT</p>
	</footer>
</div>