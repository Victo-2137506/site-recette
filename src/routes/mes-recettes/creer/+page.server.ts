import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
  recettes,
  ingredients,
  recetteIngredients,
} from '$lib/server/db/schema';

// Charge la page de création de recette avec la liste des ingrédients disponibles
export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/connexion');
  }

  // Récupère tous les ingrédients de la base de données
  const tousLesIngredients = await db.select().from(ingredients);

  return { ingredients: tousLesIngredients };
};

// Gère la soumission du formulaire de création de recette
export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { message: 'Non connecté' });
    }

    // Récupère les données du formulaire
    const formData = await request.formData();

    // Récupère les champs principaux de la recette
    const titre = formData.get('titre')?.toString() ?? '';
    const description = formData.get('description')?.toString() ?? '';
    const etapes = formData.get('etapes')?.toString() ?? '';

    // Récupère les tableaux d'ingrédients sélectionnés (même index = même ingrédient)
    const ingredientIds = formData.getAll('ingredient_id').map(Number);
    const quantites = formData.getAll('quantite').map(String);
    const unites = formData.getAll('unite').map(String);

    // Vérifie que le titre et les étapes sont présents
    if (!titre || !etapes) {
      return fail(400, { message: 'Le titre et les étapes sont requis' });
    }

    // Vérifie qu'au moins un ingrédient est sélectionné
    if (ingredientIds.length === 0) {
      return fail(400, { message: 'Sélectionne au moins un ingrédient' });
    }

    // Insère la recette et récupère son id généré
    const [resultat] = await db.insert(recettes).values({
      titre,
      description,
      etapes,
      utilisateurId: locals.user.id,
    });

    // Récupère l'ID de la nouvelle recette insérée
    const nouvelleRecetteId = resultat.insertId;

    // Insère chaque association ingrédient/quantité/unité
    await db.insert(recetteIngredients).values(
      ingredientIds.map((ingredientId, i) => ({
        recetteId: nouvelleRecetteId,
        ingredientId,
        quantite: quantites[i]?.trim() || '',
        unite: unites[i]?.trim() || null,
      })),
    );
    throw redirect(303, `/recettes/${nouvelleRecetteId}`);
  },
};
