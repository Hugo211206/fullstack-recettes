const {
  validateCreateRecipe,
  validateUpdateRecipe,
  validateId,
  validateListQuery,
} = require('../../src/validators/recipe.validator');

function run(middleware, req) {
  const next = jest.fn();
  middleware(req, {}, next);
  return { req, error: next.mock.calls[0][0] };
}

const VALID = { title: 'Tarte', category: 'dessert', prepTime: 30 };

describe('validateCreateRecipe', () => {
  it('reconstruit le corps avec le titre nettoyé et les valeurs par défaut', () => {
    const { req, error } = run(validateCreateRecipe, { body: { ...VALID, title: '  Tarte  ' } });

    expect(error).toBeUndefined();
    expect(req.body).toEqual({
      title: 'Tarte',
      category: 'dessert',
      prepTime: 30,
      ingredients: '',
      instructions: '',
      favorite: false,
    });
  });

  it('garde les champs facultatifs fournis', () => {
    const body = { ...VALID, ingredients: 'pommes', instructions: 'cuire', favorite: true };

    const { req } = run(validateCreateRecipe, { body });

    expect(req.body).toEqual(body);
  });

  it.each([
    ['corps null', null],
    ['corps tableau', []],
    ['prepTime NaN', { ...VALID, prepTime: NaN }],
    ['prepTime Infinity', { ...VALID, prepTime: Infinity }],
    ['ingrédients non texte', { ...VALID, ingredients: ['pommes'] }],
    ['instructions non texte', { ...VALID, instructions: 42 }],
  ])('refuse avec une erreur 400 : %s', (label, body) => {
    const { error } = run(validateCreateRecipe, { body });

    expect(error).toMatchObject({ status: 400, code: 'INVALID_INPUT' });
  });
});

describe('validateUpdateRecipe', () => {
  it('laisse passer une modification partielle et nettoie le titre', () => {
    const { req, error } = run(validateUpdateRecipe, { body: { title: '  Crêpes  ' } });

    expect(error).toBeUndefined();
    expect(req.body).toEqual({ title: 'Crêpes' });
  });

  it("n'ajoute aucune valeur par défaut", () => {
    const { req } = run(validateUpdateRecipe, { body: { favorite: true } });

    expect(req.body).toEqual({ favorite: true });
  });

  it.each([
    ['corps null', null],
    ['corps vide', {}],
    ['prepTime = 1441', { prepTime: 1441 }],
    ['ingrédients trop longs', { ingredients: 'a'.repeat(2001) }],
    ['instructions trop longues', { instructions: 'a'.repeat(5001) }],
  ])('refuse avec une erreur 400 : %s', (label, body) => {
    const { error } = run(validateUpdateRecipe, { body });

    expect(error).toMatchObject({ status: 400, code: 'INVALID_INPUT' });
  });
});

describe('validateId', () => {
  it.each(['6afd6d34bdefb600799fc803', '6AFD6D34BDEFB600799FC803'])('accepte %s', (id) => {
    const { error } = run(validateId, { params: { id } });

    expect(error).toBeUndefined();
  });

  it.each([
    ['trop court', '6afd6d34'],
    ['trop long', '6afd6d34bdefb600799fc8031'],
    ['caractère non hexadécimal', '6afd6d34bdefb600799fc80z'],
    ['texte', 'abc'],
  ])('refuse avec une erreur 400 : %s', (label, id) => {
    const { error } = run(validateId, { params: { id } });

    expect(error).toMatchObject({ status: 400, code: 'INVALID_INPUT' });
  });
});

describe('validateListQuery', () => {
  it('convertit les filtres en valeurs utilisables par le service', () => {
    const { req, error } = run(validateListQuery, {
      query: { category: 'dessert', favorite: 'false', q: '  tarte  ', mine: 'true' },
    });

    expect(error).toBeUndefined();
    expect(req.filters).toEqual({ category: 'dessert', favorite: false, q: 'tarte', mine: true });
  });

  it('met favorite et q à undefined et mine à false quand ils sont absents', () => {
    const { req } = run(validateListQuery, { query: {} });

    expect(req.filters).toEqual({ category: undefined, favorite: undefined, q: undefined, mine: false });
  });

  it('refuse un q répété (tableau)', () => {
    const { error } = run(validateListQuery, { query: { q: ['a', 'b'] } });

    expect(error).toMatchObject({ status: 400, code: 'INVALID_INPUT' });
  });
});
