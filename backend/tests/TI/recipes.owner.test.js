const request = require('supertest');
const app = require('../../src/app');
const { createUser, createRecipe } = require('../helpers');

let alice;
let bob;
let aliceRecipe;

beforeEach(async () => {
  alice = await createUser('alice@example.test');
  bob = await createUser('bob@example.test');
  aliceRecipe = await createRecipe(alice.token, { title: "La tarte d'Alice", ingredients: '4 pommes' });
});

function as(user) {
  const auth = { Authorization: `Bearer ${user.token}` };
  return {
    list: (query = '') => request(app).get(`/api/recipes${query}`).set(auth),
    get: (id) => request(app).get(`/api/recipes/${id}`).set(auth),
    patch: (id, body) => request(app).patch(`/api/recipes/${id}`).set(auth).send(body),
    remove: (id) => request(app).delete(`/api/recipes/${id}`).set(auth),
  };
}

describe('Lecture : le fil est public', () => {
  it("B voit la recette d'Alice dans la liste", async () => {
    const res = await as(bob).list();

    expect(res.status).toBe(200);
    expect(res.body.items.map((recipe) => recipe.id)).toContain(aliceRecipe.id);
  });

  it("B peut ouvrir le détail de la recette d'Alice, avec Alice comme auteur", async () => {
    const res = await as(bob).get(aliceRecipe.id);

    expect(res.status).toBe(200);
    expect(res.body.ownerId).toBe(alice.user.id);
  });
});

describe("Écriture : seul l'auteur modifie ou supprime", () => {
  it("B reçoit 404 NOT_FOUND en modifiant la recette d'Alice", async () => {
    const res = await as(bob).patch(aliceRecipe.id, { title: 'Piratée' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('la recette reste intacte après la tentative de B', async () => {
    await as(bob).patch(aliceRecipe.id, { title: 'Piratée', favorite: true });

    const res = await as(alice).get(aliceRecipe.id);

    expect(res.body).toEqual(aliceRecipe);
  });

  it("B reçoit 404 NOT_FOUND en supprimant la recette d'Alice", async () => {
    const res = await as(bob).remove(aliceRecipe.id);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe("L'auteur est toujours déduit du jeton", () => {
  it('une recette créée par B a B comme auteur', async () => {
    const bobRecipe = await createRecipe(bob.token, { title: 'Le gratin de Bob' });

    expect(bobRecipe.ownerId).toBe(bob.user.id);
  });

  it("B ne peut pas créer une recette au nom d'Alice", async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ title: 'Faux', category: 'main', prepTime: 10, ownerId: alice.user.id });

    expect(res.status).toBe(400);
  });

  it("B ne peut pas s'approprier la recette d'Alice en changeant ownerId", async () => {
    const res = await as(alice).patch(aliceRecipe.id, { ownerId: bob.user.id });

    expect(res.status).toBe(400);
  });
});
