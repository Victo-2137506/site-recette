import { describe, it, expect } from 'vitest';
import { evenementFormulaire, echec } from '../helpers/evenement';
import { actions } from '../../src/routes/mes-recettes/+page.server';

describe('action supprimer de « mes recettes »', () => {
  it('renvoie un 403 pour une recette inexistante', async () => {
    // La route ne distingue pas « introuvable » de « pas à toi » : dans les
    // deux cas elle répond 403, ce qui évite de révéler l'existence d'un id.
    const resultat = echec(
      await actions.supprimer(
        evenementFormulaire({ user: { id: 'u1' }, champs: { id: '9999' } }),
      ),
    );

    expect(resultat.status).toBe(403);
    expect(resultat.data).toEqual({ message: 'Action non autorisée' });
  });
});
