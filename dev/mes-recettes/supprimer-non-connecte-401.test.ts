import { describe, it, expect } from 'vitest';
import { evenementFormulaire, echec } from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { actions } from '../../src/routes/mes-recettes/+page.server';

describe('action supprimer de « mes recettes »', () => {
  it('refuse la suppression avec un 401 si l’utilisateur n’est pas connecté', async () => {
    const resultat = echec(
      await actions.supprimer(evenementFormulaire({ user: null, champs: { id: '10' } })),
    );

    expect(resultat.status).toBe(401);
    expect(resultat.data).toEqual({ message: 'Non connecté' });
    // La recette ne doit surtout pas avoir été supprimée.
    expect(base().recettes.map((r) => r.id)).toEqual([10, 11, 12]);
  });
});
