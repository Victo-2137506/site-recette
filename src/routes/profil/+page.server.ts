import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { recettes, jaime } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Charge les données nécessaires à la page de profil
export const load: PageServerLoad = async (event) => {
  if (!event.locals.user) {
    return redirect(302, '/connexion');
  }

  // Récupère uniquement les recettes créées par l'utilisateur connecté
  const mesRecettes = await db.query.recettes.findMany({
    where: eq(recettes.utilisateurId, event.locals.user.id),
  });

  // Récupère les recettes aimées par l'utilisateur connecté, via la table de liaison jaime
  const recettesAimees = await db.query.jaime.findMany({
    where: eq(jaime.utilisateurId, event.locals.user.id),
    with: { recette: true },
  });

  // Retourne les données nécessaires à la page de profil
  return {
    user: event.locals.user,
    recettes: mesRecettes,
    recettesAimees: recettesAimees
      .filter((j) => j.recette !== null)
      .map((j) => j.recette),
  };
};

// Action pour déconnecter l'utilisateur
export const actions: Actions = {
  signOut: async (event) => {
    await auth.api.signOut({
      headers: event.request.headers,
    });
    return redirect(302, '/connexion');
  },
};
