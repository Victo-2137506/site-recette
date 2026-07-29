// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    // Récupère les informations de l'utilisateur
    user: locals.user,
  };
};
