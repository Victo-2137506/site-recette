import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { recettes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Charge les recettes de l'utilisateur connecté
export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/connexion');
  }

  // Récupère toutes les recettes de l'utilisateur connecté
  const mesRecettes = await db.query.recettes.findMany({
    where: eq(recettes.utilisateurId, locals.user.id),
  });

  // Retourne les recettes pour affichage
  return { recettes: mesRecettes };
};

// Actions pour supprimer une recette
export const actions: Actions = {
  supprimer: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { message: 'Non connecté' });
    }

    // Récupère les données du formulaire
    const formData = await request.formData();
    const id = Number(formData.get('id'));

    // Vérifie que la recette appartient bien à l'utilisateur avant de supprimer
    const recette = await db.query.recettes.findFirst({
      where: eq(recettes.id, id),
    });

    // Vérifie que la recette appartient à l'utilisateur connecté
    if (!recette || recette.utilisateurId !== locals.user.id) {
      return fail(403, { message: 'Action non autorisée' });
    }

    // Supprime la recette de la base de données
    await db.delete(recettes).where(eq(recettes.id, id));

    return { success: true };
  },
};
