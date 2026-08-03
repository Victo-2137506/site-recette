// Setup Vitest chargé avant chaque fichier de test (voir `vite.config.ts`).
//
// Il enregistre une fois pour toutes les mocks communs, ce qui permet à chaque
// fichier de test de ne contenir que son unique cas.
//
// Conséquence importante : la vraie base de données n'est jamais contactée, et
// better-auth n'est jamais initialisé — la suite tourne donc sans `DATABASE_URL`.

import { beforeEach, vi } from 'vitest';
import { mocks } from './helpers/mocks';
import { reinitialiserBase } from './helpers/faux-db';

vi.mock('$lib/server/db', () => ({ db: mocks.db }));
vi.mock('$lib/server/auth', () => ({ auth: mocks.auth }));

// `eq`, `inArray`, `and` et `count` sont remplacés par des objets simples que la
// fausse base sait interpréter. Le reste de drizzle-orm (dont `relations`) reste
// réel, sinon le schéma ne pourrait pas être construit.
vi.mock('drizzle-orm', async (importOriginal) => {
  const reel = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...reel,
    eq: (colonne: unknown, valeur: unknown) => ({ type: 'eq', colonne, valeur }),
    inArray: (colonne: unknown, valeurs: unknown[]) => ({
      type: 'inArray',
      colonne,
      valeurs,
    }),
    and: (...conditions: unknown[]) => ({
      type: 'and',
      conditions: conditions.filter(Boolean),
    }),
    // Marqueur d'agrégat, reconnu par la projection de `faux-db.ts`.
    count: () => ({ type: 'count' }),
  };
});

// Base propre et mocks neufs avant chaque test : aucun test ne dépend d'un autre.
beforeEach(reinitialiserBase);
