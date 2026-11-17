const AppError = require('../utils/AppError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function invalid(message) {
  return new AppError(400, 'INVALID_INPUT', message);
}

function validateAuthBody(req, res, next) {
  const body = req.body;

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return next(invalid('Le corps doit être un objet JSON'));
  }

  for (const key of Object.keys(body)) {
    if (key !== 'email' && key !== 'password') {
      return next(invalid(`Champ non autorisé : ${key}`));
    }
  }

  if (typeof body.email !== 'string' || !EMAIL_REGEX.test(body.email.trim())) {
    return next(invalid('Adresse email invalide'));
  }

  if (typeof body.password !== 'string' || body.password.length < 8) {
    return next(invalid('Le mot de passe doit contenir au moins 8 caractères'));
  }

  req.body = {
    email: body.email.trim().toLowerCase(),
    password: body.password,
  };

  next();
}

module.exports = { validateAuthBody };