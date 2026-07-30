// Références mutables partagées par tous les tests.
//
// Les modules de routes importent `db` et `auth` une seule fois, au chargement.
// On leur donne donc des objets vides que l'on remplit ensuite (voir `faux-db.ts`) :
// muter ces objets suffit à piloter le comportement de la fausse base et de la
// fausse authentification, sans jamais recharger les routes.

import { vi } from 'vitest';

export const mocks = {
  db: {} as Record<string, unknown>,
  auth: {
    api: {
      signOut: vi.fn(),
      signInEmail: vi.fn(),
      signUpEmail: vi.fn(),
    },
  },
};
