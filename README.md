# RecettesX

**RecettesX** est un réseau social de recettes de cuisine : chaque utilisateur connecté découvre les recettes de la communauté, publie les siennes et reste le seul à pouvoir les modifier ou les supprimer.

Projet individuel du module **Full Stack JS** (Master 1 – EFREI).

---

## 1. Fonctionnalités

- Inscription avec un pseudo public, et connexion (mot de passe haché avec bcrypt, session par JWT).
- Fil public : tout utilisateur connecté voit et consulte les recettes de la communauté, avec le pseudo de leur auteur.
- Fil paginé : 12 recettes, puis bouton « Voir plus de recettes ».
- Création, modification et suppression de ses propres recettes ; le temps de préparation se saisit en heures + minutes.
- Filtres : catégorie, recherche dans le titre, favoris et onglet « Mes recettes ».
- Favoris : l'auteur marque ou retire ses recettes favorites.
- Validation côté serveur (et aide à la saisie côté React).
- Interface responsive, utilisable au clavier.

### Ressource `Recipe`

| Champ | Type | Règle | Requis au POST |
|---|---|---|---|
| `title` | string | 1 à 120 caractères après suppression des espaces autour | Oui |
| `category` | string | `starter`, `main`, `dessert` ou `drink` | Oui |
| `prepTime` | integer | Minutes entières, de 1 à 1440 | Oui |
| `ingredients` | string | 0 à 2000 caractères, un ingrédient par ligne | Non (défaut `""`) |
| `instructions` | string | 0 à 5000 caractères | Non (défaut `""`) |
| `favorite` | boolean | `true` ou `false` | Non (défaut `false`) |

Champs gérés uniquement par le serveur : `id` (ObjectId sous forme de chaîne), `ownerId` (auteur, déduit du JWT), `author` (`{ id, username }` de l'auteur, jamais son email), `createdAt`, `updatedAt`.

Le compte utilisateur a un `username` : 3 à 30 caractères (lettres, chiffres, `_` ou `-`), unique et enregistré en minuscules. Les comptes créés avant son ajout ont `username: null` et apparaissent comme « Utilisateur anonyme ».

---

## 2. Stack technique

| Couche | Technologie |
|---|---|
| Front-end | React 19, Vite, React Router |
| Back-end | Node.js, Express 5 |
| Base de données | MongoDB 8 (Docker) + Mongoose |
| Authentification | bcrypt, jsonwebtoken, middleware Bearer |
| Tests | Jest, Supertest, mongodb-memory-server |
| Qualité | ESLint (front et back) |
| Documentation API | OpenAPI 3 + swagger-ui-express |

Versions exactes : `backend/package.json` et `frontend/package.json`.

---

## 3. Prérequis

- **Node.js** ≥ 20 et **npm** ≥ 10.
- **Docker Desktop** (avec Docker Compose) pour la base MongoDB.
- **MongoDB Compass** (facultatif) pour visualiser les données : `mongodb://localhost:27017`.

---

## 4. Installation et configuration

```bash
git clone <url-du-depot>
cd carnet-recettes/backend
npm install
cd ../frontend
npm install
cd ..
```

Le back-end lit sa configuration dans `backend/.env` :

```bash
cp backend/.env.example backend/.env
```

| Variable | Rôle | Exemple |
|---|---|---|
| `PORT` | Port de l'API | `3000` |
| `MONGODB_URI` | Connexion MongoDB | `mongodb://127.0.0.1:27017/carnet-recettes` |
| `JWT_SECRET` | Clé de signature des JWT (longue et aléatoire) | `change-me` |
| `JWT_EXPIRES_IN` | Durée de validité d'un JWT | `24h` |

---

## 5. Lancement

À la racine, démarrer MongoDB (image `mongo:8.0`, données dans le volume `mongo-data`) :

```bash
docker compose up -d
```

Terminal 1, l'API (depuis `backend/`) puis terminal 2, le front-end (depuis `frontend/`) :

```bash
npm run dev
```

| Service | URL |
|---|---|
| Application React | http://localhost:5173 |
| API | http://localhost:3000/api |
| Documentation Swagger | http://localhost:3000/api/docs |

En développement, Vite redirige les appels `/api` vers l'API (proxy dans `vite.config.js`), ce qui évite tout problème de CORS.

### Scripts npm

| Dossier | Commande | Rôle |
|---|---|---|
| `backend` | `npm run dev` | API avec redémarrage automatique (`node --watch`) |
| `backend` | `npm start` | API sans redémarrage automatique |
| `backend` | `npm test` | Tous les tests |
| `backend` | `npm run test:coverage` | Tests + rapport de couverture |
| `backend` | `npm run lint` | ESLint |
| `frontend` | `npm run dev` | Serveur de développement Vite |
| `frontend` | `npm run build` | Build de production dans `dist/` |
| `frontend` | `npm run lint` | ESLint |

---

## 6. Contrat API

Toutes les routes commencent par `/api` et échangent du JSON.

| Méthode | Route | Auth | Succès |
|---|---|---|---|
| GET | `/api/health` | Public | `200` `{"status":"ok"}` |
| POST | `/api/auth/register` | Public | `201` `{"user":{"id","email","username"},"token"}` |
| POST | `/api/auth/login` | Public | `200` `{"user":{"id","email","username"},"token"}` |
| GET | `/api/recipes` | Bearer | `200` `{"items":[...],"page","limit","total","totalPages"}` |
| POST | `/api/recipes` | Bearer | `201` recette créée |
| GET | `/api/recipes/:id` | Bearer | `200` recette |
| PATCH | `/api/recipes/:id` | Bearer (auteur) | `200` recette modifiée |
| DELETE | `/api/recipes/:id` | Bearer (auteur) | `204` sans corps |

### Filtres et pagination de `GET /api/recipes`

Facultatifs et combinables, par exemple `?mine=true&category=dessert&q=tarte&page=2`.

| Paramètre | Valeurs | Effet |
|---|---|---|
| `category` | `starter`, `main`, `dessert`, `drink` | Une seule catégorie |
| `favorite` | `true`, `false` | Favoris ou non-favoris |
| `q` | 1 à 120 caractères | Recherche dans le titre, insensible à la casse |
| `mine` | `true`, `false` | `true` : seulement les recettes de l'utilisateur connecté |
| `page` | entier ≥ 1 (défaut `1`) | Numéro de page |
| `limit` | 1 à 50 (défaut `12`) | Nombre de recettes par page |

La réponse garde l'enveloppe `items` et ajoute `page`, `limit`, `total` (nombre de recettes correspondant aux filtres) et `totalPages`. Le tri `createdAt` puis `_id` garantit qu'aucune recette n'apparaît deux fois d'une page à l'autre.

### Erreurs

Toutes les erreurs ont le même format : `{"error":{"code":"...","message":"..."}}`.

| Code HTTP | `code` | Cas |
|---|---|---|
| 400 | `INVALID_INPUT` | Corps, filtre, pagination ou identifiant invalide, pseudo invalide, champ inconnu, `id` ou `ownerId` envoyé, PATCH vide, JSON mal formé |
| 401 | `UNAUTHORIZED` | JWT absent, invalide ou expiré ; identifiants de connexion incorrects |
| 404 | `NOT_FOUND` | Route ou recette introuvable, ou recette d'un autre compte en modification / suppression |
| 409 | `EMAIL_ALREADY_USED` | Email déjà inscrit (insensible à la casse) |
| 409 | `USERNAME_ALREADY_USED` | Pseudo déjà pris (insensible à la casse) |

---

## 7. Architecture

```
React (navigateur) ──JSON + Bearer JWT──▶ Express ──Mongoose──▶ MongoDB
```

Chemin d'une requête dans l'API :

```
route → requireAuth → validator → controller → service → modèle Mongoose
                     erreurs ──▶ middleware d'erreurs ──▶ réponse JSON
```

```
carnet-recettes/
├── docker-compose.yml
├── backend/
│   ├── src/
│   │   ├── app.js            application Express (importée par les tests)
│   │   ├── server.js         connexion MongoDB + écoute du port
│   │   ├── config/  routes/  controllers/  services/  models/
│   │   ├── middlewares/      requireAuth, gestion des erreurs
│   │   ├── validators/       règles de validation
│   │   ├── utils/            AppError
│   │   └── docs/             openapi.yaml
│   └── tests/
│       ├── TI/               tests d'intégration (Supertest)
│       └── TU/               tests unitaires
└── frontend/src/
    ├── api/                  client fetch (JWT, erreurs)
    ├── context/              session (AuthProvider, useAuth)
    ├── components/  pages/  utils/  styles/
```

---

## 8. Sécurité

- **Mots de passe** hachés avec bcrypt (coût 10) ; ni `password` ni `passwordHash` ne sortent de l'API.
- **JWT** signé avec `JWT_SECRET`, limité à l'algorithme `HS256` (un jeton `alg: none` est refusé), valable `JWT_EXPIRES_IN`.
- **Propriété** : `ownerId` est toujours déduit du JWT, jamais accepté du client. La modification et la suppression recherchent le couple `id` + `ownerId`.
- **404 plutôt que 403** pour la recette d'un autre compte : la réponse est identique à celle d'une recette inexistante, l'API ne révèle rien.
- **Connexion** : même message `401` pour un email inconnu et un mauvais mot de passe.
- **Vie privée** : l'auteur d'une recette est chargé avec `populate` en sélectionnant uniquement son `username` ; l'email des autres utilisateurs n'est jamais renvoyé.
- **Recherche** : le texte de `q` est échappé avant d'être utilisé dans une expression régulière (pas d'injection ni de ReDoS).
- **Erreurs imprévues** : `500` avec un message générique, le détail reste dans les logs serveur.
- **Stockage du JWT côté navigateur** : `localStorage`. Choix simple qui garde la session après un rechargement ; contrepartie : un script injecté (XSS) pourrait le lire. React échappe le texte affiché, ce qui limite ce risque. Un JWT expiré ou invalide déconnecte automatiquement l'utilisateur.
- `.env`, `node_modules` et `coverage` sont exclus de Git.

---

## 9. Tests

```bash
cd backend
npm test
npm run test:coverage
```

Jest + Supertest sur une base MongoDB **en mémoire** (`mongodb-memory-server`), vidée après chaque test : la base de développement n'est jamais touchée et Docker n'est pas nécessaire.

- **TI** (`tests/TI`) : requêtes HTTP réelles sur l'application complète — health, authentification, CRUD, propriété entre deux comptes, filtres, pagination.
- **TU** (`tests/TU`) : validateurs et middleware `requireAuth` appelés directement.

Scénarios couverts :
- `GET /api/health` → 200.
- Inscription 201, email ou pseudo déjà pris 409 (même avec une autre casse), entrée invalide 400 ; mot de passe stocké haché.
- Connexion 200, mauvais mot de passe ou email inconnu 401 avec le même message.
- CRUD complet : 201 / 200 / 200 / 204, puis 404 après suppression ; valeurs limites acceptées (120 caractères, 1440 min) et refusées (121, 1441).
- Données invalides → 400 : catégorie hors liste, `prepTime` décimal, PATCH vide, `ownerId` fourni…
- Sans JWT, JWT modifié, expiré ou `alg: none` → 401.
- Propriété : B lit la recette de A (200) mais ne peut ni la modifier ni la supprimer (404), et la recette reste intacte.
- Auteur affiché dans le fil et le détail, sans jamais l'email.
- Filtres seuls et combinés, recherche avec caractères spéciaux, filtres invalides → 400.
- Pagination : taille par défaut, dernière page, parcours complet sans doublon, combinaison avec les filtres, `page` ou `limit` invalide → 400.

Couverture du code du back-end : environ 95 %.

---

## 10. Outillage

- **Vite** : serveur de développement (modules ES natifs, rechargement à chaud) et build de production du front-end.
- **Babel** : transpile le JavaScript moderne et le JSX pour les navigateurs ciblés.
- **Webpack** : bundler historique, plus configurable mais plus lent et verbeux que Vite.
- **CI/CD** (non mis en place) : chaque push lancerait `npm ci`, `npm run lint`, `npm test` puis `npm run build`, et le déploiement n'aurait lieu que si tout réussit.

---

## 11. Choix techniques

- **Fil public** : la lecture est partagée entre tous les comptes (réseau social) ; l'écriture reste réservée à l'auteur.
- **MongoDB dans Docker** : même version pour tous, base démarrée en une commande.
- **Validation manuelle** dans `validators/` : règles explicites, alignées sur le contrat.
- **`prepTime` en minutes entières** : format sans ambiguïté ; le formulaire convertit heures + minutes.
- **Filtres dans l'URL** côté front : la page garde ses filtres au rechargement et le bouton « retour » fonctionne.
- **Pagination par bouton « Voir plus »** plutôt que par numéros de page : plus naturel pour un fil, et le front ignore les doublons si de nouvelles recettes sont publiées pendant la lecture.

---

## 12. Limites et améliorations

- Favoris choisis par l'auteur de la recette, pas par chaque utilisateur.
- Recherche limitée au titre ; ingrédients en texte libre.
- Pas de photo ni de renouvellement automatique du JWT.
- Pagination par décalage (`skip`) : simple, mais moins efficace qu'une pagination par curseur sur de très gros volumes.

Pistes : favoris et « j'aime » par utilisateur, page de profil d'un auteur, photos, nombre de personnes avec ajustement des quantités.
