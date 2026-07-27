import { mysqlTable, int, varchar, text } from 'drizzle-orm/mysql-core';

export const recette = mysqlTable('recette', {
  id: int('id').autoincrement().primaryKey(),
  titre: varchar('titre', { length: 255 }).notNull(),
  description: text('description'),
  etapes: text('etapes').notNull(),
});
