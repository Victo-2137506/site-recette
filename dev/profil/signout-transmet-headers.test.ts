import { describe, it, expect } from 'vitest';
import { evenement, attraper } from '../helpers/evenement';
import { mocks } from '../helpers/mocks';
import { actions } from '../../src/routes/profil/+page.server';

describe('action signOut du profil', () => {
  it('transmet les en-têtes de la requête à better-auth', async () => {
    // Sans le cookie de session, better-auth ne saurait pas quelle session fermer.
    await attraper(() => actions.signOut(evenement({ headers: { cookie: 'session=abc' } })));

    const argument = mocks.auth.api.signOut.mock.calls[0][0] as { headers: Headers };
    expect(argument.headers.get('cookie')).toBe('session=abc');
  });
});
