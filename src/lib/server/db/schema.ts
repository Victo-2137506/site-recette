// Lien de la documentation offciel pour le schema : https://orm.drizzle.team/docs/sql-schema-declaration
// Lien de la documentation officiel pour les relations : https://orm.drizzle.team/docs/relations-schema-declaration#why-foreign-keys
import {
  mysqlTable,
  int,
  varchar,
  text,
  primaryKey,
  timestamp,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { utilisateurs } from './auth.schema';

// --- Creation des tables ---

// Cette table contient toutes les recettes.
export const recettes = mysqlTable('recettes', {
  id: int('id').autoincrement().primaryKey(),
  titre: varchar('titre', { length: 255 }).notNull(),
  description: text('description'),
  // Référence vers l'utilisateur qui a créé la recette
  utilisateurId: varchar('utilisateur_id', { length: 36 })
    .notNull()
    .references(() => utilisateurs.id, { onDelete: 'cascade' }),
});

// Cette table contient les préparations d'une recette (ex. : "Pâte", "Garniture").
// Une recette possède toujours au moins une préparation, ce qui permet de gérer
// les recettes composées de plusieurs sous-parties distinctes.
export const preparations = mysqlTable('preparations', {
  id: int('id').autoincrement().primaryKey(),
  nom: varchar('nom', { length: 255 }).notNull(),
  // Contrôle l'ordre d'affichage des préparations (ex. : la pâte avant la garniture)
  ordre: int('ordre').notNull().default(0),
  etapes: text('etapes').notNull(),
  // Référence vers la recette à laquelle appartient cette préparation
  recetteId: int('recette_id')
    .notNull()
    .references(() => recettes.id, { onDelete: 'cascade' }),
});

// Cette table contient la liste des ingrédients disponibles
// (ex. : Poulet, Pâtes, Soja, Riz...).
export const ingredients = mysqlTable('ingredients', {
  id: int('id').autoincrement().primaryKey(),
  nom: varchar('nom', { length: 255 }).notNull().unique(),
});

// Une préparation peut posséder plusieurs ingrédients et
// un ingrédient peut être associé à plusieurs préparations.
export const recetteIngredients = mysqlTable(
  'recette_ingredients',
  {
    preparationId: int('preparation_id')
      .notNull()
      .references(() => preparations.id, { onDelete: 'cascade' }),
    ingredientId: int('ingredient_id')
      .notNull()
      .references(() => ingredients.id, { onDelete: 'cascade' }),
    quantite: varchar('quantite', { length: 50 }).notNull(),
    unite: varchar('unite', { length: 50 }),
  },
  (table) => [
    // Empêche qu'un même ingrédient soit associé plusieurs fois à une même préparation.
    primaryKey({ columns: [table.preparationId, table.ingredientId] }),
  ],
);

// Cette table contient les relations "j'aime" entre les utilisateurs et les recettes.
export const jaime = mysqlTable(
  'jaime',
  {
    utilisateurId: varchar('utilisateur_id', { length: 36 })
      .notNull()
      .references(() => utilisateurs.id, { onDelete: 'cascade' }),

    recetteId: int('recette_id')
      .notNull()
      .references(() => recettes.id, { onDelete: 'cascade' }),

    creeLe: timestamp('cree_le').defaultNow().notNull(),
  },
  (table) => [
    // Empêche qu'un même utilisateur aime deux fois la même recette
    primaryKey({ columns: [table.utilisateurId, table.recetteId] }),
  ],
);

// --- Relation des tables ---

// Une recette appartient à un utilisateur, possède plusieurs préparations,
// et peut être aimée par plusieurs utilisateurs.
export const recettesRelations = relations(recettes, ({ one, many }) => ({
  utilisateur: one(utilisateurs, {
    fields: [recettes.utilisateurId],
    references: [utilisateurs.id],
  }),
  preparations: many(preparations),
  jaime: many(jaime),
}));

// Une préparation appartient à une recette,
// et possède plusieurs associations avec des ingrédients.
export const preparationsRelations = relations(
  preparations,
  ({ one, many }) => ({
    recette: one(recettes, {
      fields: [preparations.recetteId],
      references: [recettes.id],
    }),
    recetteIngredients: many(recetteIngredients),
  }),
);

// Un ingrédient peut être utilisé dans plusieurs préparations.
export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  recetteIngredients: many(recetteIngredients),
}));

// Chaque ligne de la table recette_ingredients relie une préparation à un ingrédient.
export const recetteIngredientsRelations = relations(
  recetteIngredients,
  ({ one }) => ({
    preparation: one(preparations, {
      fields: [recetteIngredients.preparationId],
      references: [preparations.id],
    }),

    ingredient: one(ingredients, {
      fields: [recetteIngredients.ingredientId],
      references: [ingredients.id],
    }),
  }),
);

// Chaque ligne de la table jaime relie un utilisateur à une recette qu'il a aimée.
export const jaimeRelations = relations(jaime, ({ one }) => ({
  utilisateur: one(utilisateurs, {
    fields: [jaime.utilisateurId],
    references: [utilisateurs.id],
  }),

  recette: one(recettes, {
    fields: [jaime.recetteId],
    references: [recettes.id],
  }),
}));

export * from './auth.schema';
