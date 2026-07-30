import { describe, it, expect } from 'vitest';
import { evenementFormulaire, echec } from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { actions } from '../../src/routes/mes-recettes/creer/+page.server';

describe('action de création de recette', () => {
  it('refuse un titre vide avec un 400', async () => {
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: { titre: '', etapes: 'Cuire', ingredient_id: '1', quantite: '1' },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({ message: 'Le titre et les étapes sont requis' });
    expect(base().recettes).toHaveLength(3);
  });
});
