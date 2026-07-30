import { describe, it, expect } from 'vitest';
import { evenementFormulaire, echec } from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { actions } from '../../src/routes/mes-recettes/[id]/modifier/+page.server';

describe('action de modification de recette', () => {
  it('refuse avec un 403 la modification de la recette d’un autre utilisateur', async () => {
    // Alice (u1) soumet le formulaire de la recette 12, qui est à Bob (u2).
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '12' },
          champs: { titre: 'Volé', etapes: 'Volé' },
        }),
      ),
    );

    expect(resultat.status).toBe(403);
    expect(resultat.data).toEqual({ message: 'Action non autorisée' });
    expect(base().recettes.find((r) => r.id === 12)!.titre).toBe('Riz sauté');
  });
});
