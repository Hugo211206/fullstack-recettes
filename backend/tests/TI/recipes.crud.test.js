const request = require('supertest');
const app = require('../../src/app');
const { VALID_RECIPE, createUser, createRecipe } = require('../helpers');

const UNKNOWN_ID = '000000000000000000000000';
const MALFORMED_ID = 'abc';

let token;
let user;

beforeEach(async () => {
  ({ token, user } = await createUser());
});

function api() {
  return {
    list: () => request(app).get('/api/recipes').set('Authorization', `Bearer ${token}`),
    create: (body) => request(app).post('/api/recipes').set('Authorization', `Bearer ${token}`).send(body),
    get: (id) => request(app).get(`/api/recipes/${id}`).set('Authorization', `Bearer ${token}`),
    patch: (id, body) => request(app).patch(`/api/recipes/${id}`).set('Authorization', `Bearer ${token}`).send(body),
    remove: (id) => request(app).delete(`/api/recipes/${id}`).set('Authorization', `Bearer ${token}`),
  };
}

describe('POST /api/recipes', () => {
  it('crée une recette, répond 201 et applique les valeurs par défaut', async () => {
    const res = await api().create(VALID_RECIPE);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(String),
      title: 'Tarte aux pommes',
      category: 'dessert',
      prepTime: 60,
      ingredients: '',
      instructions: '',
      ownerId: user.id,
      author: { id: user.id, username: user.username },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      favorite: false,
      favoritesCount: 0,
    });
  });

  it('retire les espaces autour du titre', async () => {
    const res = await api().create({ ...VALID_RECIPE, title: '  Crêpes  ' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Crêpes');
  });

  it.each([
    ['titre de 120 caractères', { title: 'a'.repeat(120) }],
    ['prepTime = 1', { prepTime: 1 }],
    ['prepTime = 1440', { prepTime: 1440 }],
    ['ingrédients de 2000 caractères', { ingredients: 'a'.repeat(2000) }],
    ['instructions de 5000 caractères', { instructions: 'a'.repeat(5000) }],
  ])('accepte la valeur limite : %s', async (label, overrides) => {
    const res = await api().create({ ...VALID_RECIPE, ...overrides });

    expect(res.status).toBe(201);
  });

  it.each([
    ['titre absent', { title: undefined }],
    ['titre vide après trim', { title: '   ' }],
    ['titre de 121 caractères', { title: 'a'.repeat(121) }],
    ['catégorie hors liste', { category: 'snack' }],
    ['catégorie absente', { category: undefined }],
    ['prepTime = 0', { prepTime: 0 }],
    ['prepTime = 1441', { prepTime: 1441 }],
    ['prepTime décimal', { prepTime: 1.5 }],
    ['prepTime en texte', { prepTime: '60' }],
    ['ingrédients de 2001 caractères', { ingredients: 'a'.repeat(2001) }],
    ['instructions de 5001 caractères', { instructions: 'a'.repeat(5001) }],
    ['favorite (géré par sa propre route)', { favorite: true }],
    ['ownerId fourni par le client', { ownerId: '000000000000000000000000' }],
    ['id fourni par le client', { id: '000000000000000000000000' }],
    ['champ inconnu', { difficulty: 'facile' }],
  ])('répond 400 INVALID_INPUT : %s', async (label, overrides) => {
    const res = await api().create({ ...VALID_RECIPE, ...overrides });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { code: 'INVALID_INPUT', message: expect.any(String) } });
  });

  it("répond 400 si le corps n'est pas un objet JSON", async () => {
    const res = await api().create([VALID_RECIPE]);

    expect(res.status).toBe(400);
  });

  it('répond 401 sans jeton', async () => {
    const res = await request(app).post('/api/recipes').send(VALID_RECIPE);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('GET /api/recipes', () => {
  it("répond 200 avec une liste vide quand il n'y a aucune recette", async () => {
    const res = await api().list();

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ items: [] });
  });

  it('renvoie les recettes de la plus récente à la plus ancienne', async () => {
    await createRecipe(token, { title: 'Première' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await createRecipe(token, { title: 'Seconde' });

    const res = await api().list();

    expect(res.status).toBe(200);
    expect(res.body.items.map((recipe) => recipe.title)).toEqual(['Seconde', 'Première']);
  });

  it('répond 401 sans jeton', async () => {
    const res = await request(app).get('/api/recipes');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/recipes/:id', () => {
  it('répond 200 avec la recette', async () => {
    const recipe = await createRecipe(token);

    const res = await api().get(recipe.id);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(recipe);
  });

  it("répond 404 NOT_FOUND si la recette n'existe pas", async () => {
    const res = await api().get(UNKNOWN_ID);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it("répond 400 si l'id est mal formé", async () => {
    const res = await api().get(MALFORMED_ID);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });

  it('répond 401 sans jeton', async () => {
    const recipe = await createRecipe(token);

    const res = await request(app).get(`/api/recipes/${recipe.id}`);

    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/recipes/:id', () => {
  it('modifie seulement les champs envoyés et répond 200', async () => {
    const recipe = await createRecipe(token, { ingredients: '4 pommes' });

    const res = await api().patch(recipe.id, { title: 'Tarte fine' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Tarte fine');
    expect(res.body.category).toBe('dessert');
    expect(res.body.prepTime).toBe(60);
    expect(res.body.ingredients).toBe('4 pommes');
  });

  it.each([
    ['corps vide', {}],
    ['titre vide', { title: '   ' }],
    ['catégorie hors liste', { category: 'snack' }],
    ['prepTime décimal', { prepTime: 1.5 }],
    ['favorite (géré par sa propre route)', { favorite: true }],
    ['ownerId', { ownerId: '000000000000000000000000' }],
    ['id', { id: '000000000000000000000000' }],
    ['champ inconnu', { difficulty: 'facile' }],
  ])('répond 400 INVALID_INPUT : %s', async (label, body) => {
    const recipe = await createRecipe(token);

    const res = await api().patch(recipe.id, body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });

  it("ne modifie rien quand l'entrée est invalide", async () => {
    const recipe = await createRecipe(token);
    await api().patch(recipe.id, { title: 'Nouveau', category: 'snack' });

    const res = await api().get(recipe.id);

    expect(res.body.title).toBe('Tarte aux pommes');
  });

  it("répond 404 si la recette n'existe pas", async () => {
    const res = await api().patch(UNKNOWN_ID, { title: 'Nouveau' });

    expect(res.status).toBe(404);
  });

  it("répond 400 si l'id est mal formé", async () => {
    const res = await api().patch(MALFORMED_ID, { title: 'Nouveau' });

    expect(res.status).toBe(400);
  });

  it('répond 401 sans jeton', async () => {
    const recipe = await createRecipe(token);

    const res = await request(app).patch(`/api/recipes/${recipe.id}`).send({ title: 'Nouveau' });

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/recipes/:id', () => {
  it('supprime la recette et répond 204 sans corps', async () => {
    const recipe = await createRecipe(token);

    const res = await api().remove(recipe.id);

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
  });

  it('la recette supprimée renvoie ensuite 404', async () => {
    const recipe = await createRecipe(token);
    await api().remove(recipe.id);

    const res = await api().get(recipe.id);

    expect(res.status).toBe(404);
  });

  it('répond 404 si on supprime deux fois', async () => {
    const recipe = await createRecipe(token);
    await api().remove(recipe.id);

    const res = await api().remove(recipe.id);

    expect(res.status).toBe(404);
  });

  it("répond 400 si l'id est mal formé", async () => {
    const res = await api().remove(MALFORMED_ID);

    expect(res.status).toBe(400);
  });

  it('répond 401 sans jeton', async () => {
    const recipe = await createRecipe(token);

    const res = await request(app).delete(`/api/recipes/${recipe.id}`);

    expect(res.status).toBe(401);
  });
});
