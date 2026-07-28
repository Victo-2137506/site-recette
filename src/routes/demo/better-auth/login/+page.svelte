<script lang='ts'>
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<h1>Connexion</h1>
<form method="post" action="?/signInEmail" use:enhance>
	<label>
		Email
		<input type="email" name="email" />
	</label>
	<label>
		Mot de passe
		<input type="password" name="password" />
	</label>
	<label>
		Nom (pour l'inscription)
		<input name="name" />
	</label>
	<button>Se connecter</button>
	<button formaction="?/signUpEmail">S'inscrire</button>
</form>
<p style="color: red">{form?.message ?? ''}</p>
