import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { recette } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
  const allRecette = await db.select().from(recette);
  console.log('Recettes trouvées :', allRecette);

  return { recette: allRecette };
};
