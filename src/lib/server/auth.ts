import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

export const auth = betterAuth({
  baseURL: env.ORIGIN,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'mysql' }),
  emailAndPassword: { enabled: true },
  user: {
    modelName: 'utilisateurs',
    fields: {
      name: 'nom',
      email: 'email',
      emailVerified: 'email_verifie',
      image: 'image',
      createdAt: 'cree_le',
      updatedAt: 'modifie_le',
    },
  },
  session: {
    modelName: 'sessions',
    fields: {
      userId: 'utilisateur_id',
      expiresAt: 'expire_le',
      token: 'jeton',
      createdAt: 'cree_le',
      updatedAt: 'modifie_le',
      ipAddress: 'adresse_ip',
      userAgent: 'agent_utilisateur',
    },
  },
  account: {
    modelName: 'comptes',
    fields: {
      userId: 'utilisateur_id',
      accountId: 'compte_id',
      providerId: 'fournisseur_id',
      accessToken: 'jeton_acces',
      refreshToken: 'jeton_rafraichissement',
      idToken: 'jeton_id',
      accessTokenExpiresAt: 'jeton_acces_expire_le',
      refreshTokenExpiresAt: 'jeton_rafraichissement_expire_le',
      scope: 'portee',
      password: 'mot_de_passe',
      createdAt: 'cree_le',
      updatedAt: 'modifie_le',
    },
  },
  verification: {
    modelName: 'verifications',
    fields: {
      identifier: 'identifiant',
      value: 'valeur',
      expiresAt: 'expire_le',
      createdAt: 'cree_le',
      updatedAt: 'modifie_le',
    },
  },
  plugins: [
    sveltekitCookies(getRequestEvent), // doit rester le dernier plugin du tableau
  ],
});
