const request = require('supertest');
const app = require('../../src/app');
const { createUser, createRecipe } = require('../helpers');

let alice;
let bob;
let aliceRecipe;

beforeEach(async () => {
  alice = await createUser('alice@example.test');
  bob = await createUser('bob@example.test');
  aliceRecipe = await createRecipe(alice.token, { title: "La tarte d'Alice" });
});

function as(user) {
  const auth = { Authorization: `Bearer ${user.token}` };
  return {
    favorite: (id) => request(app).put(`/api/recipes/${id}/favorite`).set(auth),
    unfavorite: (id) => request(app).delete(`/api/recipes/${id}/favorite`).set(auth),
    get: (id) => request(app).get(`/api/recipes/${id}`).set(auth),
    list: (query = '') => request(app).get(`/api/recipes${query}`).set(auth),
  };
}

describe('PUT /api/recipes/:id/favorite', () => {
  it("permet à B de mettre en favori la recette d'Alice", async () => {
    const res = await as(bob).favorite(aliceRecipe.id);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: aliceRecipe.id, favorite: true, favoritesCount: 1 });
  });

  it("le favori de B n'apparaît pas comme favori d'Alice", async () => {
    await as(bob).favorite(aliceRecipe.id);

    const res = await as(alice).get(aliceRecipe.id);

    expect(res.body.favorite).toBe(false);
    expect(res.body.favoritesCount).toBe(1);
  });

  it('compte les favoris de plusieurs utilisateurs', async () => {
    await as(alice).favorite(aliceRecipe.id);
    await as(bob).favorite(aliceRecipe.id);

    const res = await as(alice).get(aliceRecipe.id);

    expect(res.body).toMatchObject({ favorite: true, favoritesCount: 2 });
  });

  it('est idempotent : deux ajouts ne comptent qu’une fois', async () => {
    await as(bob).favorite(aliceRecipe.id);
    const res = await as(bob).favorite(aliceRecipe.id);

    expect(res.status).toBe(200);
    expect(res.body.favoritesCount).toBe(1);
  });

  it("ne modifie pas la recette d'Alice", async () => {
    await as(bob).favorite(aliceRecipe.id);

    const res = await as(alice).get(aliceRecipe.id);

    expect(res.body).toMatchObject({ title: aliceRecipe.title, ownerId: alice.user.id });
  });

  it("répond 404 si la recette n'existe pas", async () => {
    const res = await as(bob).favorite('000000000000000000000000');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it("répond 400 si l'id est mal formé", async () => {
    const res = await as(bob).favorite('abc');

    expect(res.status).toBe(400);
  });

  it('répond 401 sans jeton', async () => {
    const res = await request(app).put(`/api/recipes/${aliceRecipe.id}/favorite`);

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/recipes/:id/favorite', () => {
  it('retire le favori', async () => {
    await as(bob).favorite(aliceRecipe.id);

    const res = await as(bob).unfavorite(aliceRecipe.id);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ favorite: false, favoritesCount: 0 });
  });

  it("ne retire que le favori de l'utilisateur connecté", async () => {
    await as(alice).favorite(aliceRecipe.id);
    await as(bob).favorite(aliceRecipe.id);

    await as(bob).unfavorite(aliceRecipe.id);
    const res = await as(alice).get(aliceRecipe.id);

    expect(res.body).toMatchObject({ favorite: true, favoritesCount: 1 });
  });

  it("est idempotent : retirer un favori absent répond 200", async () => {
    const res = await as(bob).unfavorite(aliceRecipe.id);

    expect(res.status).toBe(200);
    expect(res.body.favoritesCount).toBe(0);
  });
});

describe('Favoris dans la liste', () => {
  it('?favorite=true ne renvoie que les favoris de l’utilisateur connecté', async () => {
    const bobRecipe = await createRecipe(bob.token, { title: 'Le gratin de Bob' });
    await as(bob).favorite(aliceRecipe.id);
    await as(alice).favorite(bobRecipe.id);

    const res = await as(bob).list('?favorite=true');

    expect(res.body.items.map((recipe) => recipe.title)).toEqual(["La tarte d'Alice"]);
  });

  it('chaque recette de la liste indique si elle est en favori pour moi', async () => {
    await as(bob).favorite(aliceRecipe.id);

    const res = await as(bob).list();

    expect(res.body.items[0]).toMatchObject({ favorite: true, favoritesCount: 1 });
  });

  it('ne révèle jamais la liste des utilisateurs qui ont mis en favori', async () => {
    await as(bob).favorite(aliceRecipe.id);

    const res = await as(alice).list();

    expect(res.body.items[0].favoritedBy).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain(bob.user.id);
  });
});
