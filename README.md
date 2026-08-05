# Les recettes de grand-mère

Site de partage de recettes de cuisine. Chaque utilisateur peut publier ses
recettes, les découper en plusieurs préparations et retrouver les recettes des autres
en filtrant par les ingrédients qu'il a sous la main.

## Fonctionnalités

- **Recherche par ingrédients** — l'accueil affiche toutes les recettes et un
  nuage de pastilles d'ingrédients. En cocher plusieurs ne garde que les
  recettes qui contiennent **tous** les ingrédients sélectionnés, quelle que
  soit la préparation dans laquelle ils se trouvent. La sélection vit dans
  l'URL (`?ingredient=1&ingredient=2`), donc elle est partageable.
- **Comptes utilisateurs** — inscription et connexion par email / mot de passe,
  sessions gérées par Better Auth.
- **Création et modification de recettes** — un formulaire par recette, avec
  autant de préparations que voulu ; chaque préparation porte son propre nom,
  ses étapes numérotées et ses ingrédients (quantité + unité).
- **J'aime** — un compteur par recette, un clic pour aimer ou retirer son
  « j'aime ». Un utilisateur ne peut aimer qu'une seule fois la même recette.
- **Profils** — un profil privé (ses recettes, ses recettes aimées,
  déconnexion) et un profil public par utilisateur (`/profil/[id]`).

## Stack technique

| Outil | Rôle |
|---|---|
| [SvelteKit 2](https://svelte.dev/docs/kit) + [Svelte 5](https://svelte.dev/docs/svelte) | framework, en mode *runes* forcé |
| [TypeScript](https://www.typescriptlang.org/) | typage de bout en bout |
| [Tailwind CSS 4](https://tailwindcss.com/) | styles, via le plugin Vite |
| [Drizzle ORM](https://orm.drizzle.team/) + MySQL | base de données et migrations |
| [Better Auth](https://www.better-auth.com/) | authentification et sessions |
| [lucide-svelte](https://lucide.dev/) | icônes |
| [Vitest](https://vitest.dev/) | tests unitaires |

## Prérequis

- Node.js 20 ou plus
- Un serveur MySQL accessible

## Installation

```bash
git clone <url-du-depot>
cd site-recettes
npm install
```

Copier `.env.example` vers `.env` et remplir les trois variables :

```dotenv
# Connexion à la base MySQL
DATABASE_URL="mysql://user:password@host:port/db-name"

# URL de base du site (ex. http://localhost:5173 en développement)
ORIGIN=""

# Secret Better Auth — 32 caractères à forte entropie en production
BETTER_AUTH_SECRET=""
```

Créer ensuite les tables, puis lancer le serveur de développement :

```bash
npm run db:push
npm run dev
```

Le site est disponible sur http://localhost:5173.

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run preview` | prévisualise le build |
| `npm test` | tests en mode watch |
| `npm run test:run` | tests en une seule passe |
| `npm run check` | vérification TypeScript / Svelte |
| `npm run db:push` | applique le schéma directement à la base |
| `npm run db:generate` | génère un fichier de migration |
| `npm run db:migrate` | applique les migrations |
| `npm run db:studio` | ouvre Drizzle Studio |
| `npm run auth:schema` | régénère `auth.schema.ts` depuis la config Better Auth |

## Structure

```
src/
├── hooks.server.ts              lit la session à chaque requête → event.locals
├── app.d.ts                     types de App.Locals (user, session)
├── lib/
│   ├── auth-client.ts           client Better Auth côté navigateur
│   └── server/
│       ├── auth.ts              config Better Auth (tables et colonnes en français)
│       └── db/
│           ├── index.ts         connexion MySQL + instance drizzle
│           ├── schema.ts        tables métier et relations
│           └── auth.schema.ts   tables générées par Better Auth
└── routes/
    ├── +layout.svelte           en-tête, navigation, pied de page
    ├── +page.svelte             accueil : liste et filtrage par ingrédients
    ├── connexion/               connexion et inscription
    ├── recettes/[id]/           détail d'une recette + bouton j'aime
    ├── mes-recettes/            liste de ses recettes + suppression
    │   ├── creer/               formulaire de création
    │   └── [id]/modifier/       formulaire de modification
    └── profil/                  profil privé
        └── [id]/                profil public d'un utilisateur

dev/                             tests unitaires (voir dev/README.md)
```

## Modèle de données

```
utilisateurs ──< recettes ──< preparations ──< recette_ingredients >── ingredients
      │              │
      └──────< jaime ┘
```

- Une **recette** appartient à un utilisateur et se compose de plusieurs
  **préparations**, affichées dans l'ordre du champ `ordre`.
- Une **préparation** porte ses étapes (un seul champ texte numéroté) et ses
  ingrédients.
- `recette_ingredients` relie une préparation à un ingrédient avec une
  `quantite` et une `unite` ; sa clé primaire composite empêche le même
  ingrédient d'apparaître deux fois dans une même préparation.
- `jaime` relie un utilisateur à une recette, avec la même protection contre
  les doublons.
- Toutes les relations sont en `onDelete: 'cascade'` : supprimer une recette
  emporte ses préparations, leurs ingrédients associés et ses « j'aime ».

Les tables d'authentification (`utilisateurs`, `sessions`, `comptes`,
`verifications`) sont générées par Better Auth, avec des noms de colonnes
traduits en français dans `src/lib/server/auth.ts`.

## Tests

84 cas couvrant les fonctions `load` et les `actions` des 8 modules
`+page.server.ts`.

```bash
npm test          # mode watch
npm run test:run  # une seule passe
```

La vraie base n'est jamais contactée : `$lib/server/db` et `$lib/server/auth`
sont remplacés par des mocks, la suite tourne donc sans MySQL ni
`DATABASE_URL`. Le détail de l'organisation des tests, du jeu de données et des
helpers est documenté dans [dev/README.md](dev/README.md).

## Déploiement

Le projet utilise [`adapter-auto`](https://svelte.dev/docs/kit/adapter-auto),
qui détecte automatiquement les plateformes supportées. Pour un autre
environnement, remplacer l'adaptateur dans [vite.config.ts](vite.config.ts) par
celui qui convient (`adapter-node`, `adapter-vercel`, …).

## Source utilisée

SvelteKit : https://svelte.dev/docs/kit/introduction
Drizzle : https://orm.drizzle.team/docs/overview
Better-Auth : https://better-auth.com/docs/introduction
Claude.IA : https://claude.ai/new

---

Le README à été générer en grand partie par Claude.IA.
