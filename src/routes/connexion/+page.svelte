<script lang='ts'>
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="auth-page">
	<div class="auth-card">
		<h1>Bienvenue</h1>
		<p class="auth-subtitle">Connecte-toi ou crée un compte pour partager tes recettes</p>

		<form method="post" action="?/signInEmail" use:enhance>
			<div class="form-group">
				<label for="email">Email</label>
				<input id="email" type="email" name="email" required />
			</div>

			<div class="form-group">
				<label for="password">Mot de passe</label>
				<input id="password" type="password" name="password" required />
			</div>

			<div class="form-group">
				<label for="name">Nom (pour l'inscription)</label>
				<input id="name" name="name" />
			</div>

			<div class="auth-actions">
				<button type="submit" class="btn">Se connecter</button>
				<button type="submit" formaction="?/signUpEmail" class="btn-outline">S'inscrire</button>
			</div>
		</form>

		{#if form?.message}
			<p class="form-error">{form.message}</p>
		{/if}
	</div>
</div>