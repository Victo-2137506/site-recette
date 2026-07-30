import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/+page.server';

describe("load de la page d'accueil", () => {
  it('retourne toujours la liste complète des ingrédients pour les cases à cocher', async () => {
    // Les cases à cocher doivent rester toutes affichées, même une fois un
    // filtre appliqué, sinon on ne pourrait plus élargir la sélection.
    const sansFiltre = sansVoid(await load(evenement({ url: 'http://localhost/' })));
    const avecFiltre = sansVoid(
      await load(evenement({ url: 'http://localhost/?ingredient=1' })),
    );

    expect(sansFiltre.ingredients).toHaveLength(3);
    expect(avecFiltre.ingredients).toHaveLength(3);
  });
});
