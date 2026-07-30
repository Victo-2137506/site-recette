import { describe, it, expect } from 'vitest';
import { evenementFormulaire, echec } from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { actions } from '../../src/routes/mes-recettes/[id]/modifier/+page.server';

describe('action de modification de recette', () => {
  it('refuse un titre ou des étapes vides avec un 400', async () => {
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '10' },
          champs: { titre: '', etapes: 'Cuire' },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({ message: 'Le titre et les étapes sont requis' });
    // La validation intervient avant l'écriture : rien ne doit avoir bougé.
    expect(base().recettes.find((r) => r.id === 10)!.titre).toBe('Poulet au riz');
    expect(base().recetteIngredients.filter((ri) => ri.recetteId === 10)).toHaveLength(2);
  });
});
