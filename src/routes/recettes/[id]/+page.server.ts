import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { recettes, jaime } from '$lib/server/db/schema';
import { eq, count, and } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';

// Charge la page de détails d'une recette spécifique en fonction de son ID
export const load: PageServerLoad = async ({ params, locals }) => {
  const id = Number(params.id);

  // Vérifie si l'ID est un nombre valide
  if (Number.isNaN(id)) {
    throw error(404, 'Recette introuvable');
  }
  // Récupère la recette avec l'ID correspondant, ainsi que les informations de l'utilisateur
  // et toutes ses préparations, chacune avec ses propres ingrédients associés
  const recette = await db.query.recettes.findFirst({
    where: eq(recettes.id, id),
    with: {
      utilisateur: true,
      preparations: {
        with: {
          recetteIngredients: {
            with: { ingredient: true },
          },
        },
      },
    },
  });

  // Si la recette n'existe pas, renvoie une erreur 404
  if (!recette) {
    throw error(404, 'Recette introuvable');
  }

  // Compte le nombre de likes pour cette recette
  const [resultat] = await db
    .select({ total: count() })
    .from(jaime)
    .where(eq(jaime.recetteId, id));

  // Vérifie si l'utilisateur actuellement connecté a déjà aimé cette recette
  let dejaAime = false;

  if (locals.user) {
    const likeExistant = await db.query.jaime.findFirst({
      where: and(
        eq(jaime.recetteId, id),
        eq(jaime.utilisateurId, locals.user.id),
      ),
    });
    dejaAime = !!likeExistant;
  }

  // Retourne la recette trouvée pour l'affichage sur la page
  return { recette, nombreJaimes: resultat.total, dejaAime };
};

// Action déclenchée au clic sur le bouton j'aime/je n'aime plus
export const actions: Actions = {
  toggleLike: async ({ params, locals }) => {
    // Refuse l'action si personne n'est connecté
    if (!locals.user) {
      return fail(401, {
        message: 'Tu dois être connecté pour aimer une recette',
      });
    }

    const id = Number(params.id);

    if (Number.isNaN(id)) {
      return fail(400, { message: 'Recette invalide' });
    }

    // Vérifie si un like existe déjà pour ce couple utilisateur/recette
    const likeExistant = await db.query.jaime.findFirst({
      where: and(
        eq(jaime.recetteId, id),
        eq(jaime.utilisateurId, locals.user.id),
      ),
    });

    if (likeExistant) {
      // Déjà aimé → on retire le like
      await db
        .delete(jaime)
        .where(
          and(eq(jaime.recetteId, id), eq(jaime.utilisateurId, locals.user.id)),
        );
    } else {
      // Pas encore aimé → on l'ajoute
      await db.insert(jaime).values({
        recetteId: id,
        utilisateurId: locals.user.id,
      });
    }

    return { success: true };
  },
};
