<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { LogIn, LogOut, User } from 'lucide-svelte';
	import { authClient } from '$lib/auth-client';
	import { goto, invalidateAll } from '$app/navigation';

	let { data, children } = $props();

	async function handleSignOut() {
		await authClient.signOut();
		await invalidateAll();
		goto('/');
	}
</script>

<svelte:head>
	<title>Les recettes de grand-mère</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="site-header">
	<div class="header-content">
		<h1 class="logo">Les recettes de grand-mère</h1>

		<nav class="navbar">
			<a href="/" class="nav-link">Général</a>

			{#if data.user}
				<a href="/mes-recettes" class="nav-link">Mes recettes</a>
				<a href="/profil" class="nav-link nav-icon" aria-label="Mon profil">
					<User size={20} />
				</a>
				<button onclick={handleSignOut} class="nav-link nav-icon" aria-label="Se déconnecter">
					<LogOut size={20} />
				</button>
			{:else}
				<a href="/connexion" class="nav-link nav-icon" aria-label="Se connecter">
					<LogIn size={20} />
				</a>
			{/if}
		</nav>
	</div>
</header>

<main class="site-main">
	{@render children()}
</main>

<footer class="site-footer">
	<p>© 2026 Les recettes de grand-mère — Créé par Frédérick</p>
</footer>