# Carnet de Recettes

Application web full stack JavaScript permettant à chaque utilisateur de gérer **son propre carnet de recettes de cuisine** : créer, consulter, modifier et supprimer des recettes privées, accessibles uniquement après connexion.

Projet individuel réalisé dans le cadre du module **Full Stack JS** (Master 1 – EFREI).

> **État du projet :** en cours de développement. Les commandes et sections marquées *(à venir)* seront complétées au fur et à mesure de l'implémentation.

---

## 1. Fonctionnalités

### MVP
- Inscription et connexion d'un utilisateur (mot de passe haché avec bcrypt, session par JWT).
- **Partage des recettes** : chaque utilisateur connecté voit et consulte les recettes de toute la communauté.
- Ajout, consultation du détail, modification et suppression d'une recette.
- **Filtre par catégorie et recherche par titre** dans la liste des recettes.
- **Favoris** : marquer / retirer une recette des favoris et n'afficher que les favoris.
- Validation des données côté serveur (et aide à la saisie côté React).
- Données persistantes dans MongoDB (conservées après redémarrage de l'API).
- Propriété des recettes : seul l'auteur d'une recette peut la modifier ou la supprimer, y compris par requête HTTP directe.
- Interface responsive, utilisable au clavier.

### Ressource métier : `>Recette`

| Champ | Type | Règle | Requis au POST |
|---|---|---|---|
| `title` | string | Non vide après trim, 1 à 120 caractères | Oui |
| `category` | string | Exactement `starter`, `main`, `dessert` ou `drink` | Oui |
| `prepTime` | integer | Entier en minutes, de 1 à 1440 | Oui |
| `ingredients` | string | 0 à 2000 caractères (un ingrédient par ligne), chaîne vide acceptée | Non (défaut `""`) |
| `instructions` | string | 0 à 5000 caractères, chaîne vide acceptée | Non (défaut `""`) |
| `favorite` | boolean | `true` ou `false` uniquement (`false` est une valeur valide) | Non (défaut `false`) |

Champs gérés uniquement par le serveur : `id` (chaîne, ObjectId sérialisé) et `ownerId` (identifiant de l'auteur, déduit du JWT, renvoyé en lecture pour savoir si la recette appartient à l'utilisateur connecté).

---

## 2. Stack technique

| Couche | Technologie |
|---|---|
| Langage | JavaScript / Nodejs |
| Front-end | React + Vite + React Router |
| Back-end | Node.js + Express |1
| Base de données | MongoDB 8 (conteneur Docker) + Mongoose, visualisée avec MongoDB Compass |
| Authentification | bcrypt (hachage), jsonwebtoken (JWT), middleware Bearer |
| Tests | Jest + Supertest + mongodb-memory-server |
| Documentation API | OpenAPI 3 + swagger-ui-express |

Versions exactes : voir les fichiers `backend/package.json` et `frontend/package.json` *(à venir)*.

---

## 3. Prérequis

- **Node.js** ≥ 20 (LTS) et **npm** ≥ 10 — vérifier avec `node -v` et `npm -v`.
- **Git**.
- **Docker Desktop** (avec Docker Compose) pour faire tourner la base MongoDB — vérifier avec `docker compose version`.
- **MongoDB Compass** (facultatif) pour visualiser les données.

---

## 4. Installation

```bash
git clone <url-du-depot>
cd carnet-recettes
```

Installer les dépendances du back-end :

```bash
cd backend
npm install
```

Installer les dépendances du front-end :

```bash
cd ../frontend
npm install
```

---

## 5. Configuration (variables d'environnement)

Le back-end lit sa configuration dans `backend/.env` (chargé via `dotenv`).

1. Copier le modèle :
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Renseigner les vraies valeurs dans `backend/.env`.

| Variable | Rôle | Exemple (fictif) |
|---|---|---|
| `PORT` | Port d'écoute de l'API | `3000` |
| `MONGODB_URI` | URL de connexion MongoDB | `mongodb://127.0.0.1:27017/carnet-recettes` |
| `JWT_SECRET` | Clé de signature des JWT (longue et aléatoire) | `change-me` |
| `JWT_EXPIRES_IN` | Durée de validité d'un JWT | `24h` |

---

## 6. Base de données MongoDB

La base tourne dans un conteneur **Docker**, décrit par le fichier `docker-compose.yml` à la racine du projet (image officielle `mongo:8.0`, port `27017`, données conservées dans le volume `mongo-data`).

Depuis la racine `carnet-recettes/` :

```bash
docker compose up -d
```

L'API s'y connecte avec :

```
MONGODB_URI=mongodb://127.0.0.1:27017/carnet-recettes
```

La base `carnet-recettes` est créée automatiquement au premier enregistrement.

### Visualiser les données avec MongoDB Compass
1. *Add new connection* → URI : `mongodb://localhost:27017` (aucun identifiant).
2. *Save & Connect*, puis ouvrir la base `carnet-recettes` (collections `recipes` et `users`).

> Modifier les données directement dans Compass contourne les validations de l'API : pour tester l'application, passer par l'API.

> Les **tests automatisés n'utilisent pas** cette base : ils tournent sur une base MongoDB temporaire en mémoire (`mongodb-memory-server`), isolée des données de développement.

---

## 7. Lancement

Démarrer la base MongoDB (depuis la racine, une seule fois — elle redémarre ensuite avec Docker Desktop) :

```bash
docker compose up -d
```

Lancer l'API (terminal 1) :

```bash
cd backend
npm run dev
```

Lancer le front-end (terminal 2) :

```bash
cd frontend
npm run dev
```

| Service | URL |
|---|---|
| Front-end React (Vite) | http://localhost:5173 |
| API Express | http://localhost:3000/api |
| Santé de l'API | http://localhost:3000/api/health |
| Documentation Swagger | http://localhost:3000/api/docs |

En développement, Vite redirige les appels `/api` vers l'API (proxy configuré dans `vite.config.js`), ce qui évite les problèmes de CORS.

## 9. Contrat API

Toutes les routes commencent par `/api`. Les corps de requête et de réponse sont en JSON (`Content-Type: application/json`).

### Routes

| Méthode | Route | Auth | Succès |
|---|---|---|---|
| GET | `/api/health` | Public | `200` `{"status":"ok"}` |
| POST | `/api/auth/register` | Public | `201` `{"user":{"id","email"},"token"}` |
| POST | `/api/auth/login` | Public | `200` `{"user":{"id","email"},"token"}` |
| GET | `/api/recipes` | Bearer JWT | `200` `{"items":[...]}` (ou `{"items":[]}`) |
| POST | `/api/recipes` | Bearer JWT | `201` recette créée |
| GET | `/api/recipes/:id` | Bearer JWT | `200` recette |
| PATCH | `/api/recipes/:id` | Bearer JWT | `200` recette modifiée |
| DELETE | `/api/recipes/:id` | Bearer JWT | `204` sans corps |

### Filtres de la liste (`GET /api/recipes`)

Paramètres de requête facultatifs et combinables. Le résultat porte sur les recettes de toute la communauté et garde l'enveloppe `{"items":[...]}`.

| Paramètre | Valeurs acceptées | Effet |
|---|---|---|
| `category` | `starter`, `main`, `dessert`, `drink` | Ne garde que cette catégorie |
| `favorite` | `true`, `false` | Ne garde que les favoris (ou les non-favoris) |
| `q` | Texte de 1 à 120 caractères | Recherche dans le titre, insensible à la casse |

Exemples : `GET /api/recipes?category=dessert`, `GET /api/recipes?favorite=true&q=crêpe`.

Ajouter ou retirer un favori passe par la route de modification existante : `PATCH /api/recipes/:id` avec `{"favorite":true}`.


## 10. Règles de validation

La validation est **toujours effectuée côté serveur**. La validation des formulaires React n'est qu'une aide à l'utilisateur : elle ne protège pas l'API d'un client HTTP qui la contournerait.

### Authentification
- `email` : adresse valide, comparée et stockée en minuscules (insensible à la casse).
- `password` : au moins 8 caractères ; stocké uniquement sous forme de hash bcrypt.

### Recettes — exemples rejetés avec `400 INVALID_INPUT`
- `{"title":"Tarte","category":"snack","prepTime":30}` → catégorie hors énumération.
- `prepTime` égal à `12.5`, `0`, `-3` ou `"20"` (chaîne).
- `title` vide ou composé uniquement d'espaces.
- Présence de `id` ou `ownerId` dans un POST ou un PATCH.
- PATCH vide (`{}`) ou contenant une propriété inconnue.
- Identifiant d'URL qui n'est pas un ObjectId valide.
- `favorite` différent de `true` / `false` (par exemple `"oui"` ou `1`).
- Filtres invalides : `?category=snack`, `?favorite=peut-etre`, `?q=` vide.

---

## 11. Architecture

```
React (navigateur)  ──HTTP/JSON + Bearer JWT──▶  Express (API)  ──Mongoose──▶  MongoDB
```

### Chemin d'une requête dans l'API

```
route → middleware d'auth → validator → controller → service → modèle Mongoose
                                                         │
                         erreurs ──▶ middleware d'erreurs centralisé ──▶ réponse JSON
```

- **routes** : associent une méthode + un chemin à un contrôleur.
- **middlewares** : vérification du JWT (`req.userId`) et gestion centralisée des erreurs.
- **validators** : contrôlent et nettoient le corps de la requête.
- **controllers** : lisent la requête, appellent le service, renvoient le code HTTP.
- **services** : contiennent la logique métier (dont la vérification de l'auteur via `ownerId`).
- **models** : schémas Mongoose (`User`, `Recipe`).

### Arborescence

```
carnet-recettes/
├── README.md
├── docker-compose.yml        # base MongoDB (conteneur Docker)
├── backend/
│   ├── src/
│   │   ├── app.js            # crée l'application Express (sans écouter de port)
│   │   ├── server.js         # connexion MongoDB + démarrage sur PORT
│   │   ├── config/           # connexion base de données
│   │   ├── routes/           # health, auth, recipes
│   │   ├── controllers/      # auth, recipes
│   │   ├── services/         # logique métier auth et recettes
│   │   ├── models/           # User, Recipe (Mongoose)
│   │   ├── middlewares/      # auth Bearer, gestion d'erreurs
│   │   ├── validators/       # règles de validation auth et recettes
│   │   ├── utils/            # classe d'erreur applicative, helpers
│   │   └── docs/             # spécification OpenAPI
│   └── tests/                # tests Jest + Supertest
└── frontend/
    ├── public/
    └── src/
        ├── api/              # client fetch (ajout du header Bearer, erreurs)
        ├── context/          # état de session (AuthContext)
        ├── pages/            # Login, Register, liste, détail, formulaire
        ├── components/       # Navbar, ProtectedRoute, RecipeCard…
        └── styles/           # feuilles de style
```

La séparation `app.js` / `server.js` permet aux tests d'importer l'application Express **sans ouvrir de port**.

---

## 12. Sécurité et authentification

- **Mots de passe** : hachés avec bcrypt, jamais renvoyés dans une réponse (ni `password`, ni `passwordHash`).
- **JWT** : signé avec `JWT_SECRET` (variable d'environnement serveur), avec une durée de validité (`JWT_EXPIRES_IN`). Envoyé par le front dans l'en-tête `Authorization: Bearer <token>`.
- **Propriété des données** : `ownerId` est calculé **exclusivement côté serveur** à partir du JWT vérifié et ne peut jamais être envoyé par le client. La lecture est ouverte à tous les comptes connectés ; la modification et la suppression filtrent sur `ownerId`.
- **404 pour modifier ou supprimer la recette d'un autre compte** : la recherche se fait sur le couple `id` + `ownerId`, donc la recette est introuvable parmi celles de l'utilisateur (codes d'erreur du contrat conservés).
- **Login** : un échec renvoie `401` sans préciser si c'est l'email ou le mot de passe qui est faux.
- **Stockage du token côté navigateur** : *(choix à documenter — localStorage, simple mais exposé au XSS, ou mémoire, plus sûr mais perdu au rechargement)*.
- **Hygiène du dépôt** : `node_modules`, `.env` et tout secret sont exclus de Git.

---

## 13. Tests

```bash
cd backend
npm test
```

Les tests utilisent Jest + Supertest sur une base MongoDB **en mémoire** (`mongodb-memory-server`), créée et vidée à chaque exécution : aucune donnée de développement n'est touchée.

Scénarios couverts *(à venir)* :
- [ ] `GET /api/health` → 200 `{"status":"ok"}`
- [ ] Inscription 201, doublon 409, entrée invalide 400
- [ ] Connexion 200, mauvais mot de passe 401
- [ ] Parcours CRUD nominal complet (201 / 200 / 200 / 204 / 404 après suppression)
- [ ] Données invalides → 400 (`category` hors liste, `prepTime` décimal, PATCH vide, `ownerId` fourni…)
- [ ] Accès sans JWT ou avec JWT falsifié → 401
- [ ] Propriété : l'utilisateur B voit et lit une recette de A (200), mais ne peut ni la modifier ni la supprimer (404)
- [ ] Filtres : `?category=dessert` ne renvoie que des desserts, `?q=` trouve un titre sans tenir compte de la casse, un filtre invalide → 400
- [ ] Favoris : `PATCH {"favorite":true}` → 200, puis `?favorite=true` renvoie la recette ; `favorite` non booléen → 400

---

## 14. Documentation Swagger / OpenAPI

La spécification se trouve dans `backend/src/docs/openapi.yaml` et est servie par l'API :

- Interface Swagger UI : http://localhost:3000/api/docs

Elle décrit l'authentification Bearer, les routes `health` et `auth`, les cinq opérations sur les recettes, les schémas de requête et la réponse de succès de chaque route.

---

## 15. Outillage : Vite, Babel, Webpack et CI/CD

- **Vite** : serveur de développement très rapide (modules ES natifs, rechargement à chaud) et outil de build pour la production. Utilisé pour le front-end de ce projet.
- **Babel** : transpileur qui convertit du JavaScript moderne ou du JSX en JavaScript compatible avec les navigateurs ciblés.
- **Webpack** : bundler historique qui assemble les modules et ressources en fichiers optimisés ; plus configurable mais plus lent et verbeux que Vite.
- **CI/CD** : dans une future chaîne d'intégration continue, chaque push exécuterait `npm ci`, `npm run lint`, `npm test` puis `npm run build` ; le déploiement n'aurait lieu que si toutes ces étapes réussissent.

---

## 16. Choix techniques

- **MongoDB dans Docker** : pas d'installation de MongoDB sur la machine, même version pour tout le monde (`mongo:8.0`), base démarrée en une commande ; Compass sert d'interface graphique.
- **Validation manuelle dans `validators/`** : règles explicites et faciles à expliquer, alignées exactement sur le contrat API.
- **`prepTime` en minutes entières** : évite les ambiguïtés de format (pas de « 1h30 » en texte libre).
- **`ingredients` en texte libre** : modèle volontairement simple pour le MVP (un ingrédient par ligne).

---

## 17. Limites connues et améliorations

- Recherche limitée au titre (pas dans les ingrédients ni les instructions).
- Ingrédients non structurés (pas de quantités / unités séparées).
- Pas d'upload de photo de recette.
- Pas de rafraîchissement automatique du JWT : l'utilisateur doit se reconnecter après expiration.

Pistes d'évolution : difficulté (`easy` / `medium` / `hard`), statistiques du carnet, nombre de personnes avec ajustement des quantités, photos, liste de courses générée à partir des ingrédients, partage public d'une recette.
