import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { recettes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/connexion');
  }

  const mesRecettes = await db.query.recettes.findMany({
    where: eq(recettes.utilisateurId, locals.user.id),
  });

  return { recettes: mesRecettes };
};
