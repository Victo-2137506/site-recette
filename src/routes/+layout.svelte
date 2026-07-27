<script lang="ts">
    import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

    let { children } = $props();
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
            <a href="/mes-recettes" class="nav-link">Mes recettes</a>
            <a href="/profil" class="nav-link">Profil</a>
        </nav>
    </div>
</header>

<main class="site-main">
    {@render children()}
</main>

<footer class="site-footer">
    <p>© 2026 Les recettes de grand-mère — Créé par Frédérick</p>
</footer>
