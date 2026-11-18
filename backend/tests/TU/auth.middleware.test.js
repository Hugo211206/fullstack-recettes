const jwt = require('jsonwebtoken');
const { requireAuth } = require('../../src/middlewares/auth.middleware');

const USER_ID = '6afd6d34bdefb600799fc803';

function run(authorization) {
  const req = { headers: authorization === undefined ? {} : { authorization } };
  const next = jest.fn();
  requireAuth(req, {}, next);
  return { req, error: next.mock.calls[0][0] };
}

function sign(payload, options = {}) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h', ...options });
}

function unsignedToken(payload) {
  const encode = (part) => Buffer.from(JSON.stringify(part)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.`;
}

describe('requireAuth', () => {
  it("laisse passer un jeton valide et place l'utilisateur dans req.user", () => {
    const { req, error } = run(`Bearer ${sign({ sub: USER_ID })}`);

    expect(error).toBeUndefined();
    expect(req.user).toEqual({ id: USER_ID });
  });

  it.each([
    ['en-tête absent', undefined],
    ['schéma Basic', `Basic ${sign({ sub: USER_ID })}`],
    ['Bearer sans jeton', 'Bearer '],
    ["jeton qui n'est pas un JWT", 'Bearer nimportequoi'],
    ['jeton modifié', `Bearer ${sign({ sub: USER_ID })}x`],
    ['jeton expiré', `Bearer ${jwt.sign({ sub: USER_ID, exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET)}`],
    ['jeton sans signature (alg: none)', `Bearer ${unsignedToken({ sub: USER_ID })}`],
  ])('refuse avec une erreur 401 : %s', (label, authorization) => {
    const { req, error } = run(authorization);

    expect(error).toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    expect(req.user).toBeUndefined();
  });
});
