const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/user.model');

const EMAIL = 'alice@example.test';
const PASSWORD = 'motdepasse';
const USERNAME = 'alice';
const ALICE = { email: EMAIL, password: PASSWORD, username: USERNAME };

function register(body) {
  return request(app).post('/api/auth/register').send(body);
}

function login(body) {
  return request(app).post('/api/auth/login').send(body);
}

describe('POST /api/auth/register', () => {
  it('crée un compte et répond 201 avec user et token', async () => {
    const res = await register(ALICE);

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({ id: expect.any(String), email: EMAIL, username: USERNAME });
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('ne renvoie jamais le mot de passe ni son hash', async () => {
    const res = await register(ALICE);

    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('stocke le mot de passe haché avec bcrypt', async () => {
    await register(ALICE);

    const user = await User.findOne({ email: EMAIL });
    expect(user.passwordHash).not.toBe(PASSWORD);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$10\$/);
  });

  it("enregistre l'email et le pseudo en minuscules et sans espaces", async () => {
    const res = await register({ ...ALICE, email: '  Alice@Example.TEST ', username: ' Alice ' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(EMAIL);
    expect(res.body.user.username).toBe(USERNAME);
  });

  it("répond 409 EMAIL_ALREADY_USED si l'email existe déjà, même avec une autre casse", async () => {
    await register(ALICE);

    const res = await register({ ...ALICE, email: 'ALICE@example.test', username: 'alice2' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: { code: 'EMAIL_ALREADY_USED', message: expect.any(String) },
    });
  });

  it('répond 409 USERNAME_ALREADY_USED si le pseudo existe déjà, même avec une autre casse', async () => {
    await register(ALICE);

    const res = await register({ ...ALICE, email: 'autre@example.test', username: 'ALICE' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: { code: 'USERNAME_ALREADY_USED', message: expect.any(String) },
    });
  });

  it.each([
    ['email absent', { password: PASSWORD, username: USERNAME }],
    ['email invalide', { ...ALICE, email: 'pas-un-email' }],
    ['mot de passe absent', { email: EMAIL, username: USERNAME }],
    ['mot de passe trop court', { ...ALICE, password: 'court' }],
    ['pseudo absent', { email: EMAIL, password: PASSWORD }],
    ['pseudo trop court', { ...ALICE, username: 'ab' }],
    ['pseudo avec espace', { ...ALICE, username: 'ali ce' }],
    ['champ non autorisé', { ...ALICE, role: 'admin' }],
    ['corps vide', {}],
  ])('répond 400 INVALID_INPUT : %s', async (label, body) => {
    const res = await register(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });

  it("ne crée aucun compte quand l'entrée est invalide", async () => {
    await register({ ...ALICE, email: 'pas-un-email' });

    expect(await User.countDocuments()).toBe(0);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await register(ALICE);
  });

  it('répond 200 avec user (pseudo compris) et token', async () => {
    const res = await login({ email: EMAIL, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: expect.any(String), email: EMAIL, username: USERNAME });
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("accepte l'email avec une autre casse", async () => {
    const res = await login({ email: 'ALICE@Example.test', password: PASSWORD });

    expect(res.status).toBe(200);
  });

  it('répond 401 UNAUTHORIZED si le mot de passe est faux', async () => {
    const res = await login({ email: EMAIL, password: 'mauvaismdp' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it("répond 401 si l'email est inconnu", async () => {
    const res = await login({ email: 'inconnu@example.test', password: PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it("répond 400 si l'email est invalide", async () => {
    const res = await login({ email: 'pas-un-email', password: PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });

  it("renvoie username: null pour un ancien compte créé sans pseudo", async () => {
    await User.create({ email: 'ancien@example.test', passwordHash: (await User.findOne({ email: EMAIL })).passwordHash });

    const res = await login({ email: 'ancien@example.test', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBeNull();
  });

  it('fournit un jeton qui donne accès aux recettes', async () => {
    const { body } = await login({ email: EMAIL, password: PASSWORD });

    const res = await request(app)
      .get('/api/recipes')
      .set('Authorization', `Bearer ${body.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ items: [] });
  });
});
