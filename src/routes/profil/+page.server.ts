import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { recettes } from '$lib/server/db/schema';

export const load: PageServerLoad = async (event) => {
  if (!event.locals.user) {
    return redirect(302, '/connexion');
  }

  // Récupère uniquement les recettes créées par l'utilisateur connecté
  const mesRecettes = await db.query.recettes.findMany({
    where: eq(recettes.utilisateurId, event.locals.user.id),
  });

  // Retourne les recettes de l'utilisateur et les informations de l'utilisateur connecté
  return { user: event.locals.user, recettes: mesRecettes };
};

// Action pour la déconnexion de l'utilisateur
export const actions: Actions = {
  signOut: async (event) => {
    await auth.api.signOut({
      headers: event.request.headers,
    });
    return redirect(302, '/connexion');
  },
};
