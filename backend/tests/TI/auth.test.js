const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/user.model');

const EMAIL = 'alice@example.test';
const PASSWORD = 'motdepasse';

function register(body) {
  return request(app).post('/api/auth/register').send(body);
}

function login(body) {
  return request(app).post('/api/auth/login').send(body);
}

describe('POST /api/auth/register', () => {
  it('crée un compte et répond 201 avec user et token', async () => {
    const res = await register({ email: EMAIL, password: PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({ id: expect.any(String), email: EMAIL });
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('ne renvoie jamais le mot de passe ni son hash', async () => {
    const res = await register({ email: EMAIL, password: PASSWORD });

    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('stocke le mot de passe haché avec bcrypt', async () => {
    await register({ email: EMAIL, password: PASSWORD });

    const user = await User.findOne({ email: EMAIL });
    expect(user.passwordHash).not.toBe(PASSWORD);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$10\$/);
  });

  it("enregistre l'email en minuscules et sans espaces", async () => {
    const res = await register({ email: '  Alice@Example.TEST ', password: PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(EMAIL);
  });

  it('répond 409 EMAIL_ALREADY_USED si l\'email existe déjà, même avec une autre casse', async () => {
    await register({ email: EMAIL, password: PASSWORD });

    const res = await register({ email: 'ALICE@example.test', password: PASSWORD });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: { code: 'EMAIL_ALREADY_USED', message: expect.any(String) },
    });
  });

  it.each([
    ['email absent', { password: PASSWORD }],
    ['email invalide', { email: 'pas-un-email', password: PASSWORD }],
    ['mot de passe absent', { email: EMAIL }],
    ['mot de passe trop court', { email: EMAIL, password: 'court' }],
    ['champ non autorisé', { email: EMAIL, password: PASSWORD, role: 'admin' }],
    ['corps vide', {}],
  ])('répond 400 INVALID_INPUT : %s', async (label, body) => {
    const res = await register(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });

  it("ne crée aucun compte quand l'entrée est invalide", async () => {
    await register({ email: 'pas-un-email', password: PASSWORD });

    expect(await User.countDocuments()).toBe(0);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await register({ email: EMAIL, password: PASSWORD });
  });

});