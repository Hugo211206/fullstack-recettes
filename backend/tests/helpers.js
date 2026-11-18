  const request = require('supertest');
const app = require('../src/app');

const PASSWORD = 'motdepasse';

const VALID_RECIPE = {
  title: 'Tarte aux pommes',
  category: 'dessert',
  prepTime: 60,
};

let userCount = 0;

async function createUser(email) {
  userCount += 1;
  const finalEmail = email ?? `user${userCount}@example.test`;
  const username = finalEmail.split('@')[0];
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: finalEmail, password: PASSWORD, username });
  return { token: res.body.token, user: res.body.user };
}

async function createRecipe(token, overrides = {}) {
  const res = await request(app)
    .post('/api/recipes')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...VALID_RECIPE, ...overrides });
  return res.body;
}

module.exports = { PASSWORD, VALID_RECIPE, createUser, createRecipe };
