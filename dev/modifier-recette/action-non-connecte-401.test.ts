import { describe, it, expect } from 'vitest';
import { evenementFormulaire, echec } from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { actions } from '../../src/routes/mes-recettes/[id]/modifier/+page.server';

describe('action de modification de recette', () => {
  it('refuse la modification avec un 401 si l’utilisateur n’est pas connecté', async () => {
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: null,
          params: { id: '10' },
          champs: { titre: 'Piraté', etapes: 'Piraté' },
        }),
      ),
    );

    expect(resultat.status).toBe(401);
    expect(resultat.data).toEqual({ message: 'Non connecté' });
    expect(base().recettes.find((r) => r.id === 10)!.titre).toBe('Poulet au riz');
  });
});
