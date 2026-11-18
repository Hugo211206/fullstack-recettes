const { validateLoginBody, validateRegisterBody } = require('../../src/validators/auth.validator');

function run(middleware, body) {
  const req = { body };
  const next = jest.fn();
  middleware(req, {}, next);
  return { req, error: next.mock.calls[0][0] };
}

describe('validateLoginBody', () => {
  it("laisse passer un corps valide et nettoie l'email", () => {
    const { req, error } = run(validateLoginBody, { email: '  Alice@Example.TEST ', password: ' mot de passe ' });

    expect(error).toBeUndefined();
    expect(req.body).toEqual({ email: 'alice@example.test', password: ' mot de passe ' });
  });

  it('accepte un mot de passe de 8 caractères exactement', () => {
    const { error } = run(validateLoginBody, { email: 'a@b.fr', password: '12345678' });

    expect(error).toBeUndefined();
  });

  it.each([
    ['corps null', null],
    ['champ inconnu', { email: 'a@b.fr', password: '12345678', role: 'admin' }],
    ['pseudo envoyé à la connexion', { email: 'a@b.fr', password: '12345678', username: 'alice' }],
    ['email absent', { password: '12345678' }],
    ['email non texte', { email: 42, password: '12345678' }],
    ['email sans @', { email: 'alice.example.test', password: '12345678' }],
    ['email sans domaine', { email: 'alice@', password: '12345678' }],
    ['email avec espace', { email: 'ali ce@b.fr', password: '12345678' }],
    ['mot de passe de 7 caractères', { email: 'a@b.fr', password: '1234567' }],
    ['mot de passe non texte', { email: 'a@b.fr', password: 12345678 }],
  ])('refuse avec une erreur 400 : %s', (label, body) => {
    const { error } = run(validateLoginBody, body);

    expect(error).toMatchObject({ status: 400, code: 'INVALID_INPUT' });
  });
});

describe('validateRegisterBody', () => {
  const VALID = { email: 'a@b.fr', password: '12345678', username: 'alice' };

  it('laisse passer un corps valide et met le pseudo en minuscules', () => {
    const { req, error } = run(validateRegisterBody, { ...VALID, username: '  Alice_42  ' });

    expect(error).toBeUndefined();
    expect(req.body).toEqual({ email: 'a@b.fr', password: '12345678', username: 'alice_42' });
  });

  it.each(['abc', 'a'.repeat(30), 'jean-paul', 'chef_2026'])('accepte le pseudo %s', (username) => {
    const { error } = run(validateRegisterBody, { ...VALID, username });

    expect(error).toBeUndefined();
  });

  it.each([
    ['pseudo absent', { email: 'a@b.fr', password: '12345678' }],
    ['pseudo de 2 caractères', { ...VALID, username: 'ab' }],
    ['pseudo de 31 caractères', { ...VALID, username: 'a'.repeat(31) }],
    ['pseudo avec espace', { ...VALID, username: 'ali ce' }],
    ['pseudo avec accent', { ...VALID, username: 'élise' }],
    ['pseudo non texte', { ...VALID, username: 42 }],
    ['email invalide', { ...VALID, email: 'pas-un-email' }],
    ['mot de passe trop court', { ...VALID, password: 'court' }],
  ])('refuse avec une erreur 400 : %s', (label, body) => {
    const { error } = run(validateRegisterBody, body);

    expect(error).toMatchObject({ status: 400, code: 'INVALID_INPUT' });
  });
});
