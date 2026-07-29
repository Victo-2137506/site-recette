import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';

// Le handle original est utilisé pour initialiser les valeurs de session et d'utilisateur à null.
const originalHandle: Handle = async ({ event, resolve }) => {
  event.locals.user = null;
  event.locals.session = null;

  return resolve(event);
};
// Le handleBetterAuth est utilisé pour gérer l'authentification avec better-auth.
const handleBetterAuth: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({ headers: event.request.headers });

  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  return svelteKitHandler({ event, resolve, auth, building });
};

export const handle = sequence(originalHandle, handleBetterAuth);
