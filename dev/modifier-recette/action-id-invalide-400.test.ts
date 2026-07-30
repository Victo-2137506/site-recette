import { describe, it, expect } from 'vitest';
import { evenementFormulaire, echec } from '../helpers/evenement';
import { actions } from '../../src/routes/mes-recettes/[id]/modifier/+page.server';

describe('action de modification de recette', () => {
  it('refuse un identifiant non numérique avec un 400', async () => {
    // Le `load` répond 404 pour ce cas, mais l'action répond 400 : c'est une
    // soumission mal formée, pas une page introuvable.
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: 'abc' },
          champs: { titre: 'Tarte', etapes: 'Cuire' },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({ message: 'ID de recette invalide' });
  });
});
