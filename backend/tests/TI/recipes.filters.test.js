const request = require('supertest');
const app = require('../../src/app');
const { createUser, createRecipe } = require('../helpers');

let alice;

beforeEach(async () => {
  alice = await createUser('alice@example.test');
  const bob = await createUser('bob@example.test');

  const tarte = await createRecipe(alice.token, { title: 'Tarte aux pommes', category: 'dessert' });
  await createRecipe(alice.token, { title: 'Velouté de potiron', category: 'starter' });
  await createRecipe(bob.token, { title: 'Tarte au citron', category: 'dessert' });
  const limonade = await createRecipe(bob.token, { title: 'Limonade (maison)', category: 'drink' });
  await createRecipe(bob.token, { title: 'Poulet basquaise', category: 'main' });

  for (const recipe of [tarte, limonade]) {
    await request(app).put(`/api/recipes/${recipe.id}/favorite`).set('Authorization', `Bearer ${alice.token}`);
  }
});

function list(query) {
  return request(app).get(`/api/recipes${query}`).set('Authorization', `Bearer ${alice.token}`);
}

function titles(res) {
  return res.body.items.map((recipe) => recipe.title).sort();
}

describe('GET /api/recipes : filtres valides', () => {
  it.each([
    ['sans filtre', '', ['Limonade (maison)', 'Poulet basquaise', 'Tarte au citron', 'Tarte aux pommes', 'Velouté de potiron']],
    ['category=dessert', '?category=dessert', ['Tarte au citron', 'Tarte aux pommes']],
    ['category=drink', '?category=drink', ['Limonade (maison)']],
    ['favorite=true', '?favorite=true', ['Limonade (maison)', 'Tarte aux pommes']],
    ['favorite=false', '?favorite=false', ['Poulet basquaise', 'Tarte au citron', 'Velouté de potiron']],
    ['q insensible à la casse', '?q=TARTE', ['Tarte au citron', 'Tarte aux pommes']],
    ['q au milieu du titre', '?q=pot', ['Velouté de potiron']],
    ['q avec espaces autour', '?q=%20%20tarte%20%20', ['Tarte au citron', 'Tarte aux pommes']],
    ['q avec parenthèse', '?q=(maison', ['Limonade (maison)']],
    ['q avec .* traité comme du texte', '?q=.*', []],
    ['mine=true', '?mine=true', ['Tarte aux pommes', 'Velouté de potiron']],
    ['mine=false', '?mine=false', ['Limonade (maison)', 'Poulet basquaise', 'Tarte au citron', 'Tarte aux pommes', 'Velouté de potiron']],
    ['category + favorite', '?category=dessert&favorite=true', ['Tarte aux pommes']],
    ['mine + category + q', '?mine=true&category=dessert&q=tarte', ['Tarte aux pommes']],
    ['aucun résultat', '?category=main&favorite=true', []],
  ])('%s', async (label, query, expected) => {
    const res = await list(query);

    expect(res.status).toBe(200);
    expect(titles(res)).toEqual(expected);
  });

  it("garde l'enveloppe { items } avec les informations de pagination", async () => {
    const res = await list('?category=dessert');

    expect(Object.keys(res.body).sort()).toEqual(['items', 'limit', 'page', 'total', 'totalPages']);
    expect(res.body.total).toBe(2);
  });
});

describe('GET /api/recipes : filtres invalides', () => {
  it.each([
    ['catégorie hors liste', '?category=snack'],
    ['catégorie répétée', '?category=main&category=dessert'],
    ['favorite non booléen', '?favorite=oui'],
    ['mine non booléen', '?mine=1'],
    ['q vide', '?q='],
    ["q fait uniquement d'espaces", '?q=%20%20'],
    ['q de 121 caractères', `?q=${'a'.repeat(121)}`],
    ['filtre inconnu', '?tri=asc'],
  ])('répond 400 INVALID_INPUT : %s', async (label, query) => {
    const res = await list(query);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });

  it('répond 401 sans jeton, même avec des filtres', async () => {
    const res = await request(app).get('/api/recipes?category=dessert');

    expect(res.status).toBe(401);
  });
});
