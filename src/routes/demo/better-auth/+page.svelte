<script lang='ts'>
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();

	const initiale = data.user.name.charAt(0).toUpperCase();
</script>

<div class="profile-header">
	<div class="profile-avatar">{initiale}</div>
	<div class="profile-info">
		<h1>{data.user.name}</h1>
		<p>ID: {data.user.id}</p>
	</div>

	<!-- <form method="post" action="?/signOut" use:enhance class="profile-signout">
		<button type="submit" class="btn-outline">Se déconnecter</button>
	</form> -->
</div>

<!-- TODO: liste des recettes créées par cet utilisateur, une fois la vraie page profil construite -->