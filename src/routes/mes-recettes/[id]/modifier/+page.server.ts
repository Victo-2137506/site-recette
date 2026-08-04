import type { PageServerLoad, Actions } from './$types';
import { redirect, fail, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
  recettes,
  preparations,
  ingredients,
  recetteIngredients,
} from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Charge les détails d'une recette spécifique pour modification
export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) {
    throw redirect(303, '/connexion');
  }

  // Vérifie que l'ID de la recette est un nombre valide
  const id = Number(params.id);

  if (Number.isNaN(id)) {
    throw error(404, 'Recette introuvable');
  }

  // Récupère la recette avec toutes ses préparations et leurs ingrédients associés
  const recette = await db.query.recettes.findFirst({
    where: eq(recettes.id, id),
    with: {
      preparations: {
        with: { recetteIngredients: true },
      },
    },
  });

  // Vérifie que la recette appartient à l'utilisateur connecté
  if (!recette) {
    throw error(404, 'Recette introuvable');
  }

  // Vérifie que l'utilisateur connecté est bien le propriétaire de la recette
  if (recette.utilisateurId !== locals.user.id) {
    throw error(403, "Tu n'as pas le droit de modifier cette recette");
  }

  // Récupère tous les ingrédients disponibles pour le formulaire de modification
  const tousLesIngredients = await db.select().from(ingredients);

  return { recette, ingredients: tousLesIngredients };
};

// Une préparation entièrement validée, prête à être insérée telle quelle.
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

// Actions pour modifier une recette
export const actions: Actions = {
  default: async ({ request, params, locals }) => {
    if (!locals.user) {
      return fail(401, { message: 'Non connecté' });
    }

    // Vérifie que l'ID de la recette est un nombre valide
    const id = Number(params.id);

    if (Number.isNaN(id)) {
      return fail(400, { message: 'ID de recette invalide' });
    }

    // Vérifie que la recette appartient bien à l'utilisateur avant de modifier
    const recette = await db.query.recettes.findFirst({
      where: eq(recettes.id, id),
    });

    if (!recette || recette.utilisateurId !== locals.user.id) {
      return fail(403, { message: 'Action non autorisée' });
    }

    // Récupère les données du formulaire
    const formData = await request.formData();

    const titre = formData.get('titre')?.toString() ?? '';
    const description = formData.get('description')?.toString() ?? '';

    // Une valeur par préparation, dans l'ordre où elles apparaissent dans le formulaire
    const preparationNoms = formData.getAll('preparation_nom').map(String);

    // Étapes : chaque étape est accompagnée de l'index de sa préparation d'origine
    const etapesPrepIndex = formData
      .getAll('etape_preparation_index')
      .map(Number);
    const etapesTexte = formData
      .getAll('etape')
      .map((e) => e.toString().trim());

    // Ingrédients : chaque ligne est accompagnée de l'index de sa préparation d'origine
    const ingredientsPrepIndex = formData
      .getAll('preparation_index')
      .map(Number);
    const ingredientIds = formData.getAll('ingredient_id').map(Number);
    const quantites = formData.getAll('quantite').map(String);
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

    // Assemble et valide toutes les préparations AVANT la moindre écriture.
    // C'est essentiel ici : la mise à jour commence par supprimer les
    // préparations existantes, et un refus détecté après coup laisserait la
    // recette amputée de son contenu d'origine.
    const preparationsAEnregistrer: PreparationAEnregistrer[] = [];

    for (let i = 0; i < preparationNoms.length; i++) {
      // Ne garde que les étapes appartenant à cette préparation, en écartant
      // les blocs laissés vides dans le formulaire
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

      preparationsAEnregistrer.push({
        nom: preparationNoms[i],
        ordre: i,
        // Reconstruit le texte numéroté des étapes de cette préparation
        etapes: etapesDeCettePrep.map((e, idx) => `${idx + 1}. ${e}`).join('\n'),
        ingredients: indicesIngredients.map((k) => ({
          ingredientId: ingredientIds[k],
          quantite: quantites[k]?.trim() || '',
          unite: unites[k]?.trim() || null,
        })),
      });
    }

    // Met à jour les champs principaux de la recette dans la base de données
    await db
      .update(recettes)
      .set({ titre, description })
      .where(eq(recettes.id, id));

    // Supprime toutes les anciennes préparations (les anciens ingrédients associés
    // partent automatiquement avec, grâce à la suppression en cascade)
    await db.delete(preparations).where(eq(preparations.recetteId, id));

    // Recrée chaque préparation, avec ses propres étapes et ses propres ingrédients
    for (const preparation of preparationsAEnregistrer) {
      // Insère la préparation et récupère son id généré
      const [resultatPreparation] = await db.insert(preparations).values({
        nom: preparation.nom,
        ordre: preparation.ordre,
        etapes: preparation.etapes,
        recetteId: id,
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

    throw redirect(303, `/recettes/${id}`);
  },
};
