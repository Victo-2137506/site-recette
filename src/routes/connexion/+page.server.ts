import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

// Permet de rediriger l'utilisateur vers la page de profil s'il est déjà connecté
export const load: PageServerLoad = (event) => {
  if (event.locals.user) {
    return redirect(302, '/profil');
  }
  return {};
};

// Actions pour la connexion et l'inscription de l'utilisateur
export const actions: Actions = {
  signInEmail: async (event) => {
    const formData = await event.request.formData();
    const email = formData.get('email')?.toString() ?? '';
    const password = formData.get('password')?.toString() ?? '';

    // Appel à l'API pour connecter l'utilisateur avec son email et mot de passe
    try {
      await auth.api.signInEmail({
        body: {
          email,
          password,
          callbackURL: '/auth/verification-success',
        },
      });
    } catch (error) {
      if (error instanceof APIError) {
        return fail(400, { message: error.message || 'Connexion échouée' });
      }
      return fail(500, { message: 'Erreur inattendue' });
    }

    return redirect(302, '/profil');
  },
  // Action pour l'inscription de l'utilisateur avec email, mot de passe et nom
  signUpEmail: async (event) => {
    const formData = await event.request.formData();
    const email = formData.get('email')?.toString() ?? '';
    const password = formData.get('password')?.toString() ?? '';
    const name = formData.get('name')?.toString() ?? '';

    // Appel à l'API pour inscrire l'utilisateur avec son email, mot de passe et nom
    try {
      await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
          callbackURL: '/auth/verification-success',
        },
      });
    } catch (error) {
      if (error instanceof APIError) {
        return fail(400, { message: error.message || 'Inscription échouée' });
      }
      return fail(500, { message: 'Erreur inattendue' });
    }

    return redirect(302, '/profil');
  },
};
