import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { utilisateurs, recettes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

// Charge les détails d'un utilisateur spécifique et ses recettes
export const load: PageServerLoad = async ({ params }) => {
  const utilisateur = await db.query.utilisateurs.findFirst({
    where: eq(utilisateurs.id, params.id),
  });

  if (!utilisateur) {
    throw error(404, 'Utilisateur introuvable');
  }

  // Récupère toutes les recettes de l'utilisateur spécifique
  const recettesUtilisateur = await db.query.recettes.findMany({
    where: eq(recettes.utilisateurId, params.id),
  });

  return { utilisateur, recettes: recettesUtilisateur };
};
