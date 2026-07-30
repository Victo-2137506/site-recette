import { describe, it, expect } from 'vitest';
import { evenementFormulaire, echec } from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { actions } from '../../src/routes/mes-recettes/creer/+page.server';

describe('action de création de recette', () => {
  it('refuse une recette sans aucun ingrédient avec un 400', async () => {
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: { titre: 'Eau chaude', etapes: 'Faire bouillir' },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({ message: 'Sélectionne au moins un ingrédient' });
    expect(base().recettes).toHaveLength(3);
  });
});
