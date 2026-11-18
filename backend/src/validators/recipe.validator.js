const AppError = require('../utils/AppError');

const CATEGORIES = ['starter', 'main', 'dessert', 'drink'];
const ALLOWED_FIELDS = ['title', 'category', 'prepTime', 'ingredients', 'instructions'];
const ALLOWED_FILTERS = ['category', 'favorite', 'q', 'mine', 'page', 'limit'];
const BOOLEAN_VALUES = ['true', 'false'];
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
const POSITIVE_INTEGER = /^[1-9][0-9]{0,5}$/;

function invalid(message) {
  return new AppError(400, 'INVALID_INPUT', message);
}

function validateCreateRecipe(req, res, next) {
  const body = req.body;

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return next(invalid('Le corps doit être un objet JSON'));
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.includes(key)) {
      return next(invalid(`Champ non autorisé : ${key}`));
    }
  }

  if (typeof body.title !== 'string' || body.title.trim().length < 1 || body.title.trim().length > 120) {
    return next(invalid('title doit contenir entre 1 et 120 caractères'));
  }

  if (!CATEGORIES.includes(body.category)) {
    return next(invalid(`category doit valoir : ${CATEGORIES.join(', ')}`));
  }

  if (!Number.isInteger(body.prepTime) || body.prepTime < 1 || body.prepTime > 1440) {
  return next(invalid('prepTime doit être un nombre entier de minutes entre 1 et 1440'));
  }

  if (body.ingredients !== undefined && (typeof body.ingredients !== 'string' || body.ingredients.length > 2000)) {
  return next(invalid('ingredients doit être un texte de 2000 caractères maximum'));
  }

  if (body.instructions !== undefined && (typeof body.instructions !== 'string' || body.instructions.length > 5000)) {
  return next(invalid('instructions doit être un texte de 5000 caractères maximum'));
  }


  req.body = {
    title: body.title.trim(),
    category: body.category,
    prepTime: body.prepTime,
    ingredients: body.ingredients ?? '',
    instructions: body.instructions ?? '',
  };

  next();
}

function validateUpdateRecipe(req, res, next) {
  const body = req.body;

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return next(invalid('Le corps doit être un objet JSON'));
  }

  if (Object.keys(body).length === 0) {
    return next(invalid('Aucun champ à modifier'));
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.includes(key)) {
      return next(invalid(`Champ non autorisé : ${key}`));
    }
  }

  if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim().length < 1 || body.title.trim().length > 120)) {
    return next(invalid('title doit contenir entre 1 et 120 caractères'));
  }

  if (body.category !== undefined && !CATEGORIES.includes(body.category)) {
    return next(invalid(`category doit valoir : ${CATEGORIES.join(', ')}`));
  }

  if (body.prepTime !== undefined && (!Number.isInteger(body.prepTime) || body.prepTime < 1 || body.prepTime > 1440)) {
    return next(invalid('prepTime doit être un nombre entier de minutes entre 1 et 1440'));
  }

  if (body.ingredients !== undefined && (typeof body.ingredients !== 'string' || body.ingredients.length > 2000)) {
    return next(invalid('ingredients doit être un texte de 2000 caractères maximum'));
  }

  if (body.instructions !== undefined && (typeof body.instructions !== 'string' || body.instructions.length > 5000)) {
    return next(invalid('instructions doit être un texte de 5000 caractères maximum'));
  }

  if (body.title !== undefined) {
    body.title = body.title.trim();
  }

  next();
}

function validateId(req, res, next) {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return next(invalid('Identifiant invalide'));
  }
  next();
}

function validateListQuery(req, res, next) {
  const query = req.query;

  for (const key of Object.keys(query)) {
    if (!ALLOWED_FILTERS.includes(key)) {
      return next(invalid(`Filtre non autorisé : ${key}`));
    }
  }

  if (query.category !== undefined && !CATEGORIES.includes(query.category)) {
    return next(invalid(`category doit valoir : ${CATEGORIES.join(', ')}`));
  }

  if (query.favorite !== undefined && !BOOLEAN_VALUES.includes(query.favorite)) {
    return next(invalid('favorite doit valoir true ou false'));
  }

  if (query.mine !== undefined && !BOOLEAN_VALUES.includes(query.mine)) {
    return next(invalid('mine doit valoir true ou false'));
  }

  if (query.q !== undefined && (typeof query.q !== 'string' || query.q.trim().length < 1 || query.q.trim().length > 120)) {
    return next(invalid('q doit contenir entre 1 et 120 caractères'));
  }

  if (query.page !== undefined && (typeof query.page !== 'string' || !POSITIVE_INTEGER.test(query.page))) {
    return next(invalid('page doit être un entier supérieur ou égal à 1'));
  }

  if (query.limit !== undefined && (typeof query.limit !== 'string' || !POSITIVE_INTEGER.test(query.limit) || Number(query.limit) > MAX_LIMIT)) {
    return next(invalid(`limit doit être un entier entre 1 et ${MAX_LIMIT}`));
  }

  req.filters = {
    category: query.category,
    favorite: query.favorite === undefined ? undefined : query.favorite === 'true',
    q: query.q === undefined ? undefined : query.q.trim(),
    mine: query.mine === 'true',
    page: query.page === undefined ? 1 : Number(query.page),
    limit: query.limit === undefined ? DEFAULT_LIMIT : Number(query.limit),
  };

  next();
}

module.exports = { validateCreateRecipe, validateUpdateRecipe, validateId, validateListQuery };