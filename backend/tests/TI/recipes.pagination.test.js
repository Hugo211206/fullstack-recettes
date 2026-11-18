const request = require('supertest');
const app = require('../../src/app');
const Recipe = require('../../src/models/recipe.model');
const { createUser } = require('../helpers');

let token;

beforeEach(async () => {
  const { token: userToken, user } = await createUser();
  token = userToken;

  const recipes = Array.from({ length: 30 }, (_, index) => ({
    title: `Recette ${String(index + 1).padStart(2, '0')}`,
    category: index < 4 ? 'dessert' : 'main',
    prepTime: 10,
    ownerId: user.id,
  }));
  await Recipe.insertMany(recipes);
});

function list(query = '') {
  return request(app).get(`/api/recipes${query}`).set('Authorization', `Bearer ${token}`);
}

describe('GET /api/recipes : pagination', () => {
  it('renvoie 12 recettes et les informations de pagination par défaut', async () => {
    const res = await list();

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(12);
    expect(res.body).toMatchObject({ page: 1, limit: 12, total: 30, totalPages: 3 });
  });

  it('renvoie les 6 dernières recettes sur la page 3', async () => {
    const res = await list('?page=3');

    expect(res.body.items).toHaveLength(6);
    expect(res.body.page).toBe(3);
  });

  it('parcourt toutes les recettes sans doublon ni oubli', async () => {
    const ids = [];
    for (let page = 1; page <= 3; page += 1) {
      const res = await list(`?page=${page}`);
      ids.push(...res.body.items.map((recipe) => recipe.id));
    }

    expect(ids).toHaveLength(30);
    expect(new Set(ids).size).toBe(30);
  });

  it('respecte le paramètre limit', async () => {
    const res = await list('?limit=5');

    expect(res.body.items).toHaveLength(5);
    expect(res.body).toMatchObject({ limit: 5, totalPages: 6 });
  });

  it('renvoie une liste vide au-delà de la dernière page', async () => {
    const res = await list('?page=99');

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(30);
  });

  it('se combine avec les filtres', async () => {
    const res = await list('?category=dessert&limit=3&page=2');

    expect(res.body.items).toHaveLength(1);
    expect(res.body).toMatchObject({ page: 2, limit: 3, total: 4, totalPages: 2 });
  });

  it.each([
    ['page = 0', '?page=0'],
    ['page négative', '?page=-1'],
    ['page décimale', '?page=1.5'],
    ['page en texte', '?page=abc'],
    ['limit = 0', '?limit=0'],
    ['limit = 51', '?limit=51'],
  ])('répond 400 INVALID_INPUT : %s', async (label, query) => {
    const res = await list(query);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });
});
