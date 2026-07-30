import { describe, it, expect } from 'vitest';
import { evenementFormulaire, echec } from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { actions } from '../../src/routes/mes-recettes/creer/+page.server';

describe('action de création de recette', () => {
  it('refuse la création avec un 401 si l’utilisateur n’est pas connecté', async () => {
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: null,
          champs: { titre: 'Tarte', etapes: 'Cuire', ingredient_id: '1', quantite: '1' },
        }),
      ),
    );

    expect(resultat.status).toBe(401);
    expect(resultat.data).toEqual({ message: 'Non connecté' });
    expect(base().recettes).toHaveLength(3);
  });
});
