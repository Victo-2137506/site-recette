import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { recettes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

// Charge la page de détails d'une recette spécifique en fonction de son ID
export const load: PageServerLoad = async ({ params }) => {
  const id = Number(params.id);

  // Vérifie si l'ID est un nombre valide
  if (Number.isNaN(id)) {
    throw error(404, 'Recette introuvable');
  }
  // Récupère la recette avec l'ID correspondant, ainsi que les informations de l'utilisateur et les ingrédients associés
  const recette = await db.query.recettes.findFirst({
    where: eq(recettes.id, id),
    with: {
      utilisateur: true,
      recetteIngredients: {
        with: { ingredient: true },
      },
    },
  });

  if (!recette) {
    throw error(404, 'Recette introuvable');
  }

  // Retourne la recette trouvée pour l'affichage sur la page
  return { recette };
};
