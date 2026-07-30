import { describe, it, expect } from 'vitest';
import { evenementFormulaire, echec } from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { actions } from '../../src/routes/mes-recettes/+page.server';

describe('action supprimer de « mes recettes »', () => {
  it('refuse avec un 403 la suppression de la recette d’un autre utilisateur', async () => {
    // Alice (u1) tente de supprimer la recette 12, qui appartient à Bob (u2).
    const resultat = echec(
      await actions.supprimer(
        evenementFormulaire({ user: { id: 'u1' }, champs: { id: '12' } }),
      ),
    );

    expect(resultat.status).toBe(403);
    expect(resultat.data).toEqual({ message: 'Action non autorisée' });
    expect(base().recettes.map((r) => r.id)).toContain(12);
  });
});
