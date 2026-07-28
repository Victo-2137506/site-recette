import { relations } from "drizzle-orm";
import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/mysql-core";

export const utilisateurs = mysqlTable("utilisateurs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  nom: varchar("nom", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  email_verifie: boolean("email_verifie").default(false).notNull(),
  image: text("image"),
  cree_le: timestamp("cree_le", { fsp: 3 }).defaultNow().notNull(),
  modifie_le: timestamp("modifie_le", { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const sessions = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    expire_le: timestamp("expire_le", { fsp: 3 }).notNull(),
    jeton: varchar("jeton", { length: 255 }).notNull().unique(),
    cree_le: timestamp("cree_le", { fsp: 3 }).defaultNow().notNull(),
    modifie_le: timestamp("modifie_le", { fsp: 3 })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    adresse_ip: text("adresse_ip"),
    agent_utilisateur: text("agent_utilisateur"),
    utilisateur_id: varchar("utilisateur_id", { length: 36 })
      .notNull()
      .references(() => utilisateurs.id, { onDelete: "cascade" }),
  },
  (table) => [index("sessions_utilisateur_id_idx").on(table.utilisateur_id)],
);

export const comptes = mysqlTable(
  "comptes",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    compte_id: text("compte_id").notNull(),
    fournisseur_id: text("fournisseur_id").notNull(),
    utilisateur_id: varchar("utilisateur_id", { length: 36 })
      .notNull()
      .references(() => utilisateurs.id, { onDelete: "cascade" }),
    jeton_acces: text("jeton_acces"),
    jeton_rafraichissement: text("jeton_rafraichissement"),
    jeton_id: text("jeton_id"),
    jeton_acces_expire_le: timestamp("jeton_acces_expire_le", { fsp: 3 }),
    jeton_rafraichissement_expire_le: timestamp(
      "jeton_rafraichissement_expire_le",
      { fsp: 3 },
    ),
    portee: text("portee"),
    mot_de_passe: text("mot_de_passe"),
    cree_le: timestamp("cree_le", { fsp: 3 }).defaultNow().notNull(),
    modifie_le: timestamp("modifie_le", { fsp: 3 })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("comptes_utilisateur_id_idx").on(table.utilisateur_id)],
);

export const verifications = mysqlTable(
  "verifications",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    identifiant: varchar("identifiant", { length: 255 }).notNull(),
    valeur: text("valeur").notNull(),
    expire_le: timestamp("expire_le", { fsp: 3 }).notNull(),
    cree_le: timestamp("cree_le", { fsp: 3 }).defaultNow().notNull(),
    modifie_le: timestamp("modifie_le", { fsp: 3 })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verifications_identifiant_idx").on(table.identifiant)],
);

export const utilisateursRelations = relations(utilisateurs, ({ many }) => ({
  sessionss: many(sessions),
  comptess: many(comptes),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  utilisateurs: one(utilisateurs, {
    fields: [sessions.utilisateur_id],
    references: [utilisateurs.id],
  }),
}));

export const comptesRelations = relations(comptes, ({ one }) => ({
  utilisateurs: one(utilisateurs, {
    fields: [comptes.utilisateur_id],
    references: [utilisateurs.id],
  }),
}));
