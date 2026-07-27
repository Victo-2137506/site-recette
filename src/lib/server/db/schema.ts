// Lien de la documentation offciel pour le schema : https://orm.drizzle.team/docs/sql-schema-declaration
// Lien de la documentation officiel pour les relations : https://orm.drizzle.team/docs/relations-schema-declaration#why-foreign-keys

import {
  mysqlTable,
  int,
  varchar,
  text,
  primaryKey,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// --- Creation des tables ---

// Cette table contient les informations des utilisateurs.
export const utilisateurs = mysqlTable('utilisateurs', {
  id: int('id').autoincrement().primaryKey(),
  nom: varchar('nom', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  motDePasse: varchar('mot_de_passe', { length: 255 }).notNull(),
});

// Cette table contient toutes les recettes.
export const recettes = mysqlTable('recettes', {
  id: int('id').autoincrement().primaryKey(),
  titre: varchar('titre', { length: 255 }).notNull(),
  description: text('description'),
  etapes: text('etapes').notNull(),

  // Référence vers l'utilisateur qui a créé la recette
  utilisateurId: int('utilisateur_id')
    .notNull()
    .references(() => utilisateurs.id, { onDelete: 'cascade' }),
});

// Cette table contient la liste des ingrédients disponibles
// (ex. : Poulet, Pâtes, Soja, Riz...).
export const ingredients = mysqlTable('ingredients', {
  id: int('id').autoincrement().primaryKey(),
  nom: varchar('nom', { length: 255 }).notNull().unique(),
});

// Une recette peut posséder plusieurs ingrédients et
// un ingrédient peut être associé à plusieurs recettes.
export const recetteIngredients = mysqlTable(
  'recette_ingredients',
  {
    recetteId: int('recette_id')
      .notNull()
      .references(() => recettes.id, { onDelete: 'cascade' }),

    ingredientId: int('ingredient_id')
      .notNull()
      .references(() => ingredients.id, { onDelete: 'cascade' }),

    // Quantité de l'ingrédient
    quantite: varchar('quantite', { length: 50 }).notNull(),

    // Unité de mesure
    unite: varchar('unite', { length: 50 }),
  },
  (table) => ({
    // Empêche qu'un même ingrédient soit associé plusieurs fois à une même recette.
    pk: primaryKey({
      columns: [table.recetteId, table.ingredientId],
    }),
  }),
);

// --- Relation des tables ---

// Un utilisateur possède plusieurs recettes.
export const utilisateursRelations = relations(utilisateurs, ({ many }) => ({
  recettes: many(recettes),
}));

// Une recette appartient à un utilisateur
// et possède plusieurs associations avec des ingrédients.
export const recettesRelations = relations(recettes, ({ one, many }) => ({
  utilisateur: one(utilisateurs, {
    fields: [recettes.utilisateurId],
    references: [utilisateurs.id],
  }),
  recetteIngredients: many(recetteIngredients),
}));

// Un ingrédient peut être utilisé dans plusieurs recettes.
export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  recetteIngredients: many(recetteIngredients),
}));

// Chaque ligne de la table recette_ingredients relie une recette à un ingrédient.
export const recetteIngredientsRelations = relations(
  recetteIngredients,
  ({ one }) => ({
    recette: one(recettes, {
      fields: [recetteIngredients.recetteId],
      references: [recettes.id],
    }),
    ingredient: one(ingredients, {
      fields: [recetteIngredients.ingredientId],
      references: [ingredients.id],
    }),
  }),
);
