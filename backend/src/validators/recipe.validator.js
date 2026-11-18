const AppError = require('../utils/AppError');

const CATEGORIES = ['starter', 'main', 'dessert', 'drink'];
const ALLOWED_FIELDS = ['title', 'category', 'prepTime', 'ingredients', 'instructions', 'favorite'];
const ALLOWED_FILTERS = ['category', 'favorite', 'q', 'mine'];
const BOOLEAN_VALUES = ['true', 'false'];

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

  if (body.favorite !== undefined && typeof body.favorite !== 'boolean') {
  return next(invalid('favorite doit valoir true ou false'));
  }
  

  req.body = {
    title: body.title.trim(),
    category: body.category,
    prepTime: body.prepTime,
    ingredients: body.ingredients ?? '',
    instructions: body.instructions ?? '',
    favorite: body.favorite ?? false,
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

  if (body.favorite !== undefined && typeof body.favorite !== 'boolean') {
    return next(invalid('favorite doit valoir true ou false'));
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

  req.filters = {
    category: query.category,
    favorite: query.favorite === undefined ? undefined : query.favorite === 'true',
    q: query.q === undefined ? undefined : query.q.trim(),
    mine: query.mine === 'true',
  };

  next();
}

module.exports = { validateCreateRecipe, validateUpdateRecipe, validateId, validateListQuery };