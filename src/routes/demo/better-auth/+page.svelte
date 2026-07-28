<script lang='ts'>
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
</script>

<h1>Bonjour, {data.user.name}!</h1>
<p>Votre ID d'utilisateur est {data.user.id}.</p>
<form method="post" action="?/signOut" use:enhance>
	<button >Se déconnecter</button>
</form>
