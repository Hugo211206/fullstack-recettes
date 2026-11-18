const { validateAuthBody } = require('../../src/validators/auth.validator');

function run(body) {
  const req = { body };
  const next = jest.fn();
  validateAuthBody(req, {}, next);
  return { req, next, error: next.mock.calls[0][0] };
}

describe('validateAuthBody', () => {
  it("laisse passer un corps valide et nettoie l'email", () => {
    const { req, error } = run({ email: '  Alice@Example.TEST ', password: ' mot de passe ' });

    expect(error).toBeUndefined();
    expect(req.body).toEqual({ email: 'alice@example.test', password: ' mot de passe ' });
  });

  it('accepte un mot de passe de 8 caractères exactement', () => {
    const { error } = run({ email: 'a@b.fr', password: '12345678' });

    expect(error).toBeUndefined();
  });

  it.each([
    ['corps null', null],
    ['champ inconnu', { email: 'a@b.fr', password: '12345678', role: 'admin' }],
    ['email absent', { password: '12345678' }],
    ['email non texte', { email: 42, password: '12345678' }],
    ['email sans @', { email: 'alice.example.test', password: '12345678' }],
    ['email sans domaine', { email: 'alice@', password: '12345678' }],
    ['email avec espace', { email: 'ali ce@b.fr', password: '12345678' }],
    ['mot de passe de 7 caractères', { email: 'a@b.fr', password: '1234567' }],
    ['mot de passe non texte', { email: 'a@b.fr', password: 12345678 }],
  ])('refuse avec une erreur 400 : %s', (label, body) => {
    const { error } = run(body);

    expect(error).toMatchObject({ status: 400, code: 'INVALID_INPUT' });
  });
});
