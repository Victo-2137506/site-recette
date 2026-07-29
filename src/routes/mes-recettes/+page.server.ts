import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/connexion');
  }

  // TODO: récupérer les recettes de l'utilisateur connecté une fois le CRUD construit

  return {};
};
