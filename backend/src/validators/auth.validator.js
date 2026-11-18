const AppError = require('../utils/AppError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

function invalid(message) {
  return new AppError(400, 'INVALID_INPUT', message);
}

function checkCredentials(body, allowedFields) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return 'Le corps doit être un objet JSON';
  }

  for (const key of Object.keys(body)) {
    if (!allowedFields.includes(key)) {
      return `Champ non autorisé : ${key}`;
    }
  }

  if (typeof body.email !== 'string' || !EMAIL_REGEX.test(body.email.trim())) {
    return 'Adresse email invalide';
  }

  if (typeof body.password !== 'string' || body.password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères';
  }

  return null;
}

function validateLoginBody(req, res, next) {
  const message = checkCredentials(req.body, ['email', 'password']);
  if (message) {
    return next(invalid(message));
  }

  req.body = {
    email: req.body.email.trim().toLowerCase(),
    password: req.body.password,
  };

  next();
}

function validateRegisterBody(req, res, next) {
  const message = checkCredentials(req.body, ['email', 'password', 'username']);
  if (message) {
    return next(invalid(message));
  }

  const { username } = req.body;
  if (typeof username !== 'string' || !USERNAME_REGEX.test(username.trim())) {
    return next(invalid('Le pseudo doit contenir 3 à 30 caractères : lettres, chiffres, _ ou -'));
  }

  req.body = {
    email: req.body.email.trim().toLowerCase(),
    password: req.body.password,
    username: username.trim().toLowerCase(),
  };

  next();
}

module.exports = { validateLoginBody, validateRegisterBody };
