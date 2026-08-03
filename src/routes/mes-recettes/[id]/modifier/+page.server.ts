import type { PageServerLoad, Actions } from './$types';
import { redirect, fail, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
  recettes,
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

  // Récupère la recette avec ses ingrédients associés
  const recette = await db.query.recettes.findFirst({
    where: eq(recettes.id, id),
    with: { recetteIngredients: true },
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

    // Récupère chaque bloc d'étape envoyé par le formulaire (un champ "etape" par bloc),
    // retire les blocs vides, puis reconstruit le texte numéroté stocké en base
    const etapesListe = formData
      .getAll('etape')
      .map((e) => e.toString().trim())
      .filter(Boolean);
    const etapes = etapesListe.map((e, i) => `${i + 1}. ${e}`).join('\n');

    const ingredientIds = formData.getAll('ingredient_id').map(Number);
    const quantites = formData.getAll('quantite').map(String);
    const unites = formData.getAll('unite').map(String);

    // Vérifie que le titre et au moins une étape sont présents
    if (!titre || etapesListe.length === 0) {
      return fail(400, {
        message: 'Le titre et au moins une étape sont requis',
      });
    }

    // Met à jour la recette dans la base de données
    await db
      .update(recettes)
      .set({ titre, description, etapes })
      .where(eq(recettes.id, id));

    // Supprime les anciennes associations, puis réinsère les nouvelles
    await db
      .delete(recetteIngredients)
      .where(eq(recetteIngredients.recetteId, id));

    // Insère les nouvelles associations d'ingrédients
    if (ingredientIds.length > 0) {
      await db.insert(recetteIngredients).values(
        ingredientIds.map((ingredientId, i) => ({
          recetteId: id,
          ingredientId,
          quantite: quantites[i]?.trim() || '',
          unite: unites[i]?.trim() || null,
        })),
      );
    }

    throw redirect(303, `/recettes/${id}`);
  },
};
