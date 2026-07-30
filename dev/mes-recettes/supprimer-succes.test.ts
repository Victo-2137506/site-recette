import { describe, it, expect } from 'vitest';
import { evenementFormulaire } from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { actions } from '../../src/routes/mes-recettes/+page.server';

describe('action supprimer de « mes recettes »', () => {
  it('supprime la recette de l’utilisateur connecté', async () => {
    const resultat = await actions.supprimer(
      evenementFormulaire({ user: { id: 'u1' }, champs: { id: '11' } }),
    );

    expect(resultat).toEqual({ success: true });
    expect(base().recettes.map((r) => r.id)).toEqual([10, 12]);
  });
});
