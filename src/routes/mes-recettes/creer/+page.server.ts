import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
  recettes,
  preparations,
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

// Code généré par Claude.IA pour gérer la création d'une recette
type PreparationAEnregistrer = {
  nom: string;
  ordre: number;
  etapes: string;
  ingredients: {
    ingredientId: number;
    quantite: string;
    unite: string | null;
  }[];
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

    // Récupère les noms de chaque préparation
    const preparationNoms = formData.getAll('preparation_nom').map(String);

    // Récupère les étapes de chaque préparation
    const etapesPrepIndex = formData
      .getAll('etape_preparation_index')
      .map(Number);
    const etapesTexte = formData
      .getAll('etape')
      .map((e) => e.toString().trim());

    // Récupère les ingrédients associés à chaque préparation
    const ingredientsPrepIndex = formData
      .getAll('preparation_index')
      .map(Number);
    // Récupère les ID des ingredients
    const ingredientIds = formData.getAll('ingredient_id').map(Number);
    // Récupère les quantités
    const quantites = formData.getAll('quantite').map(String);
    // Récupère les unités
    const unites = formData.getAll('unite').map(String);

    // Vérifie que le titre est présent
    if (!titre) {
      return fail(400, { message: 'Le titre est requis' });
    }

    // Vérifie que chaque préparation a bien un nom rempli
    if (
      preparationNoms.length === 0 ||
      preparationNoms.some((n) => !n.trim())
    ) {
      return fail(400, { message: 'Chaque préparation doit avoir un nom' });
    }

    // Code généré par Claude.IA pour assembler et valider toutes les préparations
    const preparationsAEnregistrer: PreparationAEnregistrer[] = [];

    // Parcourt chaque préparation pour valider ses étapes et ses ingrédients
    for (let i = 0; i < preparationNoms.length; i++) {
      // Retrouve les étapes appartenant à cette préparation
      const etapesDeCettePrep = etapesTexte.filter(
        (_, j) => etapesPrepIndex[j] === i && etapesTexte[j],
      );

      // Vérifie que cette préparation a au moins une étape
      if (etapesDeCettePrep.length === 0) {
        return fail(400, {
          message: `La préparation "${preparationNoms[i]}" doit avoir au moins une étape`,
        });
      }

      // Retrouve les indices des ingrédients appartenant à cette préparation
      const indicesIngredients = ingredientsPrepIndex
        .map((prepIndex, k) => (prepIndex === i ? k : -1))
        .filter((k) => k !== -1);

      // Code généré par Claude.IA pour assembler les données de la préparation à enregistrer
      preparationsAEnregistrer.push({
        nom: preparationNoms[i],
        ordre: i,
        // Reconstruit le texte numéroté des étapes de cette préparation
        etapes: etapesDeCettePrep
          .map((e, idx) => `${idx + 1}. ${e}`)
          .join('\n'),
        ingredients: indicesIngredients.map((k) => ({
          ingredientId: ingredientIds[k],
          quantite: quantites[k]?.trim() || '',
          unite: unites[k]?.trim() || null,
        })),
      });
    }

    // Insère la recette et récupère son id généré
    const [resultat] = await db.insert(recettes).values({
      titre,
      description,
      utilisateurId: locals.user.id,
    });

    // Récupère l'ID de la nouvelle recette insérée
    const nouvelleRecetteId = resultat.insertId;

    // Crée chaque préparation, avec ses propres étapes et ses propres ingrédients
    for (const preparation of preparationsAEnregistrer) {
      // Insère la préparation et récupère son id généré
      const [resultatPreparation] = await db.insert(preparations).values({
        nom: preparation.nom,
        ordre: preparation.ordre,
        etapes: preparation.etapes,
        recetteId: nouvelleRecetteId,
      });

      // Insère chaque association ingrédient/quantité/unité pour cette préparation
      if (preparation.ingredients.length > 0) {
        await db.insert(recetteIngredients).values(
          preparation.ingredients.map((ingredient) => ({
            preparationId: resultatPreparation.insertId,
            ...ingredient,
          })),
        );
      }
    }

    // Redirige vers la page de la nouvelle recette créée
    throw redirect(303, `/recettes/${nouvelleRecetteId}`);
  },
};
