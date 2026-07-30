import { describe, it, expect } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { evenementFormulaire, attraper } from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { actions } from '../../src/routes/mes-recettes/[id]/modifier/+page.server';

describe('action de modification de recette', () => {
  it('laisse la recette sans aucun ingrédient si le formulaire n’en envoie plus', async () => {
    // Contrairement à la création, la modification n'exige pas d'ingrédient :
    // la suppression des anciennes associations a lieu, la réinsertion non.
    const erreur = await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '10' },
          champs: { titre: 'Riz nature', etapes: 'Cuire le riz' },
        }),
      ),
    );

    expect(base().recettes.find((r) => r.id === 10)!.titre).toBe('Riz nature');
    expect(base().recetteIngredients.filter((ri) => ri.recetteId === 10)).toEqual([]);
    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.location).toBe('/recettes/10');
  });
});
